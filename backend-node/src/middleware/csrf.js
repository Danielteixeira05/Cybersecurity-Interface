import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { httpError } from './errors.js';

const CSRF_COOKIE = 'cbcsrf_node';

function cookieOptions() {
  return {
    httpOnly: false,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  };
}

/**
 * Double-submit CSRF token for the JWT cookie flow. This keeps the current
 * React client's `/api/csrf/` + `X-CSRFToken` contract usable during the
 * gradual Django-to-Node transition.
 */
export function issueCsrfToken(_request, response) {
  const token = crypto.randomBytes(32).toString('base64url');
  response.cookie(CSRF_COOKIE, token, cookieOptions());
  return response.json({ csrf_token: token });
}

export function requireCsrf(request, _response, next) {
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();

  const cookieToken = request.cookies?.[CSRF_COOKIE];
  const headerToken = request.get('x-csrftoken');
  const cookieBuffer = typeof cookieToken === 'string' ? Buffer.from(cookieToken) : null;
  const headerBuffer = typeof headerToken === 'string' ? Buffer.from(headerToken) : null;
  if (!cookieBuffer || !headerBuffer || cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return next(httpError(403, 'Token CSRF inválido ou em falta.'));
  }
  return next();
}
