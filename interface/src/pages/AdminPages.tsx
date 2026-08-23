import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  DatabaseZap,
  Download,
  FileText,
  Globe2,
  Eye,
  Inbox,
  Mail,
  Newspaper,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Users,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import type { Page } from '../types';
import {
  dashboardApi, clientesApi, utilizadoresApi, documentosApi,
  incidentesApi, logsApi, pedidosApi, clienteDetalheApi,
  opcoesApi,
  criarGestorApi, atualizarUtilizadorApi, alterarEstadoUtilizadorApi,
  criarClienteApi, atualizarClienteApi, alterarEstadoClienteApi,
  submeterDocumentoApi, atualizarDocumentoApi, descarregarDocumentoApi,
  criarIncidenteApi, atualizarIncidenteApi,
  conteudosAdminApi, criarConteudoAdminApi, atualizarConteudoAdminApi,
  noticiasAdminApi, criarNoticiaAdminApi, atualizarNoticiaAdminApi,
  contactosAdminApi, atualizarEstadoContactoAdminApi,
  type ApiDashboardAdmin, type ApiCliente, type ApiUtilizador,
  type ApiIncidente, type ApiIncidentePayload, type ApiDocumento, type ApiPedido, type ApiClienteDetalhe,
  type ApiClientePayload, type ApiConteudoSite, type ApiConteudoSitePayload,
  type ApiNoticia, type ApiNoticiaPayload, type ApiMensagemContacto, type EstadoMensagemContacto,
  session,
} from '../apiClient';

// ========== UI HELPERS ==========
interface PageProps {
  setPage: (p: Page) => void;
}

function Loader({ text = 'A carregar...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16">
      <svg viewBox="0 0 24 24" className="h-8 w-8 animate-spin text-blue-600" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm text-slate-500">{text}</span>
    </div>
  );
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <div className="font-semibold">Erro</div>
      <div className="mt-1 text-sm">{msg}</div>
    </div>
  );
}

function StatCard({ label, value, delta, icon, color }: {
  label: string; value: string | number; delta?: string; icon?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</div>
          {delta && <div className="mt-1 text-xs font-medium text-emerald-600">{delta}</div>}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${color || 'bg-blue-50'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardKpiCard({
  label,
  value,
  icon: Icon,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 font-mono text-sm font-medium uppercase leading-tight tracking-wide text-slate-500">
          {label}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}>
          <Icon aria-hidden="true" className={`h-6 w-6 ${iconColor}`} strokeWidth={1.8} />
        </div>
      </div>
      <div className="break-words font-display text-3xl font-bold leading-none text-slate-900">{value}</div>
    </div>
  );
}

function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, emptyText = 'Sem dados',
}: {
  columns: { key: keyof T; label: string; render?: (r: T) => React.ReactNode; width?: string }[];
  data: T[];
  onRowClick?: (r: T) => void;
  emptyText?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl">📭</div>
        <div className="text-sm font-medium text-slate-900">{emptyText}</div>
        <div className="mt-1 text-xs text-slate-500">Não existem registos para apresentar</div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`table-row-hover ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((c) => (
                  <td key={String(c.key)} className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700">
                    {c.render ? c.render(row) : (row[c.key] as any) ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const PIE_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// ========== ADMIN DASHBOARD ==========
type DashboardAuxiliaryData = {
  clientes: ApiCliente[] | null;
  incidentes: ApiIncidente[] | null;
  documentos: ApiDocumento[] | null;
  pedidos: ApiPedido[] | null;
  logs: any[] | null;
};

function DashboardPanel({
  title,
  subtitle,
  action,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`admin-dashboard-v97__panel ${className}`}>
      <div className="admin-dashboard-v97__panel-header">
        <div className="min-w-0">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function DashboardEmptyState({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`admin-dashboard-v97__empty ${compact ? 'compact' : ''}`}>
      <DatabaseZap aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function DashboardQuickAction({
  icon: Icon,
  label,
  detail,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  detail?: string;
  tone: 'violet' | 'blue' | 'green' | 'red' | 'amber' | 'cyan' | 'slate';
  onClick: () => void;
}) {
  return (
    <button type="button" className="admin-dashboard-v97__quick-card" onClick={onClick}>
      <span className={`admin-dashboard-v97__quick-icon ${tone}`}>
        <Icon aria-hidden="true" />
      </span>
      <span className="admin-dashboard-v97__quick-copy">
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <ArrowRight aria-hidden="true" className="admin-dashboard-v97__quick-arrow" />
    </button>
  );
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function normaliseCode(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function formatAuditDetail(log: any): string {
  const details = log?.detalhes;
  if (typeof details === 'string' && details.trim()) {
    const value = details.trim();
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        const preferred = parsed.descricao || parsed.mensagem || parsed.assunto || parsed.titulo;
        if (typeof preferred === 'string' && preferred.trim()) return preferred.trim();
        if (Object.keys(parsed).length > 0) return value;
      }
    } catch {
      return value;
    }
  }
  if (details && typeof details === 'object') {
    const preferred = details.descricao || details.mensagem || details.assunto || details.titulo;
    if (typeof preferred === 'string' && preferred.trim()) return preferred.trim();
  }
  const action = typeof log?.acao === 'string' ? log.acao : '';
  const entity = typeof log?.entidade === 'string' ? log.entidade : '';
  return [action, entity].filter(Boolean).join(' · ') || 'Atividade registada';
}

export function AdminDashboard({ setPage }: PageProps) {
  const [data, setData] = useState<ApiDashboardAdmin | null>(null);
  const [auxiliary, setAuxiliary] = useState<DashboardAuxiliaryData>({
    clientes: null,
    incidentes: null,
    documentos: null,
    pedidos: null,
    logs: null,
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      dashboardApi(),
      Promise.allSettled([
        clientesApi(),
        incidentesApi(),
        documentosApi(),
        pedidosApi(),
        logsApi(8),
      ]),
    ])
      .then(([dashboard, results]) => {
        if (!mounted) return;
        const values = results.map((result) =>
          result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : null,
        );
        setData(dashboard as ApiDashboardAdmin);
        setAuxiliary({
          clientes: values[0] as ApiCliente[] | null,
          incidentes: values[1] as ApiIncidente[] | null,
          documentos: values[2] as ApiDocumento[] | null,
          pedidos: values[3] as ApiPedido[] | null,
          logs: values[4],
        });
      })
      .catch((e) => {
        if (mounted) setErr(e?.message || 'Erro ao carregar dashboard');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!data) return null;
  const stats = data.stats || ({} as ApiDashboardAdmin['stats']);
  const totalClients: number | string = isFiniteNonNegative(stats.clientes)
    ? stats.clientes
    : auxiliary.clientes !== null
      ? auxiliary.clientes.length
      : '—';
  const openIncidents: number | string = isFiniteNonNegative(stats.incidentes_abertos)
    ? stats.incidentes_abertos
    : auxiliary.incidentes !== null
      ? auxiliary.incidentes.filter((incident) => normaliseCode(incident.estado) !== 'ENCERRADO').length
      : '—';
  const formattedDate = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeUserValues = (Array.isArray(data.utilizadores_perfil) ? data.utilizadores_perfil : [])
    .map((profile) => profile?.utilizadores_ativos)
    .filter(isFiniteNonNegative);
  const activeUsers: number | string = activeUserValues.length > 0
    ? activeUserValues.reduce((total, value) => total + value, 0)
    : '—';

  const resolutionTotals = (Array.isArray(data.pedidos_estado) ? data.pedidos_estado : [])
    .reduce((totals, state) => {
      const averageHours = state?.tempo_medio_resolucao_horas;
      const requestCount = state?.total_pedidos;
      const isValidAverage = typeof averageHours === 'number' && Number.isFinite(averageHours) && averageHours >= 0;
      const isValidCount = typeof requestCount === 'number' && Number.isFinite(requestCount) && requestCount > 0;

      if (isValidAverage && isValidCount) {
        totals.weightedHours += averageHours * requestCount;
        totals.requestCount += requestCount;
      }

      return totals;
    }, { weightedHours: 0, requestCount: 0 });

  const averageResolutionHours = resolutionTotals.requestCount > 0
    ? resolutionTotals.weightedHours / resolutionTotals.requestCount
    : null;
  const decimalFormatter = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 });
  const averageResolution = averageResolutionHours === null
    ? '—'
    : averageResolutionHours < 24
      ? `${decimalFormatter.format(averageResolutionHours)} h`
      : `${decimalFormatter.format(averageResolutionHours / 24)} d`;

  const conformity = (Array.isArray(data.conformidade) ? data.conformidade : []).map((entry) => {
    const code = normaliseCode(entry?.codigo || entry?.estado);
    const value = isFiniteNonNegative(entry?.numero_clientes) ? entry.numero_clientes : 0;
    const semantic = code.includes('AVALI')
      ? 'evaluation'
      : code.includes('PEND') || code.includes('PROBLEM') || code.includes('NAO_CONFORM')
        ? 'pending'
        : 'compliant';
    return {
      ...entry,
      value,
      semantic,
      label: semantic === 'compliant'
        ? 'Em Conformidade'
        : semantic === 'evaluation'
          ? 'Em Avaliação'
          : 'Problemas Pendentes',
      color: semantic === 'compliant' ? '#16a34a' : semantic === 'evaluation' ? '#d97706' : '#dc2626',
    };
  });
  const conformityTotal = conformity.reduce((sum, item) => sum + item.value, 0);
  const compliantClients = conformity
    .filter((item) => item.semantic === 'compliant')
    .reduce((sum, item) => sum + item.value, 0);
  const conformityPercentage = conformityTotal > 0
    ? Math.round((compliantClients / conformityTotal) * 100)
    : null;

  const incidentTrend = (() => {
    if (!auxiliary.incidentes?.length) return [];
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        mes: new Intl.DateTimeFormat('pt-PT', { month: 'short' })
          .format(date)
          .replace('.', '')
          .replace(/^./, (letter) => letter.toUpperCase()),
        abertos: 0,
        resolvidos: 0,
      };
    });

    auxiliary.incidentes.forEach((incident) => {
      const openedAt = incident.data_hora_incidente || incident.criado_em;
      if (openedAt) {
        const openedDate = new Date(openedAt);
        const target = months.find((month) =>
          month.year === openedDate.getFullYear() && month.month === openedDate.getMonth(),
        );
        if (target && !Number.isNaN(openedDate.getTime())) target.abertos += 1;
      }
      if (incident.encerrado_em) {
        const resolvedDate = new Date(incident.encerrado_em);
        const target = months.find((month) =>
          month.year === resolvedDate.getFullYear() && month.month === resolvedDate.getMonth(),
        );
        if (target && !Number.isNaN(resolvedDate.getTime())) target.resolvidos += 1;
      }
    });

    return months.some((month) => month.abertos > 0 || month.resolvidos > 0) ? months : [];
  })();

  const pendingTickets = (auxiliary.pedidos || []).filter((request) => {
    if (request.resolvido_em) return false;
    const state = normaliseCode(request.estado_codigo || request.estado_nome);
    return state !== 'RESOLVIDO' && state !== 'FECHADO';
  });
  const pendingTicketCount = isFiniteNonNegative(stats.pedidos_abertos)
    ? stats.pedidos_abertos
    : auxiliary.pedidos !== null
      ? pendingTickets.length
      : null;
  const criticalIncidents = (auxiliary.incidentes || []).filter((incident) => {
    if (normaliseCode(incident.estado) === 'ENCERRADO') return false;
    const severity = normaliseCode(incident.gravidade);
    return severity.includes('CRIT') || severity.includes('ALTA') || severity.includes('HIGH');
  });
  const documentCount = isFiniteNonNegative(stats.documentos)
    ? stats.documentos
    : auxiliary.documentos !== null
      ? auxiliary.documentos.length
      : null;
  const auditDateFormatter = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="admin-dashboard-v97 -m-4 min-h-[calc(100vh-4rem)] space-y-7 bg-slate-50 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-6">
      <div className="admin-dashboard-v97__header">
        <h1>Dashboard</h1>
        <p>{formattedDate}</p>
      </div>

      <div className="admin-dashboard-v97__kpis grid grid-cols-2 gap-5 lg:grid-cols-4">
        <DashboardKpiCard
          label="Total de Clientes"
          value={totalClients}
          icon={Building2}
          iconBackground="bg-blue-50"
          iconColor="text-blue-600"
        />
        <DashboardKpiCard
          label="Utilizadores Ativos"
          value={activeUsers}
          icon={Users}
          iconBackground="bg-violet-50"
          iconColor="text-violet-600"
        />
        <DashboardKpiCard
          label="Incidentes Abertos"
          value={openIncidents}
          icon={AlertCircle}
          iconBackground="bg-red-50"
          iconColor="text-red-600"
        />
        <DashboardKpiCard
          label="Tempo Médio Resolução"
          value={averageResolution}
          icon={TrendingUp}
          iconBackground="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      <div className="admin-dashboard-v97__primary-grid">
        <DashboardPanel
          title="Incidentes — Tendência"
          subtitle="Abertos vs. resolvidos · últimos 6 meses"
          action={(
            <button type="button" className="admin-dashboard-v97__text-action" onClick={() => setPage('admin-analytics')}>
              Ver tudo <ArrowRight aria-hidden="true" />
            </button>
          )}
        >
          {incidentTrend.length > 0 ? (
            <div className="admin-dashboard-v97__trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incidentTrend} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="plainline" />
                  <Line type="monotone" name="Abertos" dataKey="abertos" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" name="Resolvidos" dataKey="resolvidos" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <DashboardEmptyState>Sem dados históricos disponíveis</DashboardEmptyState>
          )}
        </DashboardPanel>

        <DashboardPanel title="NIS2 — Distribuição" className="admin-dashboard-v97__nis2-panel">
          <div className="admin-dashboard-v97__donut-wrap">
            {conformityTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conformity}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={46}
                    outerRadius={78}
                    startAngle={90}
                    endAngle={-270}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {conformity.map((entry) => <Cell key={entry.codigo} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="admin-dashboard-v97__empty-donut" aria-label="Sem clientes na distribuição NIS2">
                <span>0</span>
              </div>
            )}
          </div>
          <div className="admin-dashboard-v97__legend">
            {conformity.map((entry) => (
              <div key={entry.codigo}>
                <span className="admin-dashboard-v97__legend-label">
                  <i style={{ backgroundColor: entry.color }} />
                  {entry.label}
                </span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="admin-dashboard-v97__secondary-grid">
        <section className="min-w-0">
          <h2 className="admin-dashboard-v97__section-title">Acesso Rápido</h2>
          <div className="admin-dashboard-v97__quick-grid">
            <DashboardQuickAction icon={Users} label="Utilizadores" detail={typeof activeUsers === 'number' ? `${activeUsers} ativos` : undefined} tone="violet" onClick={() => setPage('admin-users')} />
            <DashboardQuickAction icon={Building2} label="Clientes" detail={typeof totalClients === 'number' ? `${totalClients} total` : undefined} tone="blue" onClick={() => setPage('admin-clients')} />
            <DashboardQuickAction icon={FileText} label="Documentos" detail={documentCount !== null ? `${documentCount} ficheiros` : undefined} tone="green" onClick={() => setPage('admin-documents')} />
            <DashboardQuickAction icon={AlertCircle} label="Incidentes" detail={typeof openIncidents === 'number' ? `${openIncidents} abertos` : undefined} tone="red" onClick={() => setPage('admin-incidents')} />
            <DashboardQuickAction icon={BarChart3} label="Análises" tone="amber" onClick={() => setPage('admin-analytics')} />
            <DashboardQuickAction icon={Activity} label="Logs" tone="slate" onClick={() => setPage('admin-logs')} />
            <DashboardQuickAction icon={Globe2} label="Conteúdo do Site" tone="cyan" onClick={() => setPage('admin-site-content')} />
          </div>
        </section>

        <DashboardPanel
          title="Atividade Recente"
          action={(
            <button type="button" className="admin-dashboard-v97__text-action" onClick={() => setPage('admin-logs')}>
              Ver tudo
            </button>
          )}
          className="admin-dashboard-v97__activity-panel"
        >
          {auxiliary.logs?.length ? (
            <div className="admin-dashboard-v97__activity-list">
              {auxiliary.logs.slice(0, 5).map((log) => (
                <div key={log.id} className="admin-dashboard-v97__activity-item">
                  <span className="admin-dashboard-v97__activity-badge">{log.acao || log.entidade || 'registo'}</span>
                  <div className="min-w-0 flex-1">
                    {log.utilizador_nome && <strong>{log.utilizador_nome}</strong>}
                    <p>{formatAuditDetail(log)}</p>
                    {log.criado_em && <time>{auditDateFormatter.format(new Date(log.criado_em))}</time>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState compact>Sem atividade recente disponível</DashboardEmptyState>
          )}
        </DashboardPanel>
      </div>

      <div className="admin-dashboard-v97__lower-grid">
        <DashboardPanel title="Alertas Críticos" subtitle="Requerem atenção imediata">
          {criticalIncidents.length ? (
            <div className="admin-dashboard-v97__alerts-list">
              {criticalIncidents.slice(0, 4).map((incident) => (
                <button key={incident.id} type="button" onClick={() => setPage('admin-incidents')}>
                  <ShieldAlert aria-hidden="true" />
                  <span>
                    <strong>{incident.codigo} · {incident.tipo_incidente}</strong>
                    {incident.cliente_nome && <small>{incident.cliente_nome}</small>}
                  </span>
                  <em>{incident.gravidade}</em>
                </button>
              ))}
            </div>
          ) : (
            <DashboardEmptyState compact>Sem alertas críticos disponíveis</DashboardEmptyState>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Tickets Pendentes"
          action={pendingTicketCount !== null ? <span className="admin-dashboard-v97__count-badge">{pendingTicketCount} abertos</span> : undefined}
        >
          {pendingTickets.length ? (
            <div className="admin-dashboard-v97__tickets-list">
              {pendingTickets.slice(0, 4).map((request) => (
                <div key={request.id}>
                  <span>#{request.id}</span>
                  <strong>{request.assunto}</strong>
                  <small>{[request.cliente_nome, request.estado_nome].filter(Boolean).join(' · ')}</small>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState compact>Sem tickets pendentes disponíveis</DashboardEmptyState>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Próximos Pentests"
          action={(
            <button type="button" className="admin-dashboard-v97__text-action" onClick={() => setPage('admin-clients')}>
              Ver tudo <ArrowRight aria-hidden="true" />
            </button>
          )}
          className="admin-dashboard-v97__pentest-panel"
        >
          <DashboardEmptyState compact>Sem pentests agendados disponíveis</DashboardEmptyState>
          <div className="admin-dashboard-v97__global-nis2">
            <h3>NIS2 — Conformidade Global</h3>
            {conformityPercentage !== null ? (
              <>
                <div className="admin-dashboard-v97__progress-row">
                  <div
                    className="admin-dashboard-v97__progress"
                    role="progressbar"
                    aria-label="Conformidade global NIS2"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={conformityPercentage}
                  >
                    <span style={{ width: `${conformityPercentage}%` }} />
                  </div>
                  <strong>{conformityPercentage}%</strong>
                </div>
                <p>{compliantClients} de {conformityTotal} clientes em conformidade</p>
              </>
            ) : (
              <p>Sem dados de conformidade disponíveis</p>
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

// ========== ADMIN ANALYTICS ==========
const ANALYTICS_CHART_TOOLTIP = {
  backgroundColor: '#ffffff',
  border: '1px solid #dce3ec',
  borderRadius: '6px',
  color: '#334155',
  fontSize: '12px',
};

const ANALYTICS_AXIS_TICK = { fill: '#94a3b8', fontSize: 12 };

function AnalyticsEmptyState({ historical = false }: { historical?: boolean }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center px-4 text-center text-sm text-slate-500">
      {historical ? 'Sem dados históricos disponíveis' : 'Sem dados disponíveis'}
    </div>
  );
}

function formatAnalyticsMonth(value: string): string {
  const source = /^\d{4}-\d{2}$/.test(value) ? `${value}-01T00:00:00` : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-PT', { month: 'short' })
    .format(date)
    .replace('.', '')
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function AdminAnalytics() {
  const [data, setData] = useState<ApiDashboardAdmin | null>(null);
  const [incidents, setIncidents] = useState<ApiIncidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([dashboardApi(), incidentesApi()])
      .then(([dashboardResult, incidentsResult]) => {
        if (!mounted) return;
        if (dashboardResult.status === 'rejected') throw dashboardResult.reason;
        if (dashboardResult.value.tipo !== 'admin') throw new Error('Dashboard de administrador indisponível');

        setData(dashboardResult.value);
        setIncidents(
          incidentsResult.status === 'fulfilled' && Array.isArray(incidentsResult.value)
            ? incidentsResult.value
            : [],
        );
      })
      .catch((error) => {
        if (mounted) setErr(error?.message || 'Erro ao carregar análises');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader text="A carregar análises..." />;
  if (err) return <ErrorCard msg={err} />;
  if (!data) return null;

  const conformity = (Array.isArray(data.conformidade) ? data.conformidade : []).map((entry) => {
    const code = normaliseCode(entry?.codigo || entry?.estado);
    const value = isFiniteNonNegative(entry?.numero_clientes) ? entry.numero_clientes : 0;
    const semantic = code.includes('AVALI')
      ? 'evaluation'
      : code.includes('PEND') || code.includes('PROBLEM') || code.includes('NAO_CONFORM')
        ? 'pending'
        : 'compliant';

    return {
      code: entry.codigo,
      label: semantic === 'compliant'
        ? 'Em Conformidade'
        : semantic === 'evaluation'
          ? 'Em Avaliação'
          : 'Problemas Pendentes',
      value,
      color: semantic === 'compliant' ? '#16a34a' : semantic === 'evaluation' ? '#d97706' : '#dc2626',
    };
  });
  const conformityTotal = conformity.reduce((sum, entry) => sum + entry.value, 0);

  const topIncidents = (Array.isArray(data.top_incidentes) ? data.top_incidentes : [])
    .filter((entry) => typeof entry?.nome === 'string' && isFiniteNonNegative(entry?.total_incidentes))
    .slice(0, 5)
    .map((entry) => ({ nome: entry.nome, incidentes: entry.total_incidentes }));
  const hasTopIncidents = topIncidents.some((entry) => entry.incidentes > 0);

  const usersByProfile = (Array.isArray(data.utilizadores_perfil) ? data.utilizadores_perfil : [])
    .filter((entry) => typeof entry?.perfil === 'string' && isFiniteNonNegative(entry?.total_utilizadores))
    .map((entry, index) => ({
      code: entry.codigo,
      label: entry.perfil,
      value: entry.total_utilizadores,
      color: ['#2563eb', '#8b5cf6', '#06b6d4'][index % 3],
    }));
  const userTotal = usersByProfile.reduce((sum, entry) => sum + entry.value, 0);

  const incidentTrend = (() => {
    if (!incidents.length) return [];
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        mes: formatAnalyticsMonth(date.toISOString()),
        abertos: 0,
        resolvidos: 0,
      };
    });

    incidents.forEach((incident) => {
      const openedAt = incident.data_hora_incidente || incident.criado_em;
      if (openedAt) {
        const date = new Date(openedAt);
        const month = months.find((entry) =>
          entry.year === date.getFullYear() && entry.month === date.getMonth(),
        );
        if (month && !Number.isNaN(date.getTime())) month.abertos += 1;
      }
      if (incident.encerrado_em) {
        const date = new Date(incident.encerrado_em);
        const month = months.find((entry) =>
          entry.year === date.getFullYear() && entry.month === date.getMonth(),
        );
        if (month && !Number.isNaN(date.getTime())) month.resolvidos += 1;
      }
    });

    return months.some((entry) => entry.abertos > 0 || entry.resolvidos > 0) ? months : [];
  })();

  const documentsByMonth = (() => {
    const monthlyTotals = new Map<string, number>();
    (Array.isArray(data.documentos_mes) ? data.documentos_mes : []).forEach((entry) => {
      if (typeof entry?.mes !== 'string' || !isFiniteNonNegative(entry?.total_documentos)) return;
      monthlyTotals.set(entry.mes, (monthlyTotals.get(entry.mes) || 0) + entry.total_documentos);
    });
    return Array.from(monthlyTotals, ([month, docs]) => ({ month, mes: formatAnalyticsMonth(month), docs }))
      .sort((a, b) => a.month.localeCompare(b.month));
  })();
  const hasDocuments = documentsByMonth.some((entry) => entry.docs > 0);

  const ticketsByState = (Array.isArray(data.pedidos_estado) ? data.pedidos_estado : [])
    .filter((entry) => typeof entry?.estado === 'string' && isFiniteNonNegative(entry?.total_pedidos))
    .map((entry) => {
      const code = normaliseCode(entry.codigo || entry.estado);
      const color = code.includes('ABERTO')
        ? '#dc2626'
        : code.includes('ANALISE') || code.includes('AGUARDA')
          ? '#d97706'
          : code.includes('RESOLVIDO')
            ? '#16a34a'
            : '#64748b';
      return {
        code: entry.codigo,
        name: entry.estado,
        value: entry.total_pedidos,
        averageHours: entry.tempo_medio_resolucao_horas,
        color,
      };
    });
  const hasTickets = ticketsByState.some((entry) => entry.value > 0);
  const resolutionTotals = ticketsByState.reduce((totals, entry) => {
    const validAverage = typeof entry.averageHours === 'number'
      && Number.isFinite(entry.averageHours)
      && entry.averageHours >= 0;
    if (validAverage && entry.value > 0) {
      totals.hours += entry.averageHours * entry.value;
      totals.count += entry.value;
    }
    return totals;
  }, { hours: 0, count: 0 });
  const averageResolutionHours = resolutionTotals.count > 0
    ? resolutionTotals.hours / resolutionTotals.count
    : null;
  const numberFormatter = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 });
  const averageResolution = averageResolutionHours === null
    ? '—'
    : averageResolutionHours < 24
      ? `${numberFormatter.format(averageResolutionHours)} h`
      : `${numberFormatter.format(averageResolutionHours / 24)} dias`;

  return (
    <div className="admin-analytics-v97 min-w-0">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Administrador</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-slate-700">Análises &amp; Gráficos</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-xl font-bold text-slate-900">Análises &amp; Gráficos</h1>
        <p className="mt-1 text-sm text-slate-500">Visão analítica completa da plataforma</p>
      </header>

      <div className="mb-6 grid min-w-0 gap-6 lg:grid-cols-3">
        <DashboardPanel title="Clientes por Conformidade NIS2" subtitle="Distribuição atual" className="h-full">
          <div className="h-[180px]" role="img" aria-label="Distribuição de clientes por conformidade NIS2">
            {conformityTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={conformity} dataKey="value" nameKey="label" outerRadius={70} innerRadius={40} stroke="#ffffff" strokeWidth={2}>
                    {conformity.map((entry) => <Cell key={entry.code} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="admin-dashboard-v97__empty-donut" aria-label="Sem clientes na distribuição NIS2">
                <span>0</span>
              </div>
            )}
          </div>
          <div className="admin-dashboard-v97__legend mt-2">
            {conformity.map((entry) => (
              <div key={entry.code}>
                <span className="admin-dashboard-v97__legend-label">
                  <i style={{ backgroundColor: entry.color }} />
                  {entry.label}
                </span>
                <strong>{entry.value} {entry.value === 1 ? 'cliente' : 'clientes'}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Top 5 por Incidentes" subtitle="Clientes com mais incidentes" className="h-full">
          <div className="h-[200px]" role="img" aria-label="Clientes com mais incidentes">
            {hasTopIncidents ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIncidents} layout="vertical" margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nome" width={88} tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                  <Bar dataKey="incidentes" name="Incidentes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState />
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Utilizadores por Perfil" className="h-full">
          <div className="h-[180px]" role="img" aria-label="Distribuição de utilizadores por perfil">
            {userTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={usersByProfile} dataKey="value" nameKey="label" outerRadius={70} innerRadius={40} stroke="#ffffff" strokeWidth={2}>
                    {usersByProfile.map((entry) => <Cell key={entry.code} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState />
            )}
          </div>
          <div className="admin-dashboard-v97__legend mt-2">
            {usersByProfile.map((entry) => (
              <div key={entry.code}>
                <span className="admin-dashboard-v97__legend-label">
                  <i style={{ backgroundColor: entry.color }} />
                  {entry.label}
                </span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="mb-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <DashboardPanel title="Incidentes — Tendência" subtitle="Abertos vs. resolvidos · últimos 6 meses" className="h-full">
          <div className="h-[200px]" role="img" aria-label="Tendência de incidentes abertos e resolvidos nos últimos seis meses">
            {incidentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incidentTrend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                  <XAxis dataKey="mes" tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" name="Abertos" dataKey="abertos" stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" name="Resolvidos" dataKey="resolvidos" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState historical />
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Documentos Submetidos" subtitle="Por mês, todos os clientes" className="h-full">
          <div className="h-[200px]" role="img" aria-label="Documentos submetidos por mês">
            {hasDocuments ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentsByMonth} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                  <XAxis dataKey="mes" tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                  <Bar dataKey="docs" name="Documentos" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState />
            )}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Pedidos / Tickets por Estado"
        action={<span className="text-xs text-slate-500">Tempo médio de resolução: <strong className="font-semibold text-slate-700">{averageResolution}</strong></span>}
      >
        <div className="h-[180px]" role="img" aria-label="Pedidos e tickets por estado">
          {hasTickets ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByState} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                <XAxis dataKey="name" tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={ANALYTICS_AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ANALYTICS_CHART_TOOLTIP} />
                <Bar dataKey="value" name="Pedidos" radius={[3, 3, 0, 0]}>
                  {ticketsByState.map((entry) => <Cell key={entry.code} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmptyState />
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}

// ========== ADMIN USERS ==========
export function AdminUsers({ setPage }: PageProps) {
  void setPage;
  type Filter = 'TODOS' | 'COLABORADOR' | 'CLIENTE';
  type Mode = 'create' | 'edit' | 'detail' | null;
  const blankForm = { nome: '', email: '', telefone: '', nif: '', password: '' };
  const [users, setUsers] = useState<ApiUtilizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<ApiUtilizador | null>(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setErr(null);
    return utilizadoresApi()
      .then(setUsers)
      .catch((e) => setErr(e?.message || 'Não foi possível carregar os utilizadores.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const counts = {
    TODOS: users.length,
    COLABORADOR: users.filter((u) => u.perfil_codigo === 'COLABORADOR').length,
    CLIENTE: users.filter((u) => u.perfil_codigo === 'CLIENTE').length,
  };
  const query = search.trim().toLocaleLowerCase('pt-PT');
  const filtered = users.filter((u) => {
    const profileMatches = filter === 'TODOS' || u.perfil_codigo === filter;
    const queryMatches = !query || [u.nome, u.email, u.telefone, u.clientes]
      .some((value) => String(value || '').toLocaleLowerCase('pt-PT').includes(query));
    return profileMatches && queryMatches;
  });

  const openCreate = () => {
    setSelected(null);
    setForm(blankForm);
    setFormError(null);
    setMode('create');
  };
  const openDetail = (user: ApiUtilizador) => {
    setSelected(user);
    setMode('detail');
  };
  const openEdit = (user: ApiUtilizador) => {
    setSelected(user);
    setForm({
      nome: user.nome || '', email: user.email || '', telefone: user.telefone || '',
      nif: user.nif || '', password: '',
    });
    setFormError(null);
    setMode('edit');
  };
  const closeModal = () => {
    if (saving) return;
    setMode(null);
    setSelected(null);
    setFormError(null);
  };
  const updateForm = (field: keyof typeof blankForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (mode === 'create') {
        await criarGestorApi({ ...form, ativo: true });
        setNotice('Gestor criado com sucesso. A password não foi enviada por email.');
      } else if (mode === 'edit' && selected) {
        await atualizarUtilizadorApi(selected.id, {
          nome: form.nome, email: form.email, telefone: form.telefone, nif: form.nif,
        });
        setNotice('Utilizador atualizado com sucesso.');
      }
      setMode(null);
      setSelected(null);
      setFormError(null);
      await loadUsers();
    } catch (e: any) {
      const fields = e?.data?.campos as Record<string, string[]> | undefined;
      const firstFieldError = fields ? Object.values(fields).flat()[0] : null;
      setFormError(firstFieldError || e?.message || 'Não foi possível guardar o utilizador.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (user: ApiUtilizador) => {
    const action = user.ativo ? 'desativar' : 'ativar';
    if (!window.confirm(`Confirma que pretende ${action} ${user.nome}?`)) return;
    setErr(null);
    try {
      await alterarEstadoUtilizadorApi(user.id, !user.ativo);
      setNotice(`Utilizador ${user.ativo ? 'desativado' : 'ativado'} com sucesso.`);
      await loadUsers();
    } catch (e: any) {
      setErr(e?.message || `Não foi possível ${action} o utilizador.`);
    }
  };

  const profileLabel = (user: ApiUtilizador) => user.perfil_codigo === 'COLABORADOR'
    ? 'Gestor'
    : user.perfil_codigo === 'CLIENTE' ? 'Cliente / Empresa' : 'Administrador';
  const profileTone = (user: ApiUtilizador) => user.perfil_codigo === 'COLABORADOR'
    ? 'admin-users-v97__profile--manager'
    : user.perfil_codigo === 'CLIENTE' ? 'admin-users-v97__profile--client' : 'admin-users-v97__profile--admin';

  return (
    <div className="admin-users-v97">
      <PageHeader
        title="Gestão de Utilizadores"
        subtitle={`${users.length} utilizadores registados na plataforma`}
        actions={
          <button type="button" onClick={openCreate} className="admin-users-v97__primary-button">
            <Plus aria-hidden="true" /> Novo Utilizador
          </button>
        }
      />

      {notice && (
        <div className="admin-users-v97__notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Fechar mensagem"><X /></button>
        </div>
      )}
      {err && <div className="mb-4"><ErrorCard msg={err} /></div>}

      <section className="admin-users-v97__toolbar" aria-label="Pesquisa e filtros">
        <label className="admin-users-v97__search">
          <Search aria-hidden="true" />
          <span className="sr-only">Pesquisar utilizadores</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome ou e-mail..." />
        </label>
        <div className="admin-users-v97__filters" role="group" aria-label="Filtrar por perfil">
          {([
            ['TODOS', 'Todos'], ['COLABORADOR', 'Gestores'], ['CLIENTE', 'Empresas'],
          ] as Array<[Filter, string]>).map(([key, label]) => (
            <button type="button" key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
              {label} <span>{counts[key]}</span>
            </button>
          ))}
        </div>
      </section>

      {loading ? <Loader text="A carregar utilizadores..." /> : (
        <div className="admin-users-v97__table-card">
          <div className="admin-users-v97__table-scroll">
            <table>
              <thead><tr>
                <th>Utilizador</th><th>Contacto</th><th>Perfil</th><th>Estado</th><th>Criado em</th><th className="text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((user) => {
                  const editable = user.perfil_codigo !== 'ADMINISTRADOR';
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-users-v97__identity">
                          <span className={`admin-users-v97__avatar ${profileTone(user)}`}>{(user.nome || '?').charAt(0).toUpperCase()}</span>
                          <span><strong>{user.nome}</strong><small>#{user.id}</small></span>
                        </div>
                      </td>
                      <td><span className="admin-users-v97__contact"><Mail />{user.email}</span>{user.telefone && <span className="admin-users-v97__contact"><Phone />{user.telefone}</span>}</td>
                      <td><span className={`admin-users-v97__profile ${profileTone(user)}`}>{profileLabel(user)}</span></td>
                      <td><span className={`admin-users-v97__status ${user.ativo ? 'active' : 'inactive'}`}><i />{user.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td>{user.criado_em ? new Date(user.criado_em).toLocaleDateString('pt-PT') : '—'}</td>
                      <td>
                        <div className="admin-users-v97__actions">
                          <button type="button" onClick={() => openDetail(user)} title="Ver detalhes" aria-label={`Ver detalhes de ${user.nome}`}><Eye /></button>
                          {editable && <button type="button" onClick={() => openEdit(user)} title="Editar" aria-label={`Editar ${user.nome}`}><Pencil /></button>}
                          {editable && <button type="button" onClick={() => void toggleUser(user)} className={user.ativo ? 'danger' : 'success'} title={user.ativo ? 'Desativar' : 'Ativar'} aria-label={`${user.ativo ? 'Desativar' : 'Ativar'} ${user.nome}`}><Power /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="admin-users-v97__empty">Não existem utilizadores para os critérios selecionados.</div>}
        </div>
      )}

      {mode && (
        <div className="admin-users-v97__modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <section className="admin-users-v97__modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
            <header>
              <div>
                <span className="admin-users-v97__modal-kicker">{mode === 'create' ? 'Novo acesso' : mode === 'edit' ? 'Editar perfil' : 'Detalhes do utilizador'}</span>
                <h2 id="admin-user-modal-title">{mode === 'create' ? 'Criar Gestor' : selected?.nome}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Fechar"><X /></button>
            </header>

            {mode === 'detail' && selected ? (
              <div className="admin-users-v97__detail">
                <div className="admin-users-v97__detail-hero">
                  <span className={`admin-users-v97__avatar ${profileTone(selected)}`}>{selected.nome.charAt(0).toUpperCase()}</span>
                  <div><strong>{selected.nome}</strong><span className={`admin-users-v97__profile ${profileTone(selected)}`}>{profileLabel(selected)}</span></div>
                </div>
                <dl>
                  <div><dt>Email</dt><dd>{selected.email}</dd></div>
                  <div><dt>Telefone</dt><dd>{selected.telefone || 'Não indicado'}</dd></div>
                  <div><dt>NIF</dt><dd>{selected.nif || 'Não indicado'}</dd></div>
                  <div><dt>Estado</dt><dd>{selected.ativo ? 'Ativo' : 'Inativo'}</dd></div>
                  <div><dt>Organização</dt><dd>{selected.clientes || 'Sem associação'}</dd></div>
                  <div><dt>Último acesso</dt><dd>{selected.ultimo_acesso_em ? new Date(selected.ultimo_acesso_em).toLocaleString('pt-PT') : 'Nunca'}</dd></div>
                </dl>
                {selected.perfil_codigo !== 'ADMINISTRADOR' && <button type="button" className="admin-users-v97__secondary-button" onClick={() => openEdit(selected)}><Pencil /> Editar utilizador</button>}
              </div>
            ) : (
              <form onSubmit={saveUser}>
                {mode === 'create' && <p className="admin-users-v97__form-note">Será criada uma conta com o perfil Gestor. A password é definida aqui, guardada com hash e não é enviada por email.</p>}
                <div className="admin-users-v97__form-grid">
                  <label className="full"><span>Nome completo *</span><input required maxLength={120} value={form.nome} onChange={(e) => updateForm('nome', e.target.value)} /></label>
                  <label className="full"><span>Email *</span><input required type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} /></label>
                  <label><span>Telefone</span><input maxLength={30} value={form.telefone} onChange={(e) => updateForm('telefone', e.target.value)} /></label>
                  <label><span>NIF</span><input inputMode="numeric" pattern="[0-9]{9}" maxLength={9} value={form.nif} onChange={(e) => updateForm('nif', e.target.value.replace(/\D/g, '').slice(0, 9))} /></label>
                  {mode === 'create' && <label className="full"><span>Password inicial *</span><input required type="password" minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} /><small>Mínimo de 10 caracteres.</small></label>}
                </div>
                {formError && <div className="admin-users-v97__form-error" role="alert">{formError}</div>}
                <footer><button type="button" className="admin-users-v97__secondary-button" onClick={closeModal}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : mode === 'create' ? 'Criar Gestor' : 'Guardar alterações'}</button></footer>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ========== ADMIN CLIENTS ==========
type AdminClientEditorMode = 'create' | 'edit';

type AdminClientFormState = {
  nome: string; nif: string; email: string; telefone: string; morada: string;
  setor_atividade: string; numero_colaboradores: string; volume_negocios: string;
  responsavel_nome: string; responsavel_cargo: string; responsavel_email: string; responsavel_telefone: string;
  permanente_nome: string; permanente_cargo: string; permanente_email: string; permanente_telefone: string;
};

const EMPTY_CLIENT_FORM: AdminClientFormState = {
  nome: '', nif: '', email: '', telefone: '', morada: '', setor_atividade: '', numero_colaboradores: '', volume_negocios: '',
  responsavel_nome: '', responsavel_cargo: '', responsavel_email: '', responsavel_telefone: '',
  permanente_nome: '', permanente_cargo: '', permanente_email: '', permanente_telefone: '',
};

function clientFormFromDetail(detail?: ApiClienteDetalhe | null): AdminClientFormState {
  if (!detail) return { ...EMPTY_CLIENT_FORM };
  const security = detail.contactos.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA');
  const permanent = detail.contactos.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE');
  const client = detail.cliente;
  return {
    nome: client.nome || '', nif: client.nif || '', email: client.email || '', telefone: client.telefone || '',
    morada: client.morada || '', setor_atividade: client.setor_atividade || '',
    numero_colaboradores: client.numero_colaboradores == null ? '' : String(client.numero_colaboradores),
    volume_negocios: client.volume_negocios == null ? '' : String(client.volume_negocios),
    responsavel_nome: security?.nome || '', responsavel_cargo: security?.cargo || '', responsavel_email: security?.email || '', responsavel_telefone: security?.telefone || '',
    permanente_nome: permanent?.nome || '', permanente_cargo: permanent?.cargo || '', permanente_email: permanent?.email || '', permanente_telefone: permanent?.telefone || '',
  };
}

function AdminClientEditor({ mode, detail, onCancel, onSaved }: {
  mode: AdminClientEditorMode;
  detail?: ApiClienteDetalhe | null;
  onCancel: () => void;
  onSaved: (detail: ApiClienteDetalhe) => void;
}) {
  const [form, setForm] = useState<AdminClientFormState>(() => clientFormFromDetail(detail));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (field: keyof AdminClientFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload: ApiClientePayload = {
      nome: form.nome.trim(), nif: form.nif, email: form.email.trim(), telefone: form.telefone.trim(),
      morada: form.morada.trim(), setor_atividade: form.setor_atividade.trim(),
      numero_colaboradores: form.numero_colaboradores === '' ? null : Number(form.numero_colaboradores),
      volume_negocios: form.volume_negocios === '' ? null : Number(form.volume_negocios),
      responsavel_seguranca: {
        nome: form.responsavel_nome.trim(), cargo: form.responsavel_cargo.trim(),
        email: form.responsavel_email.trim(), telefone: form.responsavel_telefone.trim(),
      },
      contacto_permanente: {
        nome: form.permanente_nome.trim(), cargo: form.permanente_cargo.trim(),
        email: form.permanente_email.trim(), telefone: form.permanente_telefone.trim(),
      },
    };
    try {
      const saved = mode === 'create'
        ? await criarClienteApi(payload)
        : await atualizarClienteApi(Number(detail?.cliente.id), payload);
      onSaved(saved);
    } catch (e: any) {
      const fields = e?.data?.campos as Record<string, string[]> | undefined;
      setError((fields && Object.values(fields).flat()[0]) || e?.message || 'Não foi possível guardar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof AdminClientFormState, label: string, options?: { required?: boolean; type?: string; inputMode?: 'numeric' | 'decimal'; pattern?: string; maxLength?: number }) => (
    <label><span>{label}{options?.required ? ' *' : ''}</span><input required={options?.required} type={options?.type || 'text'} inputMode={options?.inputMode} pattern={options?.pattern} maxLength={options?.maxLength} value={form[name]} onChange={(event) => update(name, event.target.value)} /></label>
  );

  return (
    <div className="admin-client-v97__modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}>
      <section className="admin-client-v97__modal" role="dialog" aria-modal="true" aria-labelledby="admin-client-modal-title">
        <header><div><span>{mode === 'create' ? 'Novo registo' : 'Atualizar registo'}</span><h2 id="admin-client-modal-title">{mode === 'create' ? 'Criar Cliente' : `Editar ${detail?.cliente.nome}`}</h2></div><button type="button" onClick={onCancel} disabled={saving} aria-label="Fechar"><X /></button></header>
        <form onSubmit={submit}>
          <fieldset><legend>Organização</legend><div className="admin-client-v97__form-grid">
            {field('nome', 'Nome da organização', { required: true })}
            {field('nif', 'NIF', { required: true, inputMode: 'numeric', pattern: '[0-9]{9}', maxLength: 9 })}
            {field('email', 'Email geral', { required: true, type: 'email' })}
            {field('telefone', 'Telefone')}
            {field('setor_atividade', 'Setor de atividade')}
            {field('numero_colaboradores', 'N.º de colaboradores', { type: 'number', inputMode: 'numeric' })}
            {field('volume_negocios', 'Volume de negócios (€)', { type: 'number', inputMode: 'decimal' })}
            <label className="full"><span>Morada</span><textarea rows={2} value={form.morada} onChange={(event) => update('morada', event.target.value)} /></label>
          </div></fieldset>
          <fieldset><legend>Responsável de Segurança</legend><div className="admin-client-v97__form-grid">
            {field('responsavel_nome', 'Nome', { required: true })}{field('responsavel_cargo', 'Cargo')}
            {field('responsavel_email', 'Email', { required: true, type: 'email' })}{field('responsavel_telefone', 'Telefone', { required: true })}
          </div></fieldset>
          <fieldset><legend>Contacto Permanente / Emergência</legend><div className="admin-client-v97__form-grid">
            {field('permanente_nome', 'Nome', { required: true })}{field('permanente_cargo', 'Cargo')}
            {field('permanente_email', 'Email', { required: true, type: 'email' })}{field('permanente_telefone', 'Telefone', { required: true })}
          </div></fieldset>
          {error && <div className="admin-client-v97__form-error" role="alert">{error}</div>}
          <footer><button type="button" className="admin-users-v97__secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : mode === 'create' ? 'Criar Cliente' : 'Guardar alterações'}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function AdminClients({ setPage }: PageProps) {
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadClients = () => {
    setLoading(true);
    setErr(null);
    return clientesApi()
      .then(setClients)
      .catch((e) => setErr(e?.message || 'Não foi possível carregar os clientes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const query = q.trim().toLocaleLowerCase('pt-PT');
  const filtered = clients.filter((client) => {
    const queryMatch = !query || [client.nome, client.nif, client.email, client.setor_atividade]
      .some((value) => String(value || '').toLocaleLowerCase('pt-PT').includes(query));
    const statusMatch = status === 'TODOS' || (status === 'ATIVOS' ? client.ativo !== false : client.ativo === false);
    return queryMatch && statusMatch;
  });

  const openDetail = (client: ApiCliente) => {
    session.set({ ...session.get(), cliente: client });
    setPage('admin-client-detail');
  };

  const toggleClient = async (client: ApiCliente) => {
    const active = client.ativo !== false;
    if (!window.confirm(`Confirma que pretende ${active ? 'desativar' : 'ativar'} ${client.nome}?`)) return;
    try {
      await alterarEstadoClienteApi(client.id, !active);
      setNotice(`Cliente ${active ? 'desativado' : 'ativado'} com sucesso.`);
      await loadClients();
    } catch (e: any) {
      setErr(e?.message || 'Não foi possível alterar o estado do cliente.');
    }
  };

  return (
    <div className="admin-client-v97">
      <PageHeader
        title="Gestão de Clientes"
        subtitle={`${clients.length} clientes registados na plataforma`}
        actions={
          <button type="button" onClick={() => setShowCreate(true)} className="admin-users-v97__primary-button"><Plus /> Novo Cliente</button>
        }
      />
      {notice && <div className="admin-users-v97__notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Fechar mensagem"><X /></button></div>}
      {err && <div className="mb-4"><ErrorCard msg={err} /></div>}
      <section className="admin-users-v97__toolbar">
        <label className="admin-users-v97__search"><Search /><span className="sr-only">Pesquisar clientes</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome, NIF, email ou setor..." /></label>
        <div className="admin-users-v97__filters">{([['TODOS', 'Todos'], ['ATIVOS', 'Ativos'], ['INATIVOS', 'Inativos']] as const).map(([key, label]) => <button type="button" key={key} className={status === key ? 'active' : ''} onClick={() => setStatus(key)}>{label}</button>)}</div>
      </section>
      {loading ? <Loader text="A carregar clientes..." /> : (
        <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Cliente</th><th>Setor</th><th>Ativos</th><th>Incidentes</th><th>Conformidade</th><th>Estado</th><th className="text-right">Ações</th></tr></thead><tbody>
          {filtered.map((client) => <tr key={client.id}>
            <td><button type="button" className="admin-client-v97__identity" onClick={() => openDetail(client)}><span>{client.nome.charAt(0).toUpperCase()}</span><span><strong>{client.nome}</strong><small>NIF {client.nif || '—'} · {client.email || 'Sem email'}</small></span></button></td>
            <td>{client.setor_atividade || '—'}</td><td>{client.total_ativos ?? 0}</td><td>{client.total_incidentes ?? 0}</td>
            <td><span className={`admin-client-v97__conformity ${normaliseCode(client.estado_conformidade).includes('CONFORME') ? 'ok' : normaliseCode(client.estado_conformidade).includes('AVALI') ? 'review' : normaliseCode(client.estado_conformidade).includes('PEND') ? 'pending' : ''}`}>{client.estado_conformidade || 'Sem avaliação'}</span></td>
            <td><span className={`admin-users-v97__status ${client.ativo !== false ? 'active' : 'inactive'}`}><i />{client.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
            <td><div className="admin-users-v97__actions"><button type="button" onClick={() => openDetail(client)} aria-label={`Ver ${client.nome}`} title="Ver detalhes"><Eye /></button><button type="button" onClick={() => void toggleClient(client)} className={client.ativo !== false ? 'danger' : 'success'} aria-label={`${client.ativo !== false ? 'Desativar' : 'Ativar'} ${client.nome}`} title={client.ativo !== false ? 'Desativar' : 'Ativar'}><Power /></button></div></td>
          </tr>)}
        </tbody></table></div>{filtered.length === 0 && <div className="admin-users-v97__empty">Não existem clientes para os critérios selecionados.</div>}</div>
      )}
      {showCreate && <AdminClientEditor mode="create" onCancel={() => setShowCreate(false)} onSaved={(detail) => { setShowCreate(false); setNotice(`Cliente ${detail.cliente.nome} criado com os contactos obrigatórios.`); void loadClients(); }} />}
    </div>
  );
}

export function AdminClientDetail({ setPage }: PageProps) {
  const selectedId = session.get().cliente?.id;
  const [detail, setDetail] = useState<ApiClienteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDetail = () => {
    if (!selectedId) {
      setError('Nenhum cliente selecionado.');
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return clienteDetalheApi(selectedId).then(setDetail).catch((e) => setError(e?.message || 'Não foi possível carregar o cliente.')).finally(() => setLoading(false));
  };
  useEffect(() => { void loadDetail(); }, [selectedId]);

  if (loading) return <Loader text="A carregar detalhe do cliente..." />;
  if (error || !detail) return <div><button type="button" onClick={() => setPage('admin-clients')} className="admin-users-v97__secondary-button">← Voltar</button><div className="mt-4"><ErrorCard msg={error || 'Cliente não encontrado.'} /></div></div>;

  const client = detail.cliente;
  const security = detail.contactos.find((contact) => contact.tipo === 'RESPONSAVEL_SEGURANCA');
  const permanent = detail.contactos.find((contact) => contact.tipo === 'CONTACTO_PERMANENTE');
  const rawScore = Number(client.pontuacao);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(10, rawScore / 10)) : null;
  const toggle = async () => {
    const active = client.ativo !== false;
    if (!window.confirm(`Confirma que pretende ${active ? 'desativar' : 'ativar'} ${client.nome}?`)) return;
    try { await alterarEstadoClienteApi(client.id, !active); setNotice(`Cliente ${active ? 'desativado' : 'ativado'} com sucesso.`); await loadDetail(); }
    catch (e: any) { setError(e?.message || 'Não foi possível alterar o estado.'); }
  };

  return (
    <div className="admin-client-detail-v97">
      <div className="admin-client-detail-v97__back"><button type="button" onClick={() => setPage('admin-clients')}>← Voltar a Clientes</button></div>
      <PageHeader title={client.nome} subtitle={`NIF ${client.nif || '—'} · ${client.setor_atividade || 'Setor não indicado'}`} actions={<><button type="button" className="admin-users-v97__secondary-button" onClick={() => void toggle()}><Power />{client.ativo !== false ? 'Desativar' : 'Ativar'}</button><button type="button" className="admin-users-v97__primary-button" onClick={() => setEditing(true)}><Pencil /> Editar Cliente</button></>} />
      {notice && <div className="admin-users-v97__notice"><span>{notice}</span><button type="button" onClick={() => setNotice(null)}><X /></button></div>}
      <div className="admin-client-detail-v97__kpis">
        <div><span>Score de Segurança</span><strong>{score === null ? '—' : `${score.toFixed(1)}/10`}</strong></div>
        <div><span>Conformidade NIS2</span><strong>{client.estado_conformidade || 'Sem avaliação'}</strong></div>
        <div><span>Ativos</span><strong>{detail.ativos.length}</strong></div>
        <div><span>Incidentes</span><strong>{detail.incidentes.length}</strong></div>
      </div>
      <div className="admin-client-detail-v97__grid">
        <section className="admin-client-detail-v97__panel wide"><h2>Dados gerais</h2><dl>
          <div><dt>Email</dt><dd>{client.email || '—'}</dd></div><div><dt>Telefone</dt><dd>{client.telefone || '—'}</dd></div><div><dt>Morada</dt><dd>{client.morada || '—'}</dd></div><div><dt>Colaboradores</dt><dd>{client.numero_colaboradores ?? '—'}</dd></div><div><dt>Volume de negócios</dt><dd>{client.volume_negocios == null ? '—' : `${Number(client.volume_negocios).toLocaleString('pt-PT')} €`}</dd></div><div><dt>Estado</dt><dd>{client.ativo !== false ? 'Ativo' : 'Inativo'}</dd></div>
        </dl></section>
        <section className="admin-client-detail-v97__panel"><h2>Gestor responsável</h2><div className="admin-client-detail-v97__empty"><Users />Não atribuído no domínio atual</div></section>
        {[['Responsável de Segurança', security], ['Contacto Permanente', permanent]].map(([label, contact]) => <section key={String(label)} className="admin-client-detail-v97__panel"><h2>{String(label)}</h2>{contact && typeof contact === 'object' ? <div className="admin-client-detail-v97__contact"><strong>{contact.nome}</strong>{contact.cargo && <span>{contact.cargo}</span>}<a href={`mailto:${contact.email}`}><Mail />{contact.email}</a>{contact.telefone && <a href={`tel:${contact.telefone}`}><Phone />{contact.telefone}</a>}</div> : <div className="admin-client-detail-v97__empty">Sem contacto registado</div>}</section>)}
      </div>
      <section className="admin-client-detail-v97__panel admin-client-detail-v97__records"><h2>Registos do Cliente</h2><div className="admin-client-detail-v97__record-grid">
        {[['Ativos', detail.ativos.length, detail.ativos.slice(0, 3).map((item) => item.nome)], ['Incidentes', detail.incidentes.length, detail.incidentes.slice(0, 3).map((item) => item.titulo || `Incidente #${item.id}`)], ['Documentos', detail.documentos.length, detail.documentos.slice(0, 3).map((item) => item.titulo)], ['Pedidos / Tickets', detail.pedidos.length, detail.pedidos.slice(0, 3).map((item) => item.assunto)], ['Avaliações de risco', detail.avaliacoes.length, detail.avaliacoes.slice(0, 3).map((item) => item.estado_conformidade_nome || `Avaliação #${item.id}`)]].map(([label, count, names]) => <article key={String(label)}><header><strong>{String(label)}</strong><span>{Number(count)}</span></header>{Array.isArray(names) && names.length ? <ul>{names.map((name) => <li key={String(name)}>{String(name)}</li>)}</ul> : <p>Sem registos disponíveis</p>}</article>)}
      </div></section>
      {editing && <AdminClientEditor mode="edit" detail={detail} onCancel={() => setEditing(false)} onSaved={(saved) => { setDetail(saved); setEditing(false); setNotice('Cliente atualizado com sucesso.'); }} />}
    </div>
  );
}

// ========== ADMIN DOCUMENTS ==========
export function AdminDocuments() {
  const [data, setData] = useState<ApiDocumento[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('TODAS');
  const [clientFilter, setClientFilter] = useState('TODOS');
  const [mode, setMode] = useState<'upload' | 'detail' | 'edit' | null>(null);
  const [selected, setSelected] = useState<ApiDocumento | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [upload, setUpload] = useState({ clienteId: '', categoria: 'DOCUMENTACAO', titulo: '', descricao: '', ficheiro: null as File | null });

  const loadDocuments = () => {
    setLoading(true);
    setErr(null);
    return Promise.all([documentosApi(), clientesApi()])
      .then(([documents, clientRows]) => { setData(documents); setClients(clientRows); })
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void loadDocuments();
  }, []);

  const query = search.trim().toLocaleLowerCase('pt-PT');
  const filtered = data.filter((document) => {
    const queryMatch = !query || [document.titulo, document.cliente_nome, document.nome_ficheiro_original]
      .some((value) => String(value || '').toLocaleLowerCase('pt-PT').includes(query));
    return queryMatch && (category === 'TODAS' || document.categoria === category)
      && (clientFilter === 'TODOS' || String(document.cliente_id) === clientFilter);
  });

  const openUpload = () => {
    setUpload({ clienteId: clients[0] ? String(clients[0].id) : '', categoria: 'DOCUMENTACAO', titulo: '', descricao: '', ficheiro: null });
    setFormError(null);
    setMode('upload');
  };
  const uploadDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!upload.ficheiro) { setFormError('Selecione um ficheiro.'); return; }
    setSaving(true); setFormError(null);
    try {
      await submeterDocumentoApi({ clienteId: Number(upload.clienteId), categoria: upload.categoria, titulo: upload.titulo, descricao: upload.descricao, ficheiro: upload.ficheiro });
      setMode(null); setNotice('Documento submetido e guardado na área privada.'); await loadDocuments();
    } catch (e: any) {
      const fields = e?.data?.campos as Record<string, string[]> | undefined;
      setFormError((fields && Object.values(fields).flat()[0]) || e?.message || 'Não foi possível submeter o documento.');
    } finally { setSaving(false); }
  };
  const saveMetadata = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setFormError(null);
    try { const saved = await atualizarDocumentoApi(selected.id, { categoria: selected.categoria || 'OUTRO', titulo: selected.titulo, descricao: selected.descricao || '' }); setSelected(saved); setMode('detail'); setNotice('Metadados atualizados com sucesso.'); await loadDocuments(); }
    catch (e: any) { setFormError(e?.message || 'Não foi possível atualizar o documento.'); }
    finally { setSaving(false); }
  };
  const download = async (document: ApiDocumento) => {
    setErr(null);
    try {
      const { blob, filename } = await descarregarDocumentoApi(document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setErr(e?.message || 'Não foi possível descarregar o documento.'); }
  };
  const formatSize = (bytes?: number | null) => {
    if (typeof bytes !== 'number') return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-resource-v97">
      <PageHeader
        title="Documentos da Plataforma"
        subtitle={`${data.length} documentos privados registados`}
        actions={
          <button type="button" onClick={openUpload} className="admin-users-v97__primary-button"><UploadCloud /> Submeter Documento</button>
        }
      />
      {notice && <div className="admin-users-v97__notice"><span>{notice}</span><button type="button" onClick={() => setNotice(null)}><X /></button></div>}
      {err && <div className="mb-4"><ErrorCard msg={err} /></div>}
      <div className="admin-resource-v97__toolbar">
        <label className="admin-users-v97__search"><Search /><span className="sr-only">Pesquisar documentos</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar título, cliente ou ficheiro..." /></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="TODAS">Todas as categorias</option>{['DOCUMENTACAO', 'RELATORIO', 'PENTEST', 'EVIDENCIA', 'OUTRO'].map((value) => <option key={value}>{value}</option>)}</select>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}><option value="TODOS">Todos os clientes</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</select>
      </div>
      {loading ? <Loader text="A carregar documentos..." /> : <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Documento</th><th>Cliente</th><th>Categoria</th><th>Ficheiro</th><th>Tamanho</th><th>Submetido</th><th className="text-right">Ações</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.id}>
        <td><div className="admin-resource-v97__name"><FileText /><span><strong>{document.titulo}</strong><small>#{document.id}</small></span></div></td><td>{document.cliente_nome || '—'}</td><td><span className="admin-resource-v97__badge">{document.categoria || 'OUTRO'}</span></td><td>{document.nome_ficheiro_original || '—'}</td><td>{formatSize(document.tamanho_bytes)}</td><td>{document.submetido_em ? new Date(document.submetido_em).toLocaleString('pt-PT') : '—'}</td><td><div className="admin-users-v97__actions"><button type="button" title="Ver metadados" onClick={() => { setSelected(document); setMode('detail'); }}><Eye /></button><button type="button" title="Descarregar" onClick={() => void download(document)}><Download /></button></div></td>
      </tr>)}</tbody></table></div>{filtered.length === 0 && <div className="admin-users-v97__empty">Sem documentos para os critérios selecionados.</div>}</div>}

      {mode && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setMode(null)}><section className="admin-resource-v97__modal" role="dialog" aria-modal="true"><header><div><span>{mode === 'upload' ? 'Novo ficheiro' : mode === 'edit' ? 'Editar metadados' : 'Metadados'}</span><h2>{mode === 'upload' ? 'Submeter Documento' : selected?.titulo}</h2></div><button type="button" onClick={() => setMode(null)}><X /></button></header>
        {mode === 'upload' ? <form onSubmit={uploadDocument}><div className="admin-resource-v97__form-grid"><label><span>Cliente *</span><select required value={upload.clienteId} onChange={(e) => setUpload({ ...upload, clienteId: e.target.value })}><option value="">Selecione...</option>{clients.filter((client) => client.ativo !== false).map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</select></label><label><span>Categoria *</span><select value={upload.categoria} onChange={(e) => setUpload({ ...upload, categoria: e.target.value })}>{['DOCUMENTACAO', 'RELATORIO', 'PENTEST', 'EVIDENCIA', 'OUTRO'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="full"><span>Título *</span><input required maxLength={180} value={upload.titulo} onChange={(e) => setUpload({ ...upload, titulo: e.target.value })} /></label><label className="full"><span>Descrição</span><textarea rows={3} value={upload.descricao} onChange={(e) => setUpload({ ...upload, descricao: e.target.value })} /></label><label className="full"><span>Ficheiro * · PDF, DOCX, XLSX, PNG, JPG ou TXT · máximo 10 MB</span><input required type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt" onChange={(e) => setUpload({ ...upload, ficheiro: e.target.files?.[0] || null })} /></label></div>{formError && <div className="admin-client-v97__form-error">{formError}</div>}<footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setMode(null)}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A submeter...' : 'Submeter'}</button></footer></form> : selected && mode === 'detail' ? <div className="admin-resource-v97__detail"><dl><div><dt>Cliente</dt><dd>{selected.cliente_nome || '—'}</dd></div><div><dt>Categoria</dt><dd>{selected.categoria || '—'}</dd></div><div><dt>Ficheiro</dt><dd>{selected.nome_ficheiro_original || '—'}</dd></div><div><dt>MIME</dt><dd>{selected.tipo_mime || '—'}</dd></div><div><dt>Tamanho</dt><dd>{formatSize(selected.tamanho_bytes)}</dd></div><div><dt>Submetido por</dt><dd>{selected.submetido_por_nome || '—'}</dd></div><div><dt>Descrição</dt><dd>{selected.descricao || 'Sem descrição'}</dd></div></dl><footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setMode('edit')}><Pencil /> Editar metadados</button><button type="button" className="admin-users-v97__primary-button" onClick={() => void download(selected)}><Download /> Descarregar</button></footer></div> : selected && <form onSubmit={saveMetadata}><div className="admin-resource-v97__form-grid"><label><span>Categoria *</span><select value={selected.categoria || 'OUTRO'} onChange={(e) => setSelected({ ...selected, categoria: e.target.value })}>{['DOCUMENTACAO', 'RELATORIO', 'PENTEST', 'EVIDENCIA', 'OUTRO'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="full"><span>Título *</span><input required maxLength={180} value={selected.titulo} onChange={(e) => setSelected({ ...selected, titulo: e.target.value })} /></label><label className="full"><span>Descrição</span><textarea rows={3} value={selected.descricao || ''} onChange={(e) => setSelected({ ...selected, descricao: e.target.value })} /></label></div>{formError && <div className="admin-client-v97__form-error">{formError}</div>}<footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setMode('detail')}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</button></footer></form>}
      </section></div>}
    </div>
  );
}

// ========== ADMIN INCIDENTS ==========
export function AdminIncidents() {
  const [data, setData] = useState<ApiIncidente[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('TODOS');
  const [severityFilter, setSeverityFilter] = useState('TODAS');
  const [clientFilter, setClientFilter] = useState('TODOS');
  const [mode, setMode] = useState<'create' | 'detail' | 'edit' | null>(null);
  const [selected, setSelected] = useState<ApiIncidente | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emptyIncident = (): ApiIncidentePayload => ({
    cliente_id: clients[0]?.id || 0, codigo: '', data_hora_incidente: '', tipo_incidente: '', descricao: '',
    utilizadores_afetados: 0, dados_comprometidos: false, gravidade: 'MEDIA', estado: 'ABERTO',
  });
  const [form, setForm] = useState<ApiIncidentePayload>(() => emptyIncident());

  const loadIncidents = () => {
    setLoading(true); setErr(null);
    return Promise.all([incidentesApi(), clientesApi()])
      .then(([incidents, clientRows]) => { setData(incidents); setClients(clientRows); })
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void loadIncidents();
  }, []);

  const query = search.trim().toLocaleLowerCase('pt-PT');
  const filtered = data.filter((incident) => {
    const queryMatch = !query || [incident.codigo, incident.tipo_incidente, incident.cliente_nome, incident.descricao, incident.sistemas_afetados]
      .some((value) => String(value || '').toLocaleLowerCase('pt-PT').includes(query));
    return queryMatch && (stateFilter === 'TODOS' || incident.estado === stateFilter)
      && (severityFilter === 'TODAS' || incident.gravidade === severityFilter)
      && (clientFilter === 'TODOS' || String(incident.cliente_id) === clientFilter);
  });
  const toLocalDateTime = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
  const formFromIncident = (incident: ApiIncidente): ApiIncidentePayload => ({
    cliente_id: incident.cliente_id, codigo: incident.codigo, data_hora_incidente: toLocalDateTime(incident.data_hora_incidente),
    registado_por: incident.registado_por || '', departamento: incident.departamento || '', tipo_incidente: incident.tipo_incidente,
    descricao: incident.descricao || '', utilizadores_afetados: incident.utilizadores_afetados || 0,
    dados_comprometidos: !!incident.dados_comprometidos, sistemas_afetados: incident.sistemas_afetados || '',
    origem_ataque: incident.origem_ataque || '', ip_atacante: incident.ip_atacante || '', analise_log: incident.analise_log || '',
    resposta_imediata: incident.resposta_imediata || '', medidas_corretivas: incident.medidas_corretivas || '',
    gravidade: incident.gravidade || 'MEDIA', probabilidade_reincidencia: incident.probabilidade_reincidencia || '',
    recomendacoes: incident.recomendacoes || '', estado: incident.estado || 'ABERTO', encerrado_em: toLocalDateTime(incident.encerrado_em),
    responsavel_encerramento: incident.responsavel_encerramento || '',
  });
  const openCreate = () => { setSelected(null); setForm({ ...emptyIncident(), cliente_id: clients[0]?.id || 0 }); setFormError(null); setMode('create'); };
  const openDetail = (incident: ApiIncidente) => { setSelected(incident); setMode('detail'); };
  const openEdit = (incident: ApiIncidente) => { setSelected(incident); setForm(formFromIncident(incident)); setFormError(null); setMode('edit'); };
  const updateForm = <K extends keyof ApiIncidentePayload>(key: K, value: ApiIncidentePayload[K]) => setForm((current) => ({ ...current, [key]: value }));
  const saveIncident = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setFormError(null);
    const payload = { ...form, encerrado_em: form.estado === 'ENCERRADO' ? form.encerrado_em : null };
    try {
      const saved = mode === 'create' ? await criarIncidenteApi(payload) : await atualizarIncidenteApi(Number(selected?.id), payload);
      setMode(null); setSelected(saved); setNotice(`Incidente ${saved.codigo} ${mode === 'create' ? 'registado' : 'atualizado'} com sucesso.`); await loadIncidents();
    } catch (e: any) {
      const fields = e?.data?.campos as Record<string, string[]> | undefined;
      setFormError((fields && Object.values(fields).flat()[0]) || e?.message || 'Não foi possível guardar o incidente.');
    } finally { setSaving(false); }
  };
  const severityClass = (value?: string | null) => normaliseCode(value).includes('CRIT') || normaliseCode(value).includes('ALTA') ? 'danger' : normaliseCode(value).includes('MEDIA') ? 'warning' : 'success';

  return (
    <div className="admin-resource-v97 admin-incidents-v97">
      <PageHeader
        title="Gestão de Incidentes"
        subtitle={`${data.filter((incident) => normaliseCode(incident.estado) !== 'ENCERRADO').length} incidentes em curso / ${data.length} total`}
        actions={
          <button type="button" onClick={openCreate} className="admin-users-v97__primary-button"><Plus /> Reportar Incidente</button>
        }
      />
      {notice && <div className="admin-users-v97__notice"><span>{notice}</span><button type="button" onClick={() => setNotice(null)}><X /></button></div>}
      {err && <div className="mb-4"><ErrorCard msg={err} /></div>}
      <div className="admin-resource-v97__toolbar"><label className="admin-users-v97__search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar código, tipo, cliente ou sistema..." /></label><select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}><option value="TODOS">Todos os estados</option><option value="ABERTO">Aberto</option><option value="EM_ANALISE">Em análise</option><option value="ENCERRADO">Encerrado</option></select><select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}><option value="TODAS">Todas as gravidades</option>{['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map((value) => <option key={value}>{value}</option>)}</select><select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}><option value="TODOS">Todos os clientes</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</select></div>
      {loading ? <Loader text="A carregar incidentes..." /> : <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Referência</th><th>Incidente</th><th>Cliente</th><th>Gravidade</th><th>Estado</th><th>Data</th><th className="text-right">Ações</th></tr></thead><tbody>{filtered.map((incident) => <tr key={incident.id}><td><span className="admin-incidents-v97__code">{incident.codigo}</span></td><td><strong className="admin-incidents-v97__title">{incident.tipo_incidente}</strong>{incident.sistemas_afetados && <small className="admin-incidents-v97__systems">{incident.sistemas_afetados}</small>}</td><td>{incident.cliente_nome || '—'}</td><td><span className={`admin-incidents-v97__severity ${severityClass(incident.gravidade)}`}>{incident.gravidade || '—'}</span></td><td><span className={`admin-incidents-v97__state ${normaliseCode(incident.estado).toLowerCase()}`}>{String(incident.estado || '—').replace('_', ' ')}</span></td><td>{incident.data_hora_incidente ? new Date(incident.data_hora_incidente).toLocaleString('pt-PT') : '—'}</td><td><div className="admin-users-v97__actions"><button type="button" onClick={() => openDetail(incident)} title="Ver detalhe"><Eye /></button><button type="button" onClick={() => openEdit(incident)} title="Editar"><Pencil /></button></div></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="admin-users-v97__empty">Sem incidentes para os critérios selecionados.</div>}</div>}

      {mode && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setMode(null)}><section className="admin-resource-v97__modal admin-incidents-v97__modal" role="dialog" aria-modal="true"><header><div><span>{mode === 'create' ? 'Novo registo' : mode === 'edit' ? 'Atualizar incidente' : 'Detalhe operacional'}</span><h2>{mode === 'create' ? 'Reportar Incidente' : `${selected?.codigo} · ${selected?.tipo_incidente}`}</h2></div><button type="button" onClick={() => setMode(null)}><X /></button></header>
        {mode === 'detail' && selected ? <div className="admin-resource-v97__detail"><div className="admin-incidents-v97__detail-badges"><span className={`admin-incidents-v97__severity ${severityClass(selected.gravidade)}`}>{selected.gravidade}</span><span className={`admin-incidents-v97__state ${normaliseCode(selected.estado).toLowerCase()}`}>{String(selected.estado).replace('_', ' ')}</span></div><dl>{[['Cliente', selected.cliente_nome], ['Código', selected.codigo], ['Data e hora', selected.data_hora_incidente ? new Date(selected.data_hora_incidente).toLocaleString('pt-PT') : '—'], ['Tipo', selected.tipo_incidente], ['Descrição', selected.descricao], ['Sistemas afetados', selected.sistemas_afetados], ['Utilizadores afetados', selected.utilizadores_afetados], ['Dados comprometidos', selected.dados_comprometidos ? 'Sim' : 'Não'], ['Origem', selected.origem_ataque], ['IP atacante', selected.ip_atacante], ['Resposta imediata', selected.resposta_imediata], ['Medidas corretivas', selected.medidas_corretivas], ['Recomendações', selected.recomendacoes], ['Encerrado em', selected.encerrado_em ? new Date(selected.encerrado_em).toLocaleString('pt-PT') : '—']].map(([label, value]) => <div key={String(label)}><dt>{String(label)}</dt><dd>{value == null || value === '' ? '—' : String(value)}</dd></div>)}</dl><footer><button type="button" className="admin-users-v97__primary-button" onClick={() => openEdit(selected)}><Pencil /> Editar incidente</button></footer></div> : <form onSubmit={saveIncident}><div className="admin-resource-v97__form-grid"><label><span>Cliente *</span><select required value={form.cliente_id || ''} onChange={(e) => updateForm('cliente_id', Number(e.target.value))}><option value="">Selecione...</option>{clients.filter((client) => client.ativo !== false).map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</select></label><label><span>Código *</span><input required maxLength={40} value={form.codigo} onChange={(e) => updateForm('codigo', e.target.value)} /></label><label><span>Data e hora *</span><input required type="datetime-local" value={form.data_hora_incidente} onChange={(e) => updateForm('data_hora_incidente', e.target.value)} /></label><label><span>Tipo *</span><input required maxLength={100} value={form.tipo_incidente} onChange={(e) => updateForm('tipo_incidente', e.target.value)} /></label><label><span>Gravidade *</span><select value={form.gravidade} onChange={(e) => updateForm('gravidade', e.target.value)}>{['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Estado *</span><select value={form.estado} onChange={(e) => updateForm('estado', e.target.value)}><option value="ABERTO">ABERTO</option><option value="EM_ANALISE">EM ANÁLISE</option><option value="ENCERRADO">ENCERRADO</option></select></label><label className="full"><span>Descrição *</span><textarea required rows={3} value={form.descricao} onChange={(e) => updateForm('descricao', e.target.value)} /></label><label className="full"><span>Sistemas afetados</span><textarea rows={2} value={form.sistemas_afetados || ''} onChange={(e) => updateForm('sistemas_afetados', e.target.value)} /></label><label><span>Utilizadores afetados</span><input type="number" min="0" value={form.utilizadores_afetados || 0} onChange={(e) => updateForm('utilizadores_afetados', Number(e.target.value))} /></label><label className="admin-incidents-v97__checkbox"><input type="checkbox" checked={!!form.dados_comprometidos} onChange={(e) => updateForm('dados_comprometidos', e.target.checked)} /><span>Dados comprometidos</span></label><label><span>Registado por</span><input value={form.registado_por || ''} onChange={(e) => updateForm('registado_por', e.target.value)} /></label><label><span>Departamento</span><input value={form.departamento || ''} onChange={(e) => updateForm('departamento', e.target.value)} /></label><label><span>Origem do ataque</span><input value={form.origem_ataque || ''} onChange={(e) => updateForm('origem_ataque', e.target.value)} /></label><label><span>IP atacante</span><input value={form.ip_atacante || ''} onChange={(e) => updateForm('ip_atacante', e.target.value)} /></label><label className="full"><span>Resposta imediata</span><textarea rows={2} value={form.resposta_imediata || ''} onChange={(e) => updateForm('resposta_imediata', e.target.value)} /></label><label className="full"><span>Medidas corretivas</span><textarea rows={2} value={form.medidas_corretivas || ''} onChange={(e) => updateForm('medidas_corretivas', e.target.value)} /></label><label className="full"><span>Recomendações</span><textarea rows={2} value={form.recomendacoes || ''} onChange={(e) => updateForm('recomendacoes', e.target.value)} /></label>{form.estado === 'ENCERRADO' && <><label><span>Encerrado em *</span><input required type="datetime-local" value={form.encerrado_em || ''} onChange={(e) => updateForm('encerrado_em', e.target.value)} /></label><label><span>Responsável pelo encerramento</span><input value={form.responsavel_encerramento || ''} onChange={(e) => updateForm('responsavel_encerramento', e.target.value)} /></label></>}</div>{formError && <div className="admin-client-v97__form-error">{formError}</div>}<footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setMode(null)}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : mode === 'create' ? 'Registar Incidente' : 'Guardar alterações'}</button></footer></form>}
      </section></div>}
    </div>
  );
}

// ========== ADMIN LOGS ==========
export function AdminLogs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('TODAS');
  const [entity, setEntity] = useState('TODAS');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    logsApi(200)
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const actions = Array.from(new Set(data.map((log) => String(log.acao || '')).filter(Boolean))).sort();
  const entities = Array.from(new Set(data.map((log) => String(log.entidade || '')).filter(Boolean))).sort();
  const query = search.trim().toLocaleLowerCase('pt-PT');
  const filtered = data.filter((log) => {
    const details = typeof log.detalhes === 'string' ? log.detalhes : JSON.stringify(log.detalhes || {});
    const queryMatch = !query || [log.utilizador_nome, log.utilizador_email, log.acao, log.entidade, log.entidade_id, details]
      .some((value) => String(value || '').toLocaleLowerCase('pt-PT').includes(query));
    return queryMatch && (action === 'TODAS' || log.acao === action) && (entity === 'TODAS' || log.entidade === entity);
  });

  return (
    <div className="admin-resource-v97 admin-logs-v97">
      <PageHeader
        title="Logs de Atividade"
        subtitle={`${data.length} eventos recentes · consulta apenas de leitura`}
      />
      {err && <div className="mb-4"><ErrorCard msg={err} /></div>}
      <div className="admin-resource-v97__toolbar"><label className="admin-users-v97__search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar utilizador, ação, entidade ou detalhe..." /></label><select value={action} onChange={(e) => setAction(e.target.value)}><option value="TODAS">Todas as ações</option>{actions.map((value) => <option key={value}>{value}</option>)}</select><select value={entity} onChange={(e) => setEntity(e.target.value)}><option value="TODAS">Todas as entidades</option>{entities.map((value) => <option key={value}>{value}</option>)}</select></div>
      {loading ? <Loader text="A carregar logs..." /> : <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Data / Hora</th><th>Utilizador</th><th>Ação</th><th>Entidade</th><th>Recurso</th><th>IP</th><th className="text-right">Detalhe</th></tr></thead><tbody>{filtered.map((log) => <tr key={log.id}><td>{log.criado_em ? new Date(log.criado_em).toLocaleString('pt-PT') : '—'}</td><td><strong className="admin-logs-v97__user">{log.utilizador_nome || 'Sistema'}</strong>{log.utilizador_email && <small>{log.utilizador_email}</small>}</td><td><span className="admin-logs-v97__action">{log.acao || '—'}</span></td><td>{log.entidade || '—'}</td><td>{log.entidade_id ? `#${log.entidade_id}` : '—'}</td><td><span className="admin-logs-v97__ip">{log.endereco_ip || '—'}</span></td><td><div className="admin-users-v97__actions"><button type="button" onClick={() => setSelected(log)} title="Ver detalhe"><Eye /></button></div></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="admin-users-v97__empty">Sem eventos para os critérios selecionados.</div>}</div>}
      {selected && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><section className="admin-resource-v97__modal" role="dialog" aria-modal="true"><header><div><span>Evento #{selected.id}</span><h2>{selected.acao} · {selected.entidade}</h2></div><button type="button" onClick={() => setSelected(null)}><X /></button></header><div className="admin-resource-v97__detail"><dl><div><dt>Data / Hora</dt><dd>{selected.criado_em ? new Date(selected.criado_em).toLocaleString('pt-PT') : '—'}</dd></div><div><dt>Utilizador</dt><dd>{selected.utilizador_nome || 'Sistema'}{selected.utilizador_email ? ` · ${selected.utilizador_email}` : ''}</dd></div><div><dt>Entidade</dt><dd>{selected.entidade}{selected.entidade_id ? ` #${selected.entidade_id}` : ''}</dd></div><div><dt>Endereço IP</dt><dd>{selected.endereco_ip || '—'}</dd></div><div><dt>Detalhe seguro</dt><dd><pre className="admin-logs-v97__details">{JSON.stringify(selected.detalhes || {}, null, 2)}</pre></dd></div></dl></div></section></div>}
    </div>
  );
}

// ========== ADMIN SITE CONTENT & PERMISSIONS ==========
type AdminContentTab = 'contents' | 'news' | 'messages';
type AdminEditorMode = 'create' | 'edit' | null;

const CONTENT_KEY_OPTIONS = [
  ['HOME_HERO', 'Homepage · Hero'],
  ['MISSAO', 'Missão'],
  ['VISAO', 'Visão'],
  ['VALORES', 'Valores'],
  ['SERVICOS_INTRO', 'Serviços · Introdução'],
  ['SOBRE_EMPRESA', 'Sobre a empresa'],
] as const;

const EMPTY_CONTENT_FORM: ApiConteudoSitePayload = {
  chave: 'MISSAO', titulo: '', subtitulo: '', corpo: '', imagem_url: '', ativo: true, ordem: 0,
};
const EMPTY_NEWS_FORM: ApiNoticiaPayload = {
  titulo: '', resumo: '', corpo: '', imagem_url: '', publicada: false,
};

function contentPayload(item: ApiConteudoSite): ApiConteudoSitePayload {
  return {
    chave: item.chave, titulo: item.titulo, subtitulo: item.subtitulo || '', corpo: item.corpo || '',
    imagem_url: item.imagem_url || '', ativo: item.ativo, ordem: item.ordem,
  };
}

function newsPayload(item: ApiNoticia): ApiNoticiaPayload {
  return {
    titulo: item.titulo, resumo: item.resumo, corpo: item.corpo,
    imagem_url: item.imagem_url || '', publicada: item.publicada,
  };
}

export function AdminSiteContent() {
  const [tab, setTab] = useState<AdminContentTab>('contents');
  const [contents, setContents] = useState<ApiConteudoSite[]>([]);
  const [news, setNews] = useState<ApiNoticia[]>([]);
  const [messages, setMessages] = useState<ApiMensagemContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<AdminEditorMode>(null);
  const [contentId, setContentId] = useState<number | null>(null);
  const [contentForm, setContentForm] = useState<ApiConteudoSitePayload>({ ...EMPTY_CONTENT_FORM });
  const [newsMode, setNewsMode] = useState<AdminEditorMode>(null);
  const [newsId, setNewsId] = useState<number | null>(null);
  const [newsForm, setNewsForm] = useState<ApiNoticiaPayload>({ ...EMPTY_NEWS_FORM });
  const [selectedMessage, setSelectedMessage] = useState<ApiMensagemContacto | null>(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    return Promise.all([conteudosAdminApi(), noticiasAdminApi(), contactosAdminApi()])
      .then(([contentRows, newsRows, messageRows]) => {
        setContents(contentRows); setNews(newsRows); setMessages(messageRows);
      })
      .catch((e) => setError(e?.message || 'Não foi possível carregar o conteúdo do site.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void loadAll(); }, []);

  const openContent = (item?: ApiConteudoSite) => {
    setError(null);
    setContentMode(item ? 'edit' : 'create');
    setContentId(item?.id ?? null);
    setContentForm(item ? contentPayload(item) : { ...EMPTY_CONTENT_FORM });
  };
  const openNews = (item?: ApiNoticia) => {
    setError(null);
    setNewsMode(item ? 'edit' : 'create');
    setNewsId(item?.id ?? null);
    setNewsForm(item ? newsPayload(item) : { ...EMPTY_NEWS_FORM });
  };

  const saveContent = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    const payload = {
      ...contentForm, chave: contentForm.chave.trim(), titulo: contentForm.titulo.trim(),
      subtitulo: contentForm.subtitulo?.trim() || '', corpo: contentForm.corpo?.trim() || '',
      imagem_url: contentForm.imagem_url?.trim() || '',
    };
    try {
      if (contentMode === 'edit' && contentId) await atualizarConteudoAdminApi(contentId, payload);
      else await criarConteudoAdminApi(payload);
      setNotice('Conteúdo guardado e persistido com sucesso.'); setContentMode(null); await loadAll();
    } catch (e: any) { setError(e?.message || 'Não foi possível guardar o conteúdo.'); }
    finally { setSaving(false); }
  };

  const saveNews = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    const payload = {
      ...newsForm, titulo: newsForm.titulo.trim(), resumo: newsForm.resumo.trim(),
      corpo: newsForm.corpo.trim(), imagem_url: newsForm.imagem_url?.trim() || '',
    };
    try {
      if (newsMode === 'edit' && newsId) await atualizarNoticiaAdminApi(newsId, payload);
      else await criarNoticiaAdminApi(payload);
      setNotice(`Notícia guardada${payload.publicada ? ' e publicada' : ' como rascunho'} com sucesso.`);
      setNewsMode(null); await loadAll();
    } catch (e: any) { setError(e?.message || 'Não foi possível guardar a notícia.'); }
    finally { setSaving(false); }
  };

  const toggleContent = async (item: ApiConteudoSite) => {
    try {
      await atualizarConteudoAdminApi(item.id, { ...contentPayload(item), ativo: !item.ativo });
      setNotice(`Conteúdo ${item.ativo ? 'desativado' : 'publicado'} com sucesso.`); await loadAll();
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar o estado do conteúdo.'); }
  };
  const toggleNews = async (item: ApiNoticia) => {
    try {
      await atualizarNoticiaAdminApi(item.id, { ...newsPayload(item), publicada: !item.publicada });
      setNotice(`Notícia ${item.publicada ? 'despublicada' : 'publicada'} com sucesso.`); await loadAll();
    } catch (e: any) { setError(e?.message || 'Não foi possível alterar a publicação.'); }
  };
  const updateMessageState = async (item: ApiMensagemContacto, estado: EstadoMensagemContacto) => {
    try {
      const updated = await atualizarEstadoContactoAdminApi(item.id, estado);
      setSelectedMessage(updated); setNotice('Estado da mensagem atualizado.'); await loadAll();
    } catch (e: any) { setError(e?.message || 'Não foi possível atualizar a mensagem.'); }
  };

  const tabActions = tab === 'contents'
    ? <button type="button" className="admin-users-v97__primary-button" onClick={() => openContent()}><Plus /> Novo Conteúdo</button>
    : tab === 'news'
      ? <button type="button" className="admin-users-v97__primary-button" onClick={() => openNews()}><Plus /> Nova Notícia</button>
      : undefined;

  return (
    <div className="admin-site-content-v97 admin-resource-v97">
      <PageHeader title="Gestão de Conteúdo do Site" subtitle="Conteúdo público persistido na PostgreSQL" actions={tabActions} />
      {notice && <div className="admin-users-v97__notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Fechar mensagem"><X /></button></div>}
      {error && <div className="mb-4"><ErrorCard msg={error} /></div>}

      <nav className="admin-site-content-v97__tabs nav nav-pills" aria-label="Áreas de conteúdo">
        <button type="button" className={tab === 'contents' ? 'active' : ''} onClick={() => setTab('contents')}><Globe2 /> Conteúdo institucional <span>{contents.length}</span></button>
        <button type="button" className={tab === 'news' ? 'active' : ''} onClick={() => setTab('news')}><Newspaper /> Notícias <span>{news.length}</span></button>
        <button type="button" className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}><Inbox /> Mensagens <span>{messages.filter((item) => item.estado === 'NOVA').length}</span></button>
      </nav>

      {loading ? <Loader text="A carregar conteúdo do site..." /> : tab === 'contents' ? (
        <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Página / Bloco</th><th>Chave</th><th>Atualização</th><th>Estado</th><th className="text-right">Ações</th></tr></thead><tbody>
          {contents.map((item) => <tr key={item.id}><td><strong className="admin-site-content-v97__title">{item.titulo}</strong><small>{item.subtitulo || item.corpo || 'Sem descrição'}</small></td><td><code className="admin-site-content-v97__key">{item.chave}</code></td><td>{item.atualizado_em ? new Date(item.atualizado_em).toLocaleString('pt-PT') : '—'}{item.atualizado_por_nome && <small>por {item.atualizado_por_nome}</small>}</td><td><span className={`admin-users-v97__status ${item.ativo ? 'active' : 'inactive'}`}><i />{item.ativo ? 'Publicado' : 'Inativo'}</span></td><td><div className="admin-users-v97__actions"><button type="button" onClick={() => openContent(item)} title="Editar"><Pencil /></button><button type="button" className={item.ativo ? 'danger' : 'success'} onClick={() => void toggleContent(item)} title={item.ativo ? 'Desativar' : 'Publicar'}><Power /></button></div></td></tr>)}
        </tbody></table></div>{contents.length === 0 && <div className="admin-users-v97__empty">Ainda não existem conteúdos institucionais.</div>}</div>
      ) : tab === 'news' ? (
        <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Notícia</th><th>Autor</th><th>Publicação</th><th>Estado</th><th className="text-right">Ações</th></tr></thead><tbody>
          {news.map((item) => <tr key={item.id}><td><strong className="admin-site-content-v97__title">{item.titulo}</strong><small>{item.resumo}</small></td><td>{item.autor_nome || '—'}</td><td>{item.publicada_em ? new Date(item.publicada_em).toLocaleString('pt-PT') : 'Não publicada'}</td><td><span className={`admin-users-v97__status ${item.publicada ? 'active' : 'inactive'}`}><i />{item.publicada ? 'Publicada' : 'Rascunho'}</span></td><td><div className="admin-users-v97__actions"><button type="button" onClick={() => openNews(item)} title="Editar"><Pencil /></button><button type="button" className={item.publicada ? 'danger' : 'success'} onClick={() => void toggleNews(item)} title={item.publicada ? 'Despublicar' : 'Publicar'}><Power /></button></div></td></tr>)}
        </tbody></table></div>{news.length === 0 && <div className="admin-users-v97__empty">Ainda não existem notícias.</div>}</div>
      ) : (
        <div className="admin-users-v97__table-card"><div className="admin-users-v97__table-scroll"><table><thead><tr><th>Recebida</th><th>Contacto</th><th>Assunto</th><th>Estado</th><th className="text-right">Detalhe</th></tr></thead><tbody>
          {messages.map((item) => <tr key={item.id}><td>{item.criado_em ? new Date(item.criado_em).toLocaleString('pt-PT') : '—'}</td><td><strong className="admin-site-content-v97__title">{item.nome}</strong><small>{item.email}{item.empresa ? ` · ${item.empresa}` : ''}</small></td><td>{item.assunto}</td><td><span className={`admin-site-content-v97__message-state ${item.estado.toLowerCase()}`}>{item.estado.replace('_', ' ')}</span></td><td><div className="admin-users-v97__actions"><button type="button" onClick={() => setSelectedMessage(item)} title="Ver mensagem"><Eye /></button></div></td></tr>)}
        </tbody></table></div>{messages.length === 0 && <div className="admin-users-v97__empty">Sem mensagens de contacto.</div>}</div>
      )}

      {contentMode && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setContentMode(null)}><section className="admin-resource-v97__modal" role="dialog" aria-modal="true"><header><div><span>{contentMode === 'create' ? 'Novo bloco público' : 'Editar bloco público'}</span><h2>{contentMode === 'create' ? 'Criar Conteúdo' : contentForm.titulo}</h2></div><button type="button" onClick={() => setContentMode(null)} aria-label="Fechar"><X /></button></header><form onSubmit={saveContent}><div className="admin-resource-v97__form-grid"><label><span>Chave *</span><select required value={contentForm.chave} onChange={(e) => setContentForm((current) => ({ ...current, chave: e.target.value }))}>{CONTENT_KEY_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>Ordem *</span><input required type="number" min="0" value={contentForm.ordem} onChange={(e) => setContentForm((current) => ({ ...current, ordem: Number(e.target.value) }))} /></label><label className="full"><span>Título *</span><input required maxLength={180} value={contentForm.titulo} onChange={(e) => setContentForm((current) => ({ ...current, titulo: e.target.value }))} /></label><label className="full"><span>Subtítulo</span><input maxLength={240} value={contentForm.subtitulo || ''} onChange={(e) => setContentForm((current) => ({ ...current, subtitulo: e.target.value }))} /></label><label className="full"><span>Conteúdo</span><textarea rows={7} maxLength={10000} value={contentForm.corpo || ''} onChange={(e) => setContentForm((current) => ({ ...current, corpo: e.target.value }))} /></label><label className="full"><span>URL da imagem</span><input type="url" maxLength={500} value={contentForm.imagem_url || ''} onChange={(e) => setContentForm((current) => ({ ...current, imagem_url: e.target.value }))} /></label><label className="admin-site-content-v97__checkbox full"><input type="checkbox" checked={contentForm.ativo} onChange={(e) => setContentForm((current) => ({ ...current, ativo: e.target.checked }))} /><span>Publicado na área pública</span></label></div><footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setContentMode(null)}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : 'Guardar conteúdo'}</button></footer></form></section></div>}

      {newsMode && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && setNewsMode(null)}><section className="admin-resource-v97__modal admin-site-content-v97__news-modal" role="dialog" aria-modal="true"><header><div><span>{newsMode === 'create' ? 'Nova publicação' : 'Editar publicação'}</span><h2>{newsMode === 'create' ? 'Criar Notícia' : newsForm.titulo}</h2></div><button type="button" onClick={() => setNewsMode(null)} aria-label="Fechar"><X /></button></header><form onSubmit={saveNews}><div className="admin-resource-v97__form-grid"><label className="full"><span>Título *</span><input required maxLength={180} value={newsForm.titulo} onChange={(e) => setNewsForm((current) => ({ ...current, titulo: e.target.value }))} /></label><label className="full"><span>Resumo *</span><textarea required rows={3} maxLength={500} value={newsForm.resumo} onChange={(e) => setNewsForm((current) => ({ ...current, resumo: e.target.value }))} /></label><label className="full"><span>Corpo *</span><textarea required rows={10} maxLength={20000} value={newsForm.corpo} onChange={(e) => setNewsForm((current) => ({ ...current, corpo: e.target.value }))} /></label><label className="full"><span>URL da imagem</span><input type="url" maxLength={500} value={newsForm.imagem_url || ''} onChange={(e) => setNewsForm((current) => ({ ...current, imagem_url: e.target.value }))} /></label><label className="admin-site-content-v97__checkbox full"><input type="checkbox" checked={newsForm.publicada} onChange={(e) => setNewsForm((current) => ({ ...current, publicada: e.target.checked }))} /><span>Publicar imediatamente</span></label></div><footer><button type="button" className="admin-users-v97__secondary-button" onClick={() => setNewsMode(null)}>Cancelar</button><button type="submit" className="admin-users-v97__primary-button" disabled={saving}>{saving ? 'A guardar...' : newsForm.publicada ? 'Guardar e publicar' : 'Guardar rascunho'}</button></footer></form></section></div>}

      {selectedMessage && <div className="admin-resource-v97__modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedMessage(null)}><section className="admin-resource-v97__modal" role="dialog" aria-modal="true"><header><div><span>Mensagem #{selectedMessage.id}</span><h2>{selectedMessage.assunto}</h2></div><button type="button" onClick={() => setSelectedMessage(null)} aria-label="Fechar"><X /></button></header><div className="admin-resource-v97__detail"><dl><div><dt>Nome</dt><dd>{selectedMessage.nome}</dd></div><div><dt>Email</dt><dd>{selectedMessage.email}</dd></div><div><dt>Empresa</dt><dd>{selectedMessage.empresa || '—'}</dd></div><div><dt>Telefone</dt><dd>{selectedMessage.telefone || '—'}</dd></div><div><dt>Recebida</dt><dd>{selectedMessage.criado_em ? new Date(selectedMessage.criado_em).toLocaleString('pt-PT') : '—'}</dd></div><div><dt>Mensagem</dt><dd className="admin-site-content-v97__message-body">{selectedMessage.mensagem}</dd></div><div><dt>Estado</dt><dd><select value={selectedMessage.estado} onChange={(e) => void updateMessageState(selectedMessage, e.target.value as EstadoMensagemContacto)}><option value="NOVA">Nova</option><option value="EM_ANALISE">Em análise</option><option value="RESPONDIDA">Respondida</option><option value="ARQUIVADA">Arquivada</option></select></dd></div></dl></div></section></div>}
    </div>
  );
}

export function AdminPermissions({ setPage }: PageProps) {
  const [users, setUsers] = useState<ApiUtilizador[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: number; codigo: string; nome: string; descricao?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([utilizadoresApi(), opcoesApi()])
      .then(([userRows, options]) => { setUsers(userRows); setProfiles(Array.isArray(options?.perfis) ? options.perfis : []); })
      .catch((e) => setError(e?.message || 'Não foi possível carregar os perfis.'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="admin-permissions-v97">
      <PageHeader title="Permissões & Perfis" subtitle="Acesso efetivo baseado no perfil e no estado da conta" actions={<button type="button" onClick={() => setPage('admin-users')} className="admin-users-v97__primary-button"><Users /> Gerir Utilizadores</button>} />
      {loading ? <Loader text="A carregar perfis..." /> : error ? <ErrorCard msg={error} /> : <div className="admin-permissions-v97__grid">{profiles.map((profile) => {
        const profileUsers = users.filter((user) => user.perfil_codigo === profile.codigo);
        const active = profileUsers.filter((user) => user.ativo).length;
        return <article key={profile.id}><header><span><ShieldCheck /></span><div><h2>{profile.nome}</h2><code>{profile.codigo}</code></div></header><p>{profile.descricao || 'Perfil configurado no backend.'}</p><dl><div><dt>Utilizadores</dt><dd>{profileUsers.length}</dd></div><div><dt>Ativos</dt><dd>{active}</dd></div><div><dt>Inativos / revogados</dt><dd>{profileUsers.length - active}</dd></div></dl><div className="admin-permissions-v97__note">A revogação é persistente através do estado ativo da conta. Não existe um RBAC granular adicional no modelo atual.</div></article>;
      })}</div>}
    </div>
  );
}

export function AdminManagerDetail({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader
        title="Detalhe do Colaborador"
        subtitle="Perfil, atividade e clientes atribuídos"
        actions={
          <button
            onClick={() => setPage('admin-users')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar a Utilizadores
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white">
              C
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">Colaborador Demo</h3>
            <span className="badge mt-2 bg-amber-100 text-amber-700">COLABORADOR</span>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span>colab@ciberbox.pt</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Telefone</span><span>+351 910 000 000</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Desde</span><span>03/2024</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Clientes</span><span className="font-semibold">18</span></div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Atividade recente</h3>
          <ul className="space-y-4">
            {[
              { a: 'Incidente INC-0042 resolvido', t: 'Hoje, 14:32', c: 'bg-emerald-100 text-emerald-700' },
              { a: 'Documento submetido (Política de Segurança v2.1)', t: 'Hoje, 11:05', c: 'bg-blue-100 text-blue-700' },
              { a: 'Avaliação NIS2 concluída', t: 'Ontem, 18:20', c: 'bg-violet-100 text-violet-700' },
              { a: '3 ativos importados via Excel', t: 'Ontem, 10:41', c: 'bg-amber-100 text-amber-700' },
            ].map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <span className={`badge ${e.c}`}>{e.t.split(',')[0]}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{e.a}</div>
                  <div className="text-xs text-slate-500">{e.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
