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
    { path: '/', heading: 'Segurança Digital para um Mundo Conectado' },
    { path: '/servicos', heading: 'Proteção abrangente para cada ameaça.' },
    { path: '/contacto', heading: 'Estamos prontos para proteger a sua empresa.' },
  ]) {
    await page.goto(target.path);
    await expect(page.getByRole('heading', { name: target.heading })).toBeVisible();
    await expect(page.getByText('Links Rápidos')).toBeVisible();
  }
});
