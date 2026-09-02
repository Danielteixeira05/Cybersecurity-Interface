import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  deactivate,
  detail,
  download,
  history,
  list,
  receiveDocumentFile,
  review,
  uploadConfig,
  uploadDocument,
  uploadVersion,
  updateUploadLimit,
} from '../controllers/documents.controller.js';

const defaultHandlers = {
  deactivate, detail, download, history, list, receiveDocumentFile, review,
  uploadConfig, uploadDocument, uploadVersion, updateUploadLimit,
};

/**
 * Fábrica usada pelos testes HTTP locais. Em produção mantém exatamente os
 * mesmos middlewares e handlers, sem alterar o contrato público das rotas.
 */
export function createDocumentsRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const selected = { ...defaultHandlers, ...handlers };
  const router = Router();
  router.use(authenticateMiddleware, requireRolesMiddleware('admin', 'manager', 'client'));
  router.get('/', selected.list);
  router.get('/config', selected.uploadConfig);
  router.patch('/config/upload-limit', requireRolesMiddleware('admin'), selected.updateUploadLimit);
  router.post('/', selected.receiveDocumentFile, selected.uploadDocument);
  router.get('/:documentId', selected.detail);
  router.get('/:documentId/download', selected.download);
  router.get('/:documentId/history', selected.history);
  router.post('/:documentId/versions', requireRolesMiddleware('client'), selected.receiveDocumentFile, selected.uploadVersion);
  router.patch('/:documentId/review', requireRolesMiddleware('admin', 'manager'), selected.review);
  router.patch('/:documentId/deactivate', selected.deactivate);
  return router;
}

export const documentsRouter = createDocumentsRouter();
