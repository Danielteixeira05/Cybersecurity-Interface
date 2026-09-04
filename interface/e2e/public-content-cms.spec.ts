import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('Admin edita o Hero canónico e a Homepage reflete a API pública', async ({ page }) => {
  let hero = {
    id: 801,
    chave: 'homepage.hero',
    titulo: 'Hero antes da edição',
    subtitulo: 'Etiqueta institucional',
    corpo: 'Descrição institucional.',
    imagem_url: null,
    ativo: true,
    ordem: 0,
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/\/$/, '');
    if (pathname === '/api/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        autenticado: true,
        utilizador: { id: 71, nome: 'Administrador CMS', email: 'admin-cms@example.test', perfil_codigo: 'ADMINISTRADOR', ativo: true },
        cliente: null,
      }) });
      return;
    }
    if (pathname === '/api/csrf') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrf_token: 'cms-e2e-csrf' }) });
      return;
    }
    if (pathname === '/api/admin/conteudos' && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        hero,
        { ...hero, id: 999, chave: 'bloco_antigo', titulo: 'Legado oculto' },
      ]) });
      return;
    }
    if (pathname === `/api/admin/conteudos/${hero.id}` && request.method() === 'PATCH') {
      hero = { ...hero, ...(request.postDataJSON() as Partial<typeof hero>) };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(hero) });
      return;
    }
    if (pathname === '/api/public/conteudos') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([hero]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/administrador/conteudo');
  const heroTitle = page.getByText('Hero antes da edição');
  await expect(heroTitle).toBeVisible();
  await expect(page.getByText('Legado oculto')).toHaveCount(0);
  await heroTitle.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').getByRole('button', { name: 'Editar' }).click();
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill('Hero atualizado pela API local');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toContainText('Conteúdo guardado com sucesso.');

  await page.locator('aside').getByRole('link', { name: /CiberBoxSecur/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Hero atualizado pela API local' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Serviços de Cibersegurança Completos' })).toBeVisible();
  await expect(page.getByText('Links Rápidos')).toBeVisible();
});

test('Admin cria, atualiza e recarrega os quatro blocos institucionais da Homepage', async ({ page }) => {
  const presets = [
    { key: 'homepage_identidade_cabecalho', label: 'Cabeçalho da identidade', created: 'Identidade criada pela API E2E', revised: 'Identidade revista pela API E2E' },
    { key: 'homepage_missao', label: 'Missão', created: 'Missão criada pela API E2E', revised: 'Missão revista pela API E2E' },
    { key: 'homepage_visao', label: 'Visão', created: 'Visão criada pela API E2E', revised: 'Visão revista pela API E2E' },
    { key: 'homepage_valores', label: 'Valores', created: 'Valores criados pela API E2E', revised: 'Valores revistos pela API E2E' },
  ] as const;
  type IdentityContent = {
    id: number;
    chave: string;
    titulo: string;
    subtitulo: string | null;
    corpo: string | null;
    imagem_url: string | null;
    ativo: boolean;
    ordem: number;
  };
  let contents: IdentityContent[] = [];
  let nextId = 820;
  const postKeys: string[] = [];
  const patchKeys: string[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/\/$/, '');
    if (pathname === '/api/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        autenticado: true,
        utilizador: { id: 72, nome: 'Administrador Identidade', email: 'admin-identidade@example.test', perfil_codigo: 'ADMINISTRADOR', ativo: true },
        cliente: null,
      }) });
      return;
    }
    if (pathname === '/api/csrf') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrf_token: 'identity-e2e-csrf' }) });
      return;
    }
    if (pathname === '/api/admin/conteudos' && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contents) });
      return;
    }
    if (pathname === '/api/admin/conteudos' && request.method() === 'POST') {
      const payload = request.postDataJSON() as Omit<IdentityContent, 'id'>;
      postKeys.push(payload.chave);
      const created = { ...payload, id: nextId++ };
      contents = [...contents, created];
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    const contentMatch = pathname.match(/^\/api\/admin\/conteudos\/(\d+)$/);
    if (contentMatch && request.method() === 'PATCH') {
      const id = Number(contentMatch[1]);
      const payload = request.postDataJSON() as Partial<IdentityContent>;
      const current = contents.find((item) => item.id === id);
      if (!current) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ erro: 'Conteúdo não encontrado.' }) });
        return;
      }
      patchKeys.push(current.chave);
      const updated = { ...current, ...payload, id, chave: current.chave };
      contents = contents.map((item) => item.id === id ? updated : item);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      return;
    }
    if (pathname === '/api/public/conteudos') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contents.filter((item) => item.ativo)) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/administrador/conteudo');
  for (const preset of presets) {
    const card = page.getByText(preset.label, { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
    await expect(card.getByText('Predefinição')).toBeVisible();
    await card.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(preset.created);
    const bodyLabel = preset.key === 'homepage_identidade_cabecalho' ? 'Introdução' : 'Descrição';
    await page.getByRole('textbox', { name: bodyLabel }).fill(`Descrição criada para ${preset.label}.`);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Conteúdo guardado com sucesso.')).toBeVisible();
  }
  expect(postKeys).toEqual(presets.map((preset) => preset.key));

  await page.reload();
  for (const preset of presets) await expect(page.getByText(preset.created)).toBeVisible();

  for (const preset of presets) {
    const card = page.getByText(preset.created).locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
    await card.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(preset.revised);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Conteúdo guardado com sucesso.')).toBeVisible();
  }
  expect(patchKeys).toEqual(presets.map((preset) => preset.key));

  await page.reload();
  for (const preset of presets) await expect(page.getByText(preset.revised)).toBeVisible();

  const cmsNavigation = page.getByRole('navigation', { name: 'Páginas públicas editáveis' });
  await cmsNavigation.getByRole('button', { name: 'Serviços' }).click();
  await expect(page.getByRole('heading', { name: 'Conteúdos da página Serviços' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(26);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Identidade revista pela API E2E' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Missão revista pela API E2E' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Visão revista pela API E2E' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Valores revistos pela API E2E' })).toBeVisible();
  await expect(page.locator('.home-identity-card')).toHaveCount(3);
  await expect(page.locator('.home-service-card')).toHaveCount(6);
  const aboutLink = page.getByRole('link', { name: 'Sobre Nós' });
  await expect(aboutLink).toHaveAttribute('href', '/#quem-somos');
  await aboutLink.click();
  await expect(page).toHaveURL(/\/#quem-somos$/);
  await expect(page.locator('#quem-somos')).toBeInViewport();
});

test('design público original permanece completo sem CMS em desktop e mobile', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (pathname === '/api/me') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ erro: 'Autenticação necessária.' }) });
      return;
    }
    if (pathname === '/api/public/conteudos' || pathname === '/api/public/noticias') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ erro: 'Rota não encontrada.' }) });
  });

  const screenshotDir = path.resolve('test-results', 'cms-visual');
  await mkdir(screenshotDir, { recursive: true });
  const pages = [
    {
      path: '/',
      name: 'homepage',
      heading: 'Segurança Digital para um Mundo Conectado',
      verify: async () => {
        await expect(page.getByRole('heading', { name: 'A nossa identidade' })).toBeVisible();
        await expect(page.locator('.home-identity-card')).toHaveCount(3);
        await expect(page.locator('.home-service-card')).toHaveCount(6);
      },
    },
    {
      path: '/servicos',
      name: 'servicos',
      heading: 'Proteção abrangente para cada ameaça.',
      verify: async () => {
        await expect(page.locator('.service-detail-card')).toHaveCount(6);
        await expect(page.locator('.service-proof-card')).toHaveCount(4);
        await expect(page.locator('.service-process-step')).toHaveCount(4);
        await expect(page.locator('.nis2-requirement-card')).toHaveCount(6);
      },
    },
    {
      path: '/contacto',
      name: 'contacto',
      heading: 'Estamos prontos para proteger a sua empresa.',
      verify: async () => {
        await expect(page.getByRole('heading', { name: 'Envie-nos uma mensagem' })).toBeVisible();
        await expect(page.locator('.contact-v97__channel')).toHaveCount(4);
      },
    },
  ] as const;

  for (const viewport of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'mobile', width: 390, height: 844 },
  ] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const target of pages) {
      await page.goto(target.path);
      await expect(page.getByRole('heading', { name: target.heading })).toBeVisible();
      await target.verify();
      await expect(page.getByText('Links Rápidos')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
      await page.screenshot({
        path: path.join(screenshotDir, `${target.name}-${viewport.label}.png`),
        fullPage: true,
      });
    }
  }
});

test('falha do CMS não substitui a página pública nem o footer', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (pathname === '/api/me') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ erro: 'Autenticação necessária.' }) });
      return;
    }
    if (pathname === '/api/public/conteudos') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ erro: 'Falha controlada.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  for (const target of [
    { path: '/', heading: 'Segurança Digital para um Mundo Conectado', identity: true },
    { path: '/servicos', heading: 'Proteção abrangente para cada ameaça.', identity: false },
    { path: '/contacto', heading: 'Estamos prontos para proteger a sua empresa.', identity: false },
  ]) {
    await page.goto(target.path);
    await expect(page.getByRole('heading', { name: target.heading })).toBeVisible();
    if (target.identity) {
      await expect(page.getByRole('heading', { name: 'A nossa identidade' })).toBeVisible();
      await expect(page.locator('.home-identity-card')).toHaveCount(3);
    }
    await expect(page.getByText('Links Rápidos')).toBeVisible();
  }
});
