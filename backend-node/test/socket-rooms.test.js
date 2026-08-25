import assert from 'node:assert/strict';
import test from 'node:test';
import { roomsForIdentity } from '../src/socket/index.js';

test('as salas do Socket são determinadas no servidor para Gestor', () => {
  assert.deepEqual(
    roomsForIdentity({ userId: 12, role: 'manager', clientIds: [7, 9] }),
    ['user:12', 'client:7', 'client:9'],
  );
});

test('o Cliente recebe apenas a sala da organização já autorizada', () => {
  assert.deepEqual(
    roomsForIdentity({ userId: 18, role: 'client', clientIds: [7] }),
    ['user:18', 'client:7'],
  );
});

test('o Administrador recebe a sua sala individual e a sala administrativa', () => {
  assert.deepEqual(
    roomsForIdentity({ userId: 1, role: 'admin', clientIds: [] }),
    ['user:1', 'role:admin'],
  );
});
