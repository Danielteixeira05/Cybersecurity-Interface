import { createIncident, getIncident, listIncidents, updateIncident } from '../services/incidents.service.js';
import { httpError } from '../middleware/errors.js';

function incidentId(request) {
  const id = Number(request.params.incidentId);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, 'Identificador de incidente inválido.');
  return id;
}

export async function list(request, response, next) {
  try { return response.json({ items: await listIncidents(request.auth, request.query) }); } catch (error) { return next(error); }
}

export async function detail(request, response, next) {
  try { return response.json(await getIncident(request.auth, incidentId(request))); } catch (error) { return next(error); }
}

export async function create(request, response, next) {
  try { return response.status(201).json(await createIncident(request.auth, request.body ?? {})); } catch (error) { return next(error); }
}

export async function update(request, response, next) {
  try { return response.json(await updateIncident(request.auth, incidentId(request), request.body ?? {})); } catch (error) { return next(error); }
}
