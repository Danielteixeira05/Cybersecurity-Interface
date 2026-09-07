import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcelImportHistory, ExcelImportWorkspace } from './ManagerPages';

const {
  clientesApi,
  descarregarImportacaoExcelApi,
  descarregarModeloImportacaoAtivosApi,
  confirmarImportacaoExcelApi,
  importacoesExcelApi,
  previsualizarImportacaoExcelApi,
  resultadoImportacaoExcelApi,
} = vi.hoisted(() => ({
  clientesApi: vi.fn(),
  descarregarImportacaoExcelApi: vi.fn(),
  descarregarModeloImportacaoAtivosApi: vi.fn(),
  confirmarImportacaoExcelApi: vi.fn(),
  importacoesExcelApi: vi.fn(),
  previsualizarImportacaoExcelApi: vi.fn(),
  resultadoImportacaoExcelApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return {
    ...actual,
    clientesApi,
    descarregarImportacaoExcelApi,
    descarregarModeloImportacaoAtivosApi,
    confirmarImportacaoExcelApi,
    importacoesExcelApi,
    previsualizarImportacaoExcelApi,
    resultadoImportacaoExcelApi,
  };
});

describe('modelo Excel de ativos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientesApi.mockResolvedValue([{ id: 7, nome: 'Organização de teste', nif: '509999999', ativo: true }]);
    importacoesExcelApi.mockResolvedValue([]);
    resultadoImportacaoExcelApi.mockResolvedValue({
      id: 31,
      cliente_id: 7,
      tipo: 'ATIVOS',
      nome_ficheiro_original: 'ativos-alpha.xlsx',
      estado: 'FALHADO',
      total_linhas: 1,
      linhas_importadas: 0,
      linhas_rejeitadas: 1,
      linhas: [{ numero_linha: 2, estado: 'REJEITADA', nome: 'ATIVO-E2E', erro: 'Número de inventário repetido.' }],
    });
    descarregarModeloImportacaoAtivosApi.mockResolvedValue({
      blob: new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename: 'modelo_importacao_ativos.xlsx',
    });
    descarregarImportacaoExcelApi.mockResolvedValue({
      blob: new Blob(['original'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename: 'ativos-alpha.xlsx',
    });
    confirmarImportacaoExcelApi.mockResolvedValue({
      id: 31,
      cliente_id: 7,
      tipo: 'ATIVOS',
      nome_ficheiro_original: 'ativos-alpha.xlsx',
      estado: 'PROCESSADO',
      total_linhas: 1,
      linhas_importadas: 1,
      linhas_rejeitadas: 0,
    });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:modelo-ativos') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('mantém o botão ativo e inicia o download autenticado do modelo de ativos', async () => {
    const user = userEvent.setup();
    render(<ExcelImportWorkspace />);

    const button = await screen.findByRole('button', { name: 'Descarregar modelo de importação de ativos' });
    expect(button).toBeEnabled();
    await user.click(button);

    await waitFor(() => expect(descarregarModeloImportacaoAtivosApi).toHaveBeenCalledTimes(1));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:modelo-ativos');
    expect(button).toHaveTextContent('Descarregar modelo');
  });

  it('apresenta feedback controlado quando a API de download falha', async () => {
    const user = userEvent.setup();
    descarregarModeloImportacaoAtivosApi.mockRejectedValueOnce(new Error('Não foi possível descarregar o modelo de importação de ativos.'));
    render(<ExcelImportWorkspace />);

    await user.click(await screen.findByRole('button', { name: 'Descarregar modelo de importação de ativos' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível descarregar o modelo de importação de ativos.');
    expect(screen.getByRole('button', { name: 'Descarregar modelo de importação de ativos' })).toBeEnabled();
  });

  it('descarrega o ficheiro original pelo ID real da importação', async () => {
    const user = userEvent.setup();
    importacoesExcelApi.mockResolvedValueOnce([{
      id: 31,
      cliente_id: 7,
      cliente_nome: 'Organização de teste',
      tipo: 'ATIVOS',
      nome_ficheiro_original: 'ativos-alpha.xlsx',
      estado: 'PROCESSADO',
      total_linhas: 3,
      linhas_importadas: 3,
      linhas_rejeitadas: 0,
    }]);
    render(<ExcelImportHistory clientId={7} />);

    await user.click(await screen.findByRole('button', { name: 'Descarregar ficheiro original da importação 31' }));
    await waitFor(() => expect(descarregarImportacaoExcelApi).toHaveBeenCalledWith(31));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it('apresenta o erro do download no histórico sem esconder a área de importação', async () => {
    const user = userEvent.setup();
    importacoesExcelApi.mockResolvedValueOnce([{
      id: 31,
      cliente_id: 7,
      tipo: 'ATIVOS',
      nome_ficheiro_original: 'ativos-alpha.xlsx',
      estado: 'PROCESSADO',
      total_linhas: 1,
      linhas_importadas: 1,
      linhas_rejeitadas: 0,
    }]);
    descarregarImportacaoExcelApi.mockRejectedValueOnce(new Error('Ficheiro original indisponível.'));
    render(<div><ExcelImportWorkspace role="client" /><ExcelImportHistory clientId={7} /></div>);

    await user.click(await screen.findByRole('button', { name: 'Descarregar ficheiro original da importação 31' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ficheiro original indisponível.');
    expect(screen.getByRole('button', { name: 'Descarregar modelo de importação de ativos' })).toBeEnabled();
  });

  it('mantém o histórico fora da página dedicada à importação', async () => {
    render(<ExcelImportWorkspace role="client" />);

    await screen.findByText('Organização da importação');
    expect(screen.queryByRole('heading', { name: 'Histórico de importações' })).not.toBeInTheDocument();
    expect(importacoesExcelApi).not.toHaveBeenCalled();
  });

  it('apresenta zero linhas no modelo vazio e impede a confirmação', async () => {
    const user = userEvent.setup();
    previsualizarImportacaoExcelApi.mockResolvedValueOnce({
      tipo: 'ATIVOS',
      cliente_id: 7,
      nome_ficheiro_original: 'modelo_importacao_ativos.xlsx',
      total_linhas: 0,
      linhas_validas: 0,
      linhas_rejeitadas: 0,
      linhas: [],
    });
    const { container } = render(<ExcelImportWorkspace role="client" />);
    await screen.findByText('Organização da importação');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['xlsx'], 'modelo_importacao_ativos.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    await user.click(screen.getByRole('button', { name: 'Validar & Pré-visualizar' }));

    expect(await screen.findByText(/O modelo está vazio/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sem linhas para importar' })).toBeDisabled();
    expect(confirmarImportacaoExcelApi).not.toHaveBeenCalled();
  });

  it('notifica a página de ativos depois de confirmar uma importação válida', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    previsualizarImportacaoExcelApi.mockResolvedValueOnce({
      tipo: 'ATIVOS',
      cliente_id: 7,
      nome_ficheiro_original: 'ativos-validos.xlsx',
      total_linhas: 1,
      linhas_validas: 1,
      linhas_rejeitadas: 0,
      linhas: [{ linha: 2, valido: true, erros: [], dados: { nome: 'ATIVO-E2E', criticidade: 'MEDIA' } }],
    });
    const { container } = render(<ExcelImportWorkspace role="client" onCompleted={onCompleted} />);
    await screen.findByText('Organização da importação');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['xlsx'], 'ativos-validos.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    await user.click(screen.getByRole('button', { name: 'Validar & Pré-visualizar' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar importação' }));

    await waitFor(() => expect(confirmarImportacaoExcelApi).toHaveBeenCalledWith('ATIVOS', 7, expect.any(File)));
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ id: 31, cliente_id: 7, estado: 'PROCESSADO' }));
  });

  it('não apresenta sucesso nem abandona o formulário quando zero ativos são importados', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    previsualizarImportacaoExcelApi.mockResolvedValueOnce({
      tipo: 'ATIVOS', cliente_id: 7, nome_ficheiro_original: 'repetido.xlsx',
      total_linhas: 1, linhas_validas: 1, linhas_rejeitadas: 0,
      linhas: [{ numero_linha: 2, estado: 'IMPORTADA', erro: null, dados: { nome: 'ATIVO-E2E' } }],
    });
    confirmarImportacaoExcelApi.mockResolvedValueOnce({
      id: 32, cliente_id: 7, tipo: 'ATIVOS', nome_ficheiro_original: 'repetido.xlsx', estado: 'FALHADO',
      total_linhas: 1, linhas_importadas: 0, linhas_rejeitadas: 1,
      linhas: [{ numero_linha: 2, estado: 'REJEITADA', nome: 'ATIVO-E2E', erro: 'Número de inventário repetido.' }],
    });
    const { container } = render(<ExcelImportWorkspace role="client" onCompleted={onCompleted} />);
    await screen.findByText('Organização da importação');
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, new File(['xlsx'], 'repetido.xlsx'));
    await user.click(screen.getByRole('button', { name: 'Validar & Pré-visualizar' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar importação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('nenhum ativo foi importado');
    expect(screen.getByText(/Linha 2 \(ATIVO-E2E\): Número de inventário repetido/)).toBeVisible();
    expect(screen.queryByText(/concluída com sucesso/i)).not.toBeInTheDocument();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('carrega e apresenta os motivos funcionais de uma importação falhada', async () => {
    const user = userEvent.setup();
    importacoesExcelApi.mockResolvedValueOnce([{
      id: 31, cliente_id: 7, cliente_nome: 'Organização de teste', tipo: 'ATIVOS',
      nome_ficheiro_original: 'ativos-alpha.xlsx', estado: 'FALHADO', total_linhas: 1,
      linhas_importadas: 0, linhas_rejeitadas: 1,
    }]);
    render(<ExcelImportHistory clientId={7} />);
    await user.click(await screen.findByRole('button', { name: 'Consultar resultado da importação 31' }));

    await waitFor(() => expect(resultadoImportacaoExcelApi).toHaveBeenCalledWith(31, expect.any(AbortSignal)));
    expect(screen.getByRole('region', { name: 'Resultado da importação 31' })).toHaveTextContent('ATIVO-E2E: Número de inventário repetido.');
  });

  it('filtra o histórico pelo cliente atual e ignora respostas antigas', async () => {
    let resolveFirst: ((value: unknown[]) => void) | undefined;
    importacoesExcelApi
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([]);
    const { rerender } = render(<ExcelImportHistory clientId={7} />);
    rerender(<ExcelImportHistory clientId={8} />);
    await waitFor(() => expect(importacoesExcelApi).toHaveBeenLastCalledWith(8, expect.any(AbortSignal)));
    resolveFirst?.([{
      id: 31,
      cliente_id: 7,
      cliente_nome: 'Organização antiga',
      tipo: 'ATIVOS',
      nome_ficheiro_original: 'antiga.xlsx',
      estado: 'PROCESSADO',
      total_linhas: 1,
      linhas_importadas: 1,
      linhas_rejeitadas: 0,
    }]);

    await waitFor(() => expect(screen.getByText('Ainda não existem importações para esta organização.')).toBeVisible());
    expect(screen.queryByText('Organização antiga')).not.toBeInTheDocument();
  });
});
