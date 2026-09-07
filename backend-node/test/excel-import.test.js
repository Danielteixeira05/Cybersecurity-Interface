import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import ExcelJS from 'exceljs';
import express from 'express';
import { app as application } from '../src/app.js';
import { createDownloadExcelImportHandler } from '../src/controllers/excel-import.controller.js';
import { createExcelImportRouter } from '../src/routes/excel-import.routes.js';
import { errorHandler, httpError, notFound } from '../src/middleware/errors.js';
import {
  ASSET_IMPORT_TEMPLATE_FILENAME,
  ASSET_IMPORT_TEMPLATE_HEADERS,
  assertExcelImportPermission,
  commitExcelImport,
  createAssetImportTemplate,
  downloadExcelImport,
  parseExcelImportForTests,
  previewExcelImport,
} from '../src/services/excel-import.service.js';

async function xlsxFile(rows) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Importação');
  sheet.columns = Object.keys(rows[0] ?? {}).map((key) => ({ header: key, key }));
  rows.forEach((row) => sheet.addRow(row));
  const buffer = Buffer.from(await book.xlsx.writeBuffer());
  return {
    originalname: 'ativos-e2e.xlsx',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    buffer,
  };
}

test('pré-visualização XLSX normaliza ativos e assinala linhas inválidas sem escrever', async () => {
  const rows = await parseExcelImportForTests({
    tipo: 'ATIVOS',
    clienteId: 7,
    file: await xlsxFile([
      { Nome: 'Servidor de aplicação', Criticidade: 'ALTA', Numero_Inventario: 'INV-001' },
      { Nome: '', Criticidade: 'MEDIA', Numero_Inventario: 'INV-002' },
    ]),
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].estado, 'IMPORTADA');
  assert.equal(rows[0].dados.cliente_id, 7);
  assert.equal(rows[0].dados.criticidade, 'ALTA');
  assert.equal(rows[1].estado, 'REJEITADA');
  assert.match(rows[1].erro, /obrigatório/i);
});

test('pré-visualização rejeita códigos de incidente repetidos no mesmo XLSX', async () => {
  const rows = await parseExcelImportForTests({
    tipo: 'INCIDENTES',
    clienteId: 7,
    file: await xlsxFile([
      { Codigo: 'INC-001', Data_Hora_Incidente: '2026-08-30T10:00:00Z', Tipo_Incidente: 'Phishing', Descricao: 'Tentativa bloqueada', Gravidade: 'MEDIA' },
      { Codigo: 'INC-001', Data_Hora_Incidente: '2026-08-30T11:00:00Z', Tipo_Incidente: 'Phishing', Descricao: 'Tentativa repetida', Gravidade: 'MEDIA' },
    ]),
  });

  assert.equal(rows[0].estado, 'IMPORTADA');
  assert.equal(rows[1].estado, 'REJEITADA');
  assert.match(rows[1].erro, /repetido/i);
});

test('Cliente só pode usar a importação Excel para ativos tecnológicos', () => {
  assert.doesNotThrow(() => assertExcelImportPermission({ role: 'client' }, 'ATIVOS'));
  assert.throws(
    () => assertExcelImportPermission({ role: 'client' }, 'INCIDENTES'),
    (error) => error?.status === 403,
  );
  assert.doesNotThrow(() => assertExcelImportPermission({ role: 'manager' }, 'INCIDENTES'));
});

test('o modelo de ativos corresponde ao contrato do parser e não contém linhas importáveis', async () => {
  const buffer = await createAssetImportTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Importação', 'Instruções']);
  const sheet = workbook.getWorksheet('Importação');
  assert.ok(sheet);
  assert.deepEqual(sheet.getRow(1).values.slice(1), ASSET_IMPORT_TEMPLATE_HEADERS);
  assert.equal(sheet.views[0].state, 'frozen');
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(sheet.getCell('A1').fill.fgColor.argb, 'FFF59E0B');
  assert.equal(sheet.getCell('B1').fill.fgColor.argb, 'FFF59E0B');
  assert.deepEqual(sheet.getCell('B2').dataValidation.formulae, ['"RESIDUAL,BAIXA,MEDIA,ALTA,CRITICA"']);
  assert.equal(sheet.getCell('A2').value, null);
  const instructionText = workbook.getWorksheet('Instruções').getColumn(1).values.join(' ');
  assert.match(instructionText, /EXEMPLO-REMOVER/);

  const rows = await parseExcelImportForTests({
    tipo: 'ATIVOS',
    clienteId: 7,
    file: {
      originalname: ASSET_IMPORT_TEMPLATE_FILENAME,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length,
      buffer,
    },
  });
  assert.deepEqual(rows, []);

  const preview = await previewExcelImport(
    { role: 'client', sub: '7' },
    { tipo: 'ATIVOS', cliente_id: 7 },
    {
      originalname: ASSET_IMPORT_TEMPLATE_FILENAME,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length,
      buffer,
    },
    { activeClientForImport: async () => 7 },
  );
  assert.equal(preview.total_linhas, 0);
  assert.equal(preview.linhas_validas, 0);
  assert.equal(preview.linhas_rejeitadas, 0);
  assert.deepEqual(preview.linhas, []);
});

test('a confirmação de um modelo vazio não cria importação, ativos ou objetos no storage', async () => {
  const buffer = await createAssetImportTemplate();
  let storageWrites = 0;
  let importWrites = 0;
  let assetWrites = 0;

  await assert.rejects(
    () => commitExcelImport(
      { role: 'client', sub: '7' },
      { tipo: 'ATIVOS', cliente_id: 7 },
      {
        originalname: ASSET_IMPORT_TEMPLATE_FILENAME,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer,
      },
      {
        activeClientForImport: async () => 7,
        storage: { put: async () => { storageWrites += 1; } },
        models: { ExcelImport: { create: async () => { importWrites += 1; } } },
        createAssetFromImport: async () => { assetWrites += 1; },
      },
    ),
    (error) => error?.status === 422,
  );
  assert.equal(storageWrites, 0);
  assert.equal(importWrites, 0);
  assert.equal(assetWrites, 0);
});

test('o importador rejeita um ficheiro incompatível com XLSX', async () => {
  const buffer = Buffer.from('conteúdo que não é um workbook');
  await assert.rejects(
    () => parseExcelImportForTests({
      tipo: 'ATIVOS',
      clienteId: 7,
      file: {
        originalname: 'ficheiro-incompativel.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        buffer,
      },
    }),
    (error) => error?.status === 422,
  );
});

test('a confirmação persiste o tipo normalizado e conclui a transação sem ReferenceError', async () => {
  const transaction = { id: 'transacao-isolada' };
  const created = {
    id: 41,
    async update(values) { Object.assign(this, values); },
    get() {
      return Object.fromEntries(Object.entries(this).filter(([, value]) => typeof value !== 'function'));
    },
  };
  let importPayload;
  let auditPayload;
  let assetCreated = false;
  let blobDeleted = false;

  const result = await commitExcelImport(
    { role: 'client', sub: '7' },
    { tipo: 'ATIVOS', cliente_id: 9 },
    await xlsxFile([{ nome: 'ATIVO-E2E', criticidade: 'MEDIA', numero_inventario: 'E2E-001' }]),
    {
      activeClientForImport: async () => 9,
      storage: {
        put: async ({ key }) => ({ key }),
        delete: async () => { blobDeleted = true; },
      },
      models: {
        ExcelImport: {
          create: async (payload, options) => {
            assert.equal(options.transaction, transaction);
            importPayload = payload;
            Object.assign(created, payload);
            return created;
          },
        },
        ImportRow: {
          create: async (_payload, options) => { assert.equal(options.transaction, transaction); },
        },
        sequelize: {
          transaction: async (callback) => callback(transaction),
        },
      },
      createAssetFromImport: async (_auth, _payload, options) => {
        assert.equal(options.transaction, transaction);
        assert.equal(options.importId, 41);
        assetCreated = true;
      },
      createIncidentFromImport: async () => assert.fail('A confirmação de ativos não deve criar incidentes.'),
      recordAudit: async (payload, receivedTransaction) => {
        assert.equal(receivedTransaction, transaction);
        auditPayload = payload;
      },
    },
  );

  assert.equal(importPayload.tipo, 'ATIVOS');
  assert.equal(auditPayload.details.tipo, 'ATIVOS');
  assert.equal(result.tipo, 'ATIVOS');
  assert.equal(result.estado, 'PROCESSADO');
  assert.equal(result.linhas_importadas, 1);
  assert.equal(assetCreated, true);
  assert.equal(blobDeleted, false);
});

function createTemplateTestApp() {
  const instance = express();
  const router = createExcelImportRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role, sub: '7' };
      return next();
    },
  });
  instance.use('/api/excel-imports', router);
  instance.use(notFound);
  instance.use(errorHandler);
  return instance;
}

async function withServer(instance, callback) {
  const server = await new Promise((resolve) => {
    const created = instance.listen(0, '127.0.0.1', () => resolve(created));
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('o endpoint autenticado entrega o modelo XLSX com os headers de download corretos', async () => {
  await withServer(createTemplateTestApp(), async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/excel-imports/templates/assets`);
    assert.equal(anonymous.status, 401);

    const response = await fetch(`${baseUrl}/api/excel-imports/templates/assets`, {
      headers: { 'x-test-role': 'manager' },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/i);
    assert.match(response.headers.get('content-disposition') || '', new RegExp(ASSET_IMPORT_TEMPLATE_FILENAME));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
    assert.ok(workbook.getWorksheet('Importação'));
    assert.ok(workbook.getWorksheet('Instruções'));
  });
});

test('a aplicação Express real recusa o modelo sem autenticação antes de consultar dados', async () => {
  await withServer(application, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/excel-imports/templates/assets`);
    assert.equal(response.status, 401);
  });
});

function storedImport(overrides = {}) {
  return {
    id: 31,
    cliente_id: 7,
    tipo: 'ATIVOS',
    nome_ficheiro_original: 'ativos-alpha.xlsx',
    caminho_ficheiro: 'imports/7/private/original.xlsx',
    estado: 'PROCESSADO',
    ...overrides,
  };
}

function downloadDependencies({ row = storedImport(), allowed = true } = {}) {
  const calls = { storage: 0, audit: 0 };
  const dependencies = {
    models: {
      Client: { name: 'Client' },
      ExcelImport: {
        async findOne(options) {
          assert.deepEqual(options.where, { id: 31 });
          assert.equal(options.include[0].where.ativo, true);
          assert.equal(options.include[0].required, true);
          return row;
        },
      },
    },
    async assertClientAccess(_auth, clientId) {
      assert.equal(clientId, 7);
      if (!allowed) throw httpError(403, 'Sem permissão para consultar este cliente.');
    },
    storage: {
      async get(key) {
        calls.storage += 1;
        assert.equal(key, 'imports/7/private/original.xlsx');
        return {
          stream: Readable.from(Buffer.from('xlsx-original')),
          contentType: 'application/octet-stream',
          size: 13,
          privateUrl: 'nunca-expor',
        };
      },
    },
    async recordAudit(payload) {
      calls.audit += 1;
      assert.deepEqual(payload, {
        userId: 70,
        action: 'DESCARREGAR_IMPORTACAO_EXCEL',
        entity: 'importacoes_excel',
        entityId: 31,
        details: { cliente_id: 7, tipo: 'ATIVOS' },
      });
    },
  };
  return { calls, dependencies, row };
}

test('o download privado reutiliza o mesmo ID para Admin, Gestor associado e Cliente da organização', async () => {
  for (const role of ['admin', 'manager', 'client']) {
    const { calls, dependencies, row } = downloadDependencies();
    const before = structuredClone(row);
    const result = await downloadExcelImport({ role, sub: '70' }, '31', dependencies);
    const chunks = [];
    for await (const chunk of result.stream) chunks.push(Buffer.from(chunk));
    assert.equal(Buffer.concat(chunks).toString(), 'xlsx-original');
    assert.equal(result.filename, 'ativos-alpha.xlsx');
    assert.equal(result.contentType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.deepEqual(Object.keys(result).sort(), ['contentType', 'filename', 'size', 'stream']);
    assert.deepEqual(row, before);
    assert.equal(calls.storage, 1);
    assert.equal(calls.audit, 1);
  }
});

test('o download recusa Gestor/Cliente sem associação antes de consultar o Blob', async () => {
  for (const role of ['manager', 'client']) {
    const { calls, dependencies } = downloadDependencies({ allowed: false });
    await assert.rejects(
      () => downloadExcelImport({ role, sub: '70' }, '31', dependencies),
      (error) => error?.status === 403,
    );
    assert.equal(calls.storage, 0);
    assert.equal(calls.audit, 0);
  }
});

test('o download rejeita IDs não canónicos e devolve 404 para uma importação inexistente', async () => {
  for (const invalid of ['0', '-1', '01', '1.0', '1e2', 'texto', ' 31', '31 ']) {
    await assert.rejects(
      () => downloadExcelImport({ role: 'admin', sub: '70' }, invalid, {}),
      (error) => error?.status === 400,
    );
  }
  const { dependencies } = downloadDependencies({ row: null });
  await assert.rejects(
    () => downloadExcelImport({ role: 'admin', sub: '70' }, '31', dependencies),
    (error) => error?.status === 404,
  );
});

test('o endpoint de download exige sessão e devolve XLSX com nome seguro', async () => {
  const handler = createDownloadExcelImportHandler(async () => ({
    filename: '../ativos\r\nalpha.xlsx',
    stream: Readable.from(Buffer.from('xlsx-http')),
    size: 9,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const instance = express();
  instance.use('/api/excel-imports', createExcelImportRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role, sub: '70' };
      return next();
    },
    handlers: { download: handler },
  }));
  instance.use(notFound);
  instance.use(errorHandler);

  await withServer(instance, async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/excel-imports/31/download`);
    assert.equal(anonymous.status, 401);

    const response = await fetch(`${baseUrl}/api/excel-imports/31/download`, { headers: { 'x-test-role': 'admin' } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/i);
    assert.match(response.headers.get('content-disposition') || '', /ativos__alpha\.xlsx/i);
    assert.doesNotMatch(response.headers.get('content-disposition') || '', /\.\.\//);
    assert.equal(Buffer.from(await response.arrayBuffer()).toString(), 'xlsx-http');
  });
});
