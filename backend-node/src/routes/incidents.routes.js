import { Router } from 'express';
import { create, detail, list, update } from '../controllers/incidents.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const incidentsRouter = Router();
incidentsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
incidentsRouter.route('/').get(list).post(requireRoles('admin', 'manager', 'client'), create);
incidentsRouter.route('/:incidentId').get(detail).patch(requireRoles('admin', 'manager'), update);
