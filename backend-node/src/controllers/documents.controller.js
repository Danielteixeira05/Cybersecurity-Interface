import multer from 'multer';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import {
  deactivateDocument,
  documentDetail,
  documentHistory,
  documentUploadConfig,
  downloadDocument,
  listDocuments,
  reviewDocument,
  submitDocument,
  submitDocumentVersion,
} from '../services/documents.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: env.documentUploadSafetyMaxMb * 1024 * 1024 },
});

export function receiveDocumentFile(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'O ficheiro excede o teto de segurança do servidor.'));
    if (error) return next(httpError(400, 'Não foi possível processar o ficheiro submetido.'));
    return next();
  });
}

function responder(handler) {
  return async (request, response, next) => {
    try { return response.json(await handler(request)); } catch (error) { return next(error); }
  };
}

function safeDownloadName(value) {
  const base = String(value ?? 'documento').replace(/[\\/\r\n\0]/g, '_');
  return base || 'documento';
}

export const list = responder((request) => listDocuments(request.auth, request.query));
export const detail = responder((request) => documentDetail(request.auth, request.params.documentId));
export const history = responder((request) => documentHistory(request.auth, request.params.documentId));
export const uploadDocument = responder((request) => submitDocument(request.auth, request.body, request.file));
export const uploadVersion = responder((request) => submitDocumentVersion(request.auth, request.params.documentId, request.body, request.file));
export const review = responder((request) => reviewDocument(request.auth, request.params.documentId, request.body));
export const deactivate = responder((request) => deactivateDocument(request.auth, request.params.documentId));
export const uploadConfig = responder((request) => documentUploadConfig(request.auth));

export async function download(request, response, next) {
  try {
    const { document, stream, contentType, size } = await downloadDocument(request.auth, request.params.documentId);
    const name = safeDownloadName(document.nome_ficheiro_original);
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${name.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      ...(size ? { 'Content-Length': String(size) } : {}),
    });
    stream.on('error', next);
    stream.pipe(response);
  } catch (error) {
    next(error);
  }
}
