import { describe, expect, it } from 'vitest';
import { managerIdFromPathname, pageFromPathname } from './App';

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
