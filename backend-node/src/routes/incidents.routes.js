import { Router } from 'express';
import { create, detail, list, update } from '../controllers/incidents.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const incidentsRouter = Router();
incidentsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
// O Cliente pode submeter o report inicial apenas para a sua organização. A
// autorização por associação continua a ser confirmada no serviço; edição e
// desativação mantêm-se reservadas ao tratamento interno.
incidentsRouter.route('/').get(list).post(requireRoles('admin', 'manager', 'client'), create);
incidentsRouter.route('/:incidentId').get(detail).patch(requireRoles('admin', 'manager'), update);
