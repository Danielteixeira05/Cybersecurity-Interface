import { expect, test } from '@playwright/test';

const client = { id: 91, nome: 'Organização E2E', nif: '509999998', ativo: true };

test('Cliente submete um report inicial Aberto sem controlo NIS2', async ({ page }) => {
  const submissions: Record<string, unknown>[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === '/api/me' || pathname === '/api/me/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autenticado: true,
          utilizador: { id: 51, nome: 'Cliente E2E', email: 'cliente.e2e@example.test', perfil_codigo: 'CLIENTE', ativo: true },
          cliente: client,
        }),
      });
      return;
    }
    if (pathname.startsWith('/api/clients')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([client]) });
      return;
    }
    if (pathname.startsWith('/api/incidents') && request.method() === 'POST') {
      submissions.push(request.postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1001, cliente_id: client.id, titulo: 'Report E2E', estado: 'ABERTO', gravidade: 'MEDIA', notificado_nis2: false }),
      });
      return;
    }
    if (pathname.startsWith('/api/incidents') || pathname.startsWith('/api/notifications')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }
    if (pathname === '/api/csrf' || pathname === '/api/csrf/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrf_token: 'test-csrf-token' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/cliente/incidentes');
  await expect(page.getByRole('heading', { name: 'Incidentes' })).toBeVisible();
  await page.getByRole('button', { name: 'Reportar Incidente' }).click();

  const dialog = page.getByRole('dialog', { name: 'Reportar incidente' });
  await expect(dialog.getByLabel('Cliente')).toBeDisabled();
  await expect(dialog.getByLabel('Estado')).toBeDisabled();
  await expect(dialog.getByLabel('Estado').locator('option')).toHaveCount(1);
  await expect(dialog.getByText('Notificado às autoridades NIS2 (CNCS/ENISA)')).toHaveCount(0);

  await dialog.getByLabel('Código').fill('INC-E2E-001');
  await dialog.getByLabel('Tipo').fill('Acesso não autorizado');
  await dialog.getByLabel('Data e hora de deteção').fill('2026-08-31T10:00');
  await dialog.getByLabel('Descrição').fill('Apenas validação do contrato de submissão no browser.');
  await dialog.getByRole('button', { name: 'Submeter report' }).click();

  await expect.poll(() => submissions.length).toBe(1);
  expect(submissions[0]).toMatchObject({
    cliente_id: client.id,
    estado: 'ABERTO',
    notificado_nis2: false,
    ativo: true,
  });
});
