import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Nis2AssessmentForm } from './Nis2AssessmentForm';

const { criarAvaliacaoApi, estadosConformidadeApi } = vi.hoisted(() => ({
  criarAvaliacaoApi: vi.fn(),
  estadosConformidadeApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../apiClient')>()),
  criarAvaliacaoApi,
  estadosConformidadeApi,
}));

const client = { id: 4, nome: 'Organização associada', nif: '123456789', ativo: true };
const created = {
  id: 21, cliente_id: 4, cliente_nome: client.nome, estado_conformidade_id: 2,
  estado_conformidade_codigo: 'EM_REVISAO', estado_conformidade_nome: 'Em revisão',
  data_avaliacao: '2026-09-02', nivel_risco: 'MEDIO', score: 7.5, pontuacao: 7.5,
  resumo: 'Resumo válido', recomendacoes: null,
};

describe('Nis2AssessmentForm', () => {
  beforeEach(() => {
    criarAvaliacaoApi.mockReset();
    estadosConformidadeApi.mockReset();
    estadosConformidadeApi.mockResolvedValue([
      { id: 2, codigo: 'EM_REVISAO', nome: 'Em revisão' },
      { id: 3, codigo: 'CONFORME', nome: 'Conforme' },
    ]);
  });

  async function completeForm(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(screen.getByLabelText('Organização'), '4');
    await user.clear(screen.getByLabelText('Pontuação (0–10)'));
    await user.type(screen.getByLabelText('Pontuação (0–10)'), '7.5');
    await user.type(screen.getByLabelText('Resumo'), '  Resumo válido  ');
    await user.type(screen.getByLabelText(/Recomendações/), ' Rever controlo ');
  }

  it('carrega estados reais, mostra apenas organizações recebidas e envia o payload tipado', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    criarAvaliacaoApi.mockResolvedValue(created);
    render(<Nis2AssessmentForm role="manager" clients={[client]} onCreated={onCreated} onCancel={vi.fn()} />);

    await screen.findByRole('option', { name: 'Em revisão (EM_REVISAO)' });
    await completeForm(user);
    await user.click(screen.getByRole('button', { name: 'Guardar avaliação' }));

    await waitFor(() => expect(criarAvaliacaoApi).toHaveBeenCalledTimes(1));
    expect(criarAvaliacaoApi).toHaveBeenCalledWith(expect.objectContaining({
      cliente_id: 4, estado_conformidade_id: 2, nivel_risco: 'MEDIO', pontuacao: 7.5,
      resumo: 'Resumo válido', recomendacoes: 'Rever controlo',
    }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
  });

  it('fixa a organização no detalhe e não permite trocar por outro cliente', async () => {
    render(<Nis2AssessmentForm role="manager" clients={[client, { ...client, id: 5, nome: 'Não elegível' }]} fixedClient={client} onCreated={vi.fn()} onCancel={vi.fn()} />);
    await screen.findByText('Organização associada — NIF 123456789');
    expect(screen.queryByLabelText('Organização')).not.toBeInTheDocument();
  });

  it('representa loading/erro de estados e não submete duas vezes enquanto guarda', async () => {
    const user = userEvent.setup();
    let resolveCreate: ((value: typeof created) => void) | undefined;
    criarAvaliacaoApi.mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve; }));
    render(<Nis2AssessmentForm role="manager" clients={[client]} onCreated={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'A carregar estados…' })).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Em revisão (EM_REVISAO)' });
    await completeForm(user);
    const submit = screen.getByRole('button', { name: 'Guardar avaliação' });
    await user.click(submit);
    await user.click(submit);
    expect(criarAvaliacaoApi).toHaveBeenCalledTimes(1);
    resolveCreate?.(created);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar avaliação' })).not.toBeDisabled());
  });

  it('mostra erros de API e valida score/resumo antes de escrever', async () => {
    const user = userEvent.setup();
    criarAvaliacaoApi.mockRejectedValue(new Error('Erro controlado da API.'));
    render(<Nis2AssessmentForm role="manager" clients={[client]} onCreated={vi.fn()} onCancel={vi.fn()} />);
    await screen.findByRole('option', { name: 'Em revisão (EM_REVISAO)' });
    await user.selectOptions(screen.getByLabelText('Organização'), '4');
    await user.clear(screen.getByLabelText('Pontuação (0–10)'));
    await user.type(screen.getByLabelText('Pontuação (0–10)'), '10.001');
    await user.type(screen.getByLabelText('Resumo'), 'Resumo válido');
    await user.click(screen.getByRole('button', { name: 'Guardar avaliação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no máximo duas casas decimais');
    expect(criarAvaliacaoApi).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Pontuação (0–10)'));
    await user.type(screen.getByLabelText('Pontuação (0–10)'), '8');
    await user.click(screen.getByRole('button', { name: 'Guardar avaliação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro controlado da API.');
  });
});
