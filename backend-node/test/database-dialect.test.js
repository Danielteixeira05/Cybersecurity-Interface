import assert from 'node:assert/strict';
import test from 'node:test';
import { createSequelizeOptions, postgresDialectModule } from '../src/config/database.js';

test('a configuração PostgreSQL usa o módulo pg importado estaticamente', () => {
  const options = createSequelizeOptions('production');

  assert.equal(typeof postgresDialectModule.Client, 'function');
  assert.equal(typeof postgresDialectModule.Pool, 'function');
  assert.equal(options.dialect, 'postgres');
  assert.equal(options.dialectModule, postgresDialectModule);
  assert.deepEqual(options.dialectOptions, { ssl: { require: true, rejectUnauthorized: true } });
});
