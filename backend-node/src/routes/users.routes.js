import { Router } from 'express';
import { create, detail, list, update } from '../controllers/users.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const usersRouter = Router();
usersRouter.use(authenticate, requireRoles('admin'));
usersRouter.route('/').get(list).post(create);
usersRouter.route('/:userId').get(detail).patch(update);
