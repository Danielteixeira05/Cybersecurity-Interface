import { useState } from 'react';
import type { UserRole, Page } from '../types';
import { loginApi, mapPerfilToRole } from '../apiClient';
import type { ApiLoginResponse } from '../apiClient';

interface Props {
  setRole: (r: UserRole) => void;
  setPage: (p: Page) => void;
}

export default function LoginPage({ setRole, setPage }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res: ApiLoginResponse = await loginApi({ email: email.trim(), password });
      const r = mapPerfilToRole(res.utilizador.perfil_codigo);
      setRole(r);
      if (r === 'admin') setPage('admin-dashboard');
      else if (r === 'manager') setPage('mgr-dashboard');
      else if (r === 'client') setPage('cli-dashboard');
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar sessão. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="hero-orb-1" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' }} />
      <div className="hero-orb-2" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <div className="hidden flex-1 flex-col justify-center px-12 py-16 lg:flex">
          <button
            onClick={() => setPage('home')}
            className="mb-12 flex items-center gap-2 text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-2xl font-bold">
              CiberBox<span className="text-blue-400">Secur</span>
            </span>
          </button>

          <h1 className="font-display text-4xl font-bold leading-tight text-white lg:text-5xl">
            Plataforma de Gestão de
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Cibersegurança
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-slate-300">
            Gere ativos, incidentes, conformidade NIS2 e pedidos dos seus clientes numa única plataforma segura e em conformidade.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { n: '256-bit', t: 'Encriptação AES' },
              { n: 'NIS2', t: 'Conformidade Total' },
              { n: 'ISO 27001', t: 'Melhores Práticas' },
              { n: '99.9%', t: 'Uptime garantido' },
            ].map((f) => (
              <div key={f.n} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="font-display text-2xl font-bold text-white">{f.n}</div>
                <div className="mt-1 text-sm text-slate-400">{f.t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="lg:hidden mb-8 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display text-xl font-bold text-slate-900">CiberBoxSecur</span>
            </div>

            <h2 className="font-display text-3xl font-bold text-slate-900">Iniciar Sessão</h2>
            <p className="mt-2 text-slate-500">Bem-vindo de volta. Introduza as suas credenciais.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.pt"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M17.94 17.94A10.94 10.94 0 0112 20c-5.5 0-10-4.5-10-10a10.94 10.94 0 012.06-5.94M9.9 4.24A10 10 0 0112 4c5.5 0 10 4.5 10 10a10 10 0 01-.24 2.1M1 1l22 22" strokeLinecap="round" />
                        <path d="M9.88 9.88a3 3 0 104.24 4.24" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-5 w-5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-base hover:from-blue-700 hover:to-violet-700 disabled:opacity-60"
              >
                {loading && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? 'A autenticar...' : 'Entrar na Plataforma'}
              </button>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900">
                <div className="font-semibold mb-1">Contas de demonstração:</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div>admin@ciberbox.local / Demo2026!</div>
                  <div>colaborador@ciberbox.local / Demo2026!</div>
                  <div>cliente1@ciberbox.local / Demo2026!</div>
                </div>
                <div className="mt-2 text-[10px] text-blue-700/80">
                  Projeto de Bases de Dados — Daniel Teixeira, n.º 27645 · 2025/2026
                </div>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              <button
                onClick={() => setPage('home')}
                className="text-blue-600 hover:underline"
              >
                ← Voltar ao site público
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
