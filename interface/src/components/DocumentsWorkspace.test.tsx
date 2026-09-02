import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentsWorkspace } from './DocumentsWorkspace';

const {
  clientesApi,
  configuracaoDocumentosApi,
  descarregarDocumentoApi,
  desativarDocumentoApi,
  documentoDetalheApi,
  documentosApi,
  reverDocumentoApi,
  submeterDocumentoApi,
  submeterVersaoDocumentoApi,
  atualizarLimiteUploadDocumentosApi,
} = vi.hoisted(() => ({
  clientesApi: vi.fn(), configuracaoDocumentosApi: vi.fn(), descarregarDocumentoApi: vi.fn(),
  desativarDocumentoApi: vi.fn(), documentoDetalheApi: vi.fn(), documentosApi: vi.fn(),
  reverDocumentoApi: vi.fn(), submeterDocumentoApi: vi.fn(), submeterVersaoDocumentoApi: vi.fn(),
  atualizarLimiteUploadDocumentosApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../apiClient')>()),
  clientesApi, configuracaoDocumentosApi, descarregarDocumentoApi, desativarDocumentoApi,
  documentoDetalheApi, documentosApi, reverDocumentoApi, submeterDocumentoApi,
  submeterVersaoDocumentoApi, atualizarLimiteUploadDocumentosApi,
}));

const organisation = { id: 71, nome: 'Organização autorizada', nif: '509999971', ativo: true };
const document = {
  id: 901, cliente_id: 71, cliente_nome: organisation.nome, cliente_nif: organisation.nif,
  categoria: 'PENTEST', titulo: 'PenTest real', descricao: 'Descrição segura',
  nome_ficheiro_original: 'pentest.pdf', tipo_mime: 'application/pdf', tamanho_bytes: 64,
  privado: true, submetido_por: 5, submetido_por_nome: 'Cliente', submetido_em: '2026-09-02T12:00:00.000Z',
  ativo: true, estado: 'SUBMETIDO', versao: '1.0', data_documento: '2026-09-02',
  documento_anterior_id: null, revisto_por: null, revisto_em: null, atualizado_em: '2026-09-02T12:00:00.000Z',
};
const report = { ...document, id: 902, categoria: 'RELATORIO', titulo: 'Relatório técnico', nome_ficheiro_original: 'relatorio.pdf' };
const cncsReport = { ...document, id: 903, categoria: 'RELATORIO_CNCS', titulo: 'Relatório CNCS', nome_ficheiro_original: 'cncs.pdf' };
const evidence = { ...document, id: 904, categoria: 'EVIDENCIA', titulo: 'Evidência técnica', nome_ficheiro_original: 'evidencia.pdf' };
const otherDocument = { ...document, id: 905, categoria: 'OUTRO', titulo: 'Documento de outra categoria', nome_ficheiro_original: 'outro.pdf' };
const detail = { ...document, historico: [{ id: 1, documento_id: 901, estado_anterior: null, estado_novo: 'SUBMETIDO', observacao: 'Submissão inicial', autor_id: 5, autor: { id: 5, nome: 'Cliente' }, criado_em: '2026-09-02T12:00:00.000Z' }], versoes: [{ ...document, id: 900, versao: '0.9' }, document] };

function configureDefaults(rows = [document]) {
  clientesApi.mockResolvedValue([organisation]);
  configuracaoDocumentosApi.mockResolvedValue({ max_upload_mb: 10, categorias: ['PENTEST'], estados: ['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES'] });
  documentosApi.mockResolvedValue(rows);
  documentoDetalheApi.mockResolvedValue(detail);
  descarregarDocumentoApi.mockResolvedValue({ blob: new Blob(['pdf']), filename: 'pentest.pdf' });
  desativarDocumentoApi.mockResolvedValue(document);
  reverDocumentoApi.mockResolvedValue(detail);
  submeterDocumentoApi.mockResolvedValue(detail);
  submeterVersaoDocumentoApi.mockResolvedValue(detail);
  atualizarLimiteUploadDocumentosApi.mockResolvedValue({ max_upload_mb: 10, categorias: ['PENTEST'], estados: ['SUBMETIDO'] });
}

beforeEach(() => {
  vi.clearAllMocks();
  configureDefaults();
});

describe('DocumentsWorkspace na categoria Pentest', () => {
  const categoryCases: Array<[string, string[] | undefined, string[], number]> = [
    ['Documentos', undefined, ['PenTest real', 'Relatório técnico', 'Relatório CNCS', 'Evidência técnica', 'Documento de outra categoria'], 5],
    ['Relatórios', ['RELATORIO', 'RELATORIO_CNCS'], ['Relatório técnico', 'Relatório CNCS'], 2],
    ['PenTests', ['PENTEST'], ['PenTest real'], 1],
    ['Evidências', ['EVIDENCIA'], ['Evidência técnica'], 1],
  ];

  it.each(categoryCases)('%s mantém apenas as categorias autorizadas e ações reais', async (_tab, categoryScope, expectedTitles, expectedActions) => {
    const allDocuments = [document, report, cncsReport, evidence, otherDocument];
    configureDefaults(allDocuments);
    render(<DocumentsWorkspace role="admin" clientId={organisation.id} compact categoryScope={categoryScope} />);

    await screen.findByText(expectedTitles[0]);
    for (const title of expectedTitles) expect(screen.getByText(title)).toBeVisible();
    for (const title of allDocuments.map((item) => item.titulo).filter((title) => !expectedTitles.includes(title))) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole('button', { name: 'Ver' })).toHaveLength(expectedActions);
    expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(expectedActions);
    expect(documentosApi).toHaveBeenCalledWith(
      expect.objectContaining({ cliente_id: organisation.id }),
      expect.any(AbortSignal),
    );
  });

  it('abre e descarrega pelo ID real no detalhe documental partilhado', async () => {
    const user = userEvent.setup();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    configureDefaults([report]);
    documentoDetalheApi.mockResolvedValue({ ...detail, ...report, historico: detail.historico, versoes: [report] });
    render(<DocumentsWorkspace role="admin" clientId={organisation.id} compact categoryScope={['RELATORIO']} />);
    await screen.findByText(report.titulo);

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await waitFor(() => expect(documentoDetalheApi).toHaveBeenCalledWith(report.id, expect.any(AbortSignal)));
    const dialog = await screen.findByRole('dialog', { name: report.titulo });
    expect(within(dialog).getByText('Histórico')).toBeVisible();
    expect(within(dialog).getByText('Versões')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Rever' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(descarregarDocumentoApi).toHaveBeenCalledWith(report.id));
    anchorClick.mockRestore();
  });

  it('apresenta estados explícitos de carregamento e lista vazia', async () => {
    let resolveRows!: (rows: typeof document[]) => void;
    documentosApi.mockImplementation(() => new Promise<typeof document[]>((resolve) => { resolveRows = resolve; }));
    render(<DocumentsWorkspace role="admin" clientId={organisation.id} compact categoryScope={['PENTEST']} />);
    expect(screen.getByText('A carregar documentos…')).toBeVisible();
    await act(async () => { resolveRows([]); });
    expect(await screen.findByText('Ainda não existem documentos')).toBeVisible();
  });

  it('apresenta um erro controlado quando a listagem falha', async () => {
    documentosApi.mockRejectedValue(new Error('Falha de listagem simulada.'));
    render(<DocumentsWorkspace role="admin" clientId={organisation.id} compact categoryScope={['PENTEST']} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar os documentos.');
    expect(alert).toHaveTextContent('Falha de listagem simulada.');
  });

  it('Cliente fixa PENTEST no pedido, não expõe seletor de organização/categoria e submete ficheiro', async () => {
    const user = userEvent.setup();
    render(<DocumentsWorkspace role="client" categoryScope={['PENTEST']} />);
    await screen.findByText('PenTest real');
    expect(documentosApi).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'PENTEST' }), expect.any(AbortSignal));
    expect(clientesApi).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Submeter documento' }));
    const dialog = screen.getByRole('dialog', { name: 'Submeter documento' });
    expect(within(dialog).queryByLabelText('Organização')).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Categoria')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Categoria:\s*Pentest/);
    const fileInput = within(dialog).getByLabelText('Ficheiro') as HTMLInputElement;
    expect(fileInput.accept).toBe('.pdf,.docx,.xlsx,.csv');
    await user.type(within(dialog).getByLabelText('Título'), 'Novo PenTest');
    const file = new File(['%PDF-1.4'], 'novo.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.files?.[0]).toBe(file);
    fireEvent.submit(dialog.querySelector('form')!);
    await waitFor(() => expect(submeterDocumentoApi).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'PENTEST', cliente_id: undefined, file: expect.any(File) })));
  });

  it('Cliente consulta o detalhe mas não recebe ações de revisão', async () => {
    const user = userEvent.setup();
    render(<DocumentsWorkspace role="client" categoryScope={['PENTEST']} />);
    await screen.findByText('PenTest real');
    await user.click(screen.getByRole('button', { name: 'Ver' }));
    const dialog = await screen.findByRole('dialog', { name: 'PenTest real' });
    expect(within(dialog).getByRole('button', { name: 'Download' })).toBeVisible();
    expect(within(dialog).queryByRole('button', { name: 'Rever' })).not.toBeInTheDocument();
  });

  it('Gestor recebe exclusivamente organizações autorizadas e apenas estados coerentes na revisão', async () => {
    const user = userEvent.setup();
    render(<DocumentsWorkspace role="manager" categoryScope={['PENTEST']} />);
    await screen.findByText('PenTest real');
    await user.click(screen.getByRole('button', { name: 'Submeter documento' }));
    const upload = screen.getByRole('dialog', { name: 'Submeter documento' });
    expect(within(upload).getByLabelText('Organização')).toHaveTextContent('Organização autorizada');
    expect(within(upload).queryByText('Todas as organizações')).not.toBeInTheDocument();
    await user.click(within(upload).getByLabelText('Fechar'));

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await user.click(screen.getByRole('button', { name: 'Rever' }));
    const review = screen.getByRole('dialog', { name: 'Rever documento' });
    expect(within(review).getByLabelText('Estado')).toHaveTextContent('SubmetidoEm Analise');
    expect(within(review).queryByRole('option', { name: 'Aprovado' })).not.toBeInTheDocument();
  });

  it('mostra detalhe, histórico e versões sem expor chaves de armazenamento', async () => {
    const user = userEvent.setup();
    render(<DocumentsWorkspace role="manager" categoryScope={['PENTEST']} />);
    await screen.findByText('PenTest real');
    await user.click(screen.getByRole('button', { name: 'Ver' }));
    expect(await screen.findByText('Histórico')).toBeVisible();
    expect(screen.getByText('Submissão inicial')).toBeVisible();
    expect(screen.getByText('Versões')).toBeVisible();
    expect(screen.getByText('v0.9')).toBeVisible();
    expect(screen.queryByText(/documents\//)).not.toBeInTheDocument();
  });

  it('cancela e ignora a resposta antiga quando o cliente do detalhe muda depressa', async () => {
    let resolveFirst!: (rows: typeof document[]) => void;
    let resolveSecond!: (rows: typeof document[]) => void;
    let firstSignal: AbortSignal | undefined;
    const first = new Promise<typeof document[]>((resolve) => { resolveFirst = resolve; });
    const second = new Promise<typeof document[]>((resolve) => { resolveSecond = resolve; });
    documentosApi.mockImplementation((filters: { cliente_id?: number }, signal?: AbortSignal) => {
      if (filters.cliente_id === 71) { firstSignal = signal; return first; }
      return second;
    });
    const { rerender } = render(<DocumentsWorkspace role="admin" clientId={71} categoryScope={['PENTEST']} />);
    await waitFor(() => expect(documentosApi).toHaveBeenCalled());
    rerender(<DocumentsWorkspace role="admin" clientId={72} categoryScope={['PENTEST']} />);
    await waitFor(() => expect(firstSignal?.aborted).toBe(true));

    await act(async () => { resolveFirst([{ ...document, cliente_id: 71, titulo: 'Cliente anterior' }]); });
    expect(screen.queryByText('Cliente anterior')).not.toBeInTheDocument();
    await act(async () => { resolveSecond([{ ...document, cliente_id: 72, titulo: 'Cliente atual' }]); });
    expect(await screen.findByText('Cliente atual')).toBeVisible();
    expect(screen.queryByText('Cliente anterior')).not.toBeInTheDocument();
  });
});
