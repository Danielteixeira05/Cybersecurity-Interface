import multer from 'multer';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import {
  ASSET_IMPORT_TEMPLATE_FILENAME,
  commitExcelImport,
  createAssetImportTemplate,
  downloadExcelImport,
  listExcelImports,
  previewExcelImport,
} from '../services/excel-import.service.js';

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

function safeDownloadName(value) {
  const name = String(value ?? 'importacao.xlsx').replace(/[\\/\r\n\0]/g, '_').replace(/"/g, '');
  return name || 'importacao.xlsx';
}

export function createDownloadExcelImportHandler(downloadHandler = downloadExcelImport) {
  return async (request, response, next) => {
    try {
      const { filename, stream, contentType, size } = await downloadHandler(request.auth, request.params.importId);
      const name = safeDownloadName(filename);
      response.set({
        'Cache-Control': 'private, no-store',
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        ...(size ? { 'Content-Length': String(size) } : {}),
      });
      stream.on('error', next);
      stream.pipe(response);
    } catch (error) {
      next(error);
    }
  };
}

export const download = createDownloadExcelImportHandler();

export async function downloadAssetTemplate(_request, response, next) {
  try {
    const buffer = await createAssetImportTemplate();
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename=\"${ASSET_IMPORT_TEMPLATE_FILENAME}\"`,
      'Content-Length': String(buffer.length),
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return response.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
}
