import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { httpError } from './errors.js';

export function authenticate(request, _response, next) {
  const [scheme, bearerToken] = (request.get('authorization') || '').split(' ');
  const token = scheme === 'Bearer' ? bearerToken : request.cookies?.cbsess_node;
  if (!token) return next(httpError(401, 'Autenticação necessária.'));
  if (!env.jwtSecret) return next(httpError(503, 'JWT não configurado no ambiente local.'));

  try {
    request.auth = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return next(httpError(401, 'Sessão inválida ou expirada.'));
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
