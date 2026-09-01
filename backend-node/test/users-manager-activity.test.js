import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { activity, createActivityController } from '../src/controllers/users.controller.js';
import { requireRoles } from '../src/middleware/auth.js';
import { errorHandler, httpError } from '../src/middleware/errors.js';
import { createUsersRouter } from '../src/routes/users.routes.js';
import { createManagerActivityReader, normaliseManagerActivityLimit } from '../src/services/users.service.js';

function createReader({ user = { perfil: { codigo: 'COLABORADOR' } }, entries = [] } = {}) {
  const calls = { user: [], activity: [] };
  const reader = createManagerActivityReader(() => ({
    Profile: {},
    User: {
      async findByPk(...args) {
        calls.user.push(args);
        return user;
      },
    },
    ActivityLog: {
      async findAll(options) {
        calls.activity.push(options);
        return entries;
      },
    },
  }));
  return { reader, calls };
}

test('a atividade administrativa é filtrada pelo Gestor, ordenada e limitada', async () => {
  const { reader, calls } = createReader({
    entries: [{
      get: () => ({
        id: 20,
        acao: 'ATUALIZAR',
        entidade: 'incidentes',
        entidade_id: 91,
        detalhes: {
          cliente_id: 12,
          estado: 'ABERTO',
          destinatarios: [4, 9],
          campos: ['nome', 'ativo'],
          password: 'não expor',
          token: 'não expor',
          credencial_inesperada: 'não expor',
          diagnostico: { authorization: 'não expor' },
          clientes_ids: [12, { nested: true }],
        },
        criado_em: '2026-09-01T10:00:00.000Z',
        endereco_ip: '127.0.0.1',
      }),
    }],
  });

  const result = await reader(42, 99);

  assert.deepEqual(calls.activity[0].where, { utilizador_id: 42 });
  assert.deepEqual(calls.activity[0].order, [['criado_em', 'DESC'], ['id', 'DESC']]);
  assert.equal(calls.activity[0].limit, 50);
  assert.deepEqual(result, [{
    id: 20,
    acao: 'ATUALIZAR',
    entidade: 'incidentes',
    entidade_id: 91,
    detalhes: { cliente_id: 12, estado: 'ABERTO', destinatarios: [4, 9], campos: ['nome', 'ativo'] },
    criado_em: '2026-09-01T10:00:00.000Z',
  }]);
});

test('o leitor distingue Gestor inexistente de utilizador sem perfil de Gestor', async () => {
  const missing = createReader({ user: null });
  await assert.rejects(missing.reader(42), (error) => error?.status === 404);

  const client = createReader({ user: { perfil: { codigo: 'CLIENTE' } } });
  await assert.rejects(client.reader(42), (error) => error?.status === 422);
  assert.equal(client.calls.activity.length, 0);
});

test('o limite de atividade aceita apenas inteiros positivos e nunca ultrapassa 50', () => {
  assert.equal(normaliseManagerActivityLimit(), 20);
  assert.equal(normaliseManagerActivityLimit('3'), 3);
  assert.equal(normaliseManagerActivityLimit(1000), 50);
  assert.throws(() => normaliseManagerActivityLimit('abc'), (error) => error?.status === 400);
  assert.throws(() => normaliseManagerActivityLimit(0), (error) => error?.status === 400);
  for (const value of ['-1', '1.0', '01', '1e2', ' 1', '1 ']) {
    assert.throws(() => normaliseManagerActivityLimit(value), (error) => error?.status === 400);
  }
});

test('um identificador inválido devolve erro controlado antes de consultar a base de dados', async () => {
  let capturedError;
  await activity({ params: { userId: 'NaN' }, query: {} }, {}, (error) => { capturedError = error; });
  assert.equal(capturedError?.status, 400);
});

test('Cliente e Gestor são recusados pelo middleware administrativo', () => {
  for (const role of ['client', 'manager']) {
    let capturedError;
    requireRoles('admin')({ auth: { role } }, {}, (error) => { capturedError = error; });
    assert.equal(capturedError?.status, 403);
  }
});

test('a allowlist de detalhes remove campos desconhecidos, objetos, arrays aninhados e detalhes vazios', async () => {
  const { reader } = createReader({
    entries: [{
      get: () => ({
        id: 21,
        acao: 'ATUALIZAR',
        entidade: 'utilizadores',
        entidade_id: 42,
        detalhes: {
          perfil: 'COLABORADOR',
          clientes_ids: [1, 2],
          campos: ['email', 'telefone'],
          password_hash: 'não expor',
          segredo_com_nome_inesperado: 'não expor',
          cliente_id: { id: 1 },
          gestores_ids: [2, { token: 'não expor' }],
          objeto_aninhado: { cookie: 'não expor' },
          array_aninhado: [{ jwt: 'não expor' }],
        },
        criado_em: '2026-09-01T10:00:00.000Z',
      }),
    }, {
      get: () => ({
        id: 22,
        acao: 'CRIAR',
        entidade: 'clientes',
        entidade_id: 3,
        detalhes: {},
        criado_em: '2026-09-01T10:01:00.000Z',
      }),
    }],
  });

  const result = await reader(42, 2);
  assert.deepEqual(result[0].detalhes, {
    perfil: 'COLABORADOR', clientes_ids: [1, 2], campos: ['email', 'telefone'],
  });
  assert.deepEqual(result[1].detalhes, {});
  assert.equal(JSON.stringify(result).includes('não expor'), false);
});

function createRouterTestApp({ user = { perfil: { codigo: 'COLABORADOR' } }, entries = [] } = {}) {
  const { reader } = createReader({ user, entries });
  const app = express();
  const router = createUsersRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role };
      return next();
    },
    handlers: { activity: createActivityController(reader) },
  });
  app.locals.usersRouter = router;
  app.use('/api/users', router);
  app.use(errorHandler);
  return app;
}

async function withRouterTestServer(app, callback) {
  const server = await new Promise((resolve) => {
    const created = app.listen(0, '127.0.0.1', () => resolve(created));
  });
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function getJson(baseUrl, path, role) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: role ? { 'x-test-role': role } : undefined,
  });
  return { status: response.status, body: await response.json() };
}

test('o router HTTP administrativo resolve atividade, aplica permissões e não expõe detalhes sensíveis', async () => {
  const entries = [{
    get: () => ({
      id: 23,
      acao: 'ATUALIZAR',
      entidade: 'incidentes',
      entidade_id: 88,
      detalhes: { cliente_id: 6, estado: 'ABERTO', token: 'não expor', contexto_tecnico: { secret: 'não expor' } },
      criado_em: '2026-09-01T10:00:00.000Z',
    }),
  }];
  const app = createRouterTestApp({ entries });
  const paths = app.locals.usersRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.deepEqual(paths, ['/', '/:userId/activity', '/:userId']);

  await withRouterTestServer(app, async (baseUrl) => {
    const admin = await getJson(baseUrl, '/api/users/42/activity?limit=50', 'admin');
    assert.equal(admin.status, 200);
    assert.deepEqual(admin.body, {
      items: [{
        id: 23, acao: 'ATUALIZAR', entidade: 'incidentes', entidade_id: 88,
        detalhes: { cliente_id: 6, estado: 'ABERTO' }, criado_em: '2026-09-01T10:00:00.000Z',
      }],
    });
    assert.equal(JSON.stringify(admin.body).includes('não expor'), false);

    assert.equal((await getJson(baseUrl, '/api/users/42/activity', 'manager')).status, 403);
    assert.equal((await getJson(baseUrl, '/api/users/42/activity', 'client')).status, 403);
    assert.equal((await getJson(baseUrl, '/api/users/42/activity')).status, 401);

    for (const invalidId of ['0', '-1', '1.0', '01', '1e2', '%201', '1%20', 'texto']) {
      assert.equal((await getJson(baseUrl, `/api/users/${invalidId}/activity`, 'admin')).status, 400);
    }
    assert.equal((await getJson(baseUrl, '/api/users/01', 'admin')).status, 400);

    for (const validId of ['1', '2', '123']) {
      assert.equal((await getJson(baseUrl, `/api/users/${validId}/activity`, 'admin')).status, 200);
    }
  });

  await withRouterTestServer(createRouterTestApp({ user: null }), async (baseUrl) => {
    assert.equal((await getJson(baseUrl, '/api/users/42/activity', 'admin')).status, 404);
  });
  await withRouterTestServer(createRouterTestApp({ user: { perfil: { codigo: 'CLIENTE' } } }), async (baseUrl) => {
    assert.equal((await getJson(baseUrl, '/api/users/42/activity', 'admin')).status, 422);
  });
});
