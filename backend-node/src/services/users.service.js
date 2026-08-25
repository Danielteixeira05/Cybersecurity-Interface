import { Op } from 'sequelize';
import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { recordAudit } from './audit-log.service.js';
import { hashPassword } from './passwords.js';

const CREATABLE_PROFILES = new Set(['ADMINISTRADOR', 'COLABORADOR', 'CLIENTE']);

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

function toId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, `Identificador de ${label} inválido.`);
  return id;
}

function deduplicatedClientIds(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw httpError(400, 'clientes_ids tem de ser uma lista.');
  return [...new Set(value.map((id) => toId(id, 'cliente')))];
}

function userInclude() {
  const { Profile, Client } = getModels();
  return [
    { model: Profile, as: 'perfil', attributes: ['codigo', 'nome'] },
    { model: Client, as: 'clientes', attributes: ['id', 'nome'], through: { attributes: ['principal'], where: { ativo: true } } },
  ];
}

function serialiseUser(record) {
  const row = record.get ? record.get({ plain: true }) : record;
  const clients = (row.clientes ?? []).map((client) => ({
    id: Number(client.id),
    nome: client.nome,
    principal: Boolean(client.UserClient?.principal),
  }));
  const primary = clients.find((client) => client.principal) ?? clients[0] ?? null;
  return {
    id: Number(row.id),
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? null,
    nif: row.nif ?? null,
    ativo: row.ativo,
    perfil_id: Number(row.perfil_id),
    perfil_codigo: row.perfil?.codigo ?? null,
    perfil_nome: row.perfil?.nome ?? null,
    ultimo_acesso_em: row.ultimo_acesso_em ?? null,
    criado_em: row.criado_em ?? null,
    cliente_id: primary?.id ?? null,
    clientes: clients,
  };
}

async function getProfile(code) {
  const { Profile } = getModels();
  const profile = await Profile.findOne({ where: { codigo: code } });
  if (!profile) throw httpError(400, 'Perfil inválido.');
  return profile;
}

async function assertClientsExist(clientIds) {
  if (clientIds.length === 0) return;
  const { Client } = getModels();
  const count = await Client.count({ where: { id: clientIds, ativo: true } });
  if (count !== clientIds.length) throw httpError(400, 'Um ou mais clientes não existem ou estão inativos.');
}

async function validateClientAssociation(profileCode, clientIds, userId = null, transaction) {
  if (profileCode === 'ADMINISTRADOR' && clientIds.length !== 0) {
    throw httpError(400, 'Uma conta de Administrador não pode estar associada a organizações.');
  }
  if (profileCode === 'CLIENTE' && clientIds.length !== 1) {
    throw httpError(400, 'Uma conta de Cliente tem de estar associada a exatamente uma organização.');
  }
  if (profileCode === 'COLABORADOR' && clientIds.length === 0) {
    throw httpError(400, 'Um Gestor tem de ter pelo menos um cliente associado.');
  }
  await assertClientsExist(clientIds);

  // A restrição SQL existente permite apenas um contacto principal por
  // organização. Esse papel é reservado à conta Cliente; os Gestores nunca
  // recebem `principal=true`.
  if (profileCode === 'CLIENTE' && clientIds.length === 1) {
    const { UserClient } = getModels();
    const conflicting = await UserClient.findOne({
      where: {
        cliente_id: clientIds[0],
        principal: true,
        ativo: true,
        ...(userId ? { utilizador_id: { [Op.ne]: userId } } : {}),
      },
      transaction,
    });
    if (conflicting) throw httpError(409, 'A organização já tem uma conta Cliente principal ativa.');
  }
}

async function replaceClientLinks({ userId, profileCode, clientIds, transaction }) {
  const { UserClient } = getModels();
  const currentLinks = await UserClient.findAll({ where: { utilizador_id: userId }, transaction });
  const currentByClient = new Map(currentLinks.map((link) => [String(link.cliente_id), link]));

  await UserClient.update({ ativo: false }, { where: { utilizador_id: userId, ativo: true }, transaction });
  for (const clientId of clientIds) {
    const current = currentByClient.get(String(clientId));
    const values = {
      principal: profileCode === 'CLIENTE',
      ativo: true,
    };
    if (current) {
      await current.update(values, { transaction });
    } else {
      await UserClient.create({
        utilizador_id: userId,
        cliente_id: clientId,
        criado_em: new Date(),
        ...values,
      }, { transaction });
    }
  }
}

export async function listUsers(profileCode, search) {
  const { User, Profile } = getModels();
  const profileFilter = profileCode ? cleanText(profileCode, 20, { required: true }).toUpperCase() : null;
  const query = typeof search === 'string' ? search.trim().slice(0, 254) : '';
  const rows = await User.findAll({
    where: query ? {
      [Op.or]: [
        { nome: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
      ],
    } : undefined,
    include: userInclude().map((include) => include.as === 'perfil' && profileFilter ? { ...include, where: { codigo: profileFilter }, required: true } : include),
    order: [['nome', 'ASC'], ['id', 'ASC']],
  });
  return rows.map(serialiseUser);
}

export async function getUser(id) {
  const { User } = getModels();
  const user = await User.findByPk(id, { include: userInclude() });
  if (!user) throw httpError(404, 'Utilizador não encontrado.');
  return serialiseUser(user);
}

export async function createUser(input, actorId) {
  const profileCode = cleanText(input.perfil_codigo, 20, { required: true }).toUpperCase();
  if (!CREATABLE_PROFILES.has(profileCode)) throw httpError(400, 'Perfil inválido.');
  const clientIds = deduplicatedClientIds(input.clientes_ids ?? (input.cliente_id ? [input.cliente_id] : []));
  const password = typeof input.password === 'string' ? input.password : '';
  if (password.length < 12) throw httpError(400, 'A password tem de ter pelo menos 12 caracteres.');

  const payload = {
    nome: cleanText(input.nome, 120, { required: true }),
    email: validEmail(input.email),
    telefone: cleanText(input.telefone, 30) || null,
    nif: cleanText(input.nif, 9) || null,
    password_hash: await hashPassword(password),
  };
  const profile = await getProfile(profileCode);
  const { sequelize, User } = getModels();
  const id = await sequelize.transaction(async (transaction) => {
    await validateClientAssociation(profileCode, clientIds, null, transaction);
    const user = await User.create({
      ...payload,
      perfil_id: profile.id,
      ativo: true,
      criado_em: new Date(),
      atualizado_em: new Date(),
    }, { transaction });
    await replaceClientLinks({ userId: user.id, profileCode, clientIds, transaction });
    await recordAudit({
      userId: actorId,
      action: 'CRIAR',
      entity: 'utilizadores',
      entityId: Number(user.id),
      details: { perfil: profileCode, clientes_ids: clientIds },
    }, transaction);
    return user.id;
  });
  return getUser(id);
}

export async function updateUser(id, input, actorId) {
  const { User, Profile, sequelize } = getModels();
  const user = await User.findByPk(id, { include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }] });
  if (!user) throw httpError(404, 'Utilizador não encontrado.');
  if (input.perfil_codigo !== undefined || input.perfil_id !== undefined) {
    throw httpError(400, 'O perfil não pode ser alterado por esta operação.');
  }
  const changes = {};
  if (input.nome !== undefined) changes.nome = cleanText(input.nome, 120, { required: true });
  if (input.email !== undefined) changes.email = validEmail(input.email);
  if (input.telefone !== undefined) changes.telefone = cleanText(input.telefone, 30) || null;
  if (input.nif !== undefined) changes.nif = cleanText(input.nif, 9) || null;
  if (input.ativo !== undefined) {
    if (typeof input.ativo !== 'boolean') throw httpError(400, 'O estado ativo tem de ser booleano.');
    if (Number(id) === Number(actorId) && !input.ativo) throw httpError(400, 'Não pode desativar a sua própria conta.');
    changes.ativo = input.ativo;
  }
  if (input.password !== undefined) {
    if (typeof input.password !== 'string' || input.password.length < 12) throw httpError(400, 'A password tem de ter pelo menos 12 caracteres.');
    changes.password_hash = await hashPassword(input.password);
  }
  const clientIdsProvided = input.clientes_ids !== undefined || input.cliente_id !== undefined;
  const clientIds = clientIdsProvided
    ? deduplicatedClientIds(input.clientes_ids ?? (input.cliente_id ? [input.cliente_id] : []))
    : null;
  if (Object.keys(changes).length === 0 && !clientIdsProvided) throw httpError(400, 'Não existem alterações válidas.');
  changes.atualizado_em = new Date();
  await sequelize.transaction(async (transaction) => {
    if (clientIdsProvided) {
      await validateClientAssociation(user.perfil.codigo, clientIds, Number(id), transaction);
      await replaceClientLinks({ userId: user.id, profileCode: user.perfil.codigo, clientIds, transaction });
    }
    await user.update(changes, { transaction });
    await recordAudit({
      userId: actorId,
      action: changes.ativo === false ? 'DESATIVAR' : changes.ativo === true ? 'REATIVAR' : 'ATUALIZAR',
      entity: 'utilizadores',
      entityId: Number(id),
      details: {
        campos: Object.keys(changes).filter((field) => field !== 'password_hash' && field !== 'atualizado_em'),
        ...(clientIdsProvided ? { clientes_ids: clientIds } : {}),
      },
    }, transaction);
  });
  return getUser(id);
}
