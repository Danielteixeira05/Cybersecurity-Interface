import { Router } from 'express';
import { assessmentsControllers } from '../controllers/assessments.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createAssessmentsRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  const resolved = { ...assessmentsControllers, ...handlers };
  router.use(authenticateMiddleware);
  router.get('/estados', resolved.statuses);
  router.get('/', resolved.list);
  router.post('/', requireRolesMiddleware('admin', 'manager'), resolved.create);
  return router;
}

export const assessmentsRouter = createAssessmentsRouter();
