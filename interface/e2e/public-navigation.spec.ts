import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/me' || pathname === '/api/me/') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ erro: 'Não autenticado.' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
});

test('a navegação pública permanece disponível sem sessão', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('CiberBoxSecur');
  expect(await page.locator('html').getAttribute('lang')).toBe('pt-PT');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Plataforma académica de gestão de cibersegurança e apoio à conformidade NIS2.');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await page.getByLabel('Navegação principal').getByRole('button', { name: 'Serviços', exact: true }).click();
  await expect(page).toHaveURL(/\/servicos$/);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('o footer mantém destinos reais, ano atual e comportamento móvel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const footer = page.locator('.home-footer');
  await expect(footer.getByRole('link', { name: 'Sobre Nós' })).toHaveAttribute('href', '/#quem-somos');
  await expect(footer.getByRole('button', { name: 'Início', exact: true })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Serviços', exact: true })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Notícias', exact: true })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Contacto', exact: true })).toBeVisible();
  await expect(footer.getByText(new RegExp(`© ${new Date().getFullYear()} CiberBoxSecur`))).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await footer.getByRole('button', { name: 'Notícias', exact: true }).click();
  await expect(page).toHaveURL(/\/noticias$/);
  await page.reload();
  await expect(page).toHaveTitle('CiberBoxSecur');
});
