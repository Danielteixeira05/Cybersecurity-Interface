import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser, singlePrincipalClientId } from './clients.service.js';
import { createVercelBlobStorage, validateDocumentFile } from './document-storage.service.js';
import { createAssetFromImport, normaliseAssetPayload } from './assets.service.js';
import { createIncidentFromImport, normaliseIncidentPayload } from './incidents.service.js';
import { recordAudit } from './audit-log.service.js';

const IMPORT_TYPES = new Set(['ATIVOS', 'INCIDENTES']);
const MAX_ROWS = 1000;
let testStorage = null;

const FIELD_ALIASES = {
  ATIVOS: {
    nome: ['nome', 'nome_ativo', 'ativo'],
    criticidade: ['criticidade', 'criticalidade'],
    numero_inventario: ['numero_inventario', 'inventario'],
    tipo_equipamento: ['tipo_equipamento', 'tipo', 'equipamento'],
    sistema_operativo: ['sistema_operativo', 'sistema', 'plataforma'],
    endereco_ip: ['endereco_ip', 'ip'],
    endereco_mac: ['endereco_mac', 'mac'],
    fqdn: ['fqdn', 'hostname'],
    fabricante: ['fabricante'],
    modelo_versao: ['modelo_versao', 'modelo', 'versao'],
    numero_serie: ['numero_serie', 'serie'],
    localizacao: ['localizacao', 'localizacao_fisica'],
    tipologia: ['tipologia'],
    observacoes: ['observacoes', 'observacao'],
    comunicado_cncs: ['comunicado_cncs'],
    programa_gestao_risco: ['programa_gestao_risco'],
  },
  INCIDENTES: {
    codigo: ['codigo', 'id_incidente'],
    data_hora_incidente: ['data_hora_incidente', 'data_deteccao', 'detetado_em'],
    tipo_incidente: ['tipo_incidente', 'tipo', 'titulo'],
    descricao: ['descricao', 'descrição'],
    gravidade: ['gravidade', 'severidade'],
    estado: ['estado'],
    departamento: ['departamento'],
    utilizadores_afetados: ['utilizadores_afetados', 'afetados'],
    dados_comprometidos: ['dados_comprometidos'],
    sistemas_afetados: ['sistemas_afetados'],
    origem_ataque: ['origem_ataque'],
    ip_atacante: ['ip_atacante'],
    analise_log: ['analise_log'],
    resposta_imediata: ['resposta_imediata'],
    medidas_corretivas: ['medidas_corretivas'],
    entidades_internas: ['entidades_internas'],
    entidades_externas: ['entidades_externas'],
    probabilidade_reincidencia: ['probabilidade_reincidencia'],
    recomendacoes: ['recomendacoes'],
    encerrado_em: ['encerrado_em', 'data_encerramento'],
  },
};

export const ASSET_IMPORT_TEMPLATE_FILENAME = 'modelo_importacao_ativos.xlsx';
export const ASSET_IMPORT_TEMPLATE_HEADERS = Object.freeze(Object.keys(FIELD_ALIASES.ATIVOS));

const REQUIRED_ASSET_IMPORT_HEADERS = new Set(['nome', 'criticidade']);
const ASSET_CRITICALITIES = Object.freeze(['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA']);

export async function createAssetImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CiberBoxSecur';
  workbook.created = new Date(0);
  workbook.modified = new Date(0);

  const sheet = workbook.addWorksheet('Importação', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const widths = {
    nome: 28,
    criticidade: 16,
    numero_inventario: 22,
    tipo_equipamento: 22,
    sistema_operativo: 24,
    endereco_ip: 18,
    endereco_mac: 20,
    fqdn: 30,
    fabricante: 20,
    modelo_versao: 24,
    numero_serie: 20,
    localizacao: 24,
    tipologia: 20,
    observacoes: 54,
    comunicado_cncs: 20,
    programa_gestao_risco: 26,
  };
  sheet.columns = ASSET_IMPORT_TEMPLATE_HEADERS.map((header) => ({
    header,
    key: header,
    width: widths[header] ?? 20,
  }));
  sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(ASSET_IMPORT_TEMPLATE_HEADERS.length).letter}1` };

  sheet.getRow(1).eachCell((cell) => {
    const required = REQUIRED_ASSET_IMPORT_HEADERS.has(String(cell.value));
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: required ? 'FFF59E0B' : 'FF2563EB' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  sheet.getRow(1).height = 24;

  const criticalityColumn = sheet.getColumn('criticidade');
  for (let row = 2; row <= MAX_ROWS + 1; row += 1) {
    sheet.getCell(row, criticalityColumn.number).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`\"${ASSET_CRITICALITIES.join(',')}\"`],
      showErrorMessage: true,
      errorTitle: 'Criticidade inválida',
      error: `Escolha uma das criticidades permitidas: ${ASSET_CRITICALITIES.join(', ')}.`,
    };
  }

  const instructions = workbook.addWorksheet('Instruções');
  instructions.columns = [{ key: 'texto', width: 110 }];
  [
    'Modelo de importação de ativos — CiberBoxSecur',
    'Os campos nome e criticidade são obrigatórios e estão destacados a laranja.',
    `Criticidades permitidas: ${ASSET_CRITICALITIES.join(', ')}.`,
    'A folha Importação contém apenas cabeçalhos. Adicione os ativos a partir da linha 2.',
    'Exemplo meramente explicativo: nome EXEMPLO-REMOVER; criticidade MEDIA; número de inventário DEMO-001.',
    'Não copie o exemplo sem o substituir pelos dados que pretende importar.',
    `O limite máximo é de ${MAX_ROWS} linhas de dados, sem contar com o cabeçalho.`,
    'Não altere os nomes dos cabeçalhos da folha Importação.',
  ].forEach((value) => instructions.addRow({ texto: value }));
  instructions.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
  instructions.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function text(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function asId(value, name) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `${name} inválido.`);
  return id;
}

function canonicalRouteId(value, name) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw httpError(400, `${name} inválido.`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw httpError(400, `${name} inválido.`);
  return id;
}

function importType(value) {
  const type = text(value).toUpperCase();
  if (!IMPORT_TYPES.has(type)) throw httpError(400, 'Tipo de importação inválido.');
  return type;
}

export function assertExcelImportPermission(auth, type) {
  if (auth.role === 'client' && type !== 'ATIVOS') {
    throw httpError(403, 'O Cliente apenas pode importar ativos tecnológicos da sua organização.');
  }
}

function assertWritable() {
  if (env.readOnlyMode) throw httpError(403, 'As importações estão desativadas em modo de leitura.');
}

function storage() {
  return testStorage ?? createVercelBlobStorage();
}

export function setExcelImportStorageForTests(value = null) {
  testStorage = value;
}

function normaliseHeader(value) {
  return text(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = text(value).toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'sim', 'yes', 'x'].includes(normalized)) return true;
  if (['false', '0', 'nao', 'não', 'no'].includes(normalized)) return false;
  return value;
}

function mappedRow(row, type, clientId) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normaliseHeader(key), value]));
  const result = { cliente_id: clientId };
  for (const [field, aliases] of Object.entries(FIELD_ALIASES[type])) {
    const key = aliases.find((candidate) => normalized[normaliseHeader(candidate)] !== undefined);
    if (!key) continue;
    const value = normalized[normaliseHeader(key)];
    if (value === '' || value === null || value === undefined) continue;
    result[field] = ['comunicado_cncs', 'programa_gestao_risco', 'dados_comprometidos'].includes(field) ? asBoolean(value) : text(value);
  }
  return result;
}

function validationError(error) {
  return error?.status && error.status < 500 ? error.message : 'Linha inválida para importação.';
}

async function validateWorkbook(file, type, clientId, { allowEmpty = false } = {}) {
  const validated = await validateDocumentFile(file, env.documentUploadSafetyMaxMb * 1024 * 1024);
  if (validated.extension !== 'xlsx') throw httpError(422, 'A importação aceita apenas ficheiros XLSX.');

  let workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(validated.buffer);
  } catch {
    throw httpError(422, 'Não foi possível ler o ficheiro XLSX.');
  }
  const firstSheet = workbook.worksheets[0];
  if (!firstSheet) throw httpError(422, 'O ficheiro XLSX não contém folhas.');
  const headers = new Map();
  firstSheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    const header = text(cell.text);
    if (header) headers.set(column, header);
  });
  const rows = [];
  firstSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const source = {};
    for (const [column, header] of headers) source[header] = row.getCell(column).text;
    if (Object.values(source).some((value) => text(value) !== '')) rows.push({ source, numero_linha: rowNumber });
  });
  if (!rows.length && !allowEmpty) throw httpError(422, 'O ficheiro XLSX não contém linhas para importar.');
  if (rows.length > MAX_ROWS) throw httpError(413, `A importação excede o máximo de ${MAX_ROWS} linhas.`);

  const seen = new Set();
  const prepared = rows.map(({ source, numero_linha: line }) => {
    const data = mappedRow(source, type, clientId);
    try {
      const normalized = type === 'ATIVOS' ? normaliseAssetPayload(data) : normaliseIncidentPayload({ ...data, notificado_nis2: false });
      const unique = type === 'ATIVOS' ? normalized.numero_inventario : normalized.codigo;
      if (unique) {
        const key = String(unique).toUpperCase();
        if (seen.has(key)) throw httpError(400, type === 'ATIVOS' ? 'Número de inventário repetido no ficheiro.' : 'Código de incidente repetido no ficheiro.');
        seen.add(key);
      }
      return { numero_linha: line, estado: 'IMPORTADA', erro: null, dados: normalized };
    } catch (error) {
      return { numero_linha: line, estado: 'REJEITADA', erro: validationError(error), dados: data };
    }
  });
  return { validated, rows: prepared };
}

/**
 * Expõe apenas a análise determinística do XLSX aos testes unitários. Não
 * consulta a base de dados nem persiste ficheiros.
 */
export async function parseExcelImportForTests({ file, tipo, clienteId }) {
  const type = importType(tipo);
  const clientId = asId(clienteId, 'Cliente');
  const parsed = await validateWorkbook(file, type, clientId, { allowEmpty: true });
  return parsed.rows;
}

async function activeClientForImport(auth, input) {
  const requestedId = asId(input.cliente_id ?? input.clienteId, 'Cliente');
  let clientId = requestedId;
  if (auth.role === 'client') {
    const ids = await clientIdsForUser(auth.sub, { principalOnly: true });
    clientId = singlePrincipalClientId(ids, requestedId, 'importar ativos');
  } else {
    await assertClientAccess(auth, clientId);
  }
  const { Client } = getModels();
  const client = await Client.findOne({ where: { id: clientId, ativo: true } });
  if (!client) throw httpError(400, 'Cliente não encontrado ou inativo.');
  return clientId;
}

function serialiseImportLine(value) {
  const item = value?.get ? value.get({ plain: true }) : value;
  const data = item?.dados;
  return {
    numero_linha: Number(item?.numero_linha),
    estado: item?.estado === 'IMPORTADA' ? 'IMPORTADA' : 'REJEITADA',
    nome: data && typeof data === 'object' && !Array.isArray(data) && typeof data.nome === 'string'
      ? data.nome.trim().slice(0, 160) || null
      : null,
    erro: typeof item?.erro === 'string' ? item.erro.trim().slice(0, 500) || null : null,
  };
}

function serialiseImport(value, lines = undefined) {
  const item = value.get ? value.get({ plain: true }) : value;
  return {
    id: Number(item.id),
    cliente_id: Number(item.cliente_id),
    tipo: item.tipo,
    nome_ficheiro_original: item.nome_ficheiro_original,
    estado: item.estado,
    total_linhas: Number(item.total_linhas),
    linhas_importadas: Number(item.linhas_importadas),
    linhas_rejeitadas: Number(item.linhas_rejeitadas),
    importado_por: item.importado_por === null || item.importado_por === undefined ? null : Number(item.importado_por),
    importado_em: item.importado_em,
    cliente_nome: item.cliente?.nome ?? item.cliente_nome ?? null,
    importado_por_nome: item.importadoPor?.nome ?? item.importado_por_nome ?? null,
    ...(lines ? { linhas: lines.map(serialiseImportLine) } : {}),
  };
}

async function rejectExistingIdentifiers(type, clientId, rows, dependencies = {}, transaction) {
  const field = type === 'ATIVOS' ? 'numero_inventario' : 'codigo';
  const modelName = type === 'ATIVOS' ? 'Asset' : 'Incident';
  const values = [...new Set(rows
    .filter((row) => row.estado === 'IMPORTADA' && row.dados[field])
    .map((row) => String(row.dados[field])))];
  if (!values.length) return rows;

  const Model = dependencies.models?.[modelName] ?? getModels()[modelName];
  const existing = await Model.findAll({
    where: { cliente_id: clientId, [field]: { [Op.in]: values } },
    attributes: [field],
    transaction,
  });
  const existingValues = new Set(existing.map((row) => String(row.get ? row.get(field) : row[field])));
  if (!existingValues.size) return rows;

  const message = type === 'ATIVOS'
    ? 'Já existe um ativo com este número de inventário para o cliente.'
    : 'Já existe um incidente com este código para o cliente.';
  return rows.map((row) => row.estado === 'IMPORTADA' && row.dados[field]
    && existingValues.has(String(row.dados[field]))
    ? { ...row, estado: 'REJEITADA', erro: message }
    : row);
}

async function whereFor(auth, clientId) {
  if (clientId !== undefined) {
    await assertClientAccess(auth, clientId);
    return { cliente_id: clientId };
  }
  if (auth.role === 'admin') return {};
  const ids = (await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' })).map(Number);
  return ids.length ? { cliente_id: ids } : null;
}

export async function previewExcelImport(auth, input, file, dependencies = {}) {
  const type = importType(input.tipo);
  assertExcelImportPermission(auth, type);
  const resolveActiveClient = dependencies.activeClientForImport ?? activeClientForImport;
  const clientId = await resolveActiveClient(auth, input);
  const parsed = await validateWorkbook(file, type, clientId, { allowEmpty: true });
  const rows = await rejectExistingIdentifiers(type, clientId, parsed.rows, dependencies);
  const accepted = rows.filter((row) => row.estado === 'IMPORTADA').length;
  return {
    tipo: type,
    cliente_id: clientId,
    nome_ficheiro_original: parsed.validated.originalName,
    total_linhas: rows.length,
    linhas_validas: accepted,
    linhas_rejeitadas: rows.length - accepted,
    linhas: rows,
  };
}

export async function commitExcelImport(auth, input, file, dependencies = {}) {
  assertWritable();
  const type = importType(input.tipo);
  assertExcelImportPermission(auth, type);
  const resolveActiveClient = dependencies.activeClientForImport ?? activeClientForImport;
  const createAsset = dependencies.createAssetFromImport ?? createAssetFromImport;
  const createIncident = dependencies.createIncidentFromImport ?? createIncidentFromImport;
  const writeAudit = dependencies.recordAudit ?? recordAudit;
  const storageAdapter = dependencies.storage ?? storage();
  const clientId = await resolveActiveClient(auth, input);
  const parsed = await validateWorkbook(file, type, clientId);
  parsed.rows = await rejectExistingIdentifiers(type, clientId, parsed.rows, dependencies);
  const objectKey = `imports/${clientId}/${randomUUID()}/${parsed.validated.storageName}`;
  let stored = false;

  try {
    const result = await storageAdapter.put({ key: objectKey, buffer: parsed.validated.buffer, contentType: parsed.validated.mime });
    stored = true;
    const { ExcelImport, ImportRow, sequelize } = dependencies.models ?? getModels();
    let created;
    const lineResults = [];
    await sequelize.transaction(async (transaction) => {
      created = await ExcelImport.create({
        cliente_id: clientId,
        tipo: type,
        nome_ficheiro_original: parsed.validated.originalName,
        caminho_ficheiro: result.key,
        estado: 'FALHADO',
        total_linhas: parsed.rows.length,
        linhas_importadas: 0,
        linhas_rejeitadas: 0,
        importado_por: Number(auth.sub),
        importado_em: new Date(),
      }, { transaction });

      let imported = 0;
      let rejected = 0;
      for (const row of parsed.rows) {
        let state = row.estado;
        let error = row.erro;
        if (state === 'IMPORTADA') {
          try {
            if (type === 'ATIVOS') await createAsset(auth, row.dados, { transaction, importId: created.id });
            else await createIncident(auth, row.dados, { transaction, importId: created.id });
            imported += 1;
          } catch (cause) {
            if (!cause?.status || cause.status >= 500) throw cause;
            state = 'REJEITADA';
            error = validationError(cause);
            rejected += 1;
          }
        } else {
          rejected += 1;
        }
        await ImportRow.create({
          importacao_id: created.id,
          numero_linha: row.numero_linha,
          estado: state,
          erro: error,
          dados: row.dados,
          criado_em: new Date(),
        }, { transaction });
        lineResults.push({ numero_linha: row.numero_linha, estado: state, erro: error, dados: row.dados });
      }
      const state = rejected === 0 ? 'PROCESSADO' : imported === 0 ? 'FALHADO' : 'PARCIAL';
      await created.update({ estado: state, linhas_importadas: imported, linhas_rejeitadas: rejected }, { transaction });
      await writeAudit({
        userId: Number(auth.sub), action: 'IMPORTAR_EXCEL', entity: 'importacoes_excel', entityId: Number(created.id),
        details: { cliente_id: clientId, tipo: type, total_linhas: parsed.rows.length, linhas_importadas: imported, linhas_rejeitadas: rejected },
      }, transaction);
    });
    return serialiseImport(created, lineResults);
  } catch (error) {
    if (stored) {
      try { await storageAdapter.delete(objectKey); } catch { /* O erro da importação mantém precedência. */ }
    }
    throw error;
  }
}

export async function listExcelImports(auth, filters = {}, dependencies = {}) {
  const rawClientId = filters.cliente_id ?? filters.clienteId;
  const clientId = rawClientId === undefined || rawClientId === '' ? undefined : asId(rawClientId, 'Cliente');
  const where = await whereFor(auth, clientId);
  if (!where) return [];
  const { ExcelImport, Client, User } = dependencies.models ?? getModels();
  const rows = await ExcelImport.findAll({
    where,
    include: [
      { model: Client, as: 'cliente', attributes: ['id', 'nome', 'nif'], where: { ativo: true }, required: true },
      { model: User, as: 'importadoPor', attributes: ['id', 'nome'] },
    ],
    order: [['importado_em', 'DESC'], ['id', 'DESC']],
    limit: 100,
  });
  return rows.map((row) => serialiseImport(row));
}

export async function getExcelImportResult(auth, importId, dependencies = {}) {
  const id = canonicalRouteId(importId, 'Importação');
  const { ExcelImport, ImportRow, Client } = dependencies.models ?? getModels();
  const row = await ExcelImport.findOne({
    where: { id },
    include: [{ model: Client, as: 'cliente', attributes: ['id', 'nome'], where: { ativo: true }, required: true }],
  });
  if (!row) throw httpError(404, 'Importação não encontrada.');
  await (dependencies.assertClientAccess ?? assertClientAccess)(auth, Number(row.cliente_id));
  const lines = await ImportRow.findAll({
    where: { importacao_id: id },
    attributes: ['numero_linha', 'estado', 'erro', 'dados'],
    order: [['numero_linha', 'ASC']],
  });
  return serialiseImport(row, lines);
}

/**
 * Resolve o ficheiro privado exclusivamente pelo ID canónico da importação.
 * A chave Blob permanece interna e nunca integra a resposta HTTP.
 */
export async function downloadExcelImport(auth, importId, dependencies = {}) {
  const id = canonicalRouteId(importId, 'Importação');
  const { ExcelImport, Client } = dependencies.models ?? getModels();
  const row = await ExcelImport.findOne({
    where: { id },
    include: [{ model: Client, as: 'cliente', attributes: ['id'], where: { ativo: true }, required: true }],
  });
  if (!row) throw httpError(404, 'Importação não encontrada.');

  const item = row.get ? row.get({ plain: true }) : row;
  const checkClientAccess = dependencies.assertClientAccess ?? assertClientAccess;
  await checkClientAccess(auth, Number(item.cliente_id));

  const objectKey = typeof item.caminho_ficheiro === 'string' ? item.caminho_ficheiro.trim() : '';
  if (!objectKey) throw httpError(404, 'Ficheiro original da importação não encontrado.');
  const storageAdapter = dependencies.storage ?? storage();
  const object = await storageAdapter.get(objectKey);

  const writeAudit = dependencies.recordAudit ?? recordAudit;
  await writeAudit({
    userId: Number(auth.sub),
    action: 'DESCARREGAR_IMPORTACAO_EXCEL',
    entity: 'importacoes_excel',
    entityId: id,
    details: { cliente_id: Number(item.cliente_id), tipo: item.tipo },
  });

  return {
    filename: parsedSafeDownloadName(item.nome_ficheiro_original),
    stream: object.stream,
    size: object.size,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function parsedSafeDownloadName(value) {
  const name = typeof value === 'string' ? value.trim().replace(/[\\/\r\n\0]/g, '_') : '';
  if (!name) return 'importacao.xlsx';
  if (/\.xlsx$/i.test(name)) return name.slice(0, 255);
  const base = name.replace(/\.+$/, '').slice(0, 250);
  return `${base || 'importacao'}.xlsx`;
}
