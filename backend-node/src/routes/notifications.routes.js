import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { list, markRead } from '../controllers/notifications.controller.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
notificationsRouter.get('/', list);
notificationsRouter.patch('/:notificationId/read', markRead);
