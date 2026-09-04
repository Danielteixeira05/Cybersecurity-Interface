import { expect, test, type Page } from '@playwright/test';

type Profile = {
  name: string;
  path: string;
  perfil: 'ADMINISTRADOR' | 'COLABORADOR' | 'CLIENTE';
  activeItem: string;
};

const profiles: Profile[] = [
  {
    name: 'Administrador',
    path: '/administrador/utilizadores',
    perfil: 'ADMINISTRADOR',
    activeItem: 'Utilizadores',
  },
  {
    name: 'Gestor',
    path: '/gestor/clientes',
    perfil: 'COLABORADOR',
    activeItem: 'Clientes',
  },
  {
    name: 'Cliente',
    path: '/cliente/incidentes',
    perfil: 'CLIENTE',
    activeItem: 'Incidentes',
  },
];

async function mockAuthenticatedSession(page: Page, profile: Profile) {
  const user = {
    id: profile.perfil === 'ADMINISTRADOR' ? 101 : profile.perfil === 'COLABORADOR' ? 102 : 103,
    nome: `${profile.name} E2E`,
    email: `${profile.name.toLowerCase()}@example.test`,
    perfil_codigo: profile.perfil,
    ativo: true,
  };
  const client = {
    id: 201,
    nome: 'Organização E2E',
    nif: '509999900',
    ativo: true,
  };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname === '/api/me' || pathname === '/api/me/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autenticado: true,
          utilizador: user,
          cliente: profile.perfil === 'CLIENTE' ? client : null,
        }),
      });
      return;
    }
    if (pathname === '/api/csrf' || pathname === '/api/csrf/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ csrf_token: 'sidebar-e2e-csrf' }),
      });
      return;
    }
    if (pathname === '/api/documents/config') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ max_upload_mb: 10, categories: [], states: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function sidebarRect(page: Page) {
  return page.locator('aside').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      position: getComputedStyle(element).position,
    };
  });
}

for (const profile of profiles) {
  test(`${profile.name}: sidebar permanece ancorada e o conteúdo continua acessível`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 650 });
    await mockAuthenticatedSession(page, profile);
    await page.goto(profile.path);

    await expect(page).toHaveURL(new RegExp(`${profile.path.replaceAll('/', '\\/')}$`));
    const sidebar = page.locator('aside');
    const main = page.locator('main');
    await expect(sidebar.getByText(`${profile.name} E2E`, { exact: true })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: profile.activeItem, exact: true })).toBeVisible();
    await expect(main).toBeVisible();

    await main.evaluate((element) => {
      const spacer = document.createElement('section');
      spacer.dataset.testid = 'long-page-spacer';
      spacer.style.height = '2200px';
      const marker = document.createElement('p');
      marker.dataset.testid = 'long-page-end';
      marker.textContent = 'Fim do conteúdo E2E';
      spacer.append(marker);
      element.append(spacer);
    });

    const before = await sidebarRect(page);
    expect(before.position).toBe('fixed');
    expect(Math.abs(before.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(before.left)).toBeLessThanOrEqual(1);
    expect(before.bottom).toBeLessThanOrEqual(651);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByTestId('long-page-end')).toBeVisible();

    const after = await sidebarRect(page);
    expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(1);
    expect(after.bottom).toBeLessThanOrEqual(651);
    await expect(sidebar.getByText(`${profile.name} E2E`, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test(`${profile.name}: drawer móvel abre e fecha por teclado e controlo visível`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthenticatedSession(page, profile);
    await page.goto(profile.path);

    const openButton = page.getByRole('button', { name: 'Abrir menu' });
    await expect(openButton).toBeVisible();
    await expect.poll(async () => (await sidebarRect(page)).right).toBeLessThanOrEqual(1);

    await openButton.click();
    await expect.poll(async () => Math.abs((await sidebarRect(page)).left)).toBeLessThanOrEqual(1);
    await expect(page.locator('aside').getByText(`${profile.name} E2E`, { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect.poll(async () => (await sidebarRect(page)).right).toBeLessThanOrEqual(1);

    await openButton.click();
    await expect.poll(async () => Math.abs((await sidebarRect(page)).left)).toBeLessThanOrEqual(1);
    await page.locator('aside').getByRole('button', { name: 'Fechar' }).click();
    await expect.poll(async () => (await sidebarRect(page)).right).toBeLessThanOrEqual(1);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('Administrador: a página demonstrativa Permissões foi removida', async ({ page }) => {
  const admin = profiles[0];
  await mockAuthenticatedSession(page, admin);
  await page.goto('/administrador/permissoes');

  await expect(page).toHaveURL(/\/administrador$/);
  await expect(page.locator('aside').getByRole('button', { name: 'Permissões', exact: true })).toHaveCount(0);
  await expect(page.getByText('Permissões & Perfis')).toHaveCount(0);
});
