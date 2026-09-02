import { Router } from 'express';
import { list } from '../controllers/logs.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createLogsRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  router.use(authenticateMiddleware, requireRolesMiddleware('admin'));
  router.get('/', { list, ...handlers }.list);
  return router;
}

export const logsRouter = createLogsRouter();
