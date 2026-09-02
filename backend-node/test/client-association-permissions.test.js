import test from 'node:test';
import assert from 'node:assert/strict';
import { singlePrincipalClientId } from '../src/services/clients.service.js';

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
