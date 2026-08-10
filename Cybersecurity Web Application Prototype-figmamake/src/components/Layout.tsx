import { type ReactNode, useState, useRef, useEffect } from 'react';
import type { Page, UserRole } from '../types';
import {
  LayoutDashboard, Users, Shield, Building2, ScrollText,
  Briefcase, AlertTriangle, FileText, BarChart3, ClipboardList,
  FileSpreadsheet, ChevronDown, Bell, LogOut, Menu, X,
  Home, Info, Wrench, Mail, Lock, Package,
  CheckSquare, FileCheck, Settings, Activity,
  Zap, MessageSquare, Database, TestTube, LineChart, Globe2,
  Clock, CheckCheck,
} from 'lucide-react';

// ── Dados de lembretes por perfil ─────────────────────────────────────────────
interface Reminder { id: string; doc: string; reason: string; time: string; }

const REMINDERS: Record<NonNullable<UserRole>, Reminder[]> = {
  admin: [
    { id: 'a1', doc: 'Plano de Continuidade de Negócio', reason: 'Atualizado para v2.0 — requer revisão e aprovação', time: 'há 2h' },
    { id: 'a2', doc: 'Política de Segurança da Informação NIS2', reason: 'Atualizado para v3.1 — aguarda aprovação final', time: 'há 5h' },
    { id: 'a3', doc: 'Relatório de Auditoria Interna 2025', reason: 'Prazo de entrega amanhã — revisão pendente', time: 'há 1 dia' },
    { id: 'a4', doc: 'Auditoria de Conformidade NIS2 2025', reason: 'Documento expirado — renovação necessária', time: 'há 1 dia' },
    { id: 'a5', doc: 'Inventário de Ativos Críticos', reason: 'Versão desatualizada — atualização obrigatória', time: 'há 3 dias' },
  ],
  manager: [
    { id: 'm1', doc: 'Relatório NIS2 Q2 2025 — TechCorp Portugal', reason: 'Aguarda revisão e aprovação do gestor', time: 'há 3h' },
    { id: 'm2', doc: 'Política de Segurança v3 — Banco Norte', reason: 'Rascunho pendente de validação', time: 'há 6h' },
    { id: 'm3', doc: 'Relatório PenTest Q1 — Saúde Digital', reason: 'Expirado — renovação necessária antes do prazo', time: 'há 1 dia' },
    { id: 'm4', doc: 'Inventário de Ativos — EnergiaPT', reason: 'Em revisão há mais de 7 dias — ação necessária', time: 'há 2 dias' },
    { id: 'm5', doc: 'Avaliação de Risco 2025 — Logística Sul', reason: 'Documento ainda não enviado ao cliente', time: 'há 3 dias' },
  ],
  client: [
    { id: 'c1', doc: 'Relatório NIS2 Q2 2025', reason: 'Novo documento disponível — requer a sua leitura', time: 'há 1h' },
    { id: 'c2', doc: 'Política de Segurança v3.docx', reason: 'Documento atualizado pelo seu gestor', time: 'há 4h' },
    { id: 'c3', doc: 'Relatório PenTest Q1', reason: 'Expirado — entre em contacto com o seu gestor', time: 'há 2 dias' },
  ],
};

// ── Painel de Lembretes de Documentos ────────────────────────────────────────
function NotificationPanel({ role, readIds, onRead, onReadAll, onClose }: {
  role: NonNullable<UserRole>;
  readIds: Set<string>;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClose: () => void;
}) {
  const reminders = REMINDERS[role];
  const unread = reminders.filter(r => !readIds.has(r.id));

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-blue-600" />
          <span className="text-sm font-bold text-slate-900 font-display">Lembretes de Documentos</span>
          {unread.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full font-mono leading-none">
              {unread.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
        {reminders.map((r) => {
          const isRead = readIds.has(r.id);
          return (
            <div
              key={r.id}
              onClick={() => onRead(r.id)}
              className={`flex gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${isRead ? 'opacity-60' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isRead ? 'bg-slate-100' : 'bg-blue-50'}`}>
                <FileText size={14} className={isRead ? 'text-slate-400' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug mb-0.5 ${isRead ? 'text-slate-500' : 'text-slate-900'}`}>{r.doc}</p>
                <p className="text-xs text-slate-400 leading-snug">{r.reason}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={10} className="text-slate-300" />
                  <span className="text-xs text-slate-400 font-mono">{r.time}</span>
                </div>
              </div>
              {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
        <button
          onClick={onReadAll}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <CheckCheck size={13} />
          Marcar todos como lidos
        </button>
      </div>
    </div>
  );
}

// ── Itens de navegação por perfil ─────────────────────────────────────────────
const adminNav = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admin-analytics', label: 'Análises & Gráficos', icon: LineChart },
  { id: 'admin-users', label: 'Utilizadores', icon: Users },
  { id: 'admin-clients', label: 'Clientes', icon: Building2 },
  { id: 'admin-documents', label: 'Documentos', icon: FileText },
  { id: 'admin-incidents', label: 'Incidentes', icon: AlertTriangle },
  { id: 'admin-logs', label: 'Logs de Atividade', icon: ScrollText },
  { id: 'admin-site-content', label: 'Conteúdo do Site', icon: Globe2 },
];

const managerNav = [
  { id: 'mgr-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mgr-analytics', label: 'Análises', icon: LineChart },
  { id: 'mgr-clients', label: 'Clientes', icon: Building2 },
  { id: 'mgr-documents', label: 'Documentos', icon: FileText },
  { id: 'mgr-incidents', label: 'Incidentes', icon: AlertTriangle },
];

const clientNav = [
  { id: 'cli-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cli-workspace', label: 'Área de Trabalho', icon: Briefcase },
  { id: 'cli-documents', label: 'Os Meus Documentos', icon: FileText },
  { id: 'cli-reports', label: 'Relatórios', icon: ClipboardList },
];

const publicNav = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'services', label: 'Serviços', icon: Wrench },
  { id: 'news', label: 'Notícias', icon: Info },
  { id: 'contact', label: 'Contacto', icon: Mail },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  client: 'Cliente',
};
const roleUsers: Record<string, string> = {
  admin: 'Ana Rodrigues',
  manager: 'Carlos Mendes',
  client: 'TechCorp Portugal',
};

function RolePill({ role }: { role: UserRole }) {
  const styles = {
    admin: 'text-purple-700 bg-purple-100 border border-purple-200',
    manager: 'text-blue-700 bg-blue-100 border border-blue-200',
    client: 'text-green-700 bg-green-100 border border-green-200',
  };
  const icons = { admin: Shield, manager: Briefcase, client: Building2 };
  if (!role) return null;
  const Icon = icons[role];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[role]}`}>
      <Icon size={11} />{roleLabels[role]}
    </div>
  );
}

// ── Navbar Pública ────────────────────────────────────────────────────────────
export function PublicNavbar({ page, setPage, role, onBackToPortal }: {
  page: Page; setPage: (p: Page) => void; role?: UserRole; onBackToPortal?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboardPage = role === 'admin' ? 'admin-dashboard' : role === 'manager' ? 'mgr-dashboard' : 'cli-dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="flex items-center gap-2.5">
          <img src="/src/imports/CiberBoxSecur-Minimal-color_c_pia.png" alt="CiberBoxSecur" className="w-8 h-8 object-contain" />
          <span className="font-bold text-slate-900 font-display tracking-tight">CiberBox<span className="text-blue-600">Secur</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {publicNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id as Page)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-base ${
                page === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {role ? (
            <button
              onClick={() => onBackToPortal ? onBackToPortal() : setPage(dashboardPage as Page)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-base shadow-sm"
            >
              <Briefcase size={13} /> Voltar ao Portal
            </button>
          ) : (
            <button
              onClick={() => setPage('login')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-base shadow-sm"
            >
              Entrar
            </button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-500 hover:text-slate-900">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 flex flex-col gap-1 shadow-lg">
          {publicNav.map((item) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id as Page); setMenuOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${page === item.id ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <item.icon size={15} />{item.label}
            </button>
          ))}
          {role ? (
            <button
              onClick={() => { onBackToPortal?.(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md mt-2"
            >
              <Briefcase size={13} /> Voltar ao Portal
            </button>
          ) : (
            <button onClick={() => { setPage('login'); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-md mt-2">
              Entrar
            </button>
          )}
        </div>
      )}
    </header>
  );
}


// ── Layout Autenticado ────────────────────────────────────────────────────────
export function AppLayout({ role, page, setPage, setRole, onHome, children }: {
  role: UserRole; page: Page; setPage: (p: Page) => void;
  setRole: (r: UserRole) => void; onHome: () => void; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  const navItems = role === 'admin' ? adminNav : role === 'manager' ? managerNav : clientNav;
  const reminders = REMINDERS[role!];
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const unreadCount = reminders.filter(r => !readIds.has(r.id)).length;

  const SidebarContent = () => (
    <aside className={`flex flex-col h-full bg-slate-900 transition-all duration-200 ${collapsed ? 'w-14' : 'w-60'}`}>
      {/* Logótipo */}
      <button
        onClick={onHome}
        className={`h-14 flex items-center border-b border-slate-700/50 shrink-0 hover:bg-white/5 transition-colors ${collapsed ? 'justify-center px-0 w-full' : 'px-4 gap-2.5'}`}
        title="Ir para a página inicial"
      >
        <img src="/src/imports/CiberBoxSecur-Minimal-color_c_pia.png" alt="CiberBoxSecur" className="w-7 h-7 object-contain shrink-0" />
        {!collapsed && <span className="font-bold text-white font-display text-sm tracking-tight">CiberBox<span className="text-blue-400">Secur</span></span>}
      </button>

      {/* Perfil ativo */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-700/50 shrink-0">
          <RolePill role={role} />
        </div>
      )}

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setPage(item.id as Page); setMobileOpen(false); }}
            className={`sidebar-link w-full flex items-center gap-3 py-2 text-xs font-medium text-slate-400 ${
              page === item.id ? 'active text-white' : ''
            } ${collapsed ? 'justify-center px-0' : 'px-4'}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={15} className="shrink-0" />
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {/* Rodapé da sidebar */}
      <div className={`border-t border-slate-700/50 py-3 shrink-0 ${collapsed ? 'flex flex-col items-center gap-2 px-0' : 'px-3'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-md mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {roleUsers[role!].charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{roleUsers[role!]}</p>
              <p className="text-xs text-slate-400 truncate">{roleLabels[role!]}</p>
            </div>
          </div>
        )}
        <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'gap-1 justify-end'}`}>
          <button className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-base" title="Definições">
            <Settings size={14} />
          </button>
          <button
            onClick={() => setRole(null)}
            className="w-8 h-8 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-base"
            title="Terminar sessão"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-col h-full shrink-0">
        <SidebarContent />
      </div>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar superior */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCollapsed(!collapsed); setMobileOpen(!mobileOpen); }}
              className="text-slate-400 hover:text-slate-700 transition-base"
            >
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Activity size={12} className="text-green-500" />
              <span>Sistema operacional</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-base"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationPanel
                  role={role!}
                  readIds={readIds}
                  onRead={(id) => setReadIds(prev => new Set([...prev, id]))}
                  onReadAll={() => setReadIds(new Set(reminders.map(r => r.id)))}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {roleUsers[role!].charAt(0)}
              </div>
              <span className="hidden sm:block text-xs text-slate-600 font-medium">{roleUsers[role!]}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
