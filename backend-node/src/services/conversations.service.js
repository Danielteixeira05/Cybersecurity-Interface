import { Op } from 'sequelize';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';
import { emitChatMessage, emitChatRead } from '../socket/events.js';

const MAX_MESSAGE_LENGTH = 2000;
const PAGE_SIZE = 50;
const MESSAGE_RATE_LIMIT = 12;
const MESSAGE_RATE_WINDOW_MS = 60_000;
const messageWindows = new Map();

function idOf(value, name, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw httpError(400, `${name} é obrigatório.`);
    return undefined;
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `${name} inválido.`);
  return id;
}

function limitOf(value) {
  if (value === undefined || value === null || value === '') return PAGE_SIZE;
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1) throw httpError(400, 'Limite de paginação inválido.');
  return Math.min(limit, 100);
}

export function normaliseMessageContent(value) {
  if (typeof value !== 'string') throw httpError(400, 'A mensagem é obrigatória.');
  const content = value.trim();
  if (!content) throw httpError(400, 'A mensagem não pode estar vazia.');
  if (content.length > MAX_MESSAGE_LENGTH) throw httpError(400, `A mensagem não pode exceder ${MAX_MESSAGE_LENGTH} caracteres.`);
  return content;
}

function enforceMessageRate(userId) {
  const now = Date.now();
  const current = (messageWindows.get(userId) ?? []).filter((timestamp) => now - timestamp < MESSAGE_RATE_WINDOW_MS);
  if (current.length >= MESSAGE_RATE_LIMIT) throw httpError(429, 'Foram enviadas demasiadas mensagens. Tente novamente dentro de instantes.');
  current.push(now);
  messageWindows.set(userId, current);
}

function serialiseClient(client) {
  const row = client?.get ? client.get({ plain: true }) : client;
  if (!row) return null;
  return { id: Number(row.id), nome: row.nome, nif: row.nif ?? null };
}

function serialiseMessage(message) {
  const row = message?.get ? message.get({ plain: true }) : message;
  if (!row) return null;
  const sender = row.remetente?.get ? row.remetente.get({ plain: true }) : row.remetente;
  const profile = sender?.perfil?.get ? sender.perfil.get({ plain: true }) : sender?.perfil;
  return {
    id: Number(row.id),
    conversa_id: Number(row.conversa_id),
    remetente_id: Number(row.remetente_id),
    conteudo: row.conteudo,
    criado_em: row.criado_em,
    remetente: sender ? { id: Number(sender.id), nome: sender.nome, perfil_codigo: profile?.codigo ?? null } : null,
  };
}

async function managersForClient(clientId, transaction) {
  const { Profile, User, UserClient } = getModels();
  const links = await UserClient.findAll({
    where: { cliente_id: clientId, ativo: true },
    attributes: ['utilizador_id'],
    include: [{
      model: User,
      as: 'utilizador',
      required: true,
      where: { ativo: true },
      attributes: ['id', 'nome'],
      include: [{
        model: Profile,
        as: 'perfil',
        required: true,
        where: { codigo: 'COLABORADOR' },
        attributes: ['codigo'],
      }],
    }],
    transaction,
  });
  return links.map((link) => ({ id: Number(link.utilizador.id), nome: link.utilizador.nome }));
}

async function recipientIdsForClient(clientId, transaction) {
  const { Profile, User, UserClient } = getModels();
  const [admins, links] = await Promise.all([
    User.findAll({
      where: { ativo: true },
      attributes: ['id'],
      include: [{ model: Profile, as: 'perfil', required: true, where: { codigo: 'ADMINISTRADOR' }, attributes: [] }],
      transaction,
    }),
    UserClient.findAll({
      where: { cliente_id: clientId, ativo: true },
      attributes: ['utilizador_id', 'principal'],
      include: [{
        model: User,
        as: 'utilizador',
        required: true,
        where: { ativo: true },
        attributes: ['id'],
        include: [{ model: Profile, as: 'perfil', required: true, attributes: ['codigo'] }],
      }],
      transaction,
    }),
  ]);
  return [...new Set([
    ...admins.map((user) => Number(user.id)),
    ...links
      .filter((link) => link.utilizador?.perfil?.codigo === 'COLABORADOR' || (link.principal && link.utilizador?.perfil?.codigo === 'CLIENTE'))
      .map((link) => Number(link.utilizador_id)),
  ])];
}

async function findAuthorisedConversation(auth, conversationId, transaction) {
  const id = idOf(conversationId, 'Conversa', { required: true });
  const { Client, Conversation } = getModels();
  const conversation = await Conversation.findOne({
    where: { id, ativo: true },
    include: [{ model: Client, as: 'cliente', required: true, where: { ativo: true }, attributes: ['id', 'nome', 'nif'] }],
    transaction,
  });
  if (!conversation) throw httpError(404, 'Conversa não encontrada.');
  await assertClientAccess(auth, conversation.cliente_id);
  return conversation;
}

async function conversationClientIdForEnsure(auth, input) {
  const requestedId = idOf(input?.cliente_id ?? input?.clienteId, 'Cliente');
  if (auth.role === 'client') {
    const ids = await clientIdsForUser(auth.sub, { principalOnly: true });
    if (ids.length === 0) throw httpError(403, 'Não existe uma organização ativa associada a este Cliente.');
    if (ids.length !== 1) throw httpError(400, 'A conta Cliente não tem uma associação principal única.');
    const clientId = Number(ids[0]);
    if (requestedId && requestedId !== clientId) throw httpError(403, 'Sem permissão para criar uma conversa para esta organização.');
    return clientId;
  }
  const clientId = idOf(requestedId, 'Cliente', { required: true });
  await assertClientAccess(auth, clientId);
  return clientId;
}

async function assertActiveClient(clientId, transaction) {
  const { Client } = getModels();
  const client = await Client.findOne({ where: { id: clientId, ativo: true }, transaction });
  if (!client) throw httpError(404, 'Organização não encontrada ou inativa.');
  return client;
}

async function lastMessageForConversation(conversationId, transaction) {
  const { Message, Profile, User } = getModels();
  return Message.findOne({
    where: { conversa_id: conversationId, ativo: true },
    include: [{ model: User, as: 'remetente', attributes: ['id', 'nome'], include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }] }],
    order: [['id', 'DESC']],
    transaction,
  });
}

async function unreadCount(conversationId, userId, transaction) {
  const { ConversationRead, Message } = getModels();
  const read = await ConversationRead.findOne({ where: { conversa_id: conversationId, utilizador_id: userId }, transaction });
  const afterId = Number(read?.ultima_mensagem_id ?? 0);
  return Message.count({ where: { conversa_id: conversationId, ativo: true, id: { [Op.gt]: afterId } }, transaction });
}

async function serialiseConversation(conversation, userId, transaction) {
  const row = conversation.get ? conversation.get({ plain: true }) : conversation;
  const [lastMessage, unread, gestores] = await Promise.all([
    lastMessageForConversation(row.id, transaction),
    unreadCount(row.id, userId, transaction),
    managersForClient(row.cliente_id, transaction),
  ]);
  return {
    id: Number(row.id),
    cliente_id: Number(row.cliente_id),
    cliente: serialiseClient(row.cliente),
    ativo: Boolean(row.ativo),
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    ultima_mensagem: serialiseMessage(lastMessage),
    nao_lidas: unread,
    gestores,
  };
}

export async function listConversations(auth) {
  const { Client, Conversation } = getModels();
  const where = { ativo: true };
  if (auth.role !== 'admin') {
    const ids = await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' });
    if (!ids.length) return [];
    where.cliente_id = ids;
  }
  const rows = await Conversation.findAll({
    where,
    include: [{ model: Client, as: 'cliente', required: true, where: { ativo: true }, attributes: ['id', 'nome', 'nif'] }],
    order: [['atualizado_em', 'DESC'], ['id', 'DESC']],
  });
  return Promise.all(rows.map((conversation) => serialiseConversation(conversation, Number(auth.sub))));
}

export async function ensureConversation(auth, input = {}) {
  const clientId = await conversationClientIdForEnsure(auth, input);
  const { Conversation, sequelize } = getModels();
  const conversationId = await sequelize.transaction(async (transaction) => {
    await assertActiveClient(clientId, transaction);
    const [conversation] = await Conversation.findOrCreate({
      where: { cliente_id: clientId, ativo: true },
      defaults: { cliente_id: clientId, ativo: true, criado_em: new Date(), atualizado_em: new Date() },
      transaction,
    });
    return Number(conversation.id);
  });
  const conversations = await listConversations(auth);
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) throw httpError(403, 'Sem permissão para consultar esta conversa.');
  return conversation;
}

export async function listMessages(auth, conversationId, query = {}) {
  const conversation = await findAuthorisedConversation(auth, conversationId);
  const before = idOf(query.before, 'Cursor');
  const limit = limitOf(query.limit);
  const { Message, Profile, User } = getModels();
  const where = { conversa_id: Number(conversation.id), ativo: true };
  if (before) where.id = { [Op.lt]: before };
  const rows = await Message.findAll({
    where,
    include: [{ model: User, as: 'remetente', attributes: ['id', 'nome'], include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }] }],
    order: [['id', 'DESC']],
    limit: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).reverse().map(serialiseMessage);
  return { items: page, next_cursor: hasMore && page.length ? String(page[0].id) : null };
}

export async function sendMessage(auth, conversationId, input = {}) {
  const content = normaliseMessageContent(input.conteudo ?? input.mensagem);
  enforceMessageRate(String(auth.sub));
  const { ConversationRead, Message, Profile, User, sequelize } = getModels();
  const saved = await sequelize.transaction(async (transaction) => {
    const conversation = await findAuthorisedConversation(auth, conversationId, transaction);
    const message = await Message.create({
      conversa_id: Number(conversation.id),
      remetente_id: Number(auth.sub),
      conteudo: content,
      criado_em: new Date(),
      ativo: true,
    }, { transaction });
    await conversation.update({ atualizado_em: new Date() }, { transaction });
    await ConversationRead.upsert({
      conversa_id: Number(conversation.id), utilizador_id: Number(auth.sub), ultima_mensagem_id: Number(message.id), atualizado_em: new Date(),
    }, { transaction });
    await recordAudit({
      userId: Number(auth.sub), action: 'ENVIAR_MENSAGEM', entity: 'mensagens', entityId: Number(message.id),
      details: { conversa_id: Number(conversation.id), cliente_id: Number(conversation.cliente_id) },
    }, transaction);
    const recipients = await recipientIdsForClient(Number(conversation.cliente_id), transaction);
    const hydrated = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'remetente', attributes: ['id', 'nome'], include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }] }],
      transaction,
    });
    return { message: serialiseMessage(hydrated), recipientIds: recipients, clienteId: Number(conversation.cliente_id) };
  });
  emitChatMessage(saved.message, saved.recipientIds, Number(auth.sub), saved.clienteId);
  return saved.message;
}

export async function markConversationRead(auth, conversationId) {
  const { ConversationRead, sequelize } = getModels();
  const result = await sequelize.transaction(async (transaction) => {
    const conversation = await findAuthorisedConversation(auth, conversationId, transaction);
    const lastMessage = await lastMessageForConversation(Number(conversation.id), transaction);
    await ConversationRead.upsert({
      conversa_id: Number(conversation.id), utilizador_id: Number(auth.sub), ultima_mensagem_id: lastMessage ? Number(lastMessage.id) : null, atualizado_em: new Date(),
    }, { transaction });
    return { conversa_id: Number(conversation.id), ultima_mensagem_id: lastMessage ? Number(lastMessage.id) : null, atualizado_em: new Date() };
  });
  emitChatRead(Number(auth.sub), result);
  return result;
}
