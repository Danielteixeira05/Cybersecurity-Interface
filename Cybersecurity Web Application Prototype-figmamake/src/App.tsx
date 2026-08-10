import { useEffect, useState } from 'react';
import type { Page, UserRole } from './types';

import { PublicNavbar, AppLayout } from './components/Layout';
import {
  HomePage, AboutPage, MissionPage, ServicesPage, NewsPage, ContactPage,
} from './pages/PublicPages';
import LoginPage from './pages/LoginPage';
import {
  AdminDashboard, AdminAnalytics, AdminUsers, AdminClients, AdminDocuments,
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
  ClientNIS2, ClientRisk, ClientRequests, ClientCommunication, ClientPentests,
} from './pages/ClientPages';
import {
  session, meApi, logoutApi, defaultHomePageForRole,
  type ApiUtilizador, type ApiCliente,
} from './apiClient';

export default function App() {
  const cached = session.get();
  const [page, setPage] = useState<Page>(cached.role ? defaultHomePageForRole(cached.role) : 'home');
  const [role, setRole] = useState<UserRole>(cached.role || null);
  const [currentUser, setCurrentUser] = useState<ApiUtilizador | null>(cached.utilizador || null);
  const [currentClient, setCurrentClient] = useState<ApiCliente | null>(cached.cliente || null);
  const [hydrating, setHydrating] = useState<boolean>(!!cached.role);

  // Verificar sessao com o backend ao arrancar (se houver cache local)
  useEffect(() => {
    if (!cached.role) return;
    let cancel = false;
    (async () => {
      try {
        const me = await meApi();
        if (cancel) return;
        if (me.autenticado && me.utilizador) {
          setRole(me.role || null);
          setCurrentUser(me.utilizador);
          setCurrentClient(me.cliente || null);
        } else {
          session.clear();
          setRole(null);
          setCurrentUser(null);
          setCurrentClient(null);
          setPage('home');
        }
      } catch {
        // Falha de rede -> manter a cache local (offline friendly)
      } finally {
        if (!cancel) setHydrating(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  function handleSetRole(r: UserRole) {
    setRole(r);
    if (r === 'admin') setPage('admin-dashboard');
    else if (r === 'manager') setPage('mgr-dashboard');
    else if (r === 'client') setPage('cli-dashboard');
  }

  async function handleLogout() {
    try { await logoutApi(); } catch {}
    setRole(null);
    setCurrentUser(null);
    setCurrentClient(null);
    setPage('home');
  }

  const dashboardPage = role === 'admin' ? 'admin-dashboard' : role === 'manager' ? 'mgr-dashboard' : 'cli-dashboard';
  const publicPages = ['home', 'about', 'mission', 'services', 'news', 'contact'] as const;
  const isPublicPage = (publicPages as readonly string[]).includes(page);

  if (hydrating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-mono text-slate-500">A restabelecer sessão...</div>
      </div>
    );
  }

  // ── Public Pages (incluindo quando autenticado) ──────────────────────────────
  if (!role || page === 'login' || (role && isPublicPage)) {
    return (
      <div className="min-h-screen bg-white">
        {page !== 'login' && (
          <PublicNavbar
            page={page}
            setPage={setPage}
            role={role}
            onBackToPortal={() => setPage(dashboardPage as Page)}
            onLogout={role ? handleLogout : undefined}
          />
        )}
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'about' && <AboutPage setPage={setPage} />}
        {page === 'mission' && <MissionPage setPage={setPage} />}
        {page === 'services' && <ServicesPage setPage={setPage} />}
        {page === 'news' && <NewsPage setPage={setPage} />}
        {page === 'contact' && <ContactPage setPage={setPage} />}
        {page === 'login' && (
          <LoginPage
            setRole={handleSetRole}
            setPage={setPage}
            setCurrentUser={setCurrentUser}
            setCurrentClient={setCurrentClient}
          />
        )}
      </div>
    );
  }

  // ── Authenticated Shell ─────────────────────────────────────────────────────
  return (
    <AppLayout
      role={role}
      page={page}
      setPage={setPage}
      setRole={handleLogout}
      onHome={() => setPage('home')}
      currentUser={currentUser}
      currentClient={currentClient}
    >
      {/* ADMIN PAGES */}
      {page === 'admin-dashboard' && <AdminDashboard setPage={setPage} currentUser={currentUser} />}
      {page === 'admin-analytics' && <AdminAnalytics />}
      {page === 'admin-users' && <AdminUsers setPage={setPage} />}
      {page === 'admin-clients' && <AdminClients setPage={setPage} />}
      {page === 'admin-documents' && <AdminDocuments />}
      {page === 'admin-incidents' && <AdminIncidents />}
      {page === 'admin-logs' && <AdminLogs />}
      {page === 'admin-site-content' && <AdminSiteContent />}
      {page === 'admin-permissions' && <AdminAnalytics />}
      {page === 'admin-client-detail' && <MgrClientDetail setPage={setPage} backPage="admin-clients" backLabel="Administrador" />}
      {page === 'admin-user-client' && <MgrClientDetail setPage={setPage} backPage="admin-users" backLabel="Utilizadores" />}
      {page === 'admin-user-manager' && <AdminManagerDetail setPage={setPage} />}

      {/* MANAGER PAGES */}
      {page === 'mgr-dashboard' && <MgrDashboard setPage={setPage} currentUser={currentUser} />}
      {page === 'mgr-analytics' && <MgrAnalytics setPage={setPage} />}
      {page === 'mgr-clients' && <MgrClients setPage={setPage} />}
      {page === 'mgr-client-detail' && <MgrClientDetail setPage={setPage} />}

      {page === 'mgr-incidents' && <MgrIncidents setPage={setPage} />}
      {page === 'mgr-documents' && <MgrDocuments />}
      {page === 'mgr-requests' && <MgrRequests />}
      {page === 'mgr-excel' && <MgrExcelImport />}
      {page === 'mgr-risk' && <MgrRisk />}
      {page === 'mgr-nis2' && <MgrNIS2 />}
      {page === 'mgr-assets' && <MgrAssets />}
      {page === 'mgr-reports' && <MgrReports />}
      {page === 'mgr-pentests' && <MgrPentests />}
      {page === 'mgr-evidence' && <MgrEvidence />}

      {/* CLIENT PAGES */}
      {page === 'cli-dashboard' && <ClientDashboard setPage={setPage} currentClient={currentClient} currentUser={currentUser} />}
      {page === 'cli-workspace' && <ClientWorkspace setPage={setPage} />}
      {page === 'cli-documents' && <ClientDocuments setPage={setPage} />}
      {page === 'cli-reports' && <ClientReports setPage={setPage} />}
      {page === 'cli-profile' && <ClientProfile />}
      {page === 'cli-assets' && <ClientAssets />}
      {page === 'cli-incidents' && <ClientIncidents />}
      {page === 'cli-nis2' && <ClientNIS2 />}
      {page === 'cli-risk' && <ClientRisk />}
      {page === 'cli-requests' && <ClientRequests setPage={setPage} />}
      {page === 'cli-communication' && <ClientCommunication />}
      {page === 'cli-pentests' && <ClientPentests />}
    </AppLayout>
  );
}

