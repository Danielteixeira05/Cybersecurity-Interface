import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MgrClientDetail, MgrNIS2 } from './ManagerPages';

const { avaliacoesApi, clienteDetalheApi, clientesApi, criarAvaliacaoApi, estadosConformidadeApi } = vi.hoisted(() => ({
  avaliacoesApi: vi.fn(),
  clienteDetalheApi: vi.fn(),
  clientesApi: vi.fn(),
  criarAvaliacaoApi: vi.fn(),
  estadosConformidadeApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../apiClient')>()),
  avaliacoesApi,
  clientesApi,
  clienteDetalheApi,
  criarAvaliacaoApi,
  estadosConformidadeApi,
}));

vi.mock('../components/OperationalResources', () => ({
  AssetsWorkspace: ({ role, clientId }: { role: string; clientId?: number }) => <div>{`assets:${role}:${clientId}`}</div>,
  IncidentsWorkspace: ({ role, clientId }: { role: string; clientId?: number }) => <div>{`incidents:${role}:${clientId}`}</div>,
}));

vi.mock('recharts', () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: Box, PieChart: Box, Pie: Box, Cell: Box, Tooltip: Box, BarChart: Box, Bar: Box, XAxis: Box, YAxis: Box, CartesianGrid: Box, LineChart: Box, Line: Box, Legend: Box };
});

const client = { id: 4, nome: 'Organização Gestor', nif: '123456789', ativo: true, conformidade: null };
const created = {
  id: 33, cliente_id: 4, cliente_nome: client.nome, estado_conformidade_id: 2,
  estado_conformidade_codigo: 'EM_REVISAO', estado_conformidade_nome: 'Em revisão',
  data_avaliacao: '2026-09-02', nivel_risco: 'MEDIO', score: 6.5, pontuacao: 6.5,
  resumo: 'Resumo da avaliação', recomendacoes: null,
};

describe('MgrNIS2', () => {
  beforeEach(() => {
    clientesApi.mockReset();
    clienteDetalheApi.mockReset();
    avaliacoesApi.mockReset();
    criarAvaliacaoApi.mockReset();
    estadosConformidadeApi.mockReset();
    clientesApi.mockResolvedValue(client ? [client] : []);
    avaliacoesApi.mockResolvedValueOnce([]).mockResolvedValue([created]);
    estadosConformidadeApi.mockResolvedValue([{ id: 2, codigo: 'EM_REVISAO', nome: 'Em revisão' }]);
    criarAvaliacaoApi.mockResolvedValue(created);
  });

  it('permite ao Gestor escolher apenas clientes carregados e atualiza histórico/indicadores após sucesso', async () => {
    const user = userEvent.setup();
    render(<MgrNIS2 setPage={vi.fn()} />);
    await screen.findByText('Organização Gestor');
    await user.click(screen.getByRole('button', { name: '+ Nova avaliação NIS2' }));
    await screen.findByRole('option', { name: 'Em revisão (EM_REVISAO)' });
    const options = screen.getByLabelText('Organização').querySelectorAll('option');
    expect(options).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Organização'), '4');
    await user.clear(screen.getByLabelText('Pontuação (0–10)'));
    await user.type(screen.getByLabelText('Pontuação (0–10)'), '6.5');
    await user.type(screen.getByLabelText('Resumo'), 'Resumo da avaliação');
    await user.click(screen.getByRole('button', { name: 'Guardar avaliação' }));

    await waitFor(() => expect(criarAvaliacaoApi).toHaveBeenCalledWith(expect.objectContaining({ cliente_id: 4, pontuacao: 6.5 })));
    await waitFor(() => expect(avaliacoesApi).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('status')).toHaveTextContent('Avaliação NIS2 registada com sucesso');
    expect(screen.getByText('6.5')).toBeInTheDocument();
  });
});

function clientDetail(id: number, nome: string) {
  return {
    cliente: { id, nome, nif: '123456789', email: null, ativo: true },
    contactos: [], gestores: [], ativos: [], incidentes: [], documentos: [], avaliacoes: [], pedidos: [],
  };
}

describe('MgrClientDetail no contexto administrativo', () => {
  it('cancela a leitura anterior, não mostra dados obsoletos e propaga ID/papel para Ativos e Incidentes', async () => {
    const user = userEvent.setup();
    let resolveA!: (value: ReturnType<typeof clientDetail>) => void;
    let resolveB!: (value: ReturnType<typeof clientDetail>) => void;
    const pendingA = new Promise<ReturnType<typeof clientDetail>>((resolve) => { resolveA = resolve; });
    const pendingB = new Promise<ReturnType<typeof clientDetail>>((resolve) => { resolveB = resolve; });
    const signals = new Map<number, AbortSignal | undefined>();
    clienteDetalheApi.mockImplementation((id: number, signal?: AbortSignal) => {
      signals.set(id, signal);
      return id === 7 ? pendingA : pendingB;
    });

    const { rerender } = render(<MgrClientDetail setPage={vi.fn()} role="admin" areaLabel="Administrador" clientId={7} />);
    await waitFor(() => expect(clienteDetalheApi).toHaveBeenCalledWith(7, expect.anything()));

    rerender(<MgrClientDetail setPage={vi.fn()} role="admin" areaLabel="Administrador" clientId={8} />);
    expect(signals.get(7)?.aborted).toBe(true);
    expect(screen.getByText('A carregar...')).toBeVisible();

    await act(async () => {
      resolveA(clientDetail(7, 'Cliente A'));
      await Promise.resolve();
    });
    expect(screen.queryByText('Cliente A')).not.toBeInTheDocument();

    await act(async () => {
      resolveB(clientDetail(8, 'Cliente B'));
      await Promise.resolve();
    });
    expect(await screen.findByRole('heading', { name: 'Cliente B' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ativos' }));
    expect(screen.getByText('assets:admin:8')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Incidentes' }));
    expect(screen.getByText('incidents:admin:8')).toBeVisible();
    expect(screen.getByText('Administrador')).toBeVisible();
  });
});
