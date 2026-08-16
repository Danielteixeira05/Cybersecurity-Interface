import { useState } from 'react';
import type { Page, UserRole } from './types';

import { PublicNavbar, AppLayout } from './components/Layout';
import {
  HomePage, AboutPage, MissionPage, ServicesPage, NewsPage, ContactPage,
} from './pages/PublicPages';
import LoginPage from './pages/LoginPage';
import {
  AdminDashboard, AdminAnalytics, AdminUsers, AdminClients, AdminDocuments,
  AdminIncidents, AdminLogs, AdminSiteContent, AdminManagerDetail, AdminPermissions,
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

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [role, setRole] = useState<UserRole>(null);

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
  const publicPages = ['home', 'about', 'mission', 'services', 'news', 'contact'] as const;
  const isPublicPage = (publicPages as readonly string[]).includes(page);

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
          />
        )}
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'about' && <AboutPage setPage={setPage} />}
        {page === 'mission' && <MissionPage setPage={setPage} />}
        {page === 'services' && <ServicesPage setPage={setPage} />}
        {page === 'news' && <NewsPage setPage={setPage} />}
        {page === 'contact' && <ContactPage setPage={setPage} />}
        {page === 'login' && <LoginPage setRole={handleSetRole} setPage={setPage} />}
      </div>
    );
  }

  // ── Authenticated Shell ─────────────────────────────────────────────────────
  return (
    <AppLayout role={role} page={page} setPage={setPage} setRole={handleSetRoleNull} onHome={() => setPage('home')}>
      {/* ADMIN PAGES */}
      {page === 'admin-dashboard' && <AdminDashboard setPage={setPage} />}
      {page === 'admin-analytics' && <AdminAnalytics />}
      {page === 'admin-users' && <AdminUsers setPage={setPage} />}
      {page === 'admin-clients' && <AdminClients setPage={setPage} />}
      {page === 'admin-documents' && <AdminDocuments />}
      {page === 'admin-incidents' && <AdminIncidents />}
      {page === 'admin-logs' && <AdminLogs />}
      {page === 'admin-site-content' && <AdminSiteContent />}
      {page === 'admin-permissions' && <AdminPermissions />}
      {page === 'admin-client-detail' && <MgrClientDetail setPage={setPage} backPage="admin-clients" backLabel="Administrador" />}
      {page === 'admin-user-client' && <MgrClientDetail setPage={setPage} backPage="admin-users" backLabel="Utilizadores" />}
      {page === 'admin-user-manager' && <AdminManagerDetail setPage={setPage} />}

      {/* MANAGER PAGES */}
      {page === 'mgr-dashboard' && <MgrDashboard setPage={setPage} />}
      {page === 'mgr-analytics' && <MgrAnalytics setPage={setPage} />}
      {page === 'mgr-clients' && <MgrClients setPage={setPage} />}
      {page === 'mgr-client-detail' && <MgrClientDetail setPage={setPage} />}

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
      {page === 'cli-communication' && <ClientCommunication setPage={setPage} />}
      {page === 'cli-pentests' && <ClientPentests />}
    </AppLayout>
  );
}
