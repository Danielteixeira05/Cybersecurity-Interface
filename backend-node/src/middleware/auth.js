import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { httpError } from './errors.js';
import { getModels } from '../models/index.js';

export function roleForProfile(profileCode) {
  if (profileCode === 'ADMINISTRADOR') return 'admin';
  if (profileCode === 'COLABORADOR') return 'manager';
  if (profileCode === 'CLIENTE') return 'client';
  return null;
}

export async function authenticate(request, _response, next) {
  const [scheme, bearerToken] = (request.get('authorization') || '').split(' ');
  const token = scheme === 'Bearer' ? bearerToken : request.cookies?.cbsess_node;
  if (!token) return next(httpError(401, 'Autenticação necessária.'));
  if (!env.jwtSecret) return next(httpError(503, 'JWT não configurado no ambiente local.'));

  try {
    const tokenPayload = jwt.verify(token, env.jwtSecret);
    const { User, Profile } = getModels();
    const user = await User.findByPk(tokenPayload.sub, {
      include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }],
    });
    const role = user?.ativo ? roleForProfile(user.perfil?.codigo) : null;
    if (!role) return next(httpError(401, 'Sessão inválida ou expirada.'));

    // A role vem sempre do perfil atual na base de dados. Isto impede que
    // um token antigo mantenha privilégios depois de uma desativação ou
    // alteração administrativa de perfil.
    request.auth = {
      ...tokenPayload,
      sub: String(user.id),
      email: user.email,
      role,
    };
    return next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError' || error?.name === 'NotBeforeError') {
      return next(httpError(401, 'Sessão inválida ou expirada.'));
    }
    return next(error);
  }
}

export function requireRoles(...roles) {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(httpError(403, 'Sem permissão para esta operação.'));
    }
    return next();
  };
}
