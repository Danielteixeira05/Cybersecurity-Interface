import { useState } from 'react';
import type { UserRole, Page } from '../types';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Alert } from '../components/DesignSystem';
import { loginApi, session, type ApiCliente, type ApiUtilizador } from '../apiClient';

export default function LoginPage({
  setRole,
  setPage,
  setCurrentUser,
  setCurrentClient,
}: {
  setRole: (r: UserRole) => void;
  setPage: (p: Page) => void;
  setCurrentUser?: (u: ApiUtilizador | null) => void;
  setCurrentClient?: (c: ApiCliente | null) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoLogins: Array<{ email: string; password: string; role: UserRole; perfil: string; color: string }> = [
    {
      email: 'admin@ciberbox.local',
      password: 'Demo2026!',
      role: 'admin',
      perfil: 'Administrador',
      color: 'text-purple-600 bg-purple-50 border border-purple-200',
    },
    {
      email: 'colaborador@ciberbox.local',
      password: 'Demo2026!',
      role: 'manager',
      perfil: 'Colaborador (Gestor)',
      color: 'text-blue-600 bg-blue-50 border border-blue-200',
    },
    {
      email: 'cliente1@ciberbox.local',
      password: 'Demo2026!',
      role: 'cliente',
      perfil: 'Cliente (Alpha Saude, S.A.)',
      color: 'text-green-600 bg-green-50 border border-green-200',
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim(), password });
      const role = res.utilizador.role || null;
      setRole(role);
      setCurrentUser?.(res.utilizador);
      setCurrentClient?.(res.cliente || null);
      if (role === 'admin') setPage('admin-dashboard');
      else if (role === 'manager') setPage('mgr-dashboard');
      else if (role === 'cliente') setPage('cli-dashboard');
      else setPage('home');
    } catch (err: any) {
      setError(err?.message || 'Credenciais invalidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12">
        <button onClick={() => setPage('home')} className="flex items-center gap-2.5">
          <img src="/src/imports/CiberBoxSecur-Minimal-NegativeVersion_c_pia.png" alt="CiberBoxSecur" className="w-9 h-9 object-contain" />
          <span className="font-bold text-white font-display text-lg tracking-tight">CiberBox<span className="text-blue-400">Secur</span></span>
        </button>

        <div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-xs text-slate-400 font-mono mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />DADOS DA BASE DE DADOS NEON
            </p>
            {[
              { label: 'Clientes registados', value: '---', color: 'text-blue-400', id: 'lb-clientes' },
              { label: 'Ativos monitorizados', value: '---', color: 'text-indigo-400', id: 'lb-ativos' },
              { label: 'Incidentes abertos', value: '---', color: 'text-amber-400', id: 'lb-incidentes' },
              { label: 'Pedidos de suporte', value: '---', color: 'text-green-400', id: 'lb-pedidos' },
            ].map((s) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <blockquote className="text-slate-300 text-sm italic leading-relaxed mb-4">
            "A CiberBoxSecur ajudou-nos a alcançar a conformidade NIS2 em apenas 4 meses — um processo sem fricções com apoio excecional."
          </blockquote>
          <p className="text-xs text-slate-500">— António Silva, Diretor de TI, Grupo Financeiro Norte</p>
          <p className="mt-6 text-[11px] text-slate-600 font-mono">
            Projeto de Bases de Dados — Daniel Teixiera, n. 27645 — 2025/2026
          </p>
        </div>

        <p className="text-xs text-slate-600">© 2025 CiberBoxSecur Lda. Certificado ISO/IEC 27001.</p>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/src/imports/CiberBoxSecur-Minimal-color_c_pia-1.png" alt="CiberBoxSecur" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-900 font-display">CiberBox<span className="text-blue-600">Secur</span></span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 font-display mb-2">Iniciar Sessão</h1>
          <p className="text-sm text-slate-500 mb-8">Aceda ao portal de segurança</p>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilizador@ciberbox.local"
                required
                disabled={loading}
                className="bg-white border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 w-full focus:border-blue-500 transition-base disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="bg-white border border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 w-full focus:border-blue-500 transition-base pr-10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" className="accent-blue-600 rounded" /> Lembrar-me
              </label>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-700 transition-base font-medium">
                Esqueceu a palavra-passe?
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full justify-center py-2.5 text-sm">
              <Lock size={14} />
              {loading ? 'A autenticar...' : 'Entrar'}
            </Button>
          </form>

          {/* Contas de demonstração */}
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 font-mono mb-3 uppercase tracking-wide font-semibold">
              Contas de Demonstração <span className="normal-case">(palavra-passe: Demo2026!)</span>
            </p>
            <div className="space-y-2">
              {demoLogins.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-base text-left"
                >
                  <span className="text-xs text-slate-600 font-mono">{a.email}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.color}`}>{a.perfil}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

