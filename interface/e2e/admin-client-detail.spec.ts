import { expect, test } from '@playwright/test';

const client = { id: 7, nome: 'Organização Admin E2E', nif: '509999997', email: 'admin-client@example.test', ativo: true };

function detail() {
  return {
    cliente: client,
    contactos: [], gestores: [], ativos: [], incidentes: [], documentos: [], avaliacoes: [], pedidos: [],
  };
}

test('Administrador abre um cliente por URL canónico e mantém o mesmo cliente nas abas operacionais', async ({ page }) => {
  const assetRequests: string[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/me' || pathname === '/api/me/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        autenticado: true,
        utilizador: { id: 1, nome: 'Administrador E2E', email: 'admin@example.test', perfil_codigo: 'ADMINISTRADOR', ativo: true },
        cliente: null,
      }) });
      return;
    }
    if (pathname === '/api/clients/7') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail()) });
      return;
    }
    if (pathname === '/api/clients' || pathname === '/api/clients/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([client]) });
      return;
    }
    if (pathname === '/api/users' || pathname === '/api/users/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }
    if (pathname === '/api/assets' || pathname === '/api/assets/') {
      assetRequests.push(request.url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
      return;
    }
    if (pathname === '/api/incidents' || pathname === '/api/incidents/' || pathname.startsWith('/api/notifications')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }
    if (pathname === '/api/csrf' || pathname === '/api/csrf/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrf_token: 'test-csrf-token' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/administrador/clientes');
  await page.getByText(client.nome, { exact: true }).first().click();
  await expect(page).toHaveURL(/\/administrador\/clientes\/7$/);
  await expect(page.getByRole('heading', { name: client.nome })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Administrador', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: client.nome })).toBeVisible();
  await page.getByRole('button', { name: 'Ativos' }).click();
  await expect(page.getByText('Sem ativos tecnológicos disponíveis.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Novo Ativo/i })).toBeVisible();
  expect(assetRequests.some((url) => new URL(url).searchParams.get('cliente_id') === '7')).toBe(true);
  await expect(page.getByText(/Cliente inválido\.|clientes associados a este Gestor/i)).toHaveCount(0);
});
