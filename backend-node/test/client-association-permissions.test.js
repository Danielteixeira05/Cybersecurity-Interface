import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseClientContactPayload, singlePrincipalClientId } from '../src/services/clients.service.js';

test('uma ação do Cliente é sempre limitada à única associação principal ativa', () => {
  assert.equal(singlePrincipalClientId(['21'], 21, 'reportar um incidente'), 21);
  assert.throws(
    () => singlePrincipalClientId(['21'], 22, 'reportar um incidente'),
    (error) => error?.status === 403,
  );
});

test('uma associação Cliente inexistente, ambígua ou inválida não permite escrever', () => {
  assert.throws(() => singlePrincipalClientId([], 21), (error) => error?.status === 403);
  assert.throws(() => singlePrincipalClientId(['21', '22'], 21), (error) => error?.status === 400);
  assert.throws(() => singlePrincipalClientId(['0'], 0), (error) => error?.status === 403);
});

test('os contactos de cliente exigem telefone no contrato do backend', () => {
  const base = {
    tipo: 'RESPONSAVEL_SEGURANCA',
    nome: 'Contacto de teste',
    email: 'contacto@example.test',
    comunicado_cncs: false,
    ativo: true,
  };
  assert.equal(
    normaliseClientContactPayload({ ...base, telefone: '+351 210 000 000' }).telefone,
    '+351 210 000 000',
  );
  for (const telefone of [undefined, null, '', '   ']) {
    assert.throws(
      () => normaliseClientContactPayload({ ...base, telefone }),
      (error) => error?.status === 400 && error.message === 'O telefone é obrigatório.',
    );
  }
});
