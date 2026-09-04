import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { Op } from 'sequelize';
import { errorHandler, httpError, notFound } from '../src/middleware/errors.js';
import { createAdminCmsRouter, createPublicCmsRouter } from '../src/routes/cms.routes.js';
import {
  createContent,
  listPublicContents,
  SITE_CONTENT_DEFINITIONS,
  SITE_CONTENT_KEYS,
  validateSiteContentPayload,
} from '../src/services/cms.service.js';

const validHero = {
  chave: 'homepage.hero',
  titulo: 'Segurança digital para organizações exigentes',
  subtitulo: 'CiberBoxSecur',
  corpo: 'Proteção, conformidade e acompanhamento contínuo.',
  imagem_url: 'https://cdn.example.test/hero.webp',
  ativo: true,
  ordem: 0,
};

function row(value) {
  return { get: () => ({ ...value }) };
}

function createTestApp(router, mountPath) {
  const application = express();
  application.use(express.json());
  application.use(mountPath, router);
  application.use(notFound);
  application.use(errorHandler);
  return application;
}

async function withServer(application, callback) {
  const server = await new Promise((resolve) => {
    const created = application.listen(0, '127.0.0.1', () => resolve(created));
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('o contrato editorial aceita apenas chaves canónicas e conteúdo público seguro', () => {
  const payload = validateSiteContentPayload(validHero);
  assert.equal(payload.chave, 'homepage.hero');
  assert.equal(payload.imagem_url, 'https://cdn.example.test/hero.webp');
  assert.equal('dados' in payload, false);

  for (const chave of ['livre', 'homepage', ' contacto_canal_inventado ']) {
    assert.throws(
      () => validateSiteContentPayload({ ...validHero, chave }),
      (error) => error?.status === 400 && /inválido/.test(error.message),
    );
  }
  for (const imagem_url of [
    'http://cdn.example.test/hero.webp',
    'javascript:alert(1)',
    'https://user:password@cdn.example.test/hero.webp',
  ]) {
    assert.throws(() => validateSiteContentPayload({ ...validHero, imagem_url }), (error) => error?.status === 400);
  }
  assert.throws(
    () => validateSiteContentPayload({ ...validHero, corpo: '<img src=x onerror=alert(1)>' }),
    (error) => error?.status === 400,
  );
});

test('o contrato editorial expõe apenas blocos estáveis do design público', () => {
  const identityKeys = [
    'homepage_identidade_cabecalho',
    'homepage_missao',
    'homepage_visao',
    'homepage_valores',
  ];
  assert.equal(new Set(SITE_CONTENT_KEYS).size, SITE_CONTENT_KEYS.length);
  assert.equal(SITE_CONTENT_KEYS.includes('servico'), false);
  assert.equal(SITE_CONTENT_KEYS.includes('servicos_prova'), false);
  assert.equal(SITE_CONTENT_KEYS.includes('contacto_canal'), false);
  assert.ok(SITE_CONTENT_KEYS.includes('servicos.card.pentesting'));
  assert.ok(SITE_CONTENT_KEYS.includes('contacto.channel.morada'));
  for (const chave of identityKeys) {
    assert.ok(SITE_CONTENT_KEYS.includes(chave));
    assert.deepEqual(SITE_CONTENT_DEFINITIONS[chave], { page: 'homepage', repeatable: false });
    assert.equal(validateSiteContentPayload({ ...validHero, chave }).chave, chave);
  }
});

test('o Hero usa apenas colunas existentes e a chave não pode mudar durante uma edição', () => {
  const payload = validateSiteContentPayload({ ...validHero, dados: { campo_legado: 'ignorado' } });
  assert.equal('dados' in payload, false);
  assert.throws(
    () => validateSiteContentPayload({ chave: 'servicos.card.pentesting' }, validHero),
    (error) => error?.status === 400 && /não podem ser alterados/.test(error.message),
  );
});

test('a edição mantém a chave e valida desativação e reordenação', () => {
  const current = {
    chave: 'servicos.card.pentesting', titulo: 'Serviço inicial', subtitulo: null, corpo: null,
    imagem_url: null, ativo: true, ordem: 2,
  };
  const payload = validateSiteContentPayload({ titulo: 'Serviço revisto', ativo: false, ordem: 7 }, current);
  assert.equal(payload.chave, 'servicos.card.pentesting');
  assert.equal(payload.titulo, 'Serviço revisto');
  assert.equal(payload.ativo, false);
  assert.equal(payload.ordem, 7);
  assert.equal('dados' in payload, false);
  assert.throws(() => validateSiteContentPayload({ ordem: -1 }, current), (error) => error?.status === 400);
  assert.throws(() => validateSiteContentPayload({ ativo: 'false' }, current), (error) => error?.status === 400);
  assert.equal(
    validateSiteContentPayload({ corpo: 'Primeira linha\nSegunda linha' }, current).corpo,
    'Primeira linha\nSegunda linha',
  );
});

test('canais institucionais estáveis validam email e telefone sem aceitar chaves genéricas', () => {
  const base = { ativo: true, ordem: 0, subtitulo: '', imagem_url: '' };
  assert.equal(validateSiteContentPayload({ ...base, chave: 'contacto.channel.email', titulo: 'Email', corpo: 'equipa@example.test' }).corpo, 'equipa@example.test');
  assert.equal(validateSiteContentPayload({ ...base, chave: 'contacto.channel.telefone', titulo: 'Telefone', corpo: '+351 210 000 000' }).corpo, '+351 210 000 000');
  assert.equal(validateSiteContentPayload({ ...base, chave: 'contacto.channel.website', titulo: 'Website', corpo: 'www.example.test' }).corpo, 'www.example.test');
  assert.throws(() => validateSiteContentPayload({ ...base, chave: 'contacto.channel.email', titulo: 'Email', corpo: 'email-invalido' }), (error) => error?.status === 400);
  assert.throws(() => validateSiteContentPayload({ ...base, chave: 'contacto.channel.telefone', titulo: 'Telefone', corpo: 'ligue-nos' }), (error) => error?.status === 400);
  assert.throws(() => validateSiteContentPayload({ ...base, chave: 'contacto_canal', titulo: 'Email', corpo: 'equipa@example.test' }), (error) => error?.status === 400);
});

test('a listagem pública pede apenas conteúdo ativo e canónico, em ordem determinística', async () => {
  let options;
  const models = {
    User: {},
    SiteContent: {
      async findAll(value) {
        options = value;
        return [
          row({ id: 4, chave: 'servicos.card.pentesting', titulo: 'Serviço A', ativo: true, ordem: 1 }),
          row({ id: 9, chave: 'servicos.card.siem', titulo: 'Serviço B', ativo: true, ordem: 1 }),
        ];
      },
    },
  };

  const result = await listPublicContents(undefined, models);
  assert.equal(options.where.ativo, true);
  assert.deepEqual(options.where.chave[Op.in], SITE_CONTENT_KEYS);
  assert.deepEqual(options.order, [['ordem', 'ASC'], ['id', 'ASC']]);
  assert.deepEqual(result.map((item) => item.id), [4, 9]);
  assert.equal('atualizado_por' in result[0], false);
  assert.equal('atualizado_por_nome' in result[0], false);
});

test('o filtro público valida a chave e continua a exigir estado ativo', async () => {
  let options;
  const models = {
    User: {},
    SiteContent: { async findAll(value) { options = value; return []; } },
  };
  await listPublicContents('contacto.channel.email', models);
  assert.deepEqual(options.where, { ativo: true, chave: 'contacto.channel.email' });
  await assert.rejects(() => listPublicContents('bloco_legacy', models), (error) => error?.status === 400);
});

test('a criação impede um segundo Hero antes de escrever ou registar auditoria', async () => {
  let createCalls = 0;
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const models = {
    sequelize: { async transaction(callback) { return callback(transaction); } },
    SiteContent: {
      async findOne(options) {
        assert.deepEqual(options.where, { chave: 'homepage.hero' });
        assert.equal(options.transaction, transaction);
        assert.equal(options.lock, 'UPDATE');
        return row({ id: 1, ...validHero });
      },
      async create() { createCalls += 1; },
    },
  };
  await assert.rejects(() => createContent(validHero, 7, models), (error) => error?.status === 409);
  assert.equal(createCalls, 0);
});

test('o router administrativo aplica autenticação e perfil sem expor métodos de eliminação', async () => {
  const router = createAdminCmsRouter({
    authenticateMiddleware(request, _response, next) {
      const role = request.get('x-test-role');
      if (!role) return next(httpError(401, 'Autenticação necessária.'));
      request.auth = { role, sub: '7' };
      return next();
    },
    handlers: {
      adminContents(_request, response) { return response.json([{ id: 1, chave: 'homepage.hero' }]); },
    },
  });
  const application = createTestApp(router, '/api/admin');
  await withServer(application, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/admin/conteudos/`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/admin/conteudos/`, { headers: { 'x-test-role': 'manager' } })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/admin/conteudos/`, { headers: { 'x-test-role': 'client' } })).status, 403);
    const admin = await fetch(`${baseUrl}/api/admin/conteudos/`, { headers: { 'x-test-role': 'admin' } });
    assert.equal(admin.status, 200);
    assert.equal((await admin.json())[0].chave, 'homepage.hero');
    assert.equal((await fetch(`${baseUrl}/api/admin/conteudos/1/`, {
      method: 'DELETE', headers: { 'x-test-role': 'admin' },
    })).status, 404);
  });
});

test('o router público mantém separados conteúdo, notícias e formulário de contacto', async () => {
  const calls = [];
  const router = createPublicCmsRouter({ handlers: {
    publicContents(_request, response) { calls.push('contents'); return response.json([]); },
    publicNews(_request, response) { calls.push('news'); return response.json([]); },
    publicContact(_request, response) { calls.push('contact'); return response.status(201).json({ id: 8 }); },
  } });
  const application = createTestApp(router, '/api/public');
  await withServer(application, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/public/conteudos/`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/public/noticias/`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/public/contacto/`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
    })).status, 201);
  });
  assert.deepEqual(calls, ['contents', 'news', 'contact']);
});
