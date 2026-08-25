import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { recordAudit } from './audit-log.service.js';

const CONTACT_STATES = new Set(['NOVA', 'EM_ANALISE', 'RESPONDIDA', 'ARQUIVADA']);

function cleanText(value, maximum, { required = false } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw httpError(400, 'Campo obrigatório.');
  if (text.length > maximum) throw httpError(400, `Máximo de ${maximum} caracteres.`);
  return text;
}

function requiredBoolean(value, fallback) {
  const resolved = value === undefined ? fallback : value;
  if (typeof resolved !== 'boolean') throw httpError(400, 'O campo ativo/publicada tem de ser booleano.');
  return resolved;
}

function nonNegativeInteger(value, fallback = 0) {
  const resolved = value === undefined ? fallback : value;
  if (!Number.isInteger(resolved) || resolved < 0) throw httpError(400, 'A ordem tem de ser um número inteiro não negativo.');
  return resolved;
}

function serialiseContent(record) {
  const row = record.get ? record.get({ plain: true }) : record;
  return {
    ...row,
    id: Number(row.id),
    atualizado_por: row.atualizado_por === null || row.atualizado_por === undefined ? null : Number(row.atualizado_por),
    atualizado_por_nome: row.atualizadoPor?.nome ?? row.atualizado_por_nome ?? null,
    atualizadoPor: undefined,
  };
}

function serialiseNews(record) {
  const row = record.get ? record.get({ plain: true }) : record;
  return {
    ...row,
    id: Number(row.id),
    autor_id: row.autor_id === null || row.autor_id === undefined ? null : Number(row.autor_id),
    autor_nome: row.autor?.nome ?? row.autor_nome ?? null,
    autor: undefined,
  };
}

function serialiseContactMessage(record) {
  const row = record.get ? record.get({ plain: true }) : record;
  return {
    ...row,
    id: Number(row.id),
    respondida_por: row.respondida_por === null || row.respondida_por === undefined ? null : Number(row.respondida_por),
    respondida_por_nome: row.respondidaPor?.nome ?? row.respondida_por_nome ?? null,
    respondidaPor: undefined,
  };
}

function contentPayload(input, current = {}) {
  return {
    chave: cleanText(input.chave ?? current.chave, 80, { required: true }),
    titulo: cleanText(input.titulo ?? current.titulo, 180, { required: true }),
    subtitulo: cleanText(input.subtitulo ?? current.subtitulo, 240) || null,
    corpo: cleanText(input.corpo ?? current.corpo, 10000) || null,
    imagem_url: cleanText(input.imagem_url ?? current.imagem_url, 500) || null,
    ativo: requiredBoolean(input.ativo, current.ativo ?? true),
    ordem: nonNegativeInteger(input.ordem, current.ordem ?? 0),
  };
}

function newsPayload(input, current = {}) {
  return {
    titulo: cleanText(input.titulo ?? current.titulo, 180, { required: true }),
    resumo: cleanText(input.resumo ?? current.resumo, 500, { required: true }),
    corpo: cleanText(input.corpo ?? current.corpo, 20000, { required: true }),
    imagem_url: cleanText(input.imagem_url ?? current.imagem_url, 500) || null,
    publicada: requiredBoolean(input.publicada, current.publicada ?? false),
    ativo: requiredBoolean(input.ativo, current.ativo ?? true),
  };
}

export function validateContactPayload(input) {
  const email = cleanText(input.email, 255, { required: true });
  // Mantém a validação de formato independente do browser, sem tentar
  // substituir uma validação DNS/SMTP que não existe no projeto atual.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Email inválido.');
  return {
    nome: cleanText(input.nome, 120, { required: true }),
    email,
    telefone: cleanText(input.telefone, 30) || null,
    empresa: cleanText(input.empresa, 160) || null,
    assunto: cleanText(input.assunto, 180, { required: true }),
    mensagem: cleanText(input.mensagem, 5000, { required: true }),
  };
}

async function findContent(id) {
  const { SiteContent, User } = getModels();
  const content = await SiteContent.findByPk(id, {
    include: [{ model: User, as: 'atualizadoPor', attributes: ['nome'] }],
  });
  if (!content) throw httpError(404, 'Conteúdo não encontrado.');
  return content;
}

async function findNews(id, { publicOnly = false } = {}) {
  const { News, User } = getModels();
  const news = await News.findOne({
    where: publicOnly ? { id, publicada: true, ativo: true } : { id },
    include: [{ model: User, as: 'autor', attributes: ['nome'] }],
  });
  if (!news) throw httpError(404, 'Notícia não encontrada.');
  return news;
}

export async function listPublicContents(chave) {
  const { SiteContent, User } = getModels();
  const where = { ativo: true };
  if (chave) where.chave = cleanText(chave, 80, { required: true });
  const rows = await SiteContent.findAll({
    where,
    include: [{ model: User, as: 'atualizadoPor', attributes: ['nome'] }],
    order: [['ordem', 'ASC'], ['id', 'ASC']],
  });
  return rows.map(serialiseContent);
}

export async function listAdminContents() {
  const { SiteContent, User } = getModels();
  const rows = await SiteContent.findAll({
    include: [{ model: User, as: 'atualizadoPor', attributes: ['nome'] }],
    order: [['ordem', 'ASC'], ['id', 'ASC']],
  });
  return rows.map(serialiseContent);
}

export async function getAdminContent(id) {
  return serialiseContent(await findContent(id));
}

export async function createContent(input, actorId) {
  const { sequelize, SiteContent } = getModels();
  const payload = contentPayload(input);
  const contentId = await sequelize.transaction(async (transaction) => {
    const row = await SiteContent.create({ ...payload, atualizado_por: actorId, criado_em: new Date(), atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: actorId, action: 'CRIAR', entity: 'conteudos_site', entityId: Number(row.id), details: { chave: payload.chave, ativo: payload.ativo } }, transaction);
    return row.id;
  });
  return getAdminContent(contentId);
}

export async function updateContent(id, input, actorId) {
  const current = await findContent(id);
  const payload = contentPayload(input, current.get({ plain: true }));
  const { sequelize } = getModels();
  await sequelize.transaction(async (transaction) => {
    await current.update({ ...payload, atualizado_por: actorId, atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: actorId, action: 'ATUALIZAR', entity: 'conteudos_site', entityId: Number(id), details: { chave: payload.chave, ativo: payload.ativo } }, transaction);
  });
  return getAdminContent(id);
}

export async function listPublicNews() {
  const { News, User } = getModels();
  const rows = await News.findAll({
    where: { publicada: true, ativo: true },
    include: [{ model: User, as: 'autor', attributes: ['nome'] }],
    order: [['publicada_em', 'DESC'], ['id', 'DESC']],
  });
  return rows.map(serialiseNews);
}

export async function getPublicNews(id) {
  return serialiseNews(await findNews(id, { publicOnly: true }));
}

export async function listAdminNews() {
  const { News, User } = getModels();
  const rows = await News.findAll({
    include: [{ model: User, as: 'autor', attributes: ['nome'] }],
    order: [['criado_em', 'DESC'], ['id', 'DESC']],
  });
  return rows.map(serialiseNews);
}

export async function getAdminNews(id) {
  return serialiseNews(await findNews(id));
}

export async function createNews(input, actorId) {
  const { sequelize, News } = getModels();
  const payload = newsPayload(input);
  const newsId = await sequelize.transaction(async (transaction) => {
    const row = await News.create({
      ...payload,
      autor_id: actorId,
      publicada_em: payload.publicada ? new Date() : null,
      criado_em: new Date(),
      atualizado_em: new Date(),
    }, { transaction });
    await recordAudit({ userId: actorId, action: 'CRIAR', entity: 'noticias', entityId: Number(row.id), details: { publicada: payload.publicada, ativo: payload.ativo } }, transaction);
    return row.id;
  });
  return getAdminNews(newsId);
}

export async function updateNews(id, input, actorId) {
  const current = await findNews(id);
  const currentData = current.get({ plain: true });
  const payload = newsPayload(input, currentData);
  const { sequelize } = getModels();
  await sequelize.transaction(async (transaction) => {
    await current.update({
      ...payload,
      autor_id: actorId,
      publicada_em: payload.publicada ? (currentData.publicada_em ?? new Date()) : null,
      atualizado_em: new Date(),
    }, { transaction });
    await recordAudit({ userId: actorId, action: payload.ativo ? 'ATUALIZAR' : 'DESATIVAR', entity: 'noticias', entityId: Number(id), details: { publicada: payload.publicada, ativo: payload.ativo } }, transaction);
  });
  return getAdminNews(id);
}

export async function createContactMessage(input) {
  const { sequelize, ContactMessage } = getModels();
  const payload = validateContactPayload(input);
  const id = await sequelize.transaction(async (transaction) => {
    const row = await ContactMessage.create({ ...payload, estado: 'NOVA', criado_em: new Date() }, { transaction });
    await recordAudit({ action: 'CONTACTO_PUBLICO', entity: 'mensagens_contacto', entityId: Number(row.id) }, transaction);
    return row.id;
  });
  return id;
}

export async function listContactMessages() {
  const { ContactMessage, User } = getModels();
  const rows = await ContactMessage.findAll({
    include: [{ model: User, as: 'respondidaPor', attributes: ['nome'] }],
    order: [['criado_em', 'DESC'], ['id', 'DESC']],
  });
  return rows.map(serialiseContactMessage);
}

export async function updateContactMessageState(id, state, actorId) {
  const normalized = typeof state === 'string' ? state.trim().toUpperCase() : '';
  if (!CONTACT_STATES.has(normalized)) throw httpError(400, 'Estado inválido.');
  const { ContactMessage, sequelize } = getModels();
  const message = await ContactMessage.findByPk(id);
  if (!message) throw httpError(404, 'Mensagem não encontrada.');
  const current = message.get({ plain: true });
  await sequelize.transaction(async (transaction) => {
    await message.update({
      estado: normalized,
      respondida_por: normalized === 'RESPONDIDA' ? actorId : current.respondida_por,
      respondida_em: normalized === 'RESPONDIDA' ? (current.respondida_em ?? new Date()) : current.respondida_em,
    }, { transaction });
    await recordAudit({ userId: actorId, action: 'ALTERAR_ESTADO', entity: 'mensagens_contacto', entityId: Number(id), details: { estado: normalized } }, transaction);
  });
  return serialiseContactMessage(await ContactMessage.findByPk(id));
}
