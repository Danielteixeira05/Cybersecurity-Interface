import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import {
  createMemoryDocumentStorage,
  createVercelBlobStorage,
  validateDocumentFile,
} from '../src/services/document-storage.service.js';

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF', 'utf8');

test('valida um PDF por extensão, MIME e assinatura real', async () => {
  const result = await validateDocumentFile({
    originalname: 'politica.pdf', mimetype: 'application/pdf', size: pdf.length, buffer: pdf,
  }, 1024 * 1024);
  assert.equal(result.mime, 'application/pdf');
  assert.equal(result.originalName, 'politica.pdf');
  assert.match(result.checksum, /^[0-9a-f]{64}$/);
});

test('recusa extensões proibidas antes de enviar para armazenamento', async () => {
  await assert.rejects(
    validateDocumentFile({ originalname: 'script.exe', mimetype: 'application/octet-stream', size: 4, buffer: Buffer.from('MZ!!') }, 1024),
    (error) => error.status === 422,
  );
});

test('aplica o limite de tamanho antes de persistir', async () => {
  await assert.rejects(
    validateDocumentFile({ originalname: 'politica.pdf', mimetype: 'application/pdf', size: pdf.length, buffer: pdf }, 4),
    (error) => error.status === 413,
  );
});

test('o armazenamento simulado persiste e remove apenas o objeto indicado', async () => {
  const storage = createMemoryDocumentStorage();
  await storage.put({ key: 'documents/teste/politica.pdf', buffer: pdf, contentType: 'application/pdf' });
  assert.equal(storage.has('documents/teste/politica.pdf'), true);
  const object = await storage.get('documents/teste/politica.pdf');
  const chunks = [];
  for await (const chunk of object.stream) chunks.push(chunk);
  assert.deepEqual(Buffer.concat(chunks), pdf);
  await storage.delete('documents/teste/politica.pdf');
  assert.equal(storage.has('documents/teste/politica.pdf'), false);
});

test('o download privado envia access private ao Vercel Blob', async () => {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.BLOB_READ_WRITE_TOKEN = 'token-exclusivo-do-teste';

  const calls = [];
  const key = 'documents/teste/politica.pdf';

  try {
    const storage = createVercelBlobStorage(async () => ({
      async get(receivedKey, options) {
        calls.push({ key: receivedKey, options });
        return {
          stream: Readable.from([pdf]),
          contentType: 'application/pdf',
          size: pdf.length,
        };
      },
    }));

    const object = await storage.get(key);

    assert.deepEqual(calls, [{
      key,
      options: { access: 'private' },
    }]);
    assert.equal(object.contentType, 'application/pdf');
    assert.equal(object.size, pdf.length);

    const chunks = [];
    for await (const chunk of object.stream) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), pdf);
  } finally {
    if (previous === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previous;
  }
});
test('o adaptador real falha de forma controlada sem token de Blob', async () => {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    await assert.rejects(
      createVercelBlobStorage().put({ key: 'documents/teste.pdf', buffer: pdf, contentType: 'application/pdf' }),
      (error) => error.status === 503,
    );
  } finally {
    if (previous === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previous;
  }
});
