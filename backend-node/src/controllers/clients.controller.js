import { getClient, getClientOverview, listClients } from '../services/clients.service.js';
import { httpError } from '../middleware/errors.js';

function clientIdFrom(request) {
  const clientId = Number(request.params.clientId);
  if (!Number.isSafeInteger(clientId) || clientId < 1) throw httpError(400, 'Identificador de cliente inválido.');
  return clientId;
}

export async function list(request, response, next) {
  try {
    return response.json({ items: await listClients(request.auth) });
  } catch (error) {
    return next(error);
  }
}

export async function detail(request, response, next) {
  try {
    return response.json(await getClient(request.auth, clientIdFrom(request)));
  } catch (error) {
    return next(error);
  }
}

export async function overview(request, response, next) {
  try {
    return response.json(await getClientOverview(request.auth, clientIdFrom(request)));
  } catch (error) {
    return next(error);
  }
}

function djangoClient(client) {
  return {
    id: client.id,
    nome: client.nome,
    nif: client.nif,
    email: client.email,
    telefone: client.telefone,
    morada: client.morada,
    setor_atividade: client.setorAtividade,
    numero_colaboradores: client.numeroColaboradores,
    volume_negocios: client.volumeNegocios,
    ativo: client.ativo,
    estado_conformidade: client.estadoConformidade,
    nivel_risco: client.nivelRisco,
    pontuacao: client.pontuacao,
    total_ativos: client.totalAtivos,
    total_incidentes: client.totalIncidentes,
  };
}

export async function legacyList(request, response, next) {
  try {
    return response.json((await listClients(request.auth)).map(djangoClient));
  } catch (error) {
    return next(error);
  }
}

export async function legacyDetail(request, response, next) {
  try {
    const item = await getClient(request.auth, clientIdFrom(request));
    return response.json({
      ...item,
      cliente: djangoClient(item.cliente),
    });
  } catch (error) {
    return next(error);
  }
}
