import { createRequest, getRequest, listRequests, updateRequest } from '../services/requests.service.js';
import { httpError } from '../middleware/errors.js';

function requestId(request) {
  const id = Number(request.params.requestId);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, 'Identificador de pedido inválido.');
  return id;
}

export async function list(request, response, next) {
  try { return response.json({ items: await listRequests(request.auth, request.query) }); } catch (error) { return next(error); }
}

export async function detail(request, response, next) {
  try { return response.json(await getRequest(request.auth, requestId(request))); } catch (error) { return next(error); }
}

export async function create(request, response, next) {
  try { return response.status(201).json(await createRequest(request.auth, request.body ?? {})); } catch (error) { return next(error); }
}

export async function update(request, response, next) {
  try { return response.json(await updateRequest(request.auth, requestId(request), request.body ?? {})); } catch (error) { return next(error); }
}

// Mantém o contrato consumido pelo frontend existente até à migração gradual.
export async function legacyList(request, response, next) {
  try { return response.json(await listRequests(request.auth, request.query)); } catch (error) { return next(error); }
}
