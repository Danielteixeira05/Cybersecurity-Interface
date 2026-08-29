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
} from '../controllers/documents.controller.js';

export const documentsRouter = Router();
documentsRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
documentsRouter.get('/', list);
documentsRouter.get('/config', uploadConfig);
documentsRouter.post('/', requireRoles('client'), receiveDocumentFile, uploadDocument);
documentsRouter.get('/:documentId', detail);
documentsRouter.get('/:documentId/download', download);
documentsRouter.get('/:documentId/history', history);
documentsRouter.post('/:documentId/versions', requireRoles('client'), receiveDocumentFile, uploadVersion);
documentsRouter.patch('/:documentId/review', requireRoles('admin', 'manager'), review);
documentsRouter.patch('/:documentId/deactivate', deactivate);
