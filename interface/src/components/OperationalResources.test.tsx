import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentsWorkspace } from './OperationalResources';

const { clientesApi, incidentesApi, criarIncidenteApi } = vi.hoisted(() => ({
  clientesApi: vi.fn(),
  incidentesApi: vi.fn(),
  criarIncidenteApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return {
    ...actual,
    clientesApi,
    incidentesApi,
    criarIncidenteApi,
  };
});

describe('IncidentsWorkspace para Cliente', () => {
  beforeEach(() => {
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
  });
});
