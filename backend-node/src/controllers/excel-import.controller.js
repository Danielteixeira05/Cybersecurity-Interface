import multer from 'multer';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { commitExcelImport, listExcelImports, previewExcelImport } from '../services/excel-import.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: env.documentUploadSafetyMaxMb * 1024 * 1024 },
});

export function receiveExcelFile(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'O ficheiro excede o teto de segurança do servidor.'));
    if (error) return next(httpError(400, 'Não foi possível processar o ficheiro XLSX.'));
    return next();
  });
}

function responder(handler, status = 200) {
  return async (request, response, next) => {
    try { return response.status(status).json(await handler(request)); } catch (error) { return next(error); }
  };
}

export const list = responder((request) => listExcelImports(request.auth, request.query));
export const preview = responder((request) => previewExcelImport(request.auth, request.body, request.file));
export const commit = responder((request) => commitExcelImport(request.auth, request.body, request.file), 201);
