import net from 'node:net';
import { Op } from 'sequelize';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';

const SEVERITIES = new Set(['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA']);
const STATES = new Set(['ABERTO', 'EM_ANALISE', 'ENCERRADO']);
const RECURRENCE = new Set(['BAIXA', 'MEDIA', 'ALTA']);

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

function bool(value, name, fallback) {
  const result = value === undefined ? fallback : value;
  if (typeof result !== 'boolean') throw httpError(400, `${name} tem de ser booleano.`);
  return result;
}

function nonNegativeInteger(value, name, fallback) {
  const result = value === undefined ? fallback : value;
  const numeric = Number(result);
  if (!Number.isSafeInteger(numeric) || numeric < 0) throw httpError(400, `${name} tem de ser um número inteiro não negativo.`);
  return numeric;
}

function enumValue(value, name, values, current, { required = false } = {}) {
  const result = text(value === undefined ? current : value, 20, { required }).toUpperCase();
  if (!result && !required) return null;
  if (!values.has(result)) throw httpError(400, `${name} inválido.`);
  return result;
}

function dateTime(value, name, current = null, { required = false } = {}) {
  const raw = value === undefined ? current : value;
  if (raw === null || raw === '') {
    if (required) throw httpError(400, `${name} é obrigatório.`);
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw httpError(400, `${name} inválida.`);
  return parsed;
}

function ipAddress(value, current = null) {
  const result = optionalText(value, 64, current);
  if (result && net.isIP(result) === 0) throw httpError(400, 'IP do atacante inválido.');
  return result;
}

function serialise(incident) {
  const item = incident.get ? incident.get({ plain: true }) : incident;
  return {
    ...item,
    id: Number(item.id),
    cliente_id: Number(item.cliente_id),
    cliente_nome: item.cliente?.nome ?? item.cliente_nome ?? null,
    titulo: item.tipo_incidente,
    tipo: item.tipo_incidente,
    severidade: item.gravidade,
    detetado_em: item.data_hora_incidente,
    resolvido_em: item.encerrado_em,
    cliente: undefined,
  };
}

function incidentPayload(input, current = {}, { clientCanReport = false } = {}) {
  const requestedState = input.estado === undefined ? current.estado ?? 'ABERTO' : input.estado;
  const estado = enumValue(requestedState, 'Estado', STATES, undefined, { required: true });
  if (clientCanReport && estado !== 'ABERTO') throw httpError(403, 'O Cliente apenas pode reportar incidentes abertos.');
  return {
    cliente_id: idOf(input.cliente_id ?? input.clienteId ?? current.cliente_id, 'Cliente', { required: true }),
    codigo: text(input.codigo ?? current.codigo, 40, { required: true }),
    data_hora_incidente: dateTime(input.data_hora_incidente ?? input.detetado_em, 'Data de deteção', current.data_hora_incidente, { required: true }),
    registado_por: optionalText(input.registado_por ?? input.registadoPor, 120, current.registado_por),
    departamento: optionalText(input.departamento, 120, current.departamento),
    tipo_incidente: text(input.tipo_incidente ?? input.tipo ?? input.titulo ?? current.tipo_incidente, 100, { required: true }),
    descricao: text(input.descricao ?? current.descricao, 10000, { required: true }),
    utilizadores_afetados: nonNegativeInteger(input.utilizadores_afetados ?? input.utilizadoresAfetados, 'Utilizadores afetados', current.utilizadores_afetados ?? 0),
    dados_comprometidos: bool(input.dados_comprometidos ?? input.dadosComprometidos, 'dados_comprometidos', current.dados_comprometidos ?? false),
    sistemas_afetados: optionalText(input.sistemas_afetados ?? input.sistemasAfetados, 10000, current.sistemas_afetados),
    origem_ataque: optionalText(input.origem_ataque ?? input.origemAtaque, 160, current.origem_ataque),
    ip_atacante: ipAddress(input.ip_atacante ?? input.ipAtacante, current.ip_atacante),
    analise_log: optionalText(input.analise_log ?? input.analiseLog, 10000, current.analise_log),
    resposta_imediata: optionalText(input.resposta_imediata ?? input.respostaImediata, 10000, current.resposta_imediata),
    medidas_corretivas: optionalText(input.medidas_corretivas ?? input.medidasCorretivas, 10000, current.medidas_corretivas),
    entidades_internas: optionalText(input.entidades_internas ?? input.entidadesInternas, 10000, current.entidades_internas),
    entidades_externas: optionalText(input.entidades_externas ?? input.entidadesExternas, 10000, current.entidades_externas),
    gravidade: enumValue(input.gravidade ?? input.severidade, 'Gravidade', SEVERITIES, current.gravidade, { required: true }),
    probabilidade_reincidencia: enumValue(input.probabilidade_reincidencia ?? input.probabilidadeReincidencia, 'Probabilidade de reincidência', RECURRENCE, current.probabilidade_reincidencia),
    recomendacoes: optionalText(input.recomendacoes, 10000, current.recomendacoes),
    estado,
    ativo: bool(input.ativo, 'ativo', current.ativo ?? true),
  };
}

async function assertActiveClient(clientId, transaction) {
  const { Client } = getModels();
  const client = await Client.findOne({ where: { id: clientId, ativo: true }, transaction });
  if (!client) throw httpError(400, 'Cliente não encontrado ou inativo.');
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
  if (filters.estado) where.estado = enumValue(filters.estado, 'Estado', STATES, undefined, { required: true });
  if (filters.gravidade) where.gravidade = enumValue(filters.gravidade, 'Gravidade', SEVERITIES, undefined, { required: true });
  const from = dateTime(filters.de ?? filters.data_inicio, 'Data inicial');
  const to = dateTime(filters.ate ?? filters.data_fim, 'Data final');
  if (from || to) where.data_hora_incidente = { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) };
  const q = typeof filters.q === 'string' ? filters.q.trim().slice(0, 160) : '';
  if (q) where[Op.or] = [
    { codigo: { [Op.iLike]: `%${q}%` } },
    { tipo_incidente: { [Op.iLike]: `%${q}%` } },
    { descricao: { [Op.iLike]: `%${q}%` } },
  ];
  return where;
}

export async function listIncidents(auth, filters = {}) {
  const { Incident, Client } = getModels();
  const where = await whereFor(auth, filters);
  if (!where) return [];
  const rows = await Incident.findAll({
    where,
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['data_hora_incidente', 'DESC'], ['id', 'DESC']],
  });
  return rows.map(serialise);
}

export async function getIncident(auth, incidentId) {
  const { Incident, Client } = getModels();
  const incident = await Incident.findOne({
    where: { id: idOf(incidentId, 'Incidente', { required: true }), ativo: true },
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
  });
  if (!incident) throw httpError(404, 'Incidente não encontrado.');
  await assertClientAccess(auth, incident.cliente_id);
  return serialise(incident);
}

async function assertCodeAvailable(clientId, code, currentId, transaction) {
  const { Incident } = getModels();
  const duplicate = await Incident.findOne({ where: { cliente_id: clientId, codigo: code }, transaction });
  if (duplicate && String(duplicate.id) !== String(currentId)) throw httpError(409, 'Já existe um incidente com este código para o cliente.');
}

async function actorName(userId, transaction) {
  const { User } = getModels();
  const user = await User.findByPk(userId, { attributes: ['nome'], transaction });
  return user?.nome ?? null;
}

function closure(data, input, current, actor) {
  if (data.estado !== 'ENCERRADO') return { encerrado_em: null, responsavel_encerramento: null };
  const closedAt = dateTime(input.encerrado_em ?? input.resolvido_em, 'Data de encerramento', current.encerrado_em ?? new Date(), { required: true });
  if (closedAt < data.data_hora_incidente) throw httpError(400, 'A data de encerramento não pode ser anterior à deteção.');
  return { encerrado_em: closedAt, responsavel_encerramento: input.responsavel_encerramento ?? current.responsavel_encerramento ?? actor };
}

export async function createIncident(auth, input) {
  const isClient = auth.role === 'client';
  const data = incidentPayload(input, {}, { clientCanReport: isClient });
  await assertClientAccess(auth, data.cliente_id);
  const { sequelize, Incident } = getModels();
  const id = await sequelize.transaction(async (transaction) => {
    await assertActiveClient(data.cliente_id, transaction);
    await assertCodeAvailable(data.cliente_id, data.codigo, null, transaction);
    const incident = await Incident.create({ ...data, ...closure(data, input, {}, null), criado_por: Number(auth.sub), criado_em: new Date(), atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: Number(auth.sub), action: 'CRIAR', entity: 'incidentes', entityId: Number(incident.id), details: { cliente_id: data.cliente_id, codigo: data.codigo, gravidade: data.gravidade } }, transaction);
    return incident.id;
  });
  return getIncident(auth, id);
}

export async function updateIncident(auth, incidentId, input) {
  const { Incident, sequelize } = getModels();
  const incident = await Incident.findOne({ where: { id: idOf(incidentId, 'Incidente', { required: true }) } });
  if (!incident) throw httpError(404, 'Incidente não encontrado.');
  await assertClientAccess(auth, incident.cliente_id);
  const current = incident.get({ plain: true });
  const data = incidentPayload(input, current);
  await assertClientAccess(auth, data.cliente_id);
  await sequelize.transaction(async (transaction) => {
    await assertActiveClient(data.cliente_id, transaction);
    await assertCodeAvailable(data.cliente_id, data.codigo, incident.id, transaction);
    const responsible = data.estado === 'ENCERRADO' ? await actorName(Number(auth.sub), transaction) : null;
    await incident.update({ ...data, ...closure(data, input, current, responsible), atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: Number(auth.sub), action: data.ativo ? (data.estado === 'ENCERRADO' ? 'ENCERRAR' : 'ATUALIZAR') : 'DESATIVAR', entity: 'incidentes', entityId: Number(incident.id), details: { cliente_id: data.cliente_id, codigo: data.codigo, estado: data.estado, gravidade: data.gravidade } }, transaction);
  });
  return getIncident({ ...auth, role: 'admin' }, incident.id).catch(() => serialise(incident));
}
