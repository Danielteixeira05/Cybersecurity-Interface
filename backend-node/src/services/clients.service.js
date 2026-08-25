import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';

function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function serialiseContact(contact) {
  return {
    id: toNumber(contact.id), tipo: contact.tipo, nome: contact.nome, cargo: contact.cargo ?? null,
    email: contact.email, telefone: contact.telefone ?? null, ativo: contact.ativo,
  };
}

export function serialiseClient(client, { totalAtivos = 0, totalIncidentes = 0, latestAssessment = null } = {}) {
  const assessment = latestAssessment?.get?.({ plain: true }) ?? latestAssessment;
  return {
    id: toNumber(client.id),
    nome: client.nome,
    nif: client.nif,
    email: client.email,
    telefone: client.telefone ?? null,
    morada: client.morada ?? null,
    setorAtividade: client.setor_atividade ?? null,
    numeroColaboradores: client.numero_colaboradores ?? null,
    volumeNegocios: client.volume_negocios ?? null,
    ativo: client.ativo,
    estadoConformidade: assessment?.estadoConformidade?.nome ?? null,
    nivelRisco: assessment?.nivel_risco ?? null,
    pontuacao: assessment?.pontuacao === null || assessment?.pontuacao === undefined ? null : Number(assessment.pontuacao),
    totalAtivos,
    totalIncidentes,
  };
}

export async function clientIdsForUser(userId) {
  const { UserClient } = getModels();
  const links = await UserClient.findAll({ where: { utilizador_id: userId }, attributes: ['cliente_id'] });
  return links.map((link) => String(link.cliente_id));
}

export async function assertClientAccess(auth, clientId) {
  if (auth.role === 'admin') return;
  const ids = await clientIdsForUser(auth.sub);
  if (!ids.includes(String(clientId))) throw httpError(403, 'Sem permissão para consultar este cliente.');
}

async function enrichClient(client) {
  const { Asset, Incident, RiskAssessment, ConformityStatus } = getModels();
  const [totalAtivos, totalIncidentes, latestAssessment] = await Promise.all([
    Asset.count({ where: { cliente_id: client.id } }),
    Incident.count({ where: { cliente_id: client.id } }),
    RiskAssessment.findOne({
      where: { cliente_id: client.id },
      include: [{ model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] }],
      order: [['data_avaliacao', 'DESC'], ['id', 'DESC']],
    }),
  ]);
  return serialiseClient(client, { totalAtivos, totalIncidentes, latestAssessment });
}

export async function listClients(auth) {
  const { Client } = getModels();
  const where = { ativo: true };
  if (auth.role !== 'admin') {
    const ids = await clientIdsForUser(auth.sub);
    if (ids.length === 0) return [];
    where.id = ids;
  }
  const clients = await Client.findAll({ where, order: [['nome', 'ASC']] });
  return Promise.all(clients.map(enrichClient));
}

export async function getClient(auth, clientId) {
  const { Client, ClientContact, Asset, Incident, Document, Request, RiskAssessment, ConformityStatus } = getModels();
  const client = await Client.findByPk(clientId);
  if (!client) throw httpError(404, 'Cliente não encontrado.');
  await assertClientAccess(auth, clientId);

  const [summary, contacts, assets, incidents, documents, requests, assessments] = await Promise.all([
    enrichClient(client),
    ClientContact.findAll({ where: { cliente_id: clientId, ativo: true }, order: [['tipo', 'ASC'], ['nome', 'ASC']] }),
    Asset.findAll({ where: { cliente_id: clientId }, order: [['nome', 'ASC']] }),
    Incident.findAll({ where: { cliente_id: clientId }, order: [['data_hora_incidente', 'DESC']] }),
    Document.findAll({ where: { cliente_id: clientId }, order: [['submetido_em', 'DESC']] }),
    Request.findAll({ where: { cliente_id: clientId }, order: [['criado_em', 'DESC']] }),
    RiskAssessment.findAll({
      where: { cliente_id: clientId },
      include: [{ model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] }],
      order: [['data_avaliacao', 'DESC'], ['id', 'DESC']],
    }),
  ]);

  return {
    cliente: summary,
    contactos: contacts.map(serialiseContact),
    responsavelSeguranca: contacts.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA') ? serialiseContact(contacts.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA')) : null,
    contactoPermanente: contacts.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE') ? serialiseContact(contacts.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE')) : null,
    ativos: assets.map((asset) => asset.get({ plain: true })),
    incidentes: incidents.map((incident) => incident.get({ plain: true })),
    documentos: documents.map((document) => document.get({ plain: true })),
    pedidos: requests.map((request) => request.get({ plain: true })),
    avaliacoes: assessments.map((assessment) => assessment.get({ plain: true })),
  };
}

export async function getClientOverview(auth, clientId) {
  const detail = await getClient(auth, clientId);
  return {
    cliente: detail.cliente,
    contadores: {
      ativos: detail.ativos.length,
      incidentes: detail.incidentes.length,
      documentos: detail.documentos.length,
      pedidos: detail.pedidos.length,
    },
    responsavelSeguranca: detail.responsavelSeguranca,
    contactoPermanente: detail.contactoPermanente,
  };
}
