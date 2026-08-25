import { createAsset, getAsset, listAssets, updateAsset } from '../services/assets.service.js';
import { httpError } from '../middleware/errors.js';

function assetId(request) {
  const id = Number(request.params.assetId);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, 'Identificador de ativo inválido.');
  return id;
}

export async function list(request, response, next) {
  try { return response.json({ items: await listAssets(request.auth, request.query) }); } catch (error) { return next(error); }
}

export async function detail(request, response, next) {
  try { return response.json(await getAsset(request.auth, assetId(request))); } catch (error) { return next(error); }
}

export async function create(request, response, next) {
  try { return response.status(201).json(await createAsset(request.auth, request.body ?? {})); } catch (error) { return next(error); }
}

export async function update(request, response, next) {
  try { return response.json(await updateAsset(request.auth, assetId(request), request.body ?? {})); } catch (error) { return next(error); }
}
