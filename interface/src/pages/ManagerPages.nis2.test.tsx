import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MgrNIS2 } from './ManagerPages';

const { avaliacoesApi, clientesApi, criarAvaliacaoApi, estadosConformidadeApi } = vi.hoisted(() => ({
  avaliacoesApi: vi.fn(),
  clientesApi: vi.fn(),
  criarAvaliacaoApi: vi.fn(),
  estadosConformidadeApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../apiClient')>()),
  avaliacoesApi,
  clientesApi,
  criarAvaliacaoApi,
  estadosConformidadeApi,
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
