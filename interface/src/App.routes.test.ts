import { describe, expect, it } from 'vitest';
import { adminClientIdFromPathname, managerClientIdFromPathname, managerIdFromPathname, pageFromPathname } from './App';

describe('rota de detalhe administrativo de Gestor', () => {
  it('preserva o ID numa rota canónica após refresh', () => {
    expect(pageFromPathname('/administrador/utilizadores/gestor/42')).toBe('admin-user-manager');
    expect(managerIdFromPathname('/administrador/utilizadores/gestor/42')).toBe(42);
  });

  it('aceita apenas IDs lexicamente canónicos e positivos', () => {
    expect(pageFromPathname('/administrador/utilizadores/gestor')).toBe('admin-user-manager');
    expect(managerIdFromPathname('/administrador/utilizadores/gestor')).toBeUndefined();
    for (const invalidId of ['0', '-1', '1.0', '01', '1e2', '%201', '1%20', 'abc']) {
      expect(managerIdFromPathname(`/administrador/utilizadores/gestor/${invalidId}`)).toBeUndefined();
    }
  });
});

describe('rota administrativa demonstrativa removida', () => {
  it('resolve a antiga rota de Permissões para o dashboard', () => {
    expect(pageFromPathname('/administrador/permissoes')).toBe('admin-dashboard');
    expect(pageFromPathname('/administrador/permissoes/')).toBe('admin-dashboard');
  });
});

describe('rota de detalhe administrativo de Cliente', () => {
  it('transporta um ID canónico, preservado após refresh', () => {
    expect(pageFromPathname('/administrador/clientes/42')).toBe('admin-client-detail');
    expect(adminClientIdFromPathname('/administrador/clientes/42')).toBe(42);
  });

  it('não aceita IDs ambíguos e trata a rota antiga sem estado de sessão', () => {
    expect(pageFromPathname('/administrador/clientes/detalhe')).toBe('admin-clients');
    for (const invalidId of ['0', '-1', '1.0', '01', '1e2', '%201', '1%20', 'abc', '999999999999999999999']) {
      expect(pageFromPathname(`/administrador/clientes/${invalidId}`)).toBe('admin-client-detail');
      expect(adminClientIdFromPathname(`/administrador/clientes/${invalidId}`)).toBeUndefined();
    }
  });

  it('mantém a mesma validação de ID na rota do Gestor', () => {
    expect(managerClientIdFromPathname('/gestor/clientes/9')).toBe(9);
    expect(managerClientIdFromPathname('/gestor/clientes/01')).toBeUndefined();
  });
});
