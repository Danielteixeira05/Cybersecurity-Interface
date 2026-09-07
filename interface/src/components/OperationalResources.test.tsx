import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { assetIdFromSearch, AssetsWorkspace, IncidentsWorkspace } from './OperationalResources';

const { ativosApi, ativoDetalheApi, clientesApi, incidentesApi, criarIncidenteApi } = vi.hoisted(() => ({
  ativosApi: vi.fn(),
  ativoDetalheApi: vi.fn(),
  clientesApi: vi.fn(),
  incidentesApi: vi.fn(),
  criarIncidenteApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return {
    ...actual,
    ativosApi,
    ativoDetalheApi,
    clientesApi,
    incidentesApi,
    criarIncidenteApi,
  };
});

describe('IncidentsWorkspace para Cliente', () => {
  beforeEach(() => {
    ativosApi.mockResolvedValue([]);
    clientesApi.mockResolvedValue([{ id: 21, nome: 'Organização de teste', nif: '509999999', ativo: true }]);
    incidentesApi.mockResolvedValue([]);
    criarIncidenteApi.mockReset();
  });

  it('permite apenas a submissão inicial Aberta da organização associada', async () => {
    const user = userEvent.setup();
    criarIncidenteApi.mockResolvedValue({
      id: 1,
      cliente_id: 21,
      titulo: 'Teste de incidente',
      estado: 'ABERTO',
      gravidade: 'MEDIA',
      notificado_nis2: false,
    });

    render(<IncidentsWorkspace role="client" />);
    await screen.findByText('Sem incidentes disponíveis.');
    expect(screen.queryByText('Todos os clientes')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reportar Incidente' }));

    const dialog = screen.getByRole('dialog', { name: 'Reportar incidente' });
    const form = within(dialog);
    expect(form.getByLabelText('Cliente')).toBeDisabled();
    expect(form.getByLabelText('Estado')).toBeDisabled();
    expect(form.getByLabelText('Estado')).toHaveTextContent('ABERTO');
    expect(form.queryByLabelText(/Notificado às autoridades NIS2/i)).not.toBeInTheDocument();
    expect(form.queryByLabelText('Data de encerramento')).not.toBeInTheDocument();

    await user.type(form.getByLabelText('Código'), 'INC-TESTE-001');
    await user.type(form.getByLabelText('Tipo'), 'Acesso não autorizado');
    fireEvent.change(form.getByLabelText('Data e hora de deteção'), { target: { value: '2026-08-31T10:00' } });
    await user.type(form.getByLabelText('Descrição'), 'Descrição de teste sem dados reais.');
    await user.click(form.getByRole('button', { name: 'Submeter report' }));

    expect(criarIncidenteApi).toHaveBeenCalledWith(expect.objectContaining({
      cliente_id: 21,
      estado: 'ABERTO',
      notificado_nis2: false,
      ativo: true,
    }));
  }, 15_000);
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>;
}

const alphaAsset = {
  id: 41,
  cliente_id: 7,
  cliente_nome: 'Alpha Saúde',
  nome: 'ATIVO-ALPHA',
  criticidade: 'MEDIA',
  numero_inventario: 'ALPHA-001',
};

const secondAlphaAsset = {
  ...alphaAsset,
  id: 42,
  nome: 'ATIVO-ALPHA-DOIS',
  numero_inventario: 'ALPHA-002',
};

describe('AssetsWorkspace para Cliente', () => {
  beforeEach(() => {
    ativosApi.mockResolvedValue([]);
    ativoDetalheApi.mockReset();
    clientesApi.mockResolvedValue([{ id: 7, nome: 'Alpha Saúde', nif: '509999999', ativo: true }]);
  });

  it('mantém a consulta sem filtros globais e encaminha apenas para a importação Excel existente', async () => {
    const user = userEvent.setup();
    const onImportExcel = vi.fn();
    render(<MemoryRouter><AssetsWorkspace role="client" onImportExcel={onImportExcel} /></MemoryRouter>);

    expect(await screen.findByText('Sem ativos tecnológicos disponíveis.')).toBeVisible();
    expect(screen.queryByText('Todos os clientes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Novo Ativo/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Importar ativos por Excel' }));
    expect(onImportExcel).toHaveBeenCalledTimes(1);
  });

  it('usa um assetId canónico no URL e Voltar aos Ativos preserva a lista do Cliente', async () => {
    const user = userEvent.setup();
    ativosApi.mockResolvedValue([alphaAsset]);
    ativoDetalheApi.mockResolvedValue(alphaAsset);
    render(<MemoryRouter initialEntries={['/cliente/ativos']}><AssetsWorkspace role="client" /><LocationProbe /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: 'Ver detalhe de ATIVO-ALPHA' }));
    expect(await screen.findByRole('dialog', { name: 'Detalhe do ativo' })).toHaveTextContent('ATIVO-ALPHA');
    expect(screen.getByTestId('location')).toHaveTextContent('/cliente/ativos?assetId=41');
    expect(ativoDetalheApi).toHaveBeenCalledWith(41, expect.any(AbortSignal));

    await user.click(screen.getByRole('button', { name: 'Voltar aos Ativos' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/cliente/ativos');
    expect(screen.queryByRole('dialog', { name: 'Detalhe do ativo' })).not.toBeInTheDocument();
    expect(screen.getByText('ATIVO-ALPHA')).toBeVisible();
  });

  it('restaura o mesmo ativo diretamente pelo URL após refresh', async () => {
    ativosApi.mockResolvedValue([alphaAsset]);
    ativoDetalheApi.mockResolvedValue(alphaAsset);
    render(<MemoryRouter initialEntries={['/cliente/ativos?assetId=41']}><AssetsWorkspace role="client" /></MemoryRouter>);
    expect(await screen.findByRole('dialog', { name: 'Detalhe do ativo' })).toHaveTextContent('ATIVO-ALPHA');
  });

  it.each([
    ['manager', '/gestor/clientes/7#assets', '/gestor/clientes/7?assetId=41#assets'],
    ['admin', '/administrador/clientes/7#assets', '/administrador/clientes/7?assetId=41#assets'],
  ] as const)('preserva o cliente e o perfil ao voltar no contexto %s', async (role, initialUrl, detailUrl) => {
    const user = userEvent.setup();
    ativosApi.mockResolvedValue([alphaAsset]);
    ativoDetalheApi.mockResolvedValue(alphaAsset);
    render(<MemoryRouter initialEntries={[initialUrl]}><AssetsWorkspace role={role} clientId={7} compact /><LocationProbe /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: 'Ver detalhe de ATIVO-ALPHA' }));
    expect(await screen.findByRole('dialog', { name: 'Detalhe do ativo' })).toHaveTextContent('ATIVO-ALPHA');
    expect(screen.getByTestId('location')).toHaveTextContent(detailUrl);

    await user.click(screen.getByRole('button', { name: 'Voltar aos Ativos' }));
    expect(screen.getByTestId('location')).toHaveTextContent(initialUrl);
    expect(screen.getByText('ATIVO-ALPHA')).toBeVisible();
  });

  it('nunca apresenta a resposta antiga ao trocar rapidamente de assetId', async () => {
    const user = userEvent.setup();
    ativosApi.mockResolvedValue([alphaAsset, secondAlphaAsset]);
    let resolveFirst!: (value: typeof alphaAsset) => void;
    let resolveSecond!: (value: typeof secondAlphaAsset) => void;
    ativoDetalheApi.mockImplementation((id: number) => new Promise((resolve) => {
      if (id === 41) resolveFirst = resolve;
      else resolveSecond = resolve;
    }));
    render(<MemoryRouter initialEntries={['/cliente/ativos']}><AssetsWorkspace role="client" /><LocationProbe /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: 'Ver detalhe de ATIVO-ALPHA' }));
    await user.click(screen.getByRole('button', { name: 'Ver detalhe de ATIVO-ALPHA-DOIS' }));
    resolveSecond(secondAlphaAsset);
    expect(await screen.findByText('ATIVO-ALPHA-DOIS')).toBeVisible();
    resolveFirst(alphaAsset);
    await Promise.resolve();
    expect(within(screen.getByRole('dialog', { name: 'Detalhe do ativo' })).queryByText('ATIVO-ALPHA', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Detalhe do ativo' })).toHaveTextContent('ATIVO-ALPHA-DOIS');
    expect(screen.getByTestId('location')).toHaveTextContent('/cliente/ativos?assetId=42');
  });

  it('não mostra um ativo devolvido para outro cliente no contexto compacto', async () => {
    ativosApi.mockResolvedValue([alphaAsset]);
    ativoDetalheApi.mockResolvedValue({ ...alphaAsset, id: 42, cliente_id: 8, nome: 'ATIVO-OUTRA-ORGANIZACAO' });
    render(<MemoryRouter initialEntries={['/gestor/clientes/7?assetId=42#assets']}><AssetsWorkspace role="manager" clientId={7} compact /></MemoryRouter>);
    expect(await screen.findByText('O ativo não pertence ao cliente selecionado.')).toBeVisible();
    expect(screen.queryByText('ATIVO-OUTRA-ORGANIZACAO')).not.toBeInTheDocument();
  });

  it('valida assetId lexicalmente antes de consultar a API', async () => {
    for (const value of ['0', '-1', '01', '1.0', '1e2', 'texto', ' 1']) {
      expect(assetIdFromSearch(`?assetId=${encodeURIComponent(value)}`)).toBeUndefined();
    }
    expect(assetIdFromSearch('?assetId=123')).toBe(123);
  });
});
