import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { fileTypeFromBuffer } from 'file-type';
import { httpError } from '../middleware/errors.js';

const OFFICE_MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const ALLOWED_DOCUMENT_TYPES = Object.freeze({
  pdf: { mime: 'application/pdf', label: 'PDF' },
  docx: { mime: OFFICE_MIME.docx, label: 'DOCX' },
  xlsx: { mime: OFFICE_MIME.xlsx, label: 'XLSX' },
  csv: { mime: 'text/csv', label: 'CSV' },
  png: { mime: 'image/png', label: 'PNG' },
  jpg: { mime: 'image/jpeg', label: 'JPG' },
  jpeg: { mime: 'image/jpeg', label: 'JPEG' },
});

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function extensionFromName(name) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match?.[1]?.toLowerCase() ?? '';
}

function safeOriginalName(value) {
  const name = text(value).replace(/[\\/\0]/g, '_');
  if (!name || name.length > 255) throw httpError(400, 'Nome de ficheiro inválido.');
  return name;
}

function isSafeCsv(buffer) {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

export function configuredDocumentSafetyLimitBytes() {
  const raw = Number(process.env.DOCUMENT_UPLOAD_SAFETY_MAX_MB ?? 50);
  const mb = Number.isFinite(raw) && raw >= 1 && raw <= 100 ? raw : 50;
  return Math.trunc(mb * 1024 * 1024);
}

export async function validateDocumentFile(file, maximumBytes) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) throw httpError(400, 'É obrigatório selecionar um ficheiro.');
  const originalName = safeOriginalName(file.originalname);
  const extension = extensionFromName(originalName);
  const allowed = ALLOWED_DOCUMENT_TYPES[extension];
  if (!allowed) throw httpError(422, 'Formato de ficheiro não permitido.');
  if (file.size < 1) throw httpError(422, 'O ficheiro não pode estar vazio.');
  if (file.size > maximumBytes) throw httpError(413, 'O ficheiro excede o limite máximo permitido.');

  let detectedMime;
  if (extension === 'csv') {
    if (!isSafeCsv(file.buffer)) throw httpError(422, 'O ficheiro CSV não contém texto UTF-8 válido.');
    detectedMime = 'text/csv';
  } else {
    const detected = await fileTypeFromBuffer(file.buffer);
    detectedMime = detected?.mime;
    if (!detectedMime || detectedMime !== allowed.mime) {
      throw httpError(422, 'O conteúdo do ficheiro não corresponde ao formato indicado.');
    }
  }

  const suppliedMime = text(file.mimetype).toLowerCase();
  const suppliedAllowed = !suppliedMime
    || suppliedMime === allowed.mime
    || (extension === 'csv' && ['text/plain', 'application/csv', 'application/vnd.ms-excel'].includes(suppliedMime));
  if (!suppliedAllowed) throw httpError(422, 'O tipo MIME indicado não é permitido para este ficheiro.');

  return {
    originalName,
    extension,
    mime: detectedMime,
    size: file.size,
    checksum: createHash('sha256').update(file.buffer).digest('hex'),
    storageName: `${randomUUID()}.${extension}`,
    buffer: file.buffer,
  };
}

function assertBlobConfigured() {
  if (!text(process.env.BLOB_READ_WRITE_TOKEN)) {
    throw httpError(503, 'Armazenamento privado de documentos ainda não está configurado.');
  }
}

export function createVercelBlobStorage() {
  return {
    async put({ key, buffer, contentType }) {
      assertBlobConfigured();
      const { put } = await import('@vercel/blob');
      const result = await put(key, buffer, {
        access: 'private',
        addRandomSuffix: false,
        contentType,
      });
      return { key: result.pathname || key };
    },
    async get(key) {
      assertBlobConfigured();
      const { get } = await import('@vercel/blob');
      const result = await get(key);
      if (!result) throw httpError(404, 'Ficheiro não encontrado no armazenamento privado.');
      const stream = result.stream ?? result.body;
      if (!stream) throw httpError(502, 'O armazenamento não devolveu o ficheiro solicitado.');
      return {
        stream: typeof stream.pipe === 'function' ? stream : Readable.fromWeb(stream),
        contentType: result.contentType ?? 'application/octet-stream',
        size: result.size ?? undefined,
      };
    },
    async delete(key) {
      assertBlobConfigured();
      const { del } = await import('@vercel/blob');
      await del(key);
    },
  };
}

/** Armazenamento em memória, limitado aos testes automáticos. */
export function createMemoryDocumentStorage() {
  const objects = new Map();
  return {
    async put({ key, buffer, contentType }) {
      objects.set(key, { buffer: Buffer.from(buffer), contentType });
      return { key };
    },
    async get(key) {
      const object = objects.get(key);
      if (!object) throw httpError(404, 'Ficheiro não encontrado no armazenamento simulado.');
      return { stream: Readable.from(object.buffer), contentType: object.contentType, size: object.buffer.length };
    },
    async delete(key) {
      objects.delete(key);
    },
    has(key) {
      return objects.has(key);
    },
  };
}
