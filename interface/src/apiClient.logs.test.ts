import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, logsApi, normaliseActivityLogsResponse } from './apiClient';

const validResponse = {
  items: [{
    id: 4,
    utilizador: { id: 2, nome: 'Administrador Real', email: 'admin@example.test' },
    acao: 'CRIAR_DOCUMENTO',
    entidade: 'documentos',
    entidade_id: 9,
    detalhes: { documento_id: 9 },
    criado_em: '2026-09-02T10:00:00.000Z',
  }],
  pagination: { limit: 50, offset: 0, total: 1, has_more: false, next_offset: null },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logsApi', () => {
  it('pede o endpoint Node canónico e devolve o contrato tipado', async () => {
    const request = vi.spyOn(api, 'request').mockResolvedValue({ data: validResponse } as never);
    await expect(logsApi()).resolves.toEqual(validResponse);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/logs?limit=50&offset=0', method: 'GET',
    }));
  });

  it('rejeita respostas malformadas em vez de deixar a página chamar map num valor inválido', () => {
    expect(() => normaliseActivityLogsResponse({ items: {}, pagination: {} })).toThrow('Resposta de logs inválida.');
    expect(() => normaliseActivityLogsResponse({
      items: [{ ...validResponse.items[0], detalhes: [] }], pagination: validResponse.pagination,
    })).toThrow('Resposta de logs inválida.');
  });

  it('não aceita números serializados como texto em nenhuma parte do contrato de logs', () => {
    const cases: Array<(response: typeof validResponse) => void> = [
      (response) => { response.items[0].id = '4' as never; },
      (response) => { response.items[0].utilizador!.id = '2' as never; },
      (response) => { response.items[0].entidade_id = '9' as never; },
      (response) => { response.pagination.limit = '50' as never; },
      (response) => { response.pagination.offset = '0' as never; },
      (response) => { response.pagination.total = '1' as never; },
      (response) => { response.pagination.next_offset = '1' as never; },
    ];
    for (const mutate of cases) {
      const response = structuredClone(validResponse);
      mutate(response);
      expect(() => normaliseActivityLogsResponse(response)).toThrow(/Resposta de logs inválida/);
    }
  });

  it('rejeita números não inteiros, não seguros e utilizadores malformados', () => {
    for (const id of [NaN, Infinity, -1, 1.5]) {
      expect(() => normaliseActivityLogsResponse({
        ...validResponse,
        items: [{ ...validResponse.items[0], id }],
      })).toThrow(/Resposta de logs inválida/);
    }
    expect(() => normaliseActivityLogsResponse({
      ...validResponse,
      items: [{ ...validResponse.items[0], utilizador: { id: 2, nome: 'Gestor', email: null } }],
    })).toThrow(/Resposta da API sem o campo obrigatório/);
  });

  it('exige timestamps ISO 8601 válidos, completos e com timezone', () => {
    for (const timestamp of [
      '2026-02-30T10:00:00Z',
      '02/09/2026 10:00:00',
      '2026-09-02T10:00:00',
      '',
      null,
      42,
    ]) {
      expect(() => normaliseActivityLogsResponse({
        ...validResponse,
        items: [{ ...validResponse.items[0], criado_em: timestamp }],
      })).toThrow('Resposta de logs inválida: criado_em.');
    }
    expect(() => normaliseActivityLogsResponse(validResponse)).not.toThrow();
  });
});
