import net from 'node:net';
import { Op } from 'sequelize';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';

const CRITICALITIES = new Set(['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA']);

function idOf(value, name, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw httpError(400, `${name} é obrigatório.`);
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw httpError(400, `${name} inválido.`);
  return parsed;
}

function text(value, maximum, { required = false } = {}) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (required && !result) throw httpError(400, 'Campo obrigatório.');
  if (result.length > maximum) throw httpError(400, `Máximo de ${maximum} caracteres.`);
  return result;
}

function optionalText(value, maximum, current = null) {
  const result = value === undefined ? current : text(value, maximum);
  return result || null;
}

function boolean(value, name, fallback) {
  const result = value === undefined ? fallback : value;
  if (typeof result !== 'boolean') throw httpError(400, `${name} tem de ser booleano.`);
  return result;
}

function criticality(value, current) {
  const result = text(value === undefined ? current : value, 20, { required: true }).toUpperCase();
  if (!CRITICALITIES.has(result)) throw httpError(400, 'Criticidade inválida.');
  return result;
}

function ipAddress(value, current = null) {
  const result = optionalText(value, 64, current);
  if (result && net.isIP(result) === 0) throw httpError(400, 'Endereço IP inválido.');
  return result;
}

function macAddress(value, current = null) {
  const result = optionalText(value, 32, current);
  if (result && !/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(result)) throw httpError(400, 'Endereço MAC inválido.');
  return result;
}

export function normaliseAssetPayload(input, current = {}) {
  return {
    cliente_id: idOf(input.cliente_id ?? input.clienteId ?? current.cliente_id, 'Cliente', { required: true }),
    numero_inventario: optionalText(input.numero_inventario ?? input.numeroInventario, 80, current.numero_inventario),
    tipo_equipamento: optionalText(input.tipo_equipamento ?? input.tipo ?? input.tipoEquipamento, 100, current.tipo_equipamento),
    nome: text(input.nome ?? current.nome, 160, { required: true }),
    tipologia: optionalText(input.tipologia, 100, current.tipologia),
    modelo_versao: optionalText(input.modelo_versao ?? input.modeloVersao, 160, current.modelo_versao),
    numero_serie: optionalText(input.numero_serie ?? input.numeroSerie, 120, current.numero_serie),
    fabricante: optionalText(input.fabricante, 120, current.fabricante),
    localizacao: optionalText(input.localizacao, 160, current.localizacao),
    sistema_operativo: optionalText(input.sistema_operativo ?? input.sistemaOperativo ?? input.plataforma, 120, current.sistema_operativo),
    criticidade: criticality(input.criticidade ?? input.criticalidade, current.criticidade),
    endereco_ip: ipAddress(input.endereco_ip ?? input.enderecoIp, current.endereco_ip),
    endereco_mac: macAddress(input.endereco_mac ?? input.enderecoMac, current.endereco_mac),
    fqdn: optionalText(input.fqdn, 255, current.fqdn),
    servico_suportado: optionalText(input.servico_suportado ?? input.servicoSuportado, 4000, current.servico_suportado),
    responsavel_nome: optionalText(input.responsavel_nome ?? input.responsavelNome, 120, current.responsavel_nome),
    responsavel_contacto: optionalText(input.responsavel_contacto ?? input.responsavelContacto, 120, current.responsavel_contacto),
    unidade_organica: optionalText(input.unidade_organica ?? input.unidadeOrganica, 120, current.unidade_organica),
    aplicacoes_servicos: optionalText(input.aplicacoes_servicos ?? input.aplicacoesServicos, 4000, current.aplicacoes_servicos),
    observacoes: optionalText(input.observacoes, 4000, current.observacoes),
    comunicado_cncs: boolean(input.comunicado_cncs ?? input.comunicadoCncs, 'comunicado_cncs', current.comunicado_cncs ?? false),
    programa_gestao_risco: boolean(input.programa_gestao_risco ?? input.programaGestaoRisco, 'programa_gestao_risco', current.programa_gestao_risco ?? false),
    ativo: boolean(input.ativo, 'ativo', current.ativo ?? true),
  };
}

async function assertActiveClient(clientId, transaction) {
  const { Client } = getModels();
  const client = await Client.findOne({ where: { id: clientId, ativo: true }, transaction });
  if (!client) throw httpError(400, 'Cliente não encontrado ou inativo.');
}

function serialise(asset) {
  const item = asset.get ? asset.get({ plain: true }) : asset;
  return {
    ...item,
    id: Number(item.id),
    cliente_id: Number(item.cliente_id),
    cliente_nome: item.cliente?.nome ?? item.cliente_nome ?? null,
    tipo: item.tipo_equipamento ?? null,
    criticalidade: item.criticidade ?? null,
    cliente: undefined,
  };
}

async function whereFor(auth, filters = {}) {
  const where = { ativo: true };
  const clientId = idOf(filters.cliente_id ?? filters.clienteId, 'Cliente');
  if (clientId) {
    await assertClientAccess(auth, clientId);
    where.cliente_id = clientId;
  } else if (auth.role !== 'admin') {
    const ids = await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' });
    if (ids.length === 0) return null;
    where.cliente_id = ids;
  }
  const criticidade = filters.criticidade ? criticality(filters.criticidade) : undefined;
  if (criticidade) where.criticidade = criticidade;
  const q = typeof filters.q === 'string' ? filters.q.trim().slice(0, 160) : '';
  if (q) where[Op.or] = [
    { nome: { [Op.iLike]: `%${q}%` } },
    { numero_inventario: { [Op.iLike]: `%${q}%` } },
    { fqdn: { [Op.iLike]: `%${q}%` } },
    { tipo_equipamento: { [Op.iLike]: `%${q}%` } },
  ];
  return where;
}

export async function listAssets(auth, filters = {}) {
  const { Asset, Client } = getModels();
  const where = await whereFor(auth, filters);
  if (!where) return [];
  const rows = await Asset.findAll({
    where,
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['nome', 'ASC'], ['id', 'ASC']],
  });
  return rows.map(serialise);
}

export async function getAsset(auth, assetId) {
  const { Asset, Client } = getModels();
  const asset = await Asset.findOne({
    where: { id: idOf(assetId, 'Ativo', { required: true }), ativo: true },
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
  });
  if (!asset) throw httpError(404, 'Ativo não encontrado.');
  await assertClientAccess(auth, asset.cliente_id);
  return serialise(asset);
}

async function assertInventoryAvailable(clientId, inventory, currentId, transaction) {
  if (!inventory) return;
  const { Asset } = getModels();
  const duplicate = await Asset.findOne({ where: { cliente_id: clientId, numero_inventario: inventory }, transaction });
  if (duplicate && String(duplicate.id) !== String(currentId)) throw httpError(409, 'Já existe um ativo com este número de inventário para o cliente.');
}

export async function createAsset(auth, input) {
  const data = normaliseAssetPayload(input);
  await assertClientAccess(auth, data.cliente_id);
  const { sequelize, Asset } = getModels();
  const id = await sequelize.transaction(async (transaction) => {
    await assertActiveClient(data.cliente_id, transaction);
    await assertInventoryAvailable(data.cliente_id, data.numero_inventario, null, transaction);
    const asset = await Asset.create({ ...data, criado_por: Number(auth.sub), criado_em: new Date(), atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: Number(auth.sub), action: 'CRIAR', entity: 'ativos_tecnologicos', entityId: Number(asset.id), details: { cliente_id: data.cliente_id, criticidade: data.criticidade } }, transaction);
    return asset.id;
  });
  return getAsset(auth, id);
}

export async function updateAsset(auth, assetId, input) {
  const { Asset, sequelize } = getModels();
  const asset = await Asset.findOne({ where: { id: idOf(assetId, 'Ativo', { required: true }) } });
  if (!asset) throw httpError(404, 'Ativo não encontrado.');
  await assertClientAccess(auth, asset.cliente_id);
  const data = normaliseAssetPayload(input, asset.get({ plain: true }));
  await assertClientAccess(auth, data.cliente_id);
  await sequelize.transaction(async (transaction) => {
    await assertActiveClient(data.cliente_id, transaction);
    await assertInventoryAvailable(data.cliente_id, data.numero_inventario, asset.id, transaction);
    await asset.update({ ...data, atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: Number(auth.sub), action: data.ativo ? 'ATUALIZAR' : 'DESATIVAR', entity: 'ativos_tecnologicos', entityId: Number(asset.id), details: { cliente_id: data.cliente_id, criticidade: data.criticidade } }, transaction);
  });
  return getAsset({ ...auth, role: 'admin' }, asset.id).catch(() => serialise(asset));
}

/**
 * Cria um ativo no contexto da transação de uma importação Excel. A validação
 * de campos, associação e unicidade é a mesma usada pelo formulário normal;
 * o registo de auditoria agregado fica a cargo do serviço de importação.
 */
export async function createAssetFromImport(auth, input, { transaction, importId }) {
  const data = normaliseAssetPayload(input);
  await assertClientAccess(auth, data.cliente_id);
  await assertActiveClient(data.cliente_id, transaction);
  await assertInventoryAvailable(data.cliente_id, data.numero_inventario, null, transaction);

  const { Asset } = getModels();
  return Asset.create({
    ...data,
    importacao_id: Number(importId),
    criado_por: Number(auth.sub),
    criado_em: new Date(),
    atualizado_em: new Date(),
  }, { transaction });
}
