import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcelImportWorkspace } from './ManagerPages';

const {
  clientesApi,
  descarregarModeloImportacaoAtivosApi,
  importacoesExcelApi,
} = vi.hoisted(() => ({
  clientesApi: vi.fn(),
  descarregarModeloImportacaoAtivosApi: vi.fn(),
  importacoesExcelApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return {
    ...actual,
    clientesApi,
    descarregarModeloImportacaoAtivosApi,
    importacoesExcelApi,
  };
});

describe('modelo Excel de ativos', () => {
  beforeEach(() => {
    clientesApi.mockResolvedValue([{ id: 7, nome: 'Organização de teste', nif: '509999999', ativo: true }]);
    importacoesExcelApi.mockResolvedValue([]);
    descarregarModeloImportacaoAtivosApi.mockResolvedValue({
      blob: new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename: 'modelo_importacao_ativos.xlsx',
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
});
