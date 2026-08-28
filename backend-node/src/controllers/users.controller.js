import { httpError } from '../middleware/errors.js';
import { createUser, getUser, listUsers, updateUser } from '../services/users.service.js';

function userId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, 'Identificador de utilizador inválido.');
  return id;
}

export async function list(request, response, next) {
  try { return response.json({ items: await listUsers(request.query.perfil, request.query.q) }); } catch (error) { return next(error); }
}

export async function detail(request, response, next) {
  try { return response.json(await getUser(userId(request.params.userId))); } catch (error) { return next(error); }
}

export async function create(request, response, next) {
  try {
    const created = await createUser(request.body ?? {}, Number(request.auth.sub));
    return response.set('Cache-Control', 'no-store').status(201).json(created);
  } catch (error) { return next(error); }
}

export async function update(request, response, next) {
  try { return response.json(await updateUser(userId(request.params.userId), request.body ?? {}, Number(request.auth.sub))); } catch (error) { return next(error); }
}

// Contrato transitório do frontend Django atual: devolve uma lista direta.
export async function legacyList(request, response, next) {
  try { return response.json(await listUsers(request.query.perfil, request.query.q)); } catch (error) { return next(error); }
}
