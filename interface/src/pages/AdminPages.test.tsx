import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiUtilizador } from '../apiClient';
import { AdminManagerDetail, AdminUsers } from './AdminPages';

const { atividadeGestorApi, clientesApi, utilizadorDetalheApi, utilizadoresApi } = vi.hoisted(() => ({
  atividadeGestorApi: vi.fn(),
  clientesApi: vi.fn(),
  utilizadorDetalheApi: vi.fn(),
  utilizadoresApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return { ...actual, atividadeGestorApi, clientesApi, utilizadorDetalheApi, utilizadoresApi };
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
