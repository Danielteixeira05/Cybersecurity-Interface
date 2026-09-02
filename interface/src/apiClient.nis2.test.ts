import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, avaliacoesApi, estadosConformidadeApi, normaliseAvaliacao } from './apiClient';

afterEach(() => vi.restoreAllMocks());

const assessment = {
  id: 4, cliente_id: 2, cliente_nome: 'Organização', estado_conformidade_id: 3,
  estado_conformidade_codigo: 'CONFORME', estado_conformidade_nome: 'Conforme',
  data_avaliacao: '2026-09-02', nivel_risco: 'BAIXO', score: 8.5, pontuacao: 8.5,
  resumo: 'Avaliação válida', recomendacoes: null,
};

describe('contrato NIS2', () => {
  it('usa a rota canónica sem barra final e valida respostas de avaliações', async () => {
    const request = vi.spyOn(api, 'request').mockResolvedValue({ data: [assessment] } as never);
    await expect(avaliacoesApi(2)).resolves.toEqual([assessment]);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/avaliacoes?cliente_id=2', method: 'GET' }));
    for (const invalid of [{ ...assessment, id: '4' }, { ...assessment, cliente_id: 0 }, { ...assessment, score: '8.5' }]) {
      expect(() => normaliseAvaliacao(invalid)).toThrow('Resposta de avaliação inválida');
    }
  });

  it('obtém o catálogo real de estados e rejeita contratos malformados', async () => {
    vi.spyOn(api, 'request').mockResolvedValue({ data: [{ id: 3, codigo: 'CONFORME', nome: 'Conforme' }] } as never);
    await expect(estadosConformidadeApi()).resolves.toEqual([{ id: 3, codigo: 'CONFORME', nome: 'Conforme' }]);
    vi.spyOn(api, 'request').mockResolvedValue({ data: [{ id: '3', codigo: 'CONFORME', nome: 'Conforme' }] } as never);
    await expect(estadosConformidadeApi()).rejects.toThrow('Resposta de estados de conformidade inválida');
  });
});
