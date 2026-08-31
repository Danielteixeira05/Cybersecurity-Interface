import { httpError } from '../middleware/errors.js';
import { listAssets, listDocuments, listIncidents, listRequests, listRiskAssessments } from '../services/resources.service.js';

function clientIdFromQuery(request) {
  const raw = request.query.cliente_id;
  if (raw === undefined) return undefined;
  const clientId = Number(raw);
  if (!Number.isSafeInteger(clientId) || clientId < 1) throw httpError(400, 'Identificador de cliente inválido.');
  return clientId;
}

function responder(loader) {
  return async (request, response, next) => {
    try {
      return response.json(await loader(request.auth, clientIdFromQuery(request)));
    } catch (error) {
      return next(error);
    }
  };
}

export const assets = responder(listAssets);
export const incidents = responder(listIncidents);
export const documents = responder(listDocuments);
export const requests = responder(listRequests);
export const assessments = responder(listRiskAssessments);
