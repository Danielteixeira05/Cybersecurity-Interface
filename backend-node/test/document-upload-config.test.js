import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readDocumentUploadLimit,
  resolveDocumentUploadLimit,
  updateDocumentUploadLimit,
  validDocumentUploadLimit,
} from '../src/services/document-upload-config.service.js';

test('o valor persistido válido define o limite funcional, limitado pelo teto de segurança', () => {
  assert.equal(resolveDocumentUploadLimit({ configuredValue: '80', fallbackValue: 10, safetyValue: 50 }), 50);
  assert.equal(resolveDocumentUploadLimit({ configuredValue: 'invalido', fallbackValue: 12, safetyValue: 50 }), 12);
  assert.equal(validDocumentUploadLimit('12.5'), null);
  assert.equal(validDocumentUploadLimit('0'), null);
});

test('a leitura usa fallback quando a configuração persistida não é válida', async () => {
  const value = await readDocumentUploadLimit({
    models: { SystemConfiguration: { findOne: async () => ({ valor: 'sem valor' }) } },
    fallbackValue: 10,
    safetyValue: 50,
  });
  assert.equal(value.maxUploadMb, 10);
  assert.equal(value.configuredUploadMb, null);
  assert.equal(value.usesFallback, true);
});

test('READ_ONLY_MODE bloqueia a alteração antes de abrir transação', async () => {
  let transactionCalls = 0;
  await assert.rejects(
    updateDocumentUploadLimit({ role: 'admin', sub: '7' }, { max_upload_mb: 15 }, {
      readOnly: true,
      models: { sequelize: { transaction: async () => { transactionCalls += 1; } } },
    }),
    (error) => error.status === 403,
  );
  assert.equal(transactionCalls, 0);
});

test('a alteração administrativa é transacional e regista auditoria sem segredos', async () => {
  const calls = { create: [], audit: [] };
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const models = {
    sequelize: { transaction: async (work) => work(transaction) },
    SystemConfiguration: {
      findOne: async (options) => { assert.equal(options.transaction, transaction); assert.equal(options.lock, 'UPDATE'); return null; },
      create: async (values, options) => { calls.create.push({ values, options }); return { id: 31 }; },
    },
  };
  const result = await updateDocumentUploadLimit({ role: 'admin', sub: '7' }, { max_upload_mb: '25' }, {
    models, readOnly: false,
    audit: async (entry, usedTransaction) => calls.audit.push({ entry, usedTransaction }),
  });
  assert.equal(result.maxUploadMb, 25);
  assert.equal(calls.create[0].values.chave, 'MAX_UPLOAD_MB');
  assert.equal(calls.create[0].values.valor, '25');
  assert.deepEqual(calls.audit[0].entry.details, { chave: 'MAX_UPLOAD_MB', max_upload_mb: 25 });
  assert.equal(calls.audit[0].usedTransaction, transaction);
});
