import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Page, UserRole } from './types';

import { PublicNavbar, AppLayout } from './components/Layout';
import {
  HomePage, AboutPage, MissionPage, ServicesPage, NewsPage, NewsDetailPage, ContactPage,
} from './pages/PublicPages';
import LoginPage from './pages/LoginPage';
import {
  AdminDashboard, AdminAnalytics, AdminUsers, AdminClients, AdminAssets, AdminDocuments,
  AdminIncidents, AdminLogs, AdminSiteContent, AdminManagerDetail,
} from './pages/AdminPages';
import {
  MgrDashboard, MgrAnalytics, MgrClients, MgrClientDetail, MgrIncidents, MgrDocuments,
  MgrRequests, MgrExcelImport, MgrRisk, MgrNIS2, MgrAssets, MgrReports,
  MgrPentests, MgrEvidence,
} from './pages/ManagerPages';
import {
  ClientDashboard, ClientWorkspace, ClientDocuments, ClientReports,
  ClientProfile, ClientAssets, ClientIncidents,
  ClientNIS2, ClientRisk, ClientRequests, ClientPentests,
} from './pages/ClientPages';
import { AUTH_EXPIRED_EVENT, defaultHomePageForRole, meApi, session } from './apiClient';
import { RealtimeProvider } from './realtime';
import { CommunicationPage } from './pages/CommunicationPage';

const PAGE_PATHS: Partial<Record<Page, string>> = {
  home: '/',
  about: '/sobre',
  mission: '/missao',
  services: '/servicos',
  news: '/noticias',
  contact: '/contacto',
  login: '/login',
  'admin-dashboard': '/administrador',
  'admin-analytics': '/administrador/analises',
  'admin-users': '/administrador/utilizadores',
  'admin-clients': '/administrador/clientes',
  'admin-assets': '/administrador/ativos',
  // O detalhe administrativo é sempre aberto através de `openAdminClientDetail`,
  // que inclui o identificador canónico no URL. Esta entrada é apenas o fallback
  // seguro para qualquer chamada interna antiga a `setPage`.
  'admin-client-detail': '/administrador/clientes',
  'admin-user-client': '/administrador/utilizadores/cliente',
  'admin-user-manager': '/administrador/utilizadores/gestor',
  'admin-documents': '/administrador/documentos',
  'admin-incidents': '/administrador/incidentes',
  'admin-logs': '/administrador/logs',
  'admin-site-content': '/administrador/conteudo',
  'admin-communication': '/administrador/comunicacao',
  'mgr-dashboard': '/gestor',
  'mgr-analytics': '/gestor/analises',
  'mgr-clients': '/gestor/clientes',
  'mgr-documents': '/gestor/documentos',
  'mgr-incidents': '/gestor/incidentes',
  'mgr-assets': '/gestor/ativos',
  'mgr-requests': '/gestor/pedidos',
  'mgr-risk': '/gestor/riscos',
  'mgr-nis2': '/gestor/nis2',
  'mgr-reports': '/gestor/relatorios',
  'mgr-pentests': '/gestor/pentests',
  'mgr-evidence': '/gestor/evidencias',
  'mgr-excel': '/gestor/importar-excel',
  'mgr-communication': '/gestor/comunicacao',
  'cli-dashboard': '/cliente',
  'cli-workspace': '/cliente/area-trabalho',
  'cli-documents': '/cliente/documentos',
  'cli-reports': '/cliente/relatorios',
  'cli-profile': '/cliente/perfil',
  'cli-assets': '/cliente/ativos',
  'cli-incidents': '/cliente/incidentes',
  'cli-nis2': '/cliente/nis2',
  'cli-risk': '/cliente/analises',
  'cli-requests': '/cliente/pedidos',
  'cli-communication': '/cliente/comunicacao',
  'cli-pentests': '/cliente/pentests',
};

const PUBLIC_PAGE_KEYS = new Set<Page>(['home', 'about', 'mission', 'services', 'news', 'news-detail', 'contact', 'login']);

// Os links antigos permanecem legíveis após refresh, mas a navegação da aplicação
// passa a usar apenas as rotas canónicas apresentadas na sidebar Cliente.
const LEGACY_CLIENT_PAGE_PATHS: Record<string, Page> = {
  '/cliente/espaco': 'cli-workspace',
  '/cliente/riscos': 'cli-risk',
};

export function pageFromPathname(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/administrador/permissoes') return 'admin-dashboard';
  if (/^\/administrador\/clientes\/detalhe$/.test(path)) return 'admin-clients';
  if (/^\/administrador\/clientes\/[^/]+$/.test(path)) return 'admin-client-detail';
  if (/^\/gestor\/clientes\/[^/]+$/.test(path)) return 'mgr-client-detail';
  if (/^\/administrador\/utilizadores\/gestor(?:\/.*)?$/.test(path)) return 'admin-user-manager';
  if (/^\/noticias\/[^/]+$/.test(path)) return 'news-detail';
  const entry = Object.entries(PAGE_PATHS).find(([, value]) => value === path);
  return (entry?.[0] as Page | undefined) ?? LEGACY_CLIENT_PAGE_PATHS[path] ?? 'home';
}

function canonicalClientIdFromPathname(pathname: string, prefix: string): number | undefined {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^${escapedPrefix}/([1-9]\\d*)/?$`).exec(pathname);
  if (!match) return undefined;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function managerClientIdFromPathname(pathname: string): number | undefined {
  return canonicalClientIdFromPathname(pathname, '/gestor/clientes');
}

export function adminClientIdFromPathname(pathname: string): number | undefined {
  return canonicalClientIdFromPathname(pathname, '/administrador/clientes');
}

export function managerIdFromPathname(pathname: string): number | undefined {
  const match = /^\/administrador\/utilizadores\/gestor\/([1-9]\d*)\/?$/.exec(pathname);
  if (!match) return undefined;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function newsIdFromPathname(pathname: string): string | undefined {
  const match = /^\/noticias\/([^/]+)\/?$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function pageAllowedForRole(page: Page, role: Exclude<UserRole, null>) {
  if (PUBLIC_PAGE_KEYS.has(page)) return true;
  if (role === 'admin') return page.startsWith('admin-');
  if (role === 'manager') return page.startsWith('mgr-');
  return page.startsWith('cli-');
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPageState] = useState<Page>(() => pageFromPathname(location.pathname));
  const [role, setRole] = useState<UserRole>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState('');

  const setPage = useCallback((nextPage: Page) => {
    setPageState(nextPage);
    if (nextPage === 'mgr-client-detail') {
      const clientId = managerClientIdFromPathname(location.pathname) ?? session.get().cliente?.id;
      navigate(clientId ? `/gestor/clientes/${clientId}` : PAGE_PATHS['mgr-clients']!);
      return;
    }
    if (nextPage === 'news-detail') {
      navigate(`/noticias/${selectedNewsId}`);
      return;
    }
    navigate(PAGE_PATHS[nextPage] ?? '/');
  }, [location.pathname, navigate, selectedNewsId]);

  // When role is set, go to the appropriate dashboard
  function handleSetRole(r: UserRole) {
    setRole(r);
    if (r === 'admin') setPage('admin-dashboard');
    else if (r === 'manager') setPage('mgr-dashboard');
    else if (r === 'client') setPage('cli-dashboard');
  }

  function handleSetRoleNull() {
    setRole(null);
    setPage('home');
  }

  const dashboardPage = role === 'admin' ? 'admin-dashboard' : role === 'manager' ? 'mgr-dashboard' : 'cli-dashboard';
  const publicPages = ['home', 'about', 'mission', 'services', 'news', 'news-detail', 'contact'] as const;
  const isPublicPage = (publicPages as readonly string[]).includes(page);

  useEffect(() => {
    setPageState(pageFromPathname(location.pathname));
    const newsId = newsIdFromPathname(location.pathname);
    if (newsId) setSelectedNewsId(newsId);
  }, [location.pathname]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setRole(null);
      const requestedPage = pageFromPathname(location.pathname);
      if (PUBLIC_PAGE_KEYS.has(requestedPage)) {
        setPageState(requestedPage);
        return;
      }
      setPageState('login');
      navigate(PAGE_PATHS.login!, { replace: true });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, [location.pathname, navigate]);

  useEffect(() => {
    let active = true;

    meApi()
      .then((response) => {
        if (!active || !response.autenticado || !response.role) return;
        setRole(response.role);
        const requestedPage = pageFromPathname(location.pathname);
        if (requestedPage === 'login' || !pageAllowedForRole(requestedPage, response.role)) {
          setPageState(defaultHomePageForRole(response.role));
          navigate(PAGE_PATHS[defaultHomePageForRole(response.role)]!, { replace: true });
          return;
        }
        setPageState(requestedPage);
      })
      .catch(() => {
        // A sessão local não é uma fonte de autenticação; apenas a API decide.
        if (!active) return;
        session.clear();
        const requestedPage = pageFromPathname(location.pathname);
        if (!PUBLIC_PAGE_KEYS.has(requestedPage)) {
          setPageState('login');
          navigate(PAGE_PATHS.login!, { replace: true });
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (page === 'news-detail') {
      const scrollTimer = window.setTimeout(() => {
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo({ top: 0 });
        root.style.scrollBehavior = previousScrollBehavior;
      }, 0);

      return () => window.clearTimeout(scrollTimer);
    }
  }, [page, selectedNewsId]);

  function openNewsArticle(articleId: string) {
    setSelectedNewsId(articleId);
    setPageState('news-detail');
    navigate(`/noticias/${articleId}`);
  }

  const openManagerDetail = useCallback((userId: number) => {
    if (!Number.isSafeInteger(userId) || userId < 1) return;
    setPageState('admin-user-manager');
    navigate(`/administrador/utilizadores/gestor/${userId}`);
  }, [navigate]);

  const openAdminClientDetail = useCallback((clientId: number) => {
    if (!Number.isSafeInteger(clientId) || clientId < 1) return;
    setPageState('admin-client-detail');
    navigate(`/administrador/clientes/${clientId}`);
  }, [navigate]);

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/administrador/clientes/detalhe') {
      navigate('/administrador/clientes', { replace: true });
      return;
    }
    if (path === '/administrador/permissoes') {
      navigate('/administrador', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!authReady) {
    return <div className="min-h-screen bg-slate-50" aria-busy="true" aria-label="A validar sessão" />;
  }

  // ── Public Pages (incluindo quando autenticado) ──────────────────────────────
  if (!role || page === 'login' || (role && isPublicPage)) {
    return (
      <div className="min-h-screen bg-white">
        {page !== 'login' && (
          <PublicNavbar
            page={page === 'news-detail' ? 'news' : page}
            setPage={setPage}
            role={role}
            onBackToPortal={() => setPage(dashboardPage as Page)}
          />
        )}
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'about' && <AboutPage setPage={setPage} />}
        {page === 'mission' && <MissionPage setPage={setPage} />}
        {page === 'services' && <ServicesPage setPage={setPage} />}
        {page === 'news' && <NewsPage setPage={setPage} onSelectArticle={openNewsArticle} />}
        {page === 'news-detail' && (
          <NewsDetailPage
            key={selectedNewsId}
            setPage={setPage}
            selectedArticleId={selectedNewsId}
            onSelectArticle={openNewsArticle}
          />
        )}
        {page === 'contact' && <ContactPage setPage={setPage} />}
        {page === 'login' && <LoginPage setRole={handleSetRole} setPage={setPage} />}
      </div>
    );
  }

  // ── Authenticated Shell ─────────────────────────────────────────────────────
  return (
    <RealtimeProvider>
    <AppLayout role={role} page={page} setPage={setPage} setRole={handleSetRoleNull}>
      {/* ADMIN PAGES */}
      {page === 'admin-dashboard' && <AdminDashboard setPage={setPage} />}
      {page === 'admin-analytics' && <AdminAnalytics />}
      {page === 'admin-users' && <AdminUsers setPage={setPage} openManagerDetail={openManagerDetail} />}
      {page === 'admin-clients' && <AdminClients setPage={setPage} openClientDetail={openAdminClientDetail} />}
      {page === 'admin-assets' && <AdminAssets />}
      {page === 'admin-documents' && <AdminDocuments />}
      {page === 'admin-incidents' && <AdminIncidents />}
      {page === 'admin-logs' && <AdminLogs />}
      {page === 'admin-site-content' && <AdminSiteContent />}
      {page === 'admin-communication' && <CommunicationPage role="admin" />}
      {page === 'admin-client-detail' && <MgrClientDetail setPage={setPage} backPage="admin-clients" areaLabel="Administrador" backLabel="Clientes" role="admin" clientId={adminClientIdFromPathname(location.pathname)} />}
      {page === 'admin-user-client' && <MgrClientDetail setPage={setPage} backPage="admin-users" backLabel="Utilizadores" />}
      {page === 'admin-user-manager' && <AdminManagerDetail setPage={setPage} managerId={managerIdFromPathname(location.pathname)} />}

      {/* MANAGER PAGES */}
      {page === 'mgr-dashboard' && <MgrDashboard setPage={setPage} />}
      {page === 'mgr-analytics' && <MgrAnalytics setPage={setPage} />}
      {page === 'mgr-clients' && <MgrClients setPage={setPage} />}
      {page === 'mgr-client-detail' && <MgrClientDetail setPage={setPage} clientId={managerClientIdFromPathname(location.pathname)} />}

      {page === 'mgr-incidents' && <MgrIncidents setPage={setPage} />}
      {page === 'mgr-documents' && <MgrDocuments />}
      {page === 'mgr-requests' && <MgrRequests />}
      {page === 'mgr-excel' && <MgrExcelImport />}
      {page === 'mgr-risk' && <MgrRisk setPage={setPage} />}
      {page === 'mgr-nis2' && <MgrNIS2 setPage={setPage} />}
      {page === 'mgr-assets' && <MgrAssets />}
      {page === 'mgr-reports' && <MgrReports setPage={setPage} />}
      {page === 'mgr-pentests' && <MgrPentests setPage={setPage} />}
      {page === 'mgr-evidence' && <MgrEvidence setPage={setPage} />}
      {page === 'mgr-communication' && <CommunicationPage role="manager" />}

      {/* CLIENT PAGES */}
      {page === 'cli-dashboard' && <ClientDashboard setPage={setPage} />}
      {page === 'cli-workspace' && <ClientWorkspace setPage={setPage} />}
      {page === 'cli-documents' && <ClientDocuments setPage={setPage} />}
      {page === 'cli-reports' && <ClientReports setPage={setPage} />}
      {page === 'cli-profile' && <ClientProfile />}
      {page === 'cli-assets' && <ClientAssets />}
      {page === 'cli-incidents' && <ClientIncidents />}
      {page === 'cli-nis2' && <ClientNIS2 />}
      {page === 'cli-risk' && <ClientRisk />}
      {page === 'cli-requests' && <ClientRequests setPage={setPage} />}
      {page === 'cli-communication' && <CommunicationPage role="client" />}
      {page === 'cli-pentests' && <ClientPentests />}
    </AppLayout>
    </RealtimeProvider>
  );
}
