import { Router } from 'express';
import { commit, download, downloadAssetTemplate, list, preview, receiveExcelFile, result } from '../controllers/excel-import.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createExcelImportRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  const resolved = { commit, download, downloadAssetTemplate, list, preview, receiveExcelFile, result, ...handlers };
  router.use(authenticateMiddleware, requireRolesMiddleware('admin', 'manager', 'client'));
  router.get('/templates/assets', resolved.downloadAssetTemplate);
  router.get('/:importId/result', resolved.result);
  router.get('/:importId/download', resolved.download);
  router.get('/', resolved.list);
  router.post('/preview', resolved.receiveExcelFile, resolved.preview);
  router.post('/', resolved.receiveExcelFile, resolved.commit);
  return router;
}

export const excelImportRouter = createExcelImportRouter();
