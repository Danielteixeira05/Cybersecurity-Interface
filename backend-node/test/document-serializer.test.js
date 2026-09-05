import assert from 'node:assert/strict';
import test from 'node:test';
import { serialiseDocument } from '../src/services/document.serializer.js';

test('o JSON documental canónico nunca expõe metadados internos do Blob', () => {
  const result = serialiseDocument({
    id: 71,
    cliente_id: 4,
    cliente: { nome: 'Organização de teste', nif: '500000000' },
    categoria: 'PENTEST',
    titulo: 'Documento de teste',
    nome_ficheiro_original: 'relatorio.pdf',
    nome_ficheiro_guardado: 'interno-71.pdf',
    caminho_ficheiro: 'private/documentos/interno-71.pdf',
    hash_sha256: 'hash-interno',
    blob_url: 'https://blob.example.test/private/documentos/interno-71.pdf',
    tipo_mime: 'application/pdf',
    tamanho_bytes: 128,
    privado: true,
    submetido_por: 9,
    submetido_em: '2026-09-05T10:00:00.000Z',
    ativo: true,
    estado: 'SUBMETIDO',
    versao: '1.0',
    atualizado_em: '2026-09-05T10:00:00.000Z',
  });

  const json = JSON.parse(JSON.stringify(result));
  assert.equal(json.titulo, 'Documento de teste');
  for (const field of ['caminho_ficheiro', 'hash_sha256', 'nome_ficheiro_guardado', 'blob_url']) {
    assert.equal(Object.hasOwn(json, field), false);
  }
});
