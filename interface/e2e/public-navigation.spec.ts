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

  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await page.getByLabel('Navegação principal').getByRole('button', { name: 'Serviços', exact: true }).click();
  await expect(page).toHaveURL(/\/servicos$/);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
