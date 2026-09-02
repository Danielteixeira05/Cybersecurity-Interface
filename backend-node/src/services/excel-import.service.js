import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
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

function text(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function asId(value, name) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `${name} inválido.`);
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

async function validateWorkbook(file, type, clientId) {
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
  if (!rows.length) throw httpError(422, 'O ficheiro XLSX não contém linhas para importar.');
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
  const parsed = await validateWorkbook(file, type, clientId);
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

function serialiseImport(value) {
  const item = value.get ? value.get({ plain: true }) : value;
  return {
    ...item,
    id: Number(item.id),
    cliente_id: Number(item.cliente_id),
    importado_por: item.importado_por === null || item.importado_por === undefined ? null : Number(item.importado_por),
    cliente_nome: item.cliente?.nome ?? item.cliente_nome ?? null,
    importado_por_nome: item.importadoPor?.nome ?? item.importado_por_nome ?? null,
    caminho_ficheiro: undefined,
    cliente: undefined,
    importadoPor: undefined,
  };
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

export async function previewExcelImport(auth, input, file) {
  const type = importType(input.tipo);
  assertExcelImportPermission(auth, type);
  const clientId = await activeClientForImport(auth, input);
  const parsed = await validateWorkbook(file, type, clientId);
  const accepted = parsed.rows.filter((row) => row.estado === 'IMPORTADA').length;
  return {
    tipo: type,
    cliente_id: clientId,
    nome_ficheiro_original: parsed.validated.originalName,
    total_linhas: parsed.rows.length,
    linhas_validas: accepted,
    linhas_rejeitadas: parsed.rows.length - accepted,
    linhas: parsed.rows,
  };
}

export async function commitExcelImport(auth, input, file) {
  assertWritable();
  const type = importType(input.tipo);
  assertExcelImportPermission(auth, type);
  const clientId = await activeClientForImport(auth, input);
  const parsed = await validateWorkbook(file, type, clientId);
  const objectKey = `imports/${clientId}/${randomUUID()}/${parsed.validated.storageName}`;
  let stored = false;

  try {
    const result = await storage().put({ key: objectKey, buffer: parsed.validated.buffer, contentType: parsed.validated.mime });
    stored = true;
    const { ExcelImport, ImportRow, sequelize } = getModels();
    let created;
    await sequelize.transaction(async (transaction) => {
      created = await ExcelImport.create({
        cliente_id: clientId,
        tipo,
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
            if (type === 'ATIVOS') await createAssetFromImport(auth, row.dados, { transaction, importId: created.id });
            else await createIncidentFromImport(auth, row.dados, { transaction, importId: created.id });
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
      }
      const state = rejected === 0 ? 'PROCESSADO' : imported === 0 ? 'FALHADO' : 'PARCIAL';
      await created.update({ estado: state, linhas_importadas: imported, linhas_rejeitadas: rejected }, { transaction });
      await recordAudit({
        userId: Number(auth.sub), action: 'IMPORTAR_EXCEL', entity: 'importacoes_excel', entityId: Number(created.id),
        details: { cliente_id: clientId, tipo, total_linhas: parsed.rows.length, linhas_importadas: imported, linhas_rejeitadas: rejected },
      }, transaction);
    });
    return serialiseImport(created);
  } catch (error) {
    if (stored) {
      try { await storage().delete(objectKey); } catch { /* O erro da importação mantém precedência. */ }
    }
    throw error;
  }
}

export async function listExcelImports(auth, filters = {}) {
  const rawClientId = filters.cliente_id ?? filters.clienteId;
  const clientId = rawClientId === undefined || rawClientId === '' ? undefined : asId(rawClientId, 'Cliente');
  const where = await whereFor(auth, clientId);
  if (!where) return [];
  const { ExcelImport, Client, User } = getModels();
  const rows = await ExcelImport.findAll({
    where,
    include: [
      { model: Client, as: 'cliente', attributes: ['id', 'nome', 'nif'] },
      { model: User, as: 'importadoPor', attributes: ['id', 'nome'] },
    ],
    order: [['importado_em', 'DESC'], ['id', 'DESC']],
    limit: 100,
  });
  return rows.map(serialiseImport);
}
