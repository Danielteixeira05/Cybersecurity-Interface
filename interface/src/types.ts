export type UserRole = 'admin' | 'manager' | 'client' | null;

export type Page =
  // Public
  | 'home' | 'about' | 'mission' | 'services' | 'news' | 'news-detail' | 'contact' | 'login'
  // Admin
  | 'admin-dashboard' | 'admin-analytics' | 'admin-users' | 'admin-clients' | 'admin-documents'
  | 'admin-incidents' | 'admin-logs' | 'admin-site-content' | 'admin-permissions'
  | 'admin-client-detail' | 'admin-user-client' | 'admin-user-manager'
  // Manager
  | 'mgr-dashboard' | 'mgr-analytics' | 'mgr-clients' | 'mgr-client-detail' | 'mgr-assets' | 'mgr-incidents'
  | 'mgr-documents' | 'mgr-risk' | 'mgr-nis2' | 'mgr-pentests' | 'mgr-evidence'
  | 'mgr-reports' | 'mgr-requests' | 'mgr-excel'
  // Client
  | 'cli-dashboard' | 'cli-workspace' | 'cli-documents' | 'cli-reports'
  // legacy (kept for deep links)
  | 'cli-profile' | 'cli-assets' | 'cli-incidents' | 'cli-nis2' | 'cli-risk'
  | 'cli-requests' | 'cli-communication' | 'cli-pentests';

export interface AppState {
  page: Page;
  role: UserRole;
  setPage: (p: Page) => void;
  setRole: (r: UserRole) => void;
}
