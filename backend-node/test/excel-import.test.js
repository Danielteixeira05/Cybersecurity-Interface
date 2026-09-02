import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { assertExcelImportPermission, parseExcelImportForTests } from '../src/services/excel-import.service.js';

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
