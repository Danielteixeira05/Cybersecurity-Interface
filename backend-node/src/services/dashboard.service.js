import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { clientIdsForUser } from './clients.service.js';
import { listAssets, listDocuments, listIncidents, listRequests } from './resources.service.js';

function numberId(value) {
  return Number(value);
}

function monthKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 7);
}

async function accessibleClients(auth) {
  const { Client } = getModels();
  if (auth.role === 'admin') return Client.findAll({ where: { ativo: true }, order: [['nome', 'ASC']] });
  const ids = await clientIdsForUser(auth.sub);
  if (!ids.length) return [];
  return Client.findAll({ where: { id: ids, ativo: true }, order: [['nome', 'ASC']] });
}

async function latestAssessments(clientIds) {
  const { RiskAssessment, ConformityStatus } = getModels();
  const all = await RiskAssessment.findAll({
    where: { cliente_id: clientIds },
    include: [{ model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] }],
    order: [['cliente_id', 'ASC'], ['data_avaliacao', 'DESC'], ['id', 'DESC']],
  });
  const byClient = new Map();
  for (const assessment of all) {
    const clientId = String(assessment.cliente_id);
    if (!byClient.has(clientId)) byClient.set(clientId, assessment.get({ plain: true }));
  }
  return byClient;
}

async function profileSummary() {
  const { Profile, User } = getModels();
  const profiles = await Profile.findAll({
    include: [{ model: User, as: 'utilizadores', attributes: ['id', 'ativo'] }],
    order: [['id', 'ASC']],
  });
  return profiles.map((profile) => {
    const row = profile.get({ plain: true });
    const users = row.utilizadores ?? [];
    return {
      codigo: row.codigo,
      perfil: row.nome,
      total_utilizadores: users.length,
      utilizadores_ativos: users.filter((user) => user.ativo).length,
    };
  });
}

export async function dashboardFor(auth) {
  const clients = await accessibleClients(auth);
  const clientIds = clients.map((client) => numberId(client.id));
  if (auth.role === 'client' && clientIds.length === 0) {
    throw httpError(403, 'Conta de cliente sem associação a uma organização.');
  }

  const [assets, incidents, documents, requests, assessments, { ConformityStatus }] = await Promise.all([
    listAssets(auth),
    listIncidents(auth),
    listDocuments(auth),
    listRequests(auth),
    latestAssessments(clientIds),
    getModels(),
  ]);

  if (auth.role === 'client') {
    const clientId = String(clientIds[0]);
    const assessment = assessments.get(clientId);
    return {
      tipo: 'cliente',
      total_ativos: assets.length,
      total_incidentes: incidents.length,
      total_documentos: documents.length,
      total_pedidos: requests.length,
      estado_conformidade: assessment?.estadoConformidade?.nome ?? null,
      nivel_risco: assessment?.nivel_risco ?? null,
      pontuacao: assessment?.pontuacao === null || assessment?.pontuacao === undefined ? null : Number(assessment.pontuacao),
    };
  }

  const statuses = await ConformityStatus.findAll({ order: [['ordem', 'ASC']] });
  const conformity = statuses.map((status) => {
    const row = status.get({ plain: true });
    const count = clients.filter((client) => assessments.get(String(client.id))?.estadoConformidade?.codigo === row.codigo).length;
    return { codigo: row.codigo, estado: row.nome, numero_clientes: count };
  });
  const topIncidentCounts = new Map();
  for (const incident of incidents) {
    const clientId = String(incident.cliente_id);
    topIncidentCounts.set(clientId, (topIncidentCounts.get(clientId) ?? 0) + 1);
  }
  const topIncidents = clients
    .map((client) => ({ id: numberId(client.id), nome: client.nome, total_incidentes: topIncidentCounts.get(String(client.id)) ?? 0 }))
    .filter((client) => client.total_incidentes > 0)
    .sort((a, b) => b.total_incidentes - a.total_incidentes || a.nome.localeCompare(b.nome, 'pt-PT'))
    .slice(0, 5);
  const documentMonths = new Map();
  for (const document of documents) {
    const key = `${document.cliente_id}:${monthKey(document.submetido_em)}`;
    if (!monthKey(document.submetido_em)) continue;
    documentMonths.set(key, (documentMonths.get(key) ?? 0) + 1);
  }
  const clientById = new Map(clients.map((client) => [String(client.id), client]));
  const documentsByMonth = Array.from(documentMonths.entries()).map(([key, total_documentos]) => {
    const [clientId, mes] = key.split(':');
    const client = clientById.get(clientId);
    return { id: Number(clientId), nome: client?.nome ?? '—', mes, total_documentos };
  });
  const stateCounts = new Map();
  const stateTimes = new Map();
  for (const request of requests) {
    const key = request.estado_codigo ?? 'SEM_ESTADO';
    stateCounts.set(key, (stateCounts.get(key) ?? 0) + 1);
    if (request.resolvido_em && request.criado_em) {
      const duration = new Date(request.resolvido_em).getTime() - new Date(request.criado_em).getTime();
      if (Number.isFinite(duration) && duration >= 0) {
        const current = stateTimes.get(key) ?? { sum: 0, count: 0 };
        stateTimes.set(key, { sum: current.sum + duration / 3600000, count: current.count + 1 });
      }
    }
  }
  const { RequestStatus } = getModels();
  const requestStatuses = await RequestStatus.findAll({ order: [['ordem', 'ASC']] });
  const requestState = requestStatuses.map((status) => {
    const row = status.get({ plain: true });
    const time = stateTimes.get(row.codigo);
    return {
      codigo: row.codigo,
      estado: row.nome,
      total_pedidos: stateCounts.get(row.codigo) ?? 0,
      tempo_medio_resolucao_horas: time ? Math.round((time.sum / time.count) * 100) / 100 : null,
    };
  });
  const activeUsers = auth.role === 'admin' ? (await profileSummary()).reduce((total, profile) => total + profile.utilizadores_ativos, 0) : undefined;

  return {
    tipo: 'admin',
    stats: {
      clientes: clients.filter((client) => client.ativo).length,
      utilizadores: activeUsers,
      ativos: assets.length,
      incidentes: incidents.length,
      documentos: documents.length,
      pedidos: requests.length,
      incidentes_abertos: incidents.filter((incident) => incident.estado === 'ABERTO').length,
      pedidos_abertos: requests.filter((request) => request.estado_codigo === 'ABERTO').length,
    },
    conformidade: conformity,
    top_incidentes: topIncidents,
    documentos_mes: documentsByMonth,
    utilizadores_perfil: auth.role === 'admin' ? await profileSummary() : [],
    pedidos_estado: requestState,
  };
}
