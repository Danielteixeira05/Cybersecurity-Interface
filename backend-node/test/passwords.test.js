import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { generateTemporaryPassword, hashPassword, verifyPassword } from '../src/services/passwords.js';

function djangoPbkdf2Hash(password, salt, iterations = 1000) {
  const digest = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  return `pbkdf2_sha256$${iterations}$${salt}$${digest}`;
}

test('valida um hash pbkdf2_sha256 compatível com Django', async () => {
  const hash = djangoPbkdf2Hash('password-de-teste', 'salt-de-teste');
  assert.equal(await verifyPassword('password-de-teste', hash), true);
  assert.equal(await verifyPassword('errada', hash), false);
});

test('rejeita formatos de hash desconhecidos', async () => {
  assert.equal(await verifyPassword('password', 'hash-invalido'), false);
});

test('gera hash bcrypt para novas contas Node sem expor a password', async () => {
  const hash = await hashPassword('Uma-password-de-teste-123');
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await verifyPassword('Uma-password-de-teste-123', hash), true);
});

test('gera uma password temporária forte sem recorrer a Math.random', () => {
  const password = generateTemporaryPassword();
  assert.equal(password.length, 16);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[-!@#$%^&*_+=]/);
});
