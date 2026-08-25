import { httpError } from '../middleware/errors.js';
import {
  createContactMessage, createContent, createNews, getAdminContent, getAdminNews, getPublicNews,
  listAdminContents, listAdminNews, listContactMessages, listPublicContents, listPublicNews,
  updateContactMessageState, updateContent, updateNews,
} from '../services/cms.service.js';

function numericId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `Identificador de ${label} inválido.`);
  return id;
}

export async function publicContents(request, response, next) {
  try { return response.json(await listPublicContents(request.query.chave)); } catch (error) { return next(error); }
}

export async function publicNews(request, response, next) {
  try { return response.json(await listPublicNews()); } catch (error) { return next(error); }
}

export async function publicNewsDetail(request, response, next) {
  try { return response.json(await getPublicNews(numericId(request.params.id, 'notícia'))); } catch (error) { return next(error); }
}

export async function publicContact(request, response, next) {
  try {
    const id = await createContactMessage(request.body ?? {});
    return response.status(201).json({ mensagem: 'Mensagem enviada com sucesso.', id: Number(id) });
  } catch (error) { return next(error); }
}

export async function adminContents(request, response, next) {
  try {
    if (request.method === 'GET') return response.json(await listAdminContents());
    return response.status(201).json(await createContent(request.body ?? {}, Number(request.auth.sub)));
  } catch (error) { return next(error); }
}

export async function adminContentDetail(request, response, next) {
  try {
    const id = numericId(request.params.id, 'conteúdo');
    if (request.method === 'GET') return response.json(await getAdminContent(id));
    return response.json(await updateContent(id, request.body ?? {}, Number(request.auth.sub)));
  } catch (error) { return next(error); }
}

export async function adminNews(request, response, next) {
  try {
    if (request.method === 'GET') return response.json(await listAdminNews());
    return response.status(201).json(await createNews(request.body ?? {}, Number(request.auth.sub)));
  } catch (error) { return next(error); }
}

export async function adminNewsDetail(request, response, next) {
  try {
    const id = numericId(request.params.id, 'notícia');
    if (request.method === 'GET') return response.json(await getAdminNews(id));
    return response.json(await updateNews(id, request.body ?? {}, Number(request.auth.sub)));
  } catch (error) { return next(error); }
}

export async function adminContactMessages(_request, response, next) {
  try { return response.json(await listContactMessages()); } catch (error) { return next(error); }
}

export async function adminContactMessageDetail(request, response, next) {
  try {
    const id = numericId(request.params.id, 'mensagem');
    return response.json(await updateContactMessageState(id, request.body?.estado, Number(request.auth.sub)));
  } catch (error) { return next(error); }
}
