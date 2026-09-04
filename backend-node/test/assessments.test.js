import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { app as application } from '../src/app.js';
import { createAssessmentsControllers } from '../src/controllers/assessments.controller.js';
import { errorHandler, httpError, notFound } from '../src/middleware/errors.js';
import { createAssessmentsRouter } from '../src/routes/assessments.routes.js';
import { sanitiseAuditDetails } from '../src/services/audit-log.service.js';
import { RISK_ASSESSMENT_SCORE_VALIDATION } from '../src/models/index.js';
import {
  assessmentClientId,
  createConformityStatusReader,
  createRiskAssessmentCreator,
  createRiskAssessmentReader,
  normaliseAssessmentPayload,
} from '../src/services/assessments.service.js';

const validPayload = Object.freeze({
  cliente_id: 4,
  estado_conformidade_id: 2,
  data_avaliacao: '2026-09-02',
  nivel_risco: 'MEDIO',
  pontuacao: 7.25,
  resumo: ' Avaliação interna concluída. ',
  recomendacoes: ' Rever os controlos de acesso. ',
});

function plain(value) {
  return { get: () => value };
}

test('o payload NIS2 aceita apenas campos e valores estritos', () => {
  assert.deepEqual(normaliseAssessmentPayload(validPayload), {
    ...validPayload, resumo: 'Avaliação interna concluída.', recomendacoes: 'Rever os controlos de acesso.',
  });
  for (const score of [0, 10, 4.5, 7.25]) {
    assert.equal(normaliseAssessmentPayload({ ...validPayload, pontuacao: score }).pontuacao, score);
  }
  for (const score of ['7.25', Number.NaN, Number.POSITIVE_INFINITY, -0.01, 10.01, 1.234]) {
    assert.throws(() => normaliseAssessmentPayload({ ...validPayload, pontuacao: score }), (error) => error?.status === 400);
  }
  for (const id of [0, -1, 1.1, '4', Number.NaN]) {
    assert.throws(() => normaliseAssessmentPayload({ ...validPayload, cliente_id: id }), (error) => error?.status === 400);
  }
  for (const date of ['2026-02-30', '02/09/2026', '2026-9-2', '', null]) {
    assert.throws(() => normaliseAssessmentPayload({ ...validPayload, data_avaliacao: date }), (error) => error?.status === 400);
  }
  for (const level of ['medio', 'EXTREMO', '', null]) {
    assert.throws(() => normaliseAssessmentPayload({ ...validPayload, nivel_risco: level }), (error) => error?.status === 400);
  }
  for (const summary of ['', '   ', null, 'x'.repeat(4001)]) {
    assert.throws(() => normaliseAssessmentPayload({ ...validPayload, resumo: summary }), (error) => error?.status === 400);
  }
  assert.throws(() => normaliseAssessmentPayload({ ...validPayload, criado_por: 999 }), (error) => error?.status === 400);
  assert.throws(() => normaliseAssessmentPayload({ ...validPayload, criado_em: '2026-01-01' }), (error) => error?.status === 400);
});

test('modelo e migrations alinham a pontuação NIS2 entre 0 e 10', async () => {
  assert.deepEqual(RISK_ASSESSMENT_SCORE_VALIDATION, { min: 0, max: 10 });

  const up = await readFile(new URL('../migrations/20260904_align_risk_assessment_score_constraint.up.sql', import.meta.url), 'utf8');
  const down = await readFile(new URL('../migrations/20260904_align_risk_assessment_score_constraint.down.sql', import.meta.url), 'utf8');
  assert.match(up, /pontuacao >= 0 AND pontuacao <= 10/);
  assert.match(down, /pontuacao >= 0 AND pontuacao <= 100/);
  assert.doesNotMatch(up, /\b(?:INSERT|UPDATE|DELETE)\b/i);
});

test('o filtro de cliente do GET é lexical e não aceita IDs ambíguos', () => {
  assert.equal(assessmentClientId(undefined), undefined);
  assert.equal(assessmentClientId('42'), 42);
  for (const id of ['0', '-1', '1.0', '01', '1e2', ' 1', '1 ', 'texto']) {
    assert.throws(() => assessmentClientId(id), (error) => error?.status === 400);
  }
});

test('a criação é transacional, atribui o autor no servidor e audita apenas metadados seguros', async () => {
  const calls = { created: [], audit: [], access: [] };
  const transaction = { id: 'test-transaction' };
  const create = createRiskAssessmentCreator(() => ({
    sequelize: { transaction: async (callback) => callback(transaction) },
    Client: { findOne: async () => ({ id: 4, nome: 'Organização de teste' }) },
    ConformityStatus: { findByPk: async () => ({ id: 2, codigo: 'EM_REVISAO', nome: 'Em revisão' }) },
    RiskAssessment: {
      create: async (payload, options) => {
        calls.created.push({ payload, options });
        return plain({ id: 33, ...payload });
      },
    },
  }), {
    assertAccess: async (auth, clientId) => { calls.access.push({ auth, clientId }); },
    auditWriter: async (entry, receivedTransaction) => { calls.audit.push({ entry, receivedTransaction }); },
  });
  const result = await create({ role: 'manager', sub: '19' }, validPayload);
  assert.equal(calls.created[0].payload.criado_por, 19);
  assert.equal(calls.created[0].options.transaction, transaction);
  assert.deepEqual(calls.audit[0], {
    entry: {
      userId: 19, action: 'CRIAR', entity: 'avaliacoes_risco', entityId: 33,
      details: { cliente_id: 4, estado_conformidade_id: 2, nivel_risco: 'MEDIO', pontuacao: 7.25 },
    },
    receivedTransaction: transaction,
  });
  assert.equal(JSON.stringify(calls.audit).includes('Avaliação interna'), false);
  assert.deepEqual(sanitiseAuditDetails(calls.audit[0].entry.details), calls.audit[0].entry.details);
  assert.deepEqual(calls.access, [{ auth: { role: 'manager', sub: '19' }, clientId: 4 }]);
  assert.deepEqual({ ...result, criado_em: null }, {
    id: 33, cliente_id: 4, cliente_nome: 'Organização de teste', estado_conformidade_id: 2,
    estado_conformidade_codigo: 'EM_REVISAO', estado_conformidade_nome: 'Em revisão',
    data_avaliacao: '2026-09-02', nivel_risco: 'MEDIO', pontuacao: 7.25, score: 7.25,
    resumo: 'Avaliação interna concluída.', recomendacoes: 'Rever os controlos de acesso.', criado_em: null,
  });
  assert.match(result.criado_em, /^\d{4}-\d{2}-\d{2}T/);
});

test('a criação recusa organização inexistente/inativa, estado inexistente e Gestor não associado', async () => {
  const models = (client, status) => () => ({
    sequelize: { transaction: async (callback) => callback({}) },
    Client: { findOne: async () => client },
    ConformityStatus: { findByPk: async () => status },
    RiskAssessment: { create: async () => plain({}) },
  });
  await assert.rejects(createRiskAssessmentCreator(models(null, { id: 2 }))({ role: 'admin', sub: '1' }, validPayload), (error) => error?.status === 404);
  await assert.rejects(createRiskAssessmentCreator(models({ id: 4 }, null))({ role: 'admin', sub: '1' }, validPayload), (error) => error?.status === 400);
  const unrelated = createRiskAssessmentCreator(models({ id: 4 }, { id: 2 }), {
    assertAccess: async () => { throw httpError(403, 'Sem permissão para consultar este cliente.'); },
  });
  await assert.rejects(unrelated({ role: 'manager', sub: '5' }, validPayload), (error) => error?.status === 403);
});

test('a listagem preserva acesso por associação e os estados usam a ordenação configurada', async () => {
  const calls = [];
  const reader = createRiskAssessmentReader(() => ({
    RiskAssessment: {
      async findAll(options) {
        calls.push(options);
        return [plain({
          id: 8, cliente_id: 4, estado_conformidade_id: 2, data_avaliacao: '2026-09-02',
          nivel_risco: 'BAIXO', pontuacao: '5.5', resumo: 'ok', cliente: { nome: 'Cliente' },
          estadoConformidade: { codigo: 'CONFORME', nome: 'Conforme' },
        })];
      },
    },
    ConformityStatus: {},
    Client: {},
  }), { idsForUser: async () => ['4'] });
  const listed = await reader({ role: 'manager', sub: '3' });
  assert.deepEqual(calls[0].where, { cliente_id: ['4'] });
  assert.deepEqual(calls[0].order, [['data_avaliacao', 'DESC'], ['id', 'DESC']]);
  assert.equal(listed[0].score, 5.5);
  const statuses = await createConformityStatusReader(() => ({
    ConformityStatus: { findAll: async (options) => { calls.push(options); return [plain({ id: 2, codigo: 'CONFORME', nome: 'Conforme' })]; } },
  }))();
  assert.deepEqual(statuses, [{ id: 2, codigo: 'CONFORME', nome: 'Conforme' }]);
  assert.deepEqual(calls[1].order, [['ordem', 'ASC'], ['id', 'ASC']]);
});

function createTestApp() {
  const controllers = createAssessmentsControllers({
    listAssessments: async () => [],
    listStatuses: async () => [{ id: 2, codigo: 'EM_REVISAO', nome: 'Em revisão' }],
    createAssessment: async (_auth, payload) => ({ id: 44, ...normaliseAssessmentPayload(payload), cliente_nome: 'Cliente de teste', estado_conformidade_codigo: 'EM_REVISAO', estado_conformidade_nome: 'Em revisão', score: payload.pontuacao, criado_em: '2026-09-02T12:00:00.000Z' }),
  });
  const instance = express();
  instance.use(express.json());
  const router = createAssessmentsRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role, sub: '7' };
      return next();
    },
    handlers: controllers,
  });
  instance.locals.assessmentRouter = router;
  instance.use('/api/avaliacoes', router);
  instance.use(notFound);
  instance.use(errorHandler);
  return instance;
}

async function withServer(instance, callback) {
  const server = await new Promise((resolve) => {
    const created = instance.listen(0, '127.0.0.1', () => resolve(created));
  });
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

async function requestJson(baseUrl, path, { method = 'GET', role, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(role ? { 'x-test-role': role } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

test('o router HTTP NIS2 usa a app Express, mantém GET e protege a criação', async () => {
  const instance = createTestApp();
  assert.deepEqual(instance.locals.assessmentRouter.stack.filter((layer) => layer.route).map((layer) => layer.route.path), ['/estados', '/', '/']);
  await withServer(instance, async (baseUrl) => {
    assert.equal((await requestJson(baseUrl, '/api/avaliacoes')).status, 401);
    assert.equal((await requestJson(baseUrl, '/api/avaliacoes/estados', { role: 'client' })).status, 200);
    assert.equal((await requestJson(baseUrl, '/api/avaliacoes', { role: 'client' })).status, 200);
    for (const role of ['client', undefined]) {
      assert.equal((await requestJson(baseUrl, '/api/avaliacoes', { method: 'POST', role, body: validPayload })).status, role ? 403 : 401);
    }
    for (const role of ['admin', 'manager']) {
      const created = await requestJson(baseUrl, '/api/avaliacoes', { method: 'POST', role, body: validPayload });
      assert.equal(created.status, 201);
      assert.equal(created.body.cliente_nome, 'Cliente de teste');
      assert.equal(JSON.stringify(created.body).includes('password'), false);
    }
    assert.equal((await requestJson(baseUrl, '/api/avaliacoes', { method: 'POST', role: 'admin', body: { ...validPayload, cliente_id: '4' } })).status, 400);
    assert.equal((await requestJson(baseUrl, '/api/rota-inexistente', { role: 'admin' })).status, 404);
  });
});

test('a aplicação Express real monta as avaliações antes do notFound e exige sessão', async () => {
  await withServer(application, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/avaliacoes`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/avaliacoes/estados`)).status, 401);
  });
});
