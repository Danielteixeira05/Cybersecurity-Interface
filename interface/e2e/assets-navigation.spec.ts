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
const excelImport = {
  id: 31,
  cliente_id: client.id,
  cliente_nome: client.nome,
  tipo: 'ATIVOS',
  nome_ficheiro_original: 'ativos-alpha-e2e.xlsx',
  estado: 'PROCESSADO',
  total_linhas: 3,
  linhas_importadas: 3,
  linhas_rejeitadas: 0,
  importado_por: 103,
  importado_por_nome: 'Utilizador E2E',
  importado_em: '2026-09-07T10:00:00Z',
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
    if (pathname === '/api/excel-imports' || pathname === '/api/excel-imports/') {
      if (profile.perfil !== 'CLIENTE') expect(url.searchParams.get('cliente_id')).toBe(String(client.id));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [excelImport] }) });
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

async function expectResponsiveAssetLayout(page: Page) {
  const layout = await page.evaluate(() => {
    const main = document.querySelector('main');
    const tableRegions = Array.from(document.querySelectorAll<HTMLElement>('.overflow-x-auto'))
      .filter((element) => element.querySelector('table'));
    const isContained = (element: Element | null) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1;
    };
    return {
      htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      mainContained: isContained(main),
      tablesContained: tableRegions.length >= 2 && tableRegions.every(isContained),
    };
  });
  expect(layout).toEqual({
    htmlOverflowX: 'hidden',
    bodyOverflowX: 'hidden',
    mainContained: true,
    tablesContained: true,
  });
}

for (const profile of profiles) {
  test(`${profile.label}: detalhe e Voltar aos Ativos preservam o ativo, perfil e cliente`, async ({ page }) => {
    const detailRequests: number[] = [];
    await mockAssetSession(page, profile, detailRequests);
    await page.goto(profile.initialUrl);

    await expect(page.getByText(asset.nome, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico de importações' })).toBeVisible();
    await expect(page.getByRole('button', { name: `Descarregar ficheiro original da importação ${excelImport.id}` })).toBeVisible();
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

  test(`${profile.label}: inventário, histórico e detalhe permanecem utilizáveis em mobile`, async ({ page }) => {
    const detailRequests: number[] = [];
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAssetSession(page, profile, detailRequests);
    await page.goto(profile.initialUrl);

    await expect(page.getByText(asset.nome, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico de importações' })).toBeVisible();
    await expectResponsiveAssetLayout(page);

    await page.getByRole('button', { name: `Ver detalhe de ${asset.nome}` }).click();
    await expect(page.getByRole('dialog', { name: 'Detalhe do ativo' })).toContainText(asset.numero_inventario);
    await expectResponsiveAssetLayout(page);
    await page.getByRole('button', { name: 'Voltar aos Ativos' }).click();
    await expect(page.getByText(asset.nome, { exact: true }).first()).toBeVisible();
  });
}

test('Cliente mantém o histórico em Meus Ativos e a página de importação dedicada não o duplica', async ({ page }) => {
  const detailRequests: number[] = [];
  await mockAssetSession(page, profiles[0], detailRequests);
  await page.goto('/cliente/ativos');

  await expect(page.getByRole('heading', { name: 'Histórico de importações' })).toBeVisible();
  await page.getByRole('button', { name: 'Importar ativos por Excel' }).click();
  await expect(page.getByRole('heading', { name: 'Importar Ativos via Excel' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Histórico de importações' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Voltar aos Ativos' }).click();
  await expect(page).toHaveURL(/\/cliente\/ativos$/);
  await expect(page.getByRole('heading', { name: 'Histórico de importações' })).toBeVisible();
});
