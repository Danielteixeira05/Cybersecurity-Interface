import { Router } from 'express';
import { create, detail, list, update } from '../controllers/requests.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const requestsRouter = Router();
requestsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
requestsRouter.route('/').get(list).post(create);
requestsRouter.route('/:requestId').get(detail).patch(requireRoles('admin', 'manager'), update);
