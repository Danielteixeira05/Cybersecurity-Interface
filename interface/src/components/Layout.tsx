import { useState } from 'react';
import type { Page, UserRole } from '../types';
import { session, logoutApi } from '../apiClient';

interface NavbarProps {
  page: Page;
  setPage: (p: Page) => void;
  role: UserRole;
  onBackToPortal?: () => void;
}

export function PublicNavbar({ page, setPage, role, onBackToPortal }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sess = session.get();
  const displayRole = role || sess.role;
  const displayName = sess.utilizador?.nome;

  const navItems: { key: Page; label: string }[] = [
    { key: 'home', label: 'Início' },
    { key: 'about', label: 'Sobre' },
    { key: 'mission', label: 'Missão' },
    { key: 'services', label: 'Serviços' },
    { key: 'news', label: 'Novidades' },
    { key: 'contact', label: 'Contacto' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-2 font-display text-xl font-bold text-slate-900"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
            </svg>
          </div>
          <span>CiberBox</span>
          <span className="text-blue-600">Secur</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((it) => (
            <button
              key={it.key}
              onClick={() => setPage(it.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-base ${
                page === it.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {displayRole ? (
            <div className="flex items-center gap-2">
              {onBackToPortal && (
                <button
                  onClick={onBackToPortal}
                  className="hidden rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:inline-flex"
                >
                  ← Portal
                </button>
              )}
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                <div className="text-xs capitalize text-slate-500">{displayRole}</div>
              </div>
              <button
                onClick={async () => {
                  await logoutApi();
                  setPage('home');
                  window.location.reload();
                }}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPage('login')}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Iniciar Sessão
            </button>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {navItems.map((it) => (
              <button
                key={it.key}
                onClick={() => {
                  setPage(it.key);
                  setMenuOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                  page === it.key ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

interface AppLayoutProps {
  role: UserRole;
  page: Page;
  setPage: (p: Page) => void;
  setRole: (r: UserRole) => void;
  onHome: () => void;
}

interface SideItem {
  key: Page;
  label: string;
  icon: JSX.Element;
}

const ICON = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 3v18h18" strokeLinecap="round" />
      <path d="M7 15l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-2a6 6 0 016-6h2a6 6 0 016 6v2" strokeLinecap="round" />
      <circle cx="17" cy="7" r="3" />
      <path d="M22 20v-1a5 5 0 00-3-4.58" strokeLinecap="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  incidents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 9v4m0 4h.01M10.3 3.86l-8.2 14.2a2 2 0 001.73 3h16.34a2 2 0 001.73-3l-8.2-14.2a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeLinejoin="round" />
      <path d="M14 3v6h6" strokeLinejoin="round" />
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h5M8 9h3" strokeLinecap="round" />
    </svg>
  ),
  assets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="2" y="4" width="20" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" strokeLinecap="round" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeLinejoin="round" />
    </svg>
  ),
  risk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 2L2 22h20L12 2z" strokeLinejoin="round" />
      <path d="M12 9v5M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  nis2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M9 12l2 2 4-4M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  pentests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  evidence: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  excel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinejoin="round" />
      <path d="M8 13l3 4m0-4l-3 4M13 13h4M13 17h4" strokeLinecap="round" />
    </svg>
  ),
  workspace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a6 6 0 016-6h4a6 6 0 016 6v2" strokeLinecap="round" />
    </svg>
  ),
  communication: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" />
    </svg>
  ),
  content: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" strokeLinecap="round" />
    </svg>
  ),
  permissions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
};

const ADMIN_ITEMS: SideItem[] = [
  { key: 'admin-dashboard', label: 'Dashboard', icon: ICON.dashboard },
  { key: 'admin-analytics', label: 'Análises', icon: ICON.analytics },
  { key: 'admin-users', label: 'Utilizadores', icon: ICON.users },
  { key: 'admin-clients', label: 'Clientes', icon: ICON.clients },
  { key: 'admin-documents', label: 'Documentos', icon: ICON.documents },
  { key: 'admin-incidents', label: 'Incidentes', icon: ICON.incidents },
  { key: 'admin-logs', label: 'Logs', icon: ICON.logs },
  { key: 'admin-site-content', label: 'Conteúdo', icon: ICON.content },
  { key: 'admin-permissions', label: 'Permissões', icon: ICON.permissions },
];

const MANAGER_ITEMS: SideItem[] = [
  { key: 'mgr-dashboard', label: 'Dashboard', icon: ICON.dashboard },
  { key: 'mgr-analytics', label: 'Análises', icon: ICON.analytics },
  { key: 'mgr-clients', label: 'Clientes', icon: ICON.clients },
  { key: 'mgr-assets', label: 'Ativos', icon: ICON.assets },
  { key: 'mgr-incidents', label: 'Incidentes', icon: ICON.incidents },
  { key: 'mgr-documents', label: 'Documentos', icon: ICON.documents },
  { key: 'mgr-requests', label: 'Pedidos', icon: ICON.requests },
  { key: 'mgr-risk', label: 'Riscos', icon: ICON.risk },
  { key: 'mgr-nis2', label: 'NIS2', icon: ICON.nis2 },
  { key: 'mgr-reports', label: 'Relatórios', icon: ICON.reports },
  { key: 'mgr-pentests', label: 'Pentests', icon: ICON.pentests },
  { key: 'mgr-evidence', label: 'Evidências', icon: ICON.evidence },
  { key: 'mgr-excel', label: 'Importar Excel', icon: ICON.excel },
];

const CLIENT_ITEMS: SideItem[] = [
  { key: 'cli-dashboard', label: 'Dashboard', icon: ICON.dashboard },
  { key: 'cli-workspace', label: 'Espaço', icon: ICON.workspace },
  { key: 'cli-assets', label: 'Meus Ativos', icon: ICON.assets },
  { key: 'cli-incidents', label: 'Incidentes', icon: ICON.incidents },
  { key: 'cli-documents', label: 'Documentos', icon: ICON.documents },
  { key: 'cli-requests', label: 'Pedidos', icon: ICON.requests },
  { key: 'cli-communication', label: 'Comunicação', icon: ICON.communication },
  { key: 'cli-risk', label: 'Riscos', icon: ICON.risk },
  { key: 'cli-nis2', label: 'NIS2', icon: ICON.nis2 },
  { key: 'cli-reports', label: 'Relatórios', icon: ICON.reports },
  { key: 'cli-pentests', label: 'Pentests', icon: ICON.pentests },
  { key: 'cli-profile', label: 'Perfil', icon: ICON.profile },
];

export function AppLayout({ role, page, setPage, setRole, onHome }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sess = session.get();
  const items =
    role === 'admin' ? ADMIN_ITEMS : role === 'manager' ? MANAGER_ITEMS : CLIENT_ITEMS;
  const title =
    role === 'admin' ? 'Administrador' : role === 'manager' ? 'Colaborador' : 'Área Cliente';
  const roleBadge =
    role === 'admin'
      ? 'bg-rose-500/20 text-rose-200'
      : role === 'manager'
        ? 'bg-amber-500/20 text-amber-200'
        : 'bg-emerald-500/20 text-emerald-200';

  return (
    <div className="flex min-h-screen bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <button onClick={onHome} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold">
              CiberBox<span className="text-blue-400">Secur</span>
            </span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex h-[calc(100%-8rem)] flex-col gap-0.5 overflow-y-auto p-3">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => {
                setPage(it.key);
                setSidebarOpen(false);
              }}
              className={`sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 ${
                page === it.key ? 'active' : ''
              }`}
            >
              <span className="text-slate-400 [.active_&]:text-blue-300">{it.icon}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white">
              {(sess.utilizador?.nome || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {sess.utilizador?.nome || 'Utilizador'}
              </div>
              <div className="truncate text-xs text-slate-400">
                {sess.utilizador?.email || 'email@exemplo.pt'}
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logoutApi();
              setRole(null);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div>
              <div className="text-sm font-medium text-slate-500">{title}</div>
              <div className="text-lg font-semibold text-slate-900">
                {items.find((i) => i.key === page)?.label || 'Dashboard'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${roleBadge}`}>{role}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{/* children filled by App.tsx via conditionals */}</main>
      </div>
    </div>
  );
}
