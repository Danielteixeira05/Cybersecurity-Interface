import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContactPayload } from '../src/services/cms.service.js';

test('valida a mensagem pública de contacto sem depender da base de dados', () => {
  const payload = validateContactPayload({
    nome: 'Contacto de teste',
    email: 'teste@example.org',
    telefone: '910000000',
    empresa: 'Organização de teste',
    assunto: 'Pedido de informação',
    mensagem: 'Mensagem de validação.',
  });
  assert.equal(payload.email, 'teste@example.org');
  assert.equal(payload.assunto, 'Pedido de informação');
});

test('rejeita email inválido antes de tentar escrever a mensagem de contacto', () => {
  assert.throws(
    () => validateContactPayload({ nome: 'A', email: 'invalido', assunto: 'B', mensagem: 'C' }),
    (error) => error?.status === 400,
  );
});
