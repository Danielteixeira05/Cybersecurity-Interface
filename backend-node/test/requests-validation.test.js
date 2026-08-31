import assert from 'node:assert/strict';
import test from 'node:test';
import { normaliseRequestFields } from '../src/services/requests.service.js';

test('normaliza o payload de pedido sem depender da base de dados', () => {
  const fields = normaliseRequestFields({
    assunto: '  Pedido de demonstração  ',
    descricao: '  Detalhe do pedido  ',
    prioridade: 'alta',
  });

  assert.deepEqual(fields, {
    assunto: 'Pedido de demonstração',
    descricao: 'Detalhe do pedido',
    prioridade: 'ALTA',
  });
});

test('recusa um pedido incompleto ou com prioridade inválida antes de escrever', () => {
  assert.throws(
    () => normaliseRequestFields({ assunto: '', descricao: 'Detalhe', prioridade: 'NORMAL' }),
    (error) => error?.status === 400,
  );
  assert.throws(
    () => normaliseRequestFields({ assunto: 'Assunto', descricao: 'Detalhe', prioridade: 'URGENTISSIMA' }),
    (error) => error?.status === 400,
  );
});
