import { Router } from 'express';
import { activity, create, detail, list, update } from '../controllers/users.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createUsersRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  const resolvedHandlers = { list, create, detail, activity, update, ...handlers };
  router.use(authenticateMiddleware, requireRolesMiddleware('admin'));
  router.route('/').get(resolvedHandlers.list).post(resolvedHandlers.create);
  router.get('/:userId/activity', resolvedHandlers.activity);
  router.route('/:userId').get(resolvedHandlers.detail).patch(resolvedHandlers.update);
  return router;
}

export const usersRouter = createUsersRouter();
