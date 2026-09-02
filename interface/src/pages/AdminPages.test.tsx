import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiActivityLogsResponse, ApiUtilizador } from '../apiClient';
import { AdminLogs, AdminManagerDetail, AdminUsers, useActivityLogsPage } from './AdminPages';

const { atividadeGestorApi, clientesApi, logsApi, utilizadorDetalheApi, utilizadoresApi } = vi.hoisted(() => ({
  atividadeGestorApi: vi.fn(),
  clientesApi: vi.fn(),
  logsApi: vi.fn(),
  utilizadorDetalheApi: vi.fn(),
  utilizadoresApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return { ...actual, atividadeGestorApi, clientesApi, logsApi, utilizadorDetalheApi, utilizadoresApi };
});

const manager: ApiUtilizador = {
  id: 7,
  nome: 'Gestor Real',
  email: 'gestor.real@example.test',
  telefone: null,
  nif: null,
  ativo: false,
  perfil_id: 2,
  perfil_codigo: 'COLABORADOR',
  perfil_nome: 'Gestor',
  ultimo_acesso_em: null,
  criado_em: '2026-08-01T10:00:00.000Z',
  clientes: [],
};

describe('AdminUsers', () => {
  beforeEach(() => {
    clientesApi.mockReset();
    utilizadoresApi.mockReset();
    clientesApi.mockResolvedValue([]);
    utilizadoresApi.mockResolvedValue([
      manager,
      { ...manager, id: 8, nome: 'Cliente Real', perfil_codigo: 'CLIENTE', perfil_nome: 'Cliente' },
      { ...manager, id: 9, nome: 'Admin Real', perfil_codigo: 'ADMINISTRADOR', perfil_nome: 'Administrador' },
    ]);
  });

  it('mostra Ver detalhe apenas para Gestores e navega com o ID real', async () => {
    const user = userEvent.setup();
    const openManagerDetail = vi.fn();
    render(<AdminUsers setPage={vi.fn()} openManagerDetail={openManagerDetail} />);

    const detailButtons = await screen.findAllByRole('button', { name: 'Ver detalhe' });
    expect(detailButtons).toHaveLength(2);
    await user.click(detailButtons[0]);
    expect(openManagerDetail).toHaveBeenCalledWith(7);
  });
});

describe('AdminManagerDetail', () => {
  beforeEach(() => {
    utilizadorDetalheApi.mockReset();
    atividadeGestorApi.mockReset();
    utilizadorDetalheApi.mockResolvedValue(manager);
    atividadeGestorApi.mockResolvedValue([]);
  });

  it('apresenta dados vindos da API, o estado inativo e a atividade vazia', async () => {
    render(<AdminManagerDetail setPage={vi.fn()} managerId={7} />);

    expect(await screen.findByText('Gestor Real')).toBeVisible();
    expect(screen.getByText('Inativo')).toBeVisible();
    expect(screen.getByText('Sem atividade registada.')).toBeVisible();
    expect(screen.getByText('Este Gestor não tem organizações ativas associadas.')).toBeVisible();
    expect(screen.queryByText('Colaborador Demo')).not.toBeInTheDocument();
    expect(utilizadorDetalheApi).toHaveBeenCalledWith(7, expect.anything());
    expect(atividadeGestorApi).toHaveBeenCalledWith(7, 20, expect.anything());
  });

  it('não chama a API quando o ID da rota não é válido', async () => {
    render(<AdminManagerDetail setPage={vi.fn()} managerId={undefined} />);

    expect(await screen.findByText('Identificador de Gestor inválido.')).toBeVisible();
    expect(utilizadorDetalheApi).not.toHaveBeenCalled();
    expect(atividadeGestorApi).not.toHaveBeenCalled();
  });

  it('não apresenta dados antigos quando a rota muda antes da resposta anterior', async () => {
    let resolveManagerA!: (value: ApiUtilizador) => void;
    let resolveManagerB!: (value: ApiUtilizador) => void;
    let resolveActivityA!: (value: []) => void;
    let resolveActivityB!: (value: []) => void;
    const managerA = new Promise<ApiUtilizador>((resolve) => { resolveManagerA = resolve; });
    const managerB = new Promise<ApiUtilizador>((resolve) => { resolveManagerB = resolve; });
    const activityA = new Promise<[]>((resolve) => { resolveActivityA = resolve; });
    const activityB = new Promise<[]>((resolve) => { resolveActivityB = resolve; });
    const secondManager = { ...manager, id: 8, nome: 'Segundo Gestor Real', email: 'segundo.gestor@example.test' };
    const detailSignals = new Map<number, AbortSignal | undefined>();
    const activitySignals = new Map<number, AbortSignal | undefined>();

    utilizadorDetalheApi.mockImplementation((id: number, signal?: AbortSignal) => {
      detailSignals.set(id, signal);
      return id === 7 ? managerA : managerB;
    });
    atividadeGestorApi.mockImplementation((id: number, _limit: number, signal?: AbortSignal) => {
      activitySignals.set(id, signal);
      return id === 7 ? activityA : activityB;
    });
    const { rerender } = render(<AdminManagerDetail setPage={vi.fn()} managerId={7} />);
    await waitFor(() => expect(utilizadorDetalheApi).toHaveBeenCalledWith(7, expect.anything()));

    rerender(<AdminManagerDetail setPage={vi.fn()} managerId={8} />);
    expect(detailSignals.get(7)?.aborted).toBe(true);
    expect(activitySignals.get(7)?.aborted).toBe(true);
    expect(screen.getByText('A carregar dados do Gestor...')).toBeVisible();
    expect(screen.queryByText('Gestor Real')).not.toBeInTheDocument();

    await act(async () => {
      resolveManagerA(manager);
      resolveActivityA([]);
      await Promise.resolve();
    });
    expect(screen.queryByText('Gestor Real')).not.toBeInTheDocument();
    expect(screen.getByText('A carregar dados do Gestor...')).toBeVisible();

    await act(async () => {
      resolveManagerB(secondManager);
      resolveActivityB([]);
      await Promise.resolve();
    });
    expect(await screen.findByText('Segundo Gestor Real')).toBeVisible();
    expect(screen.queryByText('Gestor Real')).not.toBeInTheDocument();
  });
});

const firstLogsPage: ApiActivityLogsResponse = {
  items: [{
    id: 80,
    utilizador: { id: 7, nome: 'Gestor Real', email: 'gestor.real@example.test' },
    acao: 'ATUALIZAR_INCIDENTE',
    entidade: 'incidentes',
    entidade_id: 44,
    detalhes: { incidente_id: 44, estado: 'ABERTO' },
    criado_em: '2026-09-02T11:00:00.000Z',
  }],
  pagination: { limit: 50, offset: 0, total: 51, has_more: true, next_offset: 50 },
};

describe('AdminLogs', () => {
  beforeEach(() => {
    logsApi.mockReset();
  });

  it('tem estados explícitos de carregamento, erro e lista vazia', async () => {
    let resolve!: (value: ApiActivityLogsResponse) => void;
    logsApi.mockReturnValueOnce(new Promise<ApiActivityLogsResponse>((done) => { resolve = done; }));
    const { rerender } = render(<AdminLogs />);
    expect(screen.getByText('A carregar logs de atividade...')).toBeVisible();

    await act(async () => {
      resolve({ items: [], pagination: { limit: 50, offset: 0, total: 0, has_more: false, next_offset: null } });
      await Promise.resolve();
    });
    expect(await screen.findByText('Ainda não existem eventos de atividade registados.')).toBeVisible();
    expect(screen.getByText('0 registos')).toBeVisible();

    logsApi.mockRejectedValueOnce(new Error('Rota não encontrada.'));
    rerender(<AdminLogs key="error" />);
    expect(await screen.findByText('Rota não encontrada.')).toBeVisible();
  });

  it('apresenta dados reais, utilizador desconhecido e detalhes vazios sem serializar JSON arbitrário', async () => {
    logsApi.mockResolvedValue({
      items: [firstLogsPage.items[0], {
        id: 79,
        utilizador: null,
        acao: 'DESATIVAR',
        entidade: 'utilizadores',
        entidade_id: 8,
        detalhes: {},
        criado_em: '2026-09-02T10:30:00.000Z',
      }],
      pagination: { limit: 50, offset: 0, total: 2, has_more: false, next_offset: null },
    } satisfies ApiActivityLogsResponse);

    render(<AdminLogs />);
    expect(await screen.findByText('Gestor Real · gestor.real@example.test')).toBeVisible();
    expect(screen.getByText('incidente id:')).toBeVisible();
    expect(screen.getByText('Utilizador não disponível')).toBeVisible();
    expect(screen.getByText('Sem detalhes adicionais.')).toBeVisible();
    expect(screen.queryByText(/password|token|cookie/i)).not.toBeInTheDocument();
  });

  it('pagina sem mostrar a página anterior enquanto a página seguinte está a carregar', async () => {
    const user = userEvent.setup();
    let resolveNext!: (value: ApiActivityLogsResponse) => void;
    logsApi
      .mockResolvedValueOnce(firstLogsPage)
      .mockReturnValueOnce(new Promise<ApiActivityLogsResponse>((done) => { resolveNext = done; }));
    render(<AdminLogs />);
    expect(await screen.findByText('ATUALIZAR_INCIDENTE', { exact: false })).toBeVisible();
    expect(screen.getByText('1–1 de 51 registos')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(logsApi).toHaveBeenLastCalledWith(50, 50, expect.anything());
    expect(screen.getByText('A carregar logs de atividade...')).toBeVisible();
    expect(screen.queryByText('Gestor Real · gestor.real@example.test')).not.toBeInTheDocument();

    await act(async () => {
      resolveNext({
        items: [{ ...firstLogsPage.items[0], id: 30, acao: 'CRIAR_DOCUMENTO' }],
        pagination: { limit: 50, offset: 50, total: 51, has_more: false, next_offset: null },
      });
      await Promise.resolve();
    });
    expect(await screen.findByText('CRIAR_DOCUMENTO', { exact: false })).toBeVisible();
    expect(screen.getByText('51–51 de 51 registos')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Seguinte' })).toBeDisabled();
  });

  it('mantém uma página fora do intervalo navegável sem apresentar um intervalo invertido', async () => {
    const user = userEvent.setup();
    logsApi.mockResolvedValueOnce(firstLogsPage).mockResolvedValueOnce({
      items: [],
      pagination: { limit: 50, offset: 50, total: 3, has_more: false, next_offset: null },
    } satisfies ApiActivityLogsResponse);
    render(<AdminLogs />);

    await screen.findByText('ATUALIZAR_INCIDENTE', { exact: false });
    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(await screen.findByText('Nenhum registo nesta página.')).toBeVisible();
    expect(screen.getByText('Nenhum registo nesta página')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    expect(screen.queryByText(/51–3/)).not.toBeInTheDocument();
  });

  it('cancela uma página antiga e a respetiva resposta nunca substitui a página atual', async () => {
    let resolveFirst!: (value: ApiActivityLogsResponse) => void;
    let resolveSecond!: (value: ApiActivityLogsResponse) => void;
    const first = new Promise<ApiActivityLogsResponse>((resolve) => { resolveFirst = resolve; });
    const second = new Promise<ApiActivityLogsResponse>((resolve) => { resolveSecond = resolve; });
    const signals = new Map<number, AbortSignal | undefined>();
    logsApi.mockImplementation((_limit: number, pageOffset: number, signal?: AbortSignal) => {
      signals.set(pageOffset, signal);
      return pageOffset === 0 ? first : second;
    });

    const { result, rerender } = renderHook(({ pageOffset }) => useActivityLogsPage(pageOffset), {
      initialProps: { pageOffset: 0 },
    });
    await waitFor(() => expect(logsApi).toHaveBeenCalledWith(50, 0, expect.anything()));
    rerender({ pageOffset: 50 });
    await waitFor(() => expect(logsApi).toHaveBeenCalledWith(50, 50, expect.anything()));
    expect(signals.get(0)?.aborted).toBe(true);

    await act(async () => {
      resolveSecond({
        items: [{ ...firstLogsPage.items[0], id: 30, acao: 'PAGINA_ATUAL' }],
        pagination: { limit: 50, offset: 50, total: 51, has_more: false, next_offset: null },
      });
      await Promise.resolve();
    });
    expect(result.current.data?.items[0].acao).toBe('PAGINA_ATUAL');

    await act(async () => {
      resolveFirst(firstLogsPage);
      await Promise.resolve();
    });
    expect(result.current.data?.items[0].acao).toBe('PAGINA_ATUAL');
  });
});
