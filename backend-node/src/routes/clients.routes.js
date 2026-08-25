import { Router } from 'express';
import {
  assignManagers, create, createClientContact, detail, list, overview, update, updateClientContact,
} from '../controllers/clients.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const clientsRouter = Router();

clientsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
clientsRouter.route('/').get(list).post(requireRoles('admin'), create);
clientsRouter.get('/:clientId/overview', overview);
clientsRouter.post('/:clientId/contacts', requireRoles('admin'), createClientContact);
clientsRouter.patch('/:clientId/contacts/:contactId', requireRoles('admin'), updateClientContact);
clientsRouter.put('/:clientId/managers', requireRoles('admin'), assignManagers);
clientsRouter.get('/:clientId', detail);
clientsRouter.patch('/:clientId', requireRoles('admin'), update);
