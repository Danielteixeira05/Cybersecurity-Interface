import { Op } from 'sequelize';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { recordAudit } from './audit-log.service.js';

const CONTACT_TYPES = new Set(['RESPONSAVEL_SEGURANCA', 'CONTACTO_PERMANENTE', 'OUTRO']);

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

function cleanText(value, maximum, { required = false } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw httpError(400, 'Campo obrigatório.');
  if (text.length > maximum) throw httpError(400, `Máximo de ${maximum} caracteres.`);
  return text;
}

function validEmail(value) {
  const email = cleanText(value, 254, { required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Email inválido.');
  return email;
}

function validNif(value) {
  const nif = cleanText(value, 9, { required: true });
  if (!/^\d{9}$/.test(nif)) throw httpError(400, 'O NIF tem de conter nove dígitos.');
  return nif;
}

function optionalInteger(value, field, current = null) {
  const resolved = value === undefined ? current : value;
  if (resolved === null || resolved === '') return null;
  if (!Number.isInteger(resolved) || resolved < 0) throw httpError(400, `${field} tem de ser um número inteiro não negativo.`);
  return resolved;
}

function optionalDecimal(value, field, current = null) {
  const resolved = value === undefined ? current : value;
  if (resolved === null || resolved === '') return null;
  const number = Number(resolved);
  if (!Number.isFinite(number) || number < 0) throw httpError(400, `${field} tem de ser um número não negativo.`);
  return number;
}

function clientPayload(input, current = {}) {
  const ativo = input.ativo === undefined ? (current.ativo ?? true) : input.ativo;
  if (typeof ativo !== 'boolean') throw httpError(400, 'O estado ativo tem de ser booleano.');
  return {
    nome: cleanText(input.nome ?? current.nome, 160, { required: true }),
    nif: validNif(input.nif ?? current.nif),
    email: validEmail(input.email ?? current.email),
    telefone: cleanText(input.telefone ?? current.telefone, 30) || null,
    morada: cleanText(input.morada ?? current.morada, 2000) || null,
    setor_atividade: cleanText(input.setor_atividade ?? input.setorAtividade ?? current.setor_atividade, 100) || null,
    numero_colaboradores: optionalInteger(input.numero_colaboradores ?? input.numeroColaboradores, 'Número de colaboradores', current.numero_colaboradores),
    volume_negocios: optionalDecimal(input.volume_negocios ?? input.volumeNegocios, 'Volume de negócios', current.volume_negocios),
    ativo,
  };
}

function contactPayload(input, current = {}) {
  const tipo = cleanText(input.tipo ?? current.tipo, 40, { required: true }).toUpperCase();
  if (!CONTACT_TYPES.has(tipo)) throw httpError(400, 'Tipo de contacto inválido.');
  const comunicado = input.comunicado_cncs ?? input.comunicadoCncs ?? current.comunicado_cncs ?? false;
  if (typeof comunicado !== 'boolean') throw httpError(400, 'comunicado_cncs tem de ser booleano.');
  const ativo = input.ativo === undefined ? (current.ativo ?? true) : input.ativo;
  if (typeof ativo !== 'boolean') throw httpError(400, 'O estado ativo tem de ser booleano.');
  return {
    tipo,
    nome: cleanText(input.nome ?? current.nome, 120, { required: true }),
    cargo: cleanText(input.cargo ?? current.cargo, 100) || null,
    email: validEmail(input.email ?? current.email),
    telefone: cleanText(input.telefone ?? current.telefone, 30) || null,
    comunicado_cncs: comunicado,
    ativo,
  };
}

function contactInputList(value) {
  if (!Array.isArray(value)) throw httpError(400, 'contactos tem de ser uma lista.');
  const contacts = value.map((contact) => contactPayload(contact));
  for (const mandatory of ['RESPONSAVEL_SEGURANCA', 'CONTACTO_PERMANENTE']) {
    if (!contacts.some((contact) => contact.tipo === mandatory && contact.ativo)) {
      throw httpError(400, 'É obrigatório indicar um Responsável de Segurança e um Contacto Permanente ativos.');
    }
  }
  return contacts;
}

function managerIds(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw httpError(400, 'gestores_ids tem de ser uma lista.');
  const ids = value.map((item) => Number(item));
  if (ids.some((id) => !Number.isSafeInteger(id) || id < 1)) throw httpError(400, 'Identificador de Gestor inválido.');
  return [...new Set(ids)];
}

export async function clientIdsForUser(userId, { principalOnly = false } = {}) {
  const { UserClient } = getModels();
  const links = await UserClient.findAll({
    where: { utilizador_id: userId, ativo: true, ...(principalOnly ? { principal: true } : {}) },
    attributes: ['cliente_id'],
  });
  return links.map((link) => String(link.cliente_id));
}

export async function assertClientAccess(auth, clientId) {
  if (auth.role === 'admin') return;
  const ids = await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' });
  if (!ids.includes(String(clientId))) throw httpError(403, 'Sem permissão para consultar este cliente.');
}

async function enrichClient(client) {
  const { Asset, Incident, RiskAssessment, ConformityStatus } = getModels();
  const [totalAtivos, totalIncidentes, latestAssessment] = await Promise.all([
    Asset.count({ where: { cliente_id: client.id, ativo: true } }),
    Incident.count({ where: { cliente_id: client.id, ativo: true } }),
    RiskAssessment.findOne({
      where: { cliente_id: client.id },
      include: [{ model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] }],
      order: [['data_avaliacao', 'DESC'], ['id', 'DESC']],
    }),
  ]);
  return serialiseClient(client, { totalAtivos, totalIncidentes, latestAssessment });
}

export async function listClients(auth, search) {
  const { Client } = getModels();
  const where = { ativo: true };
  if (auth.role !== 'admin') {
    const ids = await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' });
    if (ids.length === 0) return [];
    where.id = ids;
  }
  const query = typeof search === 'string' ? search.trim().slice(0, 160) : '';
  if (query) {
    where[Op.or] = [
      { nome: { [Op.iLike]: `%${query}%` } },
      { nif: { [Op.iLike]: `%${query}%` } },
      { email: { [Op.iLike]: `%${query}%` } },
    ];
  }
  const clients = await Client.findAll({ where, order: [['nome', 'ASC']] });
  return Promise.all(clients.map(enrichClient));
}

export async function getClient(auth, clientId) {
  const { Client, ClientContact, Asset, Incident, Document, Request, RiskAssessment, ConformityStatus, User, Profile, UserClient } = getModels();
  const client = await Client.findOne({ where: { id: clientId, ativo: true } });
  if (!client) throw httpError(404, 'Cliente não encontrado.');
  await assertClientAccess(auth, clientId);

  const [summary, contacts, assets, incidents, documents, requests, assessments, managerLinks] = await Promise.all([
    enrichClient(client),
    ClientContact.findAll({ where: { cliente_id: clientId, ativo: true }, order: [['tipo', 'ASC'], ['nome', 'ASC']] }),
    Asset.findAll({ where: { cliente_id: clientId, ativo: true }, order: [['nome', 'ASC']] }),
    Incident.findAll({ where: { cliente_id: clientId, ativo: true }, order: [['data_hora_incidente', 'DESC']] }),
    Document.findAll({ where: { cliente_id: clientId, ativo: true }, order: [['submetido_em', 'DESC']] }),
    Request.findAll({ where: { cliente_id: clientId }, order: [['criado_em', 'DESC']] }),
    RiskAssessment.findAll({
      where: { cliente_id: clientId },
      include: [{ model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] }],
      order: [['data_avaliacao', 'DESC'], ['id', 'DESC']],
    }),
    UserClient.findAll({
      where: { cliente_id: clientId, ativo: true },
      include: [{
        model: User,
        as: 'utilizador',
        required: true,
        where: { ativo: true },
        include: [{ model: Profile, as: 'perfil', where: { codigo: 'COLABORADOR' }, attributes: ['codigo'] }],
        attributes: ['id', 'nome', 'email'],
      }],
    }),
  ]);

  return {
    cliente: summary,
    contactos: contacts.map(serialiseContact),
    responsavelSeguranca: contacts.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA') ? serialiseContact(contacts.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA')) : null,
    contactoPermanente: contacts.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE') ? serialiseContact(contacts.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE')) : null,
    gestores: managerLinks.map((link) => ({ id: Number(link.utilizador.id), nome: link.utilizador.nome, email: link.utilizador.email })),
    ativos: assets.map((asset) => asset.get({ plain: true })),
    incidentes: incidents.map((incident) => incident.get({ plain: true })),
    documentos: documents.map((document) => document.get({ plain: true })),
    pedidos: requests.map((request) => request.get({ plain: true })),
    avaliacoes: assessments.map((assessment) => assessment.get({ plain: true })),
  };
}

async function assertManagersExist(ids, transaction) {
  if (ids.length === 0) return;
  const { User, Profile } = getModels();
  const count = await User.count({
    where: { id: ids, ativo: true },
    include: [{ model: Profile, as: 'perfil', where: { codigo: 'COLABORADOR' }, required: true }],
    transaction,
  });
  if (count !== ids.length) throw httpError(400, 'Um ou mais Gestores não existem ou estão inativos.');
}

async function replaceManagers(clientId, ids, transaction) {
  const { UserClient, User, Profile } = getModels();
  const current = await UserClient.findAll({
    where: { cliente_id: clientId },
    include: [{ model: User, as: 'utilizador', include: [{ model: Profile, as: 'perfil', where: { codigo: 'COLABORADOR' }, required: true }] }],
    transaction,
  });
  const currentByUser = new Map(current.map((link) => [String(link.utilizador_id), link]));
  if (current.length) {
    await UserClient.update({ ativo: false }, { where: { cliente_id: clientId, utilizador_id: current.map((link) => link.utilizador_id), ativo: true }, transaction });
  }
  for (const managerId of ids) {
    const link = currentByUser.get(String(managerId));
    if (link) await link.update({ ativo: true, principal: false }, { transaction });
    else await UserClient.create({ utilizador_id: managerId, cliente_id: clientId, principal: false, ativo: true, criado_em: new Date() }, { transaction });
  }
}

export async function createClient(input, actorId) {
  const payload = clientPayload(input);
  const contacts = contactInputList(input.contactos);
  const managers = managerIds(input.gestores_ids);
  const { sequelize, Client, ClientContact } = getModels();
  const id = await sequelize.transaction(async (transaction) => {
    await assertManagersExist(managers, transaction);
    const client = await Client.create({ ...payload, criado_em: new Date(), atualizado_em: new Date() }, { transaction });
    await ClientContact.bulkCreate(contacts.map((contact) => ({ ...contact, cliente_id: client.id, criado_em: new Date(), atualizado_em: new Date() })), { transaction });
    await replaceManagers(client.id, managers, transaction);
    await recordAudit({ userId: actorId, action: 'CRIAR', entity: 'clientes', entityId: Number(client.id), details: { gestores_ids: managers } }, transaction);
    return client.id;
  });
  return getClient({ role: 'admin', sub: String(actorId) }, id);
}

export async function updateClient(clientId, input, actorId) {
  const { Client, sequelize } = getModels();
  const client = await Client.findByPk(clientId);
  if (!client) throw httpError(404, 'Cliente não encontrado.');
  const payload = clientPayload(input, client.get({ plain: true }));
  await sequelize.transaction(async (transaction) => {
    await client.update({ ...payload, atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: actorId, action: payload.ativo ? 'ATUALIZAR' : 'DESATIVAR', entity: 'clientes', entityId: Number(clientId), details: { ativo: payload.ativo } }, transaction);
  });
  // Um cliente desativado deixa de aparecer no detalhe operacional, mas a
  // operação de desativação continua a ser bem-sucedida e devolve o registo
  // atualizado em vez de transformar uma escrita concluída num falso 404.
  return enrichClient(client);
}

export async function createContact(clientId, input, actorId) {
  const { Client, ClientContact, sequelize } = getModels();
  const client = await Client.findByPk(clientId);
  if (!client) throw httpError(404, 'Cliente não encontrado.');
  const payload = contactPayload(input);
  const id = await sequelize.transaction(async (transaction) => {
    const contact = await ClientContact.create({ ...payload, cliente_id: clientId, criado_em: new Date(), atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: actorId, action: 'CRIAR', entity: 'contactos_clientes', entityId: Number(contact.id), details: { cliente_id: Number(clientId), tipo: payload.tipo } }, transaction);
    return contact.id;
  });
  return serialiseContact(await ClientContact.findByPk(id));
}

export async function updateContact(clientId, contactId, input, actorId) {
  const { ClientContact, sequelize } = getModels();
  const contact = await ClientContact.findOne({ where: { id: contactId, cliente_id: clientId } });
  if (!contact) throw httpError(404, 'Contacto não encontrado.');
  const payload = contactPayload(input, contact.get({ plain: true }));
  await sequelize.transaction(async (transaction) => {
    await contact.update({ ...payload, atualizado_em: new Date() }, { transaction });
    await recordAudit({ userId: actorId, action: payload.ativo ? 'ATUALIZAR' : 'DESATIVAR', entity: 'contactos_clientes', entityId: Number(contactId), details: { cliente_id: Number(clientId), tipo: payload.tipo } }, transaction);
  });
  return serialiseContact(await ClientContact.findByPk(contactId));
}

export async function updateManagers(clientId, input, actorId) {
  const managers = managerIds(input.gestores_ids);
  const { Client, sequelize } = getModels();
  const client = await Client.findByPk(clientId);
  if (!client) throw httpError(404, 'Cliente não encontrado.');
  await sequelize.transaction(async (transaction) => {
    await assertManagersExist(managers, transaction);
    await replaceManagers(clientId, managers, transaction);
    await recordAudit({ userId: actorId, action: 'ASSOCIAR_GESTORES', entity: 'clientes', entityId: Number(clientId), details: { gestores_ids: managers } }, transaction);
  });
  return getClient({ role: 'admin', sub: String(actorId) }, clientId);
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
