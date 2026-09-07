import { expect, test, type Page } from '@playwright/test';

const client = { id: 7, nome: 'Alpha Saúde E2E', nif: '509999997', ativo: true };
const asset = {
  id: 41,
  cliente_id: client.id,
  cliente_nome: client.nome,
  nome: 'ATIVO-ALPHA-E2E',
  numero_inventario: 'E2E-ASSET-041',
  tipo_equipamento: 'Servidor',
  sistema_operativo: 'Ubuntu Server',
  endereco_ip: '192.0.2.41',
  criticidade: 'MEDIA',
  ativo: true,
};

type ProfileCase = {
  label: string;
  perfil: 'ADMINISTRADOR' | 'COLABORADOR' | 'CLIENTE';
  initialUrl: string;
  detailUrl: RegExp;
};

const profiles: ProfileCase[] = [
  { label: 'Cliente', perfil: 'CLIENTE', initialUrl: '/cliente/ativos', detailUrl: /\/cliente\/ativos\?assetId=41$/ },
  { label: 'Gestor', perfil: 'COLABORADOR', initialUrl: '/gestor/clientes/7#assets', detailUrl: /\/gestor\/clientes\/7\?assetId=41#assets$/ },
  { label: 'Administrador', perfil: 'ADMINISTRADOR', initialUrl: '/administrador/clientes/7#assets', detailUrl: /\/administrador\/clientes\/7\?assetId=41#assets$/ },
];

async function mockAssetSession(page: Page, profile: ProfileCase, detailRequests: number[]) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname === '/api/me' || pathname === '/api/me/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autenticado: true,
          utilizador: {
            id: profile.perfil === 'ADMINISTRADOR' ? 101 : profile.perfil === 'COLABORADOR' ? 102 : 103,
            nome: `${profile.label} E2E`,
            email: `${profile.label.toLowerCase()}@example.test`,
            perfil_codigo: profile.perfil,
            ativo: true,
          },
          cliente: profile.perfil === 'CLIENTE' ? client : null,
        }),
      });
      return;
    }
    if (pathname === '/api/clients/7') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cliente: client,
          contactos: [],
          gestores: [],
          ativos: [asset],
          incidentes: [],
          documentos: [],
          avaliacoes: [],
          pedidos: [],
        }),
      });
      return;
    }
    if (pathname === '/api/assets' || pathname === '/api/assets/') {
      if (profile.perfil !== 'CLIENTE') expect(url.searchParams.get('cliente_id')).toBe(String(client.id));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [asset] }) });
      return;
    }
    const assetMatch = /^\/api\/assets\/(\d+)$/.exec(pathname);
    if (assetMatch) {
      detailRequests.push(Number(assetMatch[1]));
      await route.fulfill({ status: Number(assetMatch[1]) === asset.id ? 200 : 404, contentType: 'application/json', body: JSON.stringify(Number(assetMatch[1]) === asset.id ? asset : { message: 'Ativo não encontrado.' }) });
      return;
    }
    if (pathname === '/api/csrf' || pathname === '/api/csrf/') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrf_token: 'assets-e2e-csrf' }) });
      return;
    }
    if (pathname.startsWith('/api/notifications')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

for (const profile of profiles) {
  test(`${profile.label}: detalhe e Voltar aos Ativos preservam o ativo, perfil e cliente`, async ({ page }) => {
    const detailRequests: number[] = [];
    await mockAssetSession(page, profile, detailRequests);
    await page.goto(profile.initialUrl);

    await expect(page.getByText(asset.nome, { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: `Ver detalhe de ${asset.nome}` }).click();
    await expect(page).toHaveURL(profile.detailUrl);
    await expect(page.getByRole('dialog', { name: 'Detalhe do ativo' })).toContainText(asset.numero_inventario);
    expect(detailRequests).toEqual([asset.id]);

    await page.reload();
    await expect(page).toHaveURL(profile.detailUrl);
    await expect(page.getByRole('dialog', { name: 'Detalhe do ativo' })).toContainText(asset.nome);
    expect(detailRequests).toEqual([asset.id, asset.id]);

    await page.getByRole('button', { name: 'Voltar aos Ativos' }).click();
    await expect(page).toHaveURL(new RegExp(`${profile.initialUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    await expect(page.getByText(asset.nome, { exact: true }).first()).toBeVisible();
  });
}
