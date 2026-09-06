import { Router } from 'express';
import { commit, downloadAssetTemplate, list, preview, receiveExcelFile } from '../controllers/excel-import.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createExcelImportRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  const resolved = { commit, downloadAssetTemplate, list, preview, receiveExcelFile, ...handlers };
  router.use(authenticateMiddleware, requireRolesMiddleware('admin', 'manager', 'client'));
  router.get('/templates/assets', resolved.downloadAssetTemplate);
  router.get('/', resolved.list);
  router.post('/preview', resolved.receiveExcelFile, resolved.preview);
  router.post('/', resolved.receiveExcelFile, resolved.commit);
  return router;
}

export const excelImportRouter = createExcelImportRouter();
