import { Router } from 'express';
import { create, detail, list, update } from '../controllers/incidents.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const incidentsRouter = Router();
incidentsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
// Clientes apenas consultam. A autorização também é validada no serviço para
// evitar que a troca manual de URL/ID contorne o controlo de acesso.
incidentsRouter.route('/').get(list).post(requireRoles('admin', 'manager'), create);
incidentsRouter.route('/:incidentId').get(detail).patch(requireRoles('admin', 'manager'), update);
