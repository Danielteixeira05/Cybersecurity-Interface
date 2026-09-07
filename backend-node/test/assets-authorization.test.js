import assert from 'node:assert/strict';
import test from 'node:test';
import { getAsset, listAssets } from '../src/services/assets.service.js';
import { httpError } from '../src/middleware/errors.js';

const assets = [
  { id: 41, cliente_id: 7, nome: 'ATIVO-ALPHA', criticidade: 'MEDIA', ativo: true, cliente: { nome: 'Alpha' } },
  { id: 42, cliente_id: 8, nome: 'ATIVO-BETA', criticidade: 'ALTA', ativo: true, cliente: { nome: 'Beta' } },
];

function models() {
  return {
    Client: { name: 'Client' },
    Asset: {
      async findAll(options) {
        assert.equal(options.include[0].where.ativo, true);
        assert.equal(options.include[0].required, true);
        const allowed = options.where.cliente_id;
        if (!allowed) return assets;
        const ids = Array.isArray(allowed) ? allowed.map(Number) : [Number(allowed)];
        return assets.filter((asset) => ids.includes(asset.cliente_id));
      },
      async findOne(options) {
        assert.equal(options.include[0].where.ativo, true);
        assert.equal(options.include[0].required, true);
        return assets.find((asset) => asset.id === Number(options.where.id)) ?? null;
      },
    },
  };
}

function dependencies(associatedClientIds) {
  return {
    models: models(),
    async clientIdsForUser(_userId, options) {
      if (options.principalOnly) return associatedClientIds.slice(0, 1).map(String);
      return associatedClientIds.map(String);
    },
    async assertClientAccess(auth, clientId) {
      if (auth.role === 'admin' || associatedClientIds.includes(Number(clientId))) return;
      throw httpError(403, 'Sem permissão para consultar este cliente.');
    },
  };
}

test('as listas de ativos ficam isoladas por perfil e associação', async () => {
  assert.deepEqual((await listAssets({ role: 'admin', sub: '1' }, {}, dependencies([]))).map((item) => item.id), [41, 42]);
  assert.deepEqual((await listAssets({ role: 'manager', sub: '2' }, {}, dependencies([7]))).map((item) => item.id), [41]);
  assert.deepEqual((await listAssets({ role: 'client', sub: '3' }, {}, dependencies([7]))).map((item) => item.id), [41]);
  assert.deepEqual(await listAssets({ role: 'manager', sub: '4' }, {}, dependencies([])), []);
});

test('o mesmo assetId é devolvido aos três perfis autorizados', async () => {
  for (const role of ['admin', 'manager', 'client']) {
    const item = await getAsset({ role, sub: '7' }, 41, dependencies([7]));
    assert.equal(item.id, 41);
    assert.equal(item.cliente_id, 7);
  }
});

test('alterar diretamente o assetId não expõe outra organização e IDs inexistentes devolvem 404', async () => {
  for (const role of ['manager', 'client']) {
    await assert.rejects(
      () => getAsset({ role, sub: '7' }, 42, dependencies([7])),
      (error) => error?.status === 403,
    );
  }
  await assert.rejects(
    () => getAsset({ role: 'admin', sub: '1' }, 999, dependencies([])),
    (error) => error?.status === 404,
  );
});
