import { Router } from 'express';
import { detail, list, overview } from '../controllers/clients.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const clientsRouter = Router();

clientsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
clientsRouter.get('/', list);
clientsRouter.get('/:clientId/overview', overview);
clientsRouter.get('/:clientId', detail);
