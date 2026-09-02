import { expect, test } from '@playwright/test';

const client = { id: 7, nome: 'Organização Admin E2E', nif: '509999997', email: 'admin-client@example.test', ativo: true };
const documents = [
  { id: 801, cliente_id: client.id, cliente_nome: client.nome, categoria: 'DOCUMENTO_INTERNO', titulo: 'Documento geral E2E', nome_ficheiro_original: 'geral.pdf', tipo_mime: 'application/pdf', tamanho_bytes: 120, privado: true, submetido_por: 2, submetido_por_nome: 'Autor E2E', submetido_em: '2026-09-02T12:00:00.000Z', ativo: true, estado: 'SUBMETIDO', versao: '1.0', data_documento: '2026-09-02', documento_anterior_id: null, revisto_por: null, revisto_em: null, atualizado_em: '2026-09-02T12:00:00.000Z' },
  { id: 802, cliente_id: client.id, cliente_nome: client.nome, categoria: 'RELATORIO', titulo: 'Relatório E2E', nome_ficheiro_original: 'relatorio.pdf', tipo_mime: 'application/pdf', tamanho_bytes: 121, privado: true, submetido_por: 2, submetido_por_nome: 'Autor E2E', submetido_em: '2026-09-02T12:01:00.000Z', ativo: true, estado: 'EM_ANALISE', versao: '1.0', data_documento: '2026-09-02', documento_anterior_id: null, revisto_por: null, revisto_em: null, atualizado_em: '2026-09-02T12:01:00.000Z' },
  { id: 803, cliente_id: client.id, cliente_nome: client.nome, categoria: 'PENTEST', titulo: 'Pentest E2E', nome_ficheiro_original: 'pentest.pdf', tipo_mime: 'application/pdf', tamanho_bytes: 122, privado: true, submetido_por: 2, submetido_por_nome: 'Autor E2E', submetido_em: '2026-09-02T12:02:00.000Z', ativo: true, estado: 'APROVADO', versao: '2.0', data_documento: '2026-09-02', documento_anterior_id: 800, revisto_por: 1, revisto_em: '2026-09-02T12:03:00.000Z', atualizado_em: '2026-09-02T12:03:00.000Z' },
  { id: 804, cliente_id: client.id, cliente_nome: client.nome, categoria: 'EVIDENCIA', titulo: 'Evidência E2E', nome_ficheiro_original: 'evidencia.pdf', tipo_mime: 'application/pdf', tamanho_bytes: 123, privado: true, submetido_por: 2, submetido_por_nome: 'Autor E2E', submetido_em: '2026-09-02T12:04:00.000Z', ativo: true, estado: 'SUBMETIDO', versao: '1.0', data_documento: '2026-09-02', documento_anterior_id: null, revisto_por: null, revisto_em: null, atualizado_em: '2026-09-02T12:04:00.000Z' },
];

function detail() {
  return {
    cliente: client,
    contactos: [], gestores: [], ativos: [], incidentes: [], documentos: [], avaliacoes: [], pedidos: [],
  };
}

test('Administrador abre um cliente por URL canónico e mantém o mesmo cliente nas abas operacionais', async ({ page }) => {
  const assetRequests: string[] = [];
  const documentDetailRequests: number[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
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
    if (pathname === '/api/documents/config') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ max_upload_mb: 10, categories: ['DOCUMENTO_INTERNO', 'RELATORIO', 'RELATORIO_CNCS', 'PENTEST', 'EVIDENCIA'], states: ['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES'] }) });
      return;
    }
    if (pathname === '/api/documents' && request.method() === 'GET') {
      expect(url.searchParams.get('cliente_id')).toBe(String(client.id));
      const category = url.searchParams.get('categoria');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(category ? documents.filter((document) => document.categoria === category) : documents) });
      return;
    }
    const documentMatch = /^\/api\/documents\/(\d+)$/.exec(pathname);
    if (documentMatch && request.method() === 'GET') {
      const documentId = Number(documentMatch[1]);
      documentDetailRequests.push(documentId);
      const document = documents.find((item) => item.id === documentId);
      await route.fulfill({ status: document ? 200 : 404, contentType: 'application/json', body: JSON.stringify(document ? { documento: document, historico: [{ id: document.id, documento_id: document.id, estado_anterior: null, estado_novo: document.estado, observacao: 'Histórico simulado local.', autor_id: 2, autor: { id: 2, nome: 'Autor E2E' }, criado_em: document.submetido_em }], versoes_relacionadas: [document] } : { message: 'Não encontrado' }) });
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

  const assertDocumentTab = async (tab: string, title: string, documentId: number) => {
    await page.getByLabel('Detalhe do cliente').getByRole('button', { name: tab, exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver' }).first().click();
    await expect(page.getByRole('dialog', { name: title })).toContainText('Histórico');
    expect(documentDetailRequests).toContain(documentId);
    await expect(page.getByRole('dialog', { name: title })).toContainText('Versões');
    await page.getByRole('button', { name: 'Fechar' }).click();
  };

  await assertDocumentTab('Documentos', 'Documento geral E2E', 801);
  await assertDocumentTab('Relatórios', 'Relatório E2E', 802);
  await assertDocumentTab('PenTests', 'Pentest E2E', 803);
  await assertDocumentTab('Evidências', 'Evidência E2E', 804);

  await page.reload();
  await expect(page).toHaveURL(/\/administrador\/clientes\/7#evidence$/);
  await expect(page.getByText('Evidência E2E', { exact: true })).toBeVisible();
});
