import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';

const PRIORITIES = new Set(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']);

function asId(value, name, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw httpError(400, `${name} é obrigatório.`);
    return undefined;
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `${name} inválido.`);
  return id;
}

function text(value, maximum, { required = false } = {}) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (required && !result) throw httpError(400, 'Campo obrigatório.');
  if (result.length > maximum) throw httpError(400, `Máximo de ${maximum} caracteres.`);
  return result;
}

function priority(value, current = 'NORMAL') {
  const result = text(value === undefined ? current : value, 20, { required: true }).toUpperCase();
  if (!PRIORITIES.has(result)) throw httpError(400, 'Prioridade inválida.');
  return result;
}

function assertWritable() {
  if (env.readOnlyMode) throw httpError(403, 'As alterações de pedidos estão desativadas em modo de leitura.');
}

function serialise(request) {
  const item = request.get ? request.get({ plain: true }) : request;
  return {
    ...item,
    id: Number(item.id),
    cliente_id: Number(item.cliente_id),
    criado_por: Number(item.criado_por),
    atribuido_a: item.atribuido_a === null || item.atribuido_a === undefined ? null : Number(item.atribuido_a),
    estado_id: Number(item.estado_id),
    cliente_nome: item.cliente?.nome ?? item.cliente_nome ?? null,
    estado_codigo: item.estado?.codigo ?? item.estado_codigo ?? null,
    estado_nome: item.estado?.nome ?? item.estado_nome ?? null,
    criado_por_nome: item.criadoPor?.nome ?? item.criado_por_nome ?? null,
    atribuido_a_nome: item.atribuidoA?.nome ?? item.atribuido_a_nome ?? null,
    cliente: undefined,
    estado: undefined,
    criadoPor: undefined,
    atribuidoA: undefined,
  };
}

function includes() {
  const { Client, RequestStatus, User } = getModels();
  return [
    { model: Client, as: 'cliente', attributes: ['id', 'nome', 'nif'] },
    { model: RequestStatus, as: 'estado', attributes: ['id', 'codigo', 'nome', 'estado_final', 'ordem'] },
    { model: User, as: 'criadoPor', attributes: ['id', 'nome'] },
    { model: User, as: 'atribuidoA', attributes: ['id', 'nome'] },
  ];
}

async function activeClientIds(auth) {
  if (auth.role === 'admin') return null;
  return (await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' })).map(Number);
}

async function whereFor(auth, filters = {}) {
  const allowed = await activeClientIds(auth);
  const clientId = asId(filters.cliente_id ?? filters.clienteId, 'Cliente');
  if (clientId) {
    await assertClientAccess(auth, clientId);
    return { cliente_id: clientId };
  }
  if (allowed === null) return {};
  if (allowed.length === 0) return null;
  return { cliente_id: allowed };
}

async function activeClientForCreation(auth, input) {
  const requested = asId(input.cliente_id ?? input.clienteId, 'Cliente');
  if (auth.role === 'client') {
    const ids = await activeClientIds(auth);
    if (ids.length !== 1) throw httpError(403, 'Não existe uma organização ativa associada a este Cliente.');
    if (requested && requested !== ids[0]) throw httpError(403, 'O Cliente não pode criar pedidos para outra organização.');
    return ids[0];
  }
  if (!requested) throw httpError(400, 'Selecione a organização do pedido.');
  await assertClientAccess(auth, requested);
  return requested;
}

async function statusByCode(code, transaction) {
  const { RequestStatus } = getModels();
  const status = await RequestStatus.findOne({ where: { codigo: code }, transaction });
  if (!status) throw httpError(400, 'Estado de pedido inválido.');
  return status;
}

async function requestById(auth, requestId, { transaction } = {}) {
  const { Request } = getModels();
  const request = await Request.findByPk(asId(requestId, 'Pedido', { required: true }), { include: includes(), transaction });
  if (!request) throw httpError(404, 'Pedido não encontrado.');
  await assertClientAccess(auth, request.cliente_id);
  return request;
}

async function validAssignee(auth, input, current, transaction) {
  const requested = input.atribuido_a ?? input.atribuidoA;
  if (requested === undefined) return current?.atribuido_a ?? (auth.role === 'manager' ? Number(auth.sub) : null);
  if (requested === null || requested === '') {
    if (auth.role === 'manager') return Number(auth.sub);
    return null;
  }
  const userId = asId(requested, 'Responsável');
  if (auth.role === 'manager' && userId !== Number(auth.sub)) {
    throw httpError(403, 'O Gestor só pode atribuir o pedido a si próprio.');
  }
  const { User, Profile } = getModels();
  const user = await User.findOne({
    where: { id: userId, ativo: true },
    include: [{ model: Profile, as: 'perfil', attributes: ['codigo'], where: { codigo: 'COLABORADOR' }, required: true }],
    transaction,
  });
  if (!user) throw httpError(400, 'Responsável inválido ou inativo.');
  return userId;
}

export function normaliseRequestFields(input, current = {}) {
  return {
    assunto: text(input.assunto ?? current.assunto, 180, { required: true }),
    descricao: text(input.descricao ?? current.descricao, 10000, { required: true }),
    prioridade: priority(input.prioridade, current.prioridade ?? 'NORMAL'),
  };
}

export async function listRequests(auth, filters = {}) {
  const { Request } = getModels();
  const where = await whereFor(auth, filters);
  if (!where) return [];
  const q = typeof filters.q === 'string' ? filters.q.trim().slice(0, 160) : '';
  if (q) where[Op.or] = [
    { assunto: { [Op.iLike]: `%${q}%` } },
    { descricao: { [Op.iLike]: `%${q}%` } },
  ];
  const rows = await Request.findAll({ where, include: includes(), order: [['criado_em', 'DESC'], ['id', 'DESC']] });
  return rows.map(serialise);
}

export async function getRequest(auth, requestId) {
  return serialise(await requestById(auth, requestId));
}

export async function createRequest(auth, input) {
  assertWritable();
  const clientId = await activeClientForCreation(auth, input);
  const fields = normaliseRequestFields(input);
  const { Client, Request, sequelize } = getModels();
  let id;
  await sequelize.transaction(async (transaction) => {
    const client = await Client.findOne({ where: { id: clientId, ativo: true }, transaction });
    if (!client) throw httpError(400, 'Cliente não encontrado ou inativo.');
    const initial = await statusByCode('ABERTO', transaction);
    const now = new Date();
    const request = await Request.create({
      cliente_id: clientId,
      criado_por: Number(auth.sub),
      atribuido_a: auth.role === 'manager' ? Number(auth.sub) : null,
      estado_id: initial.id,
      ...fields,
      criado_em: now,
      atualizado_em: now,
      resolvido_em: null,
      fechado_em: null,
    }, { transaction });
    id = Number(request.id);
    await recordAudit({
      userId: Number(auth.sub), action: 'CRIAR', entity: 'pedidos', entityId: id,
      details: { cliente_id: clientId, prioridade: fields.prioridade, estado: initial.codigo },
    }, transaction);
  });
  return getRequest({ ...auth, role: 'admin' }, id);
}

export async function updateRequest(auth, requestId, input) {
  if (auth.role === 'client') throw httpError(403, 'O Cliente não pode alterar o estado de pedidos.');
  assertWritable();
  const { sequelize } = getModels();
  let id;
  await sequelize.transaction(async (transaction) => {
    const request = await requestById(auth, requestId, { transaction });
    const current = request.get({ plain: true });
    const currentCode = current.estado?.codigo;
    const requestedCode = text(input.estado ?? input.estado_codigo ?? currentCode, 30, { required: true }).toUpperCase();
    const nextStatus = await statusByCode(requestedCode, transaction);
    if (auth.role === 'manager' && currentCode === 'FECHADO' && requestedCode !== 'FECHADO') {
      throw httpError(403, 'Apenas o Administrador pode reabrir um pedido fechado.');
    }
    const fields = normaliseRequestFields({ ...current, ...input }, current);
    const assignee = await validAssignee(auth, input, current, transaction);
    const now = new Date();
    const finished = ['RESOLVIDO', 'FECHADO'].includes(nextStatus.codigo);
    await request.update({
      ...fields,
      estado_id: nextStatus.id,
      atribuido_a: assignee,
      resolvido_em: finished ? (current.resolvido_em ?? now) : null,
      fechado_em: nextStatus.codigo === 'FECHADO' ? (current.fechado_em ?? now) : null,
      atualizado_em: now,
    }, { transaction });
    id = Number(request.id);
    await recordAudit({
      userId: Number(auth.sub), action: 'ATUALIZAR_ESTADO', entity: 'pedidos', entityId: id,
      details: { cliente_id: Number(current.cliente_id), estado_anterior: currentCode, estado_novo: nextStatus.codigo, atribuido_a: assignee },
    }, transaction);
  });
  return getRequest({ ...auth, role: 'admin' }, id);
}
