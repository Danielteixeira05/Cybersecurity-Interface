import { Router } from 'express';
import { create, detail, list, update } from '../controllers/assets.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const assetsRouter = Router();
assetsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
assetsRouter.route('/').get(list).post(requireRoles('admin', 'manager'), create);
assetsRouter.route('/:assetId').get(detail).patch(requireRoles('admin', 'manager'), update);
