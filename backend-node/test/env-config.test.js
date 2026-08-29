import assert from 'node:assert/strict';
import test from 'node:test';
import { normaliseDatabaseUrl } from '../src/config/env.js';

test('normaliseDatabaseUrl accepts a .env assignment without changing the URL value', () => {
  const value = 'database-connection-value';
  assert.equal(normaliseDatabaseUrl(`DATABASE_URL="${value}"`), value);
  assert.equal(normaliseDatabaseUrl(`export DATABASE_URL='${value}'`), value);
});
