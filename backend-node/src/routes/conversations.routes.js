import { Router } from 'express';
import { ensure, list, markRead, messages, send } from '../controllers/conversations.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const conversationsRouter = Router();
conversationsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
conversationsRouter.get('/', list);
conversationsRouter.post('/ensure', ensure);
conversationsRouter.get('/:conversationId/messages', messages);
conversationsRouter.post('/:conversationId/messages', send);
conversationsRouter.patch('/:conversationId/read', markRead);
