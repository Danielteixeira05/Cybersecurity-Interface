import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import express from 'express';
import { app as application } from '../src/app.js';
import { createExcelImportRouter } from '../src/routes/excel-import.routes.js';
import { errorHandler, httpError, notFound } from '../src/middleware/errors.js';
import {
  ASSET_IMPORT_TEMPLATE_FILENAME,
  ASSET_IMPORT_TEMPLATE_HEADERS,
  assertExcelImportPermission,
  commitExcelImport,
  createAssetImportTemplate,
  parseExcelImportForTests,
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

test('o modelo de ativos corresponde ao contrato do parser e a linha fictícia é válida', async () => {
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
  assert.equal(sheet.getCell('A2').value, 'EXEMPLO-REMOVER');

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
  assert.equal(rows.length, 1);
  assert.equal(rows[0].estado, 'IMPORTADA');
  assert.equal(rows[0].dados.nome, 'EXEMPLO-REMOVER');
  assert.equal(rows[0].dados.criticidade, 'MEDIA');
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
