import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiLoginResponse } from '../apiClient';
import LoginPage from './LoginPage';

const { loginApi } = vi.hoisted(() => ({ loginApi: vi.fn() }));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return { ...actual, loginApi };
});

const managerLogin: ApiLoginResponse = {
  utilizador: {
    id: 7,
    nome: 'Gestor de teste',
    email: 'gestor.teste@example.test',
    perfil_id: 2,
    perfil_nome: 'Gestor',
    perfil_codigo: 'COLABORADOR',
    ativo: true,
  },
  cliente: null,
};

describe('LoginPage', () => {
  beforeEach(() => {
    loginApi.mockReset();
  });

  it('submete as credenciais introduzidas e encaminha o Gestor para o portal', async () => {
    const user = userEvent.setup();
    const setRole = vi.fn();
    const setPage = vi.fn();
    loginApi.mockResolvedValue(managerLogin);

    render(<LoginPage setRole={setRole} setPage={setPage} />);

    await user.type(screen.getByLabelText('Email'), ' gestor.teste@example.test ');
    await user.type(screen.getByLabelText('Senha'), 'uma-password-de-teste');
    await user.click(screen.getByRole('button', { name: /Entrar na plataforma/i }));

    expect(loginApi).toHaveBeenCalledWith({
      email: 'gestor.teste@example.test',
      password: 'uma-password-de-teste',
    });
    expect(setRole).toHaveBeenCalledWith('manager');
    expect(setPage).toHaveBeenCalledWith('mgr-dashboard');
  });

  it('apresenta um erro devolvido pela API sem expor a palavra-passe', async () => {
    const user = userEvent.setup();
    loginApi.mockRejectedValue(new Error('Credenciais inválidas.'));

    render(<LoginPage setRole={vi.fn()} setPage={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'gestor.teste@example.test');
    await user.type(screen.getByLabelText('Senha'), 'segredo-local');
    await user.click(screen.getByRole('button', { name: /Entrar na plataforma/i }));

    expect(await screen.findByText('Credenciais inválidas.')).toBeVisible();
    expect(screen.queryByText('segredo-local')).not.toBeInTheDocument();
  });
});
