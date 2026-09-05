import { getModels } from '../models/index.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { serialiseDocument } from './document.serializer.js';
export { listRiskAssessments } from './assessments.service.js';
export { listRequests } from './requests.service.js';

async function accessibleWhere(auth, clientId, { hasActiveFlag = false } = {}) {
  const active = hasActiveFlag ? { ativo: true } : {};
  if (clientId !== undefined) {
    await assertClientAccess(auth, clientId);
    return { ...active, cliente_id: clientId };
  }
  if (auth.role === 'admin') return active;
  const ids = await clientIdsForUser(auth.sub);
  return { ...active, cliente_id: ids };
}

function withClientName(row) {
  const item = row.get({ plain: true });
  return { ...item, cliente_nome: item.cliente?.nome ?? undefined, cliente: undefined };
}

export async function listAssets(auth, clientId) {
  const { Asset, Client } = getModels();
  return (await Asset.findAll({
    where: await accessibleWhere(auth, clientId, { hasActiveFlag: true }),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['nome', 'ASC']],
  })).map(withClientName);
}

export async function listIncidents(auth, clientId) {
  const { Incident, Client } = getModels();
  return (await Incident.findAll({
    where: await accessibleWhere(auth, clientId, { hasActiveFlag: true }),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['data_hora_incidente', 'DESC'], ['id', 'DESC']],
  })).map(withClientName);
}

export async function listDocuments(auth, clientId) {
  const { Document, Client } = getModels();
  return (await Document.findAll({
    where: await accessibleWhere(auth, clientId, { hasActiveFlag: true }),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['submetido_em', 'DESC'], ['id', 'DESC']],
  })).map(serialiseDocument);
}
