import { getModels } from '../models/index.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';

async function accessibleWhere(auth, clientId) {
  if (clientId !== undefined) {
    await assertClientAccess(auth, clientId);
    return { cliente_id: clientId };
  }
  if (auth.role === 'admin') return {};
  const ids = await clientIdsForUser(auth.sub);
  return { cliente_id: ids };
}

function withClientName(row) {
  const item = row.get({ plain: true });
  return { ...item, cliente_nome: item.cliente?.nome ?? undefined, cliente: undefined };
}

export async function listAssets(auth, clientId) {
  const { Asset, Client } = getModels();
  return (await Asset.findAll({
    where: await accessibleWhere(auth, clientId),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['nome', 'ASC']],
  })).map(withClientName);
}

export async function listIncidents(auth, clientId) {
  const { Incident, Client } = getModels();
  return (await Incident.findAll({
    where: await accessibleWhere(auth, clientId),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['data_hora_incidente', 'DESC'], ['id', 'DESC']],
  })).map(withClientName);
}

export async function listDocuments(auth, clientId) {
  const { Document, Client } = getModels();
  return (await Document.findAll({
    where: await accessibleWhere(auth, clientId),
    include: [{ model: Client, as: 'cliente', attributes: ['nome'] }],
    order: [['submetido_em', 'DESC'], ['id', 'DESC']],
  })).map((document) => {
    const item = withClientName(document);
    // O metadata não expõe armazenamento interno, hash nem o nome de ficheiro guardado.
    delete item.caminho_ficheiro;
    delete item.hash_sha256;
    delete item.nome_ficheiro_guardado;
    return item;
  });
}

export async function listRequests(auth, clientId) {
  const { Request, RequestStatus, Client } = getModels();
  return (await Request.findAll({
    where: await accessibleWhere(auth, clientId),
    include: [
      { model: RequestStatus, as: 'estado', attributes: ['codigo', 'nome'] },
      { model: Client, as: 'cliente', attributes: ['nome'] },
    ],
    order: [['criado_em', 'DESC'], ['id', 'DESC']],
  })).map((request) => {
    const item = withClientName(request);
    return {
      ...item,
      estado_codigo: item.estado?.codigo ?? undefined,
      estado_nome: item.estado?.nome ?? undefined,
      estado: undefined,
    };
  });
}
