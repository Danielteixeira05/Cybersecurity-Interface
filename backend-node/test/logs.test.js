import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { app as application } from '../src/app.js';
import { createListActivityLogsController } from '../src/controllers/logs.controller.js';
import { errorHandler, httpError, notFound } from '../src/middleware/errors.js';
import { createLogsRouter } from '../src/routes/logs.routes.js';
import { sanitiseAuditDetails } from '../src/services/audit-log.service.js';
import {
  createActivityLogReader,
  DEFAULT_ACTIVITY_LOG_LIMIT,
  MAX_ACTIVITY_LOG_LIMIT,
  normaliseActivityLogPagination,
} from '../src/services/logs.service.js';

function row(value) {
  return { get: () => value };
}

function createReader({ count = 0, rows = [] } = {}) {
  const calls = [];
  const reader = createActivityLogReader(() => ({
    User: {},
    ActivityLog: {
      async findAndCountAll(options) {
        calls.push(options);
        return { count, rows };
      },
    },
  }));
  return { reader, calls };
}

test('os logs administrativos são paginados, ordenados e devolvem apenas os campos permitidos', async () => {
  const { reader, calls } = createReader({
    count: 3,
    rows: [row({
      id: 30,
      utilizador_id: 7,
      utilizador: { id: 7, nome: 'Administrador Real', email: 'admin@example.test', password_hash: 'nunca' },
      acao: 'ATUALIZAR_DOCUMENTO',
      entidade: 'documentos',
      entidade_id: 14,
      detalhes: {
        documento_id: 14,
        estado: 'EM_REVISAO',
        destinatarios: [1, 2],
        token_inesperado: 'nunca',
        contexto: { authorization: 'nunca' },
      },
      criado_em: new Date('2026-09-02T10:00:00.000Z'),
      endereco_ip: '127.0.0.1',
    }), row({
      id: 29,
      utilizador_id: null,
      utilizador: null,
      acao: 'DESATIVAR',
      entidade: 'utilizadores',
      entidade_id: 8,
      detalhes: {},
      criado_em: '2026-09-02T09:00:00.000Z',
    })],
  });

  const result = await reader({ limit: '50', offset: '0' });
  assert.deepEqual(calls[0].attributes, ['id', 'utilizador_id', 'acao', 'entidade', 'entidade_id', 'detalhes', 'criado_em']);
  assert.deepEqual(calls[0].order, [['criado_em', 'DESC'], ['id', 'DESC']]);
  assert.equal(calls[0].limit, 50);
  assert.equal(calls[0].offset, 0);
  assert.deepEqual(calls[0].include, [{ model: {}, as: 'utilizador', attributes: ['id', 'nome', 'email'], required: false }]);
  assert.deepEqual(result, {
    items: [{
      id: 30,
      utilizador: { id: 7, nome: 'Administrador Real', email: 'admin@example.test' },
      acao: 'ATUALIZAR_DOCUMENTO',
      entidade: 'documentos',
      entidade_id: 14,
      detalhes: { documento_id: 14, estado: 'EM_REVISAO', destinatarios: [1, 2] },
      criado_em: '2026-09-02T10:00:00.000Z',
    }, {
      id: 29,
      utilizador: null,
      acao: 'DESATIVAR',
      entidade: 'utilizadores',
      entidade_id: 8,
      detalhes: {},
      criado_em: '2026-09-02T09:00:00.000Z',
    }],
    pagination: { limit: 50, offset: 0, total: 3, has_more: true, next_offset: 2 },
  });
  assert.equal(JSON.stringify(result).includes('nunca'), false);
  assert.equal(JSON.stringify(result).includes('127.0.0.1'), false);
});

test('a paginação tem defaults, limita 100 e rejeita formatos lexicais inválidos', () => {
  assert.deepEqual(normaliseActivityLogPagination({}), { limit: DEFAULT_ACTIVITY_LOG_LIMIT, offset: 0 });
  assert.deepEqual(normaliseActivityLogPagination({ limit: '1000', offset: '4' }), { limit: MAX_ACTIVITY_LOG_LIMIT, offset: 4 });
  for (const value of ['0', '-1', '1.0', '01', '1e2', ' 1', '1 ', 'texto']) {
    assert.throws(() => normaliseActivityLogPagination({ limit: value }), (error) => error?.status === 400);
  }
  for (const value of ['-1', '1.0', '01', '1e2', ' 0', '0 ', 'texto']) {
    assert.throws(() => normaliseActivityLogPagination({ offset: value }), (error) => error?.status === 400);
  }
});

test('a paginação representa primeira, última, vazia e fora do intervalo sem ciclos', async () => {
  const first = createReader({ count: 51, rows: [row({ id: 51, utilizador: null, acao: 'A', entidade: 'x', entidade_id: null, detalhes: {}, criado_em: new Date() })] });
  assert.deepEqual((await first.reader({ limit: '50', offset: '0' })).pagination, {
    limit: 50, offset: 0, total: 51, has_more: true, next_offset: 1,
  });

  const last = createReader({ count: 52, rows: [row({ id: 2, utilizador: null, acao: 'A', entidade: 'x', entidade_id: null, detalhes: {}, criado_em: new Date() }), row({ id: 1, utilizador: null, acao: 'A', entidade: 'x', entidade_id: null, detalhes: {}, criado_em: new Date() })] });
  assert.deepEqual((await last.reader({ limit: '50', offset: '50' })).pagination, {
    limit: 50, offset: 50, total: 52, has_more: false, next_offset: null,
  });

  const empty = createReader();
  assert.deepEqual((await empty.reader({ limit: '50', offset: '0' })).pagination, {
    limit: 50, offset: 0, total: 0, has_more: false, next_offset: null,
  });

  const removedBetweenPages = createReader({ count: 3, rows: [] });
  assert.deepEqual((await removedBetweenPages.reader({ limit: '50', offset: '50' })).pagination, {
    limit: 50, offset: 50, total: 3, has_more: false, next_offset: null,
  });
});

test('a sanitização limita a cardinalidade, trunca arrays e não altera a origem', () => {
  const source = {
    clientes_ids: Array.from({ length: 60 }, (_, index) => index + 1),
    campos: Array.from({ length: 60 }, (_, index) => ['ativo', 'clientes_ids', 'email', 'nif', 'nome', 'telefone'][index % 6]),
    tamanho_bytes: Number.POSITIVE_INFINITY,
    ativo: true,
    atribuido_a: 'gestor', categoria: 'POLITICA', chave: 'segura', cliente_id: 4, codigo: 'DOC-1',
    conversa_id: 2, criticidade: 'ALTA', documento_anterior_id: 1, documento_id: 3,
    estado: 'ATIVO', estado_anterior: 'RASCUNHO', estado_novo: 'ATIVO', gravidade: 'MEDIA',
    incidente_id: 8, linhas_importadas: 3, linhas_rejeitadas: 0, max_upload_mb: 12,
    notificado_nis2: false, perfil: 'COLABORADOR', prioridade: 'ALTA', publicada: true,
    tem_observacao: false, tipo: 'PDF', total_linhas: 3,
    objeto_aninhado: { token: 'não expor' },
    array_aninhado: [{ segredo: 'não expor' }],
    destinatarios: [1, { nested: true }],
  };
  Object.defineProperty(source, '__proto__', { value: 'não propagar', enumerable: true });
  Object.defineProperty(source, 'constructor', { value: 'não propagar', enumerable: true });
  Object.defineProperty(source, 'prototype', { value: 'não propagar', enumerable: true });
  const original = structuredClone(source);

  const result = sanitiseAuditDetails(source);
  assert.equal(Object.keys(result).length, 24);
  assert.equal(result.clientes_ids.length, 50);
  assert.equal(result.campos.length, 50);
  assert.equal('destinatarios' in result, false);
  assert.equal(Object.hasOwn(result, '__proto__'), false);
  assert.equal(Object.hasOwn(result, 'constructor'), false);
  assert.equal(Object.hasOwn(result, 'prototype'), false);
  assert.equal('tamanho_bytes' in result, false);
  assert.equal('objeto_aninhado' in result, false);
  assert.deepEqual(source, original);
});

function createLogsTestApp(logReader) {
  const app = express();
  const router = createLogsRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role };
      return next();
    },
    handlers: { list: createListActivityLogsController(logReader) },
  });
  app.locals.logsRouter = router;
  app.use('/api/logs', router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const created = app.listen(0, '127.0.0.1', () => resolve(created));
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function getJson(baseUrl, path, role) {
  const response = await fetch(`${baseUrl}${path}`, { headers: role ? { 'x-test-role': role } : undefined });
  return { status: response.status, body: await response.json() };
}

test('o router GET /api/logs é administrativo, alcançável antes do notFound e não expõe campos sensíveis', async () => {
  const { reader } = createReader({
    count: 1,
    rows: [row({
      id: 31,
      utilizador: { id: 2, nome: 'Gestor Real', email: 'gestor@example.test', token: 'não expor' },
      acao: 'CRIAR_INCIDENTE', entidade: 'incidentes', entidade_id: 20,
      detalhes: { incidente_id: 20, segredo_inesperado: 'não expor' }, criado_em: '2026-09-02T11:00:00.000Z',
    })],
  });
  const app = createLogsTestApp(reader);
  const paths = app.locals.logsRouter.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  assert.deepEqual(paths, ['/']);

  await withServer(app, async (baseUrl) => {
    const admin = await getJson(baseUrl, '/api/logs?limit=50&offset=0', 'admin');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.items[0].utilizador.nome, 'Gestor Real');
    assert.equal(JSON.stringify(admin.body).includes('não expor'), false);
    assert.equal((await getJson(baseUrl, '/api/logs', 'manager')).status, 403);
    assert.equal((await getJson(baseUrl, '/api/logs', 'client')).status, 403);
    assert.equal((await getJson(baseUrl, '/api/logs')).status, 401);
    assert.equal((await getJson(baseUrl, '/api/logs?limit=01', 'admin')).status, 400);
    assert.equal((await getJson(baseUrl, '/api/logs?offset=-1', 'admin')).status, 400);
  });
});

test('a aplicação Express real monta logs protegidos e mantém o notFound', async () => {
  await withServer(application, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/logs`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/rota-inexistente`)).status, 404);
  });
});
