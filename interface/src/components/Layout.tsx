import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Page, UserRole } from '../types';
import { session, logoutApi } from '../apiClient';
import { useRealtime } from '../realtime';

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
    { key: 'services', label: 'Serviços' },
    { key: 'news', label: 'Notícias' },
    { key: 'contact', label: 'Contacto' },
  ];

  return (
    <header className="public-navbar">
      <div className="container-xl public-navbar__inner">
        <button
          type="button"
          onClick={() => setPage('home')}
          className="public-navbar__brand"
          aria-label="CiberBoxSecur — Início"
        >
          <span className="public-navbar__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
              <path d="M8.5 12.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="public-navbar__brand-name">
            CiberBox<span>Secur</span>
          </span>
        </button>

        <nav className="public-navbar__desktop-nav" aria-label="Navegação principal">
          {navItems.map((it) => (
            <button
              type="button"
              key={it.key}
              onClick={() => setPage(it.key)}
              className={`public-navbar__link${page === it.key ? ' is-active' : ''}`}
              aria-current={page === it.key ? 'page' : undefined}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="public-navbar__actions">
          {displayRole ? (
            <div className="public-navbar__session">
              {onBackToPortal && (
                <button
                  type="button"
                  onClick={onBackToPortal}
                  className="public-navbar__portal"
                >
                  ← Portal
                </button>
              )}
              <div className="public-navbar__user">
                <div>{displayName}</div>
                <span>{displayRole}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logoutApi();
                  setPage('home');
                  window.location.reload();
                }}
                className="public-navbar__login"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPage('login')}
              className="public-navbar__login"
            >
              Entrar
            </button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="public-navbar__menu-toggle"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div id="public-mobile-menu" className="public-navbar__mobile-menu">
          <nav className="container-xl" aria-label="Navegação móvel">
            {navItems.map((it) => (
              <button
                type="button"
                key={it.key}
                onClick={() => {
                  setPage(it.key);
                  setMenuOpen(false);
                }}
                className={`public-navbar__mobile-link${page === it.key ? ' is-active' : ''}`}
                aria-current={page === it.key ? 'page' : undefined}
              >
                {it.label}
              </button>
            ))}
          </nav>
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
  children?: React.ReactNode;
}

interface SideItem {
  key: Page;
  label: string;
  icon: ReactNode;
}

function NotificationBell({ onOpenIncidents }: { onOpenIncidents: () => void }) {
  const { notifications, unreadCount, connected, markRead } = useRealtime();
  const [open, setOpen] = useState(false);
  const buttonClass = 'app-shell__header-control focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  return <div className="relative">
    <button type="button" className={buttonClass} onClick={() => setOpen((value) => !value)} aria-label={`Notificações${unreadCount ? ` (${unreadCount} não lidas)` : ''}`} aria-expanded={open}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="text-sm font-semibold text-slate-900">Notificações</span><span className={`text-xs ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>{connected ? 'Em tempo real' : 'A sincronizar'}</span></div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">Sem notificações.</p> : notifications.map((notification) => <button key={notification.id} type="button" onClick={async () => { try { await markRead(notification); } catch {} setOpen(false); onOpenIncidents(); }} className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 ${notification.lida ? 'text-slate-500' : 'bg-blue-50/60 text-slate-900'}`}>
          <span className="block font-medium">{notification.titulo}</span><span className="mt-1 block text-xs leading-5">{notification.mensagem}</span>
        </button>)}
      </div>
    </div>}
  </div>;
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
  { key: 'admin-communication', label: 'Comunicação', icon: ICON.communication },
];

const MANAGER_ITEMS: SideItem[] = [
  { key: 'mgr-dashboard', label: 'Dashboard', icon: ICON.dashboard },
  { key: 'mgr-analytics', label: 'Análises', icon: ICON.analytics },
  { key: 'mgr-clients', label: 'Clientes', icon: ICON.clients },
  { key: 'mgr-documents', label: 'Documentos', icon: ICON.documents },
  { key: 'mgr-incidents', label: 'Incidentes', icon: ICON.incidents },
  { key: 'mgr-communication', label: 'Comunicação', icon: ICON.communication },
];

const CLIENT_ITEMS: SideItem[] = [
  { key: 'cli-dashboard', label: 'Dashboard', icon: ICON.dashboard },
  { key: 'cli-workspace', label: 'Área de Trabalho', icon: ICON.workspace },
  { key: 'cli-risk', label: 'Análises & Gráficos', icon: ICON.analytics },
  { key: 'cli-incidents', label: 'Incidentes', icon: ICON.incidents },
  { key: 'cli-documents', label: 'Os Meus Documentos', icon: ICON.documents },
  { key: 'cli-reports', label: 'Relatórios', icon: ICON.reports },
  { key: 'cli-communication', label: 'Comunicação', icon: ICON.communication },
];

export function AppLayout({ role, page, setPage, setRole, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sess = session.get();
  const isManager = role === 'manager';
  const isClient = role === 'client';
  const items =
    role === 'admin' ? ADMIN_ITEMS : role === 'manager' ? MANAGER_ITEMS : CLIENT_ITEMS;
  const title =
    role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gestor' : 'Área Cliente';
  const roleBadge =
    role === 'admin'
      ? 'bg-rose-500/20 text-rose-200'
      : role === 'manager'
        ? 'bg-amber-500/20 text-amber-200'
        : 'bg-emerald-500/20 text-emerald-200';
  const openIncidents = () => setPage(role === 'admin' ? 'admin-incidents' : role === 'manager' ? 'mgr-incidents' : 'cli-incidents');

  useEffect(() => {
    setSidebarOpen(false);
  }, [page]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className={`flex min-h-screen min-w-0 bg-slate-100${isManager ? ' mgr-shell' : ''}${isClient ? ' client-shell' : ''}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col overflow-hidden transform bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white transition-transform ${isManager ? 'mgr-shell__sidebar ' : ''}lg:fixed lg:top-0 lg:h-dvh lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link to="/" className="flex items-center gap-2" aria-label="CiberBoxSecur — Ir para a página inicial" title="Ir para a página inicial">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L3 7v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V7l-9-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold">
              CiberBox<span className="text-blue-400">Secur</span>
            </span>
          </Link>
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

        {isManager && (
          <div className="mgr-shell__role-wrap">
            <span className="mgr-shell__role-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M8 8V6a4 4 0 018 0v2M8 14h.01M16 14h.01" strokeLinecap="round" />
              </svg>
              Gestor
            </span>
          </div>
        )}

        <nav className={`flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3${isManager ? ' mgr-shell__nav' : ''}`}>
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

        <div className={`shrink-0 border-t border-white/10 p-3${isManager ? ' mgr-shell__user-area' : ''}`}>
          <div className={`flex items-center gap-3 rounded-lg bg-white/5 p-3${isManager ? ' mgr-shell__user' : ''}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white">
              {(sess.utilizador?.nome || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {sess.utilizador?.nome || 'Utilizador'}
              </div>
              <div className="truncate text-xs text-slate-400">
                {isManager ? 'Gestor' : (sess.utilizador?.email || 'email@exemplo.pt')}
              </div>
            </div>
          </div>
          {isManager && (
            <div className="mgr-shell__user-actions">
              <span className="mgr-shell__settings" title="Definições indisponíveis nesta fase" aria-label="Definições indisponíveis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1 1.55V20h-3v-.08a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 007 14.7a1.7 1.7 0 00-1.55-1H5v-3h.08a1.7 1.7 0 001.55-1A1.7 1.7 0 006.29 7.8l-.06-.06 2.12-2.12.06.06A1.7 1.7 0 0010.3 6a1.7 1.7 0 001-1.55V4h3v.08a1.7 1.7 0 001 1.55 1.7 1.7 0 001.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0019 9.3a1.7 1.7 0 001.55 1H21v3h-.08a1.7 1.7 0 00-1.52 1.7Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logoutApi();
                  setRole(null);
                }}
                className="mgr-shell__logout"
                aria-label="Terminar sessão"
                title="Terminar sessão"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
          {!isManager && <button
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
          </button>}
        </div>
      </aside>

      <div className="app-shell__main flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className={`sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6${isManager ? ' mgr-shell__header' : ''}${isClient ? ' client-shell__header' : ''}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`rounded-md p-2 text-slate-600 hover:bg-slate-100${isManager ? '' : ' lg:hidden'}`}
              aria-label="Abrir menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            {isManager ? (
              <div className="mgr-shell__system-status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 12h3l2-6 4 12 2-6h7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Sistema operacional
              </div>
            ) : isClient ? (
              <div className="client-shell__context">Área Cliente</div>
            ) : (
              <div>
                <div className="text-sm font-medium text-slate-500">{title}</div>
                <div className="text-lg font-semibold text-slate-900">
                  {items.find((i) => i.key === page)?.label || 'Dashboard'}
                </div>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-3${isManager ? ' mgr-shell__header-actions' : ''}`}>
            {isManager ? (
              <>
                <Link to="/" className="app-shell__header-control" aria-label="Ir para a página inicial" title="Ir para a página inicial">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5Z" strokeLinejoin="round" /></svg>
                </Link>
                <NotificationBell onOpenIncidents={openIncidents} />
                <span className="mgr-shell__header-avatar" aria-hidden="true">{(sess.utilizador?.nome || 'G').charAt(0).toUpperCase()}</span>
                <span className="mgr-shell__header-name">{sess.utilizador?.nome || 'Gestor'}</span>
              </>
            ) : isClient ? <>
              <Link to="/" className="app-shell__header-control" aria-label="Ir para a página inicial" title="Ir para a página inicial">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5Z" strokeLinejoin="round" /></svg>
              </Link>
              <NotificationBell onOpenIncidents={openIncidents} />
              <span className="client-shell__header-avatar" aria-hidden="true">{(sess.cliente?.nome || sess.utilizador?.nome || 'C').charAt(0).toUpperCase()}</span>
              <span className="client-shell__header-name">{sess.cliente?.nome || sess.utilizador?.nome || 'Cliente'}</span>
            </> : <>
              <Link to="/" className="app-shell__header-control" aria-label="Ir para a página inicial" title="Ir para a página inicial">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5Z" strokeLinejoin="round" /></svg>
              </Link>
              <NotificationBell onOpenIncidents={openIncidents} />
              <span className={`badge ${roleBadge}`}>{role}</span>
            </>}
          </div>
        </header>

        <main className={`min-w-0 flex-1 p-4 sm:p-6 lg:p-8${isManager ? ' mgr-shell__content' : ''}${isClient ? ' client-shell__content' : ''}`}>{children}</main>
      </div>
    </div>
  );
}
