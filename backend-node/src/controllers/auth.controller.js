import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getModels } from '../models/index.js';
import { verifyPassword } from '../services/passwords.js';
import { httpError } from '../middleware/errors.js';

function toRole(profileCode) {
  return {
    ADMINISTRADOR: 'admin',
    COLABORADOR: 'manager',
    CLIENTE: 'client',
  }[profileCode] ?? null;
}

function serializeUser(user) {
  return {
    id: Number(user.id),
    nome: user.nome,
    email: user.email,
    telefone: user.telefone ?? null,
    perfil_id: Number(user.perfil_id),
    perfil: user.perfil?.codigo ?? null,
    perfil_codigo: user.perfil?.codigo ?? null,
    perfil_nome: user.perfil?.nome ?? null,
    ativo: user.ativo,
    role: toRole(user.perfil?.codigo),
  };
}

async function clientForUser(userId) {
  const { UserClient, Client } = getModels();
  const link = await UserClient.findOne({
    where: { utilizador_id: userId },
    order: [['principal', 'DESC'], ['criado_em', 'ASC']],
  });
  if (!link) return null;
  const client = await Client.findByPk(link.cliente_id);
  if (!client) return null;
  return {
    id: Number(client.id), nome: client.nome, nif: client.nif, email: client.email,
    telefone: client.telefone ?? null, ativo: client.ativo,
  };
}

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  };
}

export async function login(request, response, next) {
  try {
    if (!env.jwtSecret) throw httpError(503, 'JWT não configurado no ambiente local.');
    const email = typeof request.body?.email === 'string' ? request.body.email.trim() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    if (!email || !password) throw httpError(400, 'Email e password são obrigatórios.');

    const { User, Profile } = getModels();
    const user = await User.findOne({
      where: { email },
      include: [{ model: Profile, as: 'perfil', attributes: ['codigo', 'nome'] }],
    });
    if (!user || !user.ativo || !(await verifyPassword(password, user.password_hash))) {
      throw httpError(401, 'Credenciais inválidas.');
    }

    const safeUser = serializeUser(user);
    if (!safeUser.role) throw httpError(403, 'Perfil sem acesso à aplicação.');
    await user.update({ ultimo_acesso_em: new Date() });
    const token = jwt.sign({ sub: String(user.id), role: safeUser.role, email: safeUser.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    response.cookie('cbsess_node', token, authCookieOptions());
    // O JWT fica exclusivamente no cookie HttpOnly; não o devolver ao JavaScript.
    return response.json({ autenticado: true, utilizador: safeUser, cliente: await clientForUser(user.id) });
  } catch (error) {
    return next(error);
  }
}

export async function me(request, response, next) {
  try {
    const { User, Profile } = getModels();
    const user = await User.findByPk(request.auth.sub, {
      include: [{ model: Profile, as: 'perfil', attributes: ['codigo', 'nome'] }],
    });
    if (!user || !user.ativo) throw httpError(401, 'Sessão inválida ou utilizador inativo.');
    const safeUser = serializeUser(user);
    return response.json({ autenticado: true, utilizador: safeUser, cliente: await clientForUser(user.id), role: safeUser.role });
  } catch (error) {
    return next(error);
  }
}

export function logout(_request, response) {
  response.clearCookie('cbsess_node', authCookieOptions());
  return response.status(204).end();
}
