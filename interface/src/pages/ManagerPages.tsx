import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  AlertTriangle, BarChart3, Building2, CalendarDays, CheckCircle2,
  Clock3, FileText, FolderOpen, Hand, MessageSquare, MonitorCog,
  Plus, Search, ShieldCheck, TriangleAlert, Users,
} from 'lucide-react';
import type { Page } from '../types';
import {
  dashboardApi, clientesApi, ativosApi, incidentesApi, documentosApi,
  atualizarPedidoApi, confirmarImportacaoExcelApi, importacoesExcelApi, pedidosApi,
  previsualizarImportacaoExcelApi, criarPedidoApi, avaliacoesApi, clienteDetalheApi, session,
  type ApiDashboardAdmin, type ApiCliente, type ApiAtivo, type ApiIncidente,
  type ApiDocumento, type ApiPedido, type ApiAvaliacao, type ApiImportacaoExcel,
  type ApiPrevisualizacaoExcel,
} from '../apiClient';
import { Nis2AssessmentForm } from '../components/Nis2AssessmentForm';
import { AssetsWorkspace, IncidentsWorkspace } from '../components/OperationalResources';
import { DocumentsWorkspace } from '../components/DocumentsWorkspace';
import { INCIDENT_CHANGED_EVENT } from '../realtime';

interface PageProps {
  setPage: (p: Page) => void;
}

interface DetailProps extends PageProps {
  backPage?: Page;
  backLabel?: string;
  clientId?: number;
}

const PIE_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

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
  label: string; value: string | number; delta?: string; icon?: ReactNode; color?: string;
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
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-blue-600 ${color || 'bg-blue-50'}`}>
            {icon}
          </div>
        )}
      </div>
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500"><FolderOpen size={25} aria-hidden="true" /></div>
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

function severityColor(s: string | null | undefined) {
  const v = (s || 'MEDIA').toLowerCase();
  if (v.includes('alta') || v.includes('crit')) return 'bg-rose-100 text-rose-700';
  if (v.includes('media') || v.includes('mod')) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function conformidadeColor(c: string | null | undefined) {
  if (!c) return 'bg-slate-100 text-slate-700';
  const v = c.toLowerCase();
  if (v.includes('conforme') && !v.includes('nao') && !v.includes('não')) return 'bg-emerald-100 text-emerald-700';
  if (v.includes('revis') || v.includes('avalia')) return 'bg-amber-100 text-amber-700';
  if (v.includes('nao') || v.includes('não')) return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
}

export function MgrDashboard({ setPage }: PageProps) {
  const [data, setData] = useState<ApiDashboardAdmin | null>(null);
  const [clientes, setClientes] = useState<ApiCliente[]>([]);
  const [incidentes, setIncidentes] = useState<ApiIncidente[]>([]);
  const [documentos, setDocumentos] = useState<ApiDocumento[]>([]);
  const [available, setAvailable] = useState({ clientes: false, incidentes: false, documentos: false });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshToken((value) => value + 1);
    window.addEventListener(INCIDENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(INCIDENT_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      dashboardApi() as Promise<ApiDashboardAdmin>,
      clientesApi(),
      incidentesApi(),
      documentosApi(),
    ])
      .then(([dashboardResult, clientesResult, incidentesResult, documentosResult]) => {
        if (!active) return;
        if (dashboardResult.status === 'rejected') {
          setErr(dashboardResult.reason?.message || 'Erro ao carregar dashboard');
          return;
        }

        setData(dashboardResult.value);
        if (clientesResult.status === 'fulfilled') setClientes(clientesResult.value);
        if (incidentesResult.status === 'fulfilled') setIncidentes(incidentesResult.value);
        if (documentosResult.status === 'fulfilled') setDocumentos(documentosResult.value);
        setAvailable({
          clientes: clientesResult.status === 'fulfilled',
          incidentes: incidentesResult.status === 'fulfilled',
          documentos: documentosResult.status === 'fulfilled',
        });
      })
      .catch((e) => {
        if (active) setErr(e?.message || 'Erro ao carregar dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshToken]);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!data) return null;
  const sessionName = session.get().utilizador?.nome || 'Gestor';
  const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const formatDate = (value?: string | null) => {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };
  const severityKey = (value?: string | null) => {
    const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalized.includes('critic')) return 'critical';
    if (normalized.includes('alt')) return 'high';
    if (normalized.includes('baix')) return 'low';
    return 'medium';
  };
  const severityDefinitions = [
    { key: 'critical', label: 'Crítico', color: '#dc2626' },
    { key: 'high', label: 'Alto', color: '#f97316' },
    { key: 'medium', label: 'Médio', color: '#2563eb' },
    { key: 'low', label: 'Baixo', color: '#16a34a' },
  ] as const;
  const severityData = severityDefinitions.map((definition) => ({
    ...definition,
    value: incidentes.filter((incidente) => severityKey(incidente.severidade) === definition.key).length,
  }));
  const hasSeverityData = severityData.some((item) => item.value > 0);
  const recentIncidents = [...incidentes]
    .sort((a, b) => new Date(b.detetado_em || b.criado_em || 0).getTime() - new Date(a.detetado_em || a.criado_em || 0).getTime())
    .slice(0, 5);
  const clientRows = clientes.slice(0, 7);
  const findingsData = (data.top_incidentes || []).map((item) => ({
    nome: item.nome || 'Cliente',
    total: numberValue(item.total_incidentes) || 0,
  }));
  const criticalAlerts = recentIncidents.filter((incidente) => {
    const severity = severityKey(incidente.severidade);
    return severity === 'critical' || severity === 'high';
  }).slice(0, 2);
  const recentDocuments = [...documentos]
    .sort((a, b) => new Date(b.submetido_em || 0).getTime() - new Date(a.submetido_em || 0).getTime())
    .slice(0, 3);
  const metrics = [
    { label: 'Clientes Ativos', value: available.clientes ? clientes.filter((cliente) => cliente.ativo !== false).length : '—', page: 'mgr-clients' as Page },
    { label: 'Incidentes Abertos', value: available.incidentes ? incidentes.filter((incidente) => incidente.estado === 'ABERTO').length : '—', page: 'mgr-incidents' as Page },
    { label: 'Documentos Pentest', value: available.documentos ? documentos.filter((documento) => documento.categoria === 'PENTEST').length : '—', page: 'mgr-pentests' as Page },
    { label: 'Documentos', value: available.documentos ? documentos.length : '—', page: 'mgr-documents' as Page },
  ];

  return (
    <div className="mgr-dashboard-v97">
      <header className="mgr-dashboard-v97__heading">
        <h1>Dashboard</h1>
        <p>CyberBoxSecur — Área Gestor</p>
      </header>

      <section className="mgr-dashboard-v97__summary" aria-labelledby="mgr-dashboard-summary-title">
        <div className="mgr-dashboard-v97__summary-copy">
          <h2 id="mgr-dashboard-summary-title">Olá, {sessionName}</h2>
          <Hand aria-hidden="true" />
        </div>
        <p>Aqui está o resumo dos seus clientes e atividades.</p>
        <div className="mgr-dashboard-v97__metrics">
          {metrics.map(({ label, value, page }) => (
            <button key={label} type="button" onClick={() => setPage(page)} className="mgr-dashboard-v97__metric">
              <strong>{value}</strong>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mgr-dashboard-v97__charts" aria-label="Indicadores operacionais">
        <article className="mgr-dashboard-v97__card">
          <h2>Incidentes por Severidade</h2>
          {hasSeverityData ? (
            <>
              <div className="mgr-dashboard-v97__pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData.filter((item) => item.value > 0)} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius="78%" stroke="#fff" strokeWidth={1}>
                      {severityData.filter((item) => item.value > 0).map((item) => <Cell key={item.key} fill={item.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value ?? 0, 'Incidentes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mgr-dashboard-v97__legend" aria-label="Legenda de severidade">
                {severityData.map((item) => (
                  <span key={item.key}><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}: {item.value}</span>
                ))}
              </div>
            </>
          ) : <div className="mgr-dashboard-v97__empty-chart">Sem dados de incidentes disponíveis</div>}
        </article>

        <article className="mgr-dashboard-v97__card">
          <h2>Incidentes por Cliente</h2>
          {findingsData.length > 0 ? (
            <div className="mgr-dashboard-v97__bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={findingsData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="nome" width={104} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [value ?? 0, 'Incidentes']} />
                  <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="mgr-dashboard-v97__empty-chart">Sem dados por cliente disponíveis</div>}
        </article>
      </section>

      <section className="mgr-dashboard-v97__lists" aria-label="Atividade operacional">
        <article className="mgr-dashboard-v97__card mgr-dashboard-v97__list-card">
          <div className="mgr-dashboard-v97__card-heading">
            <h2>Incidentes Recentes</h2>
            <button type="button" onClick={() => setPage('mgr-incidents')}>Ver todos <span aria-hidden="true">→</span></button>
          </div>
          {recentIncidents.length > 0 ? (
            <div className="mgr-dashboard-v97__rows">
              {recentIncidents.map((incidente) => (
                <button key={incidente.id} type="button" onClick={() => setPage('mgr-incidents')} className="mgr-dashboard-v97__incident-row">
                  <span className="mgr-dashboard-v97__row-copy">
                    <strong>{incidente.titulo}</strong>
                    <small>{formatDate(incidente.detetado_em || incidente.criado_em)}</small>
                  </span>
                  <span className={`mgr-dashboard-v97__status ${severityColor(incidente.severidade)}`}>{incidente.severidade || 'Sem severidade'}</span>
                </button>
              ))}
            </div>
          ) : <p className="mgr-dashboard-v97__empty-list">Sem incidentes recentes disponíveis.</p>}
        </article>

        <article className="mgr-dashboard-v97__card mgr-dashboard-v97__list-card">
          <div className="mgr-dashboard-v97__card-heading">
            <h2>Os Meus Clientes</h2>
            <button type="button" onClick={() => setPage('mgr-clients')}>Ver todos <span aria-hidden="true">→</span></button>
          </div>
          {clientRows.length > 0 ? (
            <div className="mgr-dashboard-v97__rows">
              {clientRows.map((cliente) => (
                <button key={cliente.id} type="button" onClick={() => {
                  session.set({ ...session.get(), cliente: { id: cliente.id, nome: cliente.nome } });
                  setPage('mgr-client-detail');
                }} className="mgr-dashboard-v97__client-row">
                  <span className="mgr-dashboard-v97__client-mark" aria-hidden="true">{cliente.nome.charAt(0).toUpperCase()}</span>
                  <span className="mgr-dashboard-v97__row-copy">
                    <strong>{cliente.nome}</strong>
                    <small className={conformidadeColor(cliente.conformidade)}>{cliente.conformidade || 'Sem avaliação'}</small>
                  </span>
                  <span className="mgr-dashboard-v97__client-value">{numberValue(cliente.numero_ativos) ?? '—'}<small> ativos</small></span>
                </button>
              ))}
            </div>
          ) : <p className="mgr-dashboard-v97__empty-list">Sem clientes disponíveis.</p>}
        </article>

        <article className="mgr-dashboard-v97__card mgr-dashboard-v97__activity-card">
          <h2>Alertas &amp; Atividades</h2>
          <div className="mgr-dashboard-v97__alerts">
            {criticalAlerts.length > 0 ? criticalAlerts.map((incidente) => (
              <button key={incidente.id} type="button" onClick={() => setPage('mgr-incidents')} className="mgr-dashboard-v97__alert-row">
                <AlertTriangle aria-hidden="true" />
                <span><b>{incidente.severidade || 'Alerta'}</b>{incidente.titulo}</span>
              </button>
            )) : <p className="mgr-dashboard-v97__empty-list">Sem alertas urgentes disponíveis.</p>}
          </div>
          <div className="mgr-dashboard-v97__upcoming">
            <h3>Atividade recente</h3>
            {recentDocuments.length > 0 ? recentDocuments.map((documento) => (
              <button key={documento.id} type="button" onClick={() => setPage('mgr-documents')} className="mgr-dashboard-v97__activity-row">
                <FileText aria-hidden="true" />
                <span>{documento.titulo}<small>{formatDate(documento.submetido_em)}</small></span>
              </button>
            )) : <p className="mgr-dashboard-v97__empty-list">Sem atividade recente disponível.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

export function MgrAnalytics({ setPage }: PageProps) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ApiDashboardAdmin | null>(null);
  const [clientes, setClientes] = useState<ApiCliente[]>([]);

  useEffect(() => {
    Promise.all([
      dashboardApi() as Promise<ApiDashboardAdmin>,
      clientesApi(),
    ])
      .then(([d, c]) => {
        setDashboard(d);
        setClientes(c);
      })
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!dashboard) return null;
  const timedStates = dashboard.pedidos_estado.filter((item) => item.tempo_medio_resolucao_horas !== null && item.total_pedidos > 0);
  const timedRequests = timedStates.reduce((total, item) => total + item.total_pedidos, 0);
  const mttr = timedRequests ? timedStates.reduce((total, item) => total + (item.tempo_medio_resolucao_horas ?? 0) * item.total_pedidos, 0) / timedRequests : null;
  const sectors = Array.from(clientes.reduce((groups, client) => {
    const sector = client.setor_atividade?.trim() || 'Setor não indicado';
    groups.set(sector, (groups.get(sector) ?? 0) + 1);
    return groups;
  }, new Map<string, number>()).entries()).map(([setor, n]) => ({ setor, n }));

  return (
    <div className="mgr-visual-page mgr-analytics-v98">
      <PageHeader title="Análises & Gráficos" subtitle="Resumo visual dos clientes e incidentes sob a sua gestão." />
      <section className="mgr-analytics-v98__summary" aria-label="Resumo de análises">
        <div className="mgr-analytics-v98__summary-copy">
          <BarChart3 aria-hidden="true" />
          <div><h2>Análises & Gráficos</h2><p>Indicadores calculados com os dados disponíveis.</p></div>
        </div>
        <div className="mgr-analytics-v98__metrics">
          <div><strong>{clientes.length}</strong><span>Clientes</span></div>
          <div><strong>{dashboard.stats.incidentes ?? '—'}</strong><span>Incidentes</span></div>
          <div><strong>{dashboard.stats.documentos ?? '—'}</strong><span>Documentos</span></div>
        </div>
      </section>
      <div className="mgr-analytics-v98__stat-grid">
        <StatCard label="Tempo médio de resolução" value={mttr === null ? '—' : `${mttr.toFixed(1)} h`} icon={<Clock3 size={22} aria-hidden="true" />} color="bg-amber-50 text-amber-600" />
        <StatCard label="Clientes associados" value={clientes.length} icon={<Building2 size={22} aria-hidden="true" />} color="bg-blue-50 text-blue-600" />
        <StatCard label="Incidentes registados" value={dashboard.stats.incidentes ?? '—'} icon={<ShieldCheck size={22} aria-hidden="true" />} color="bg-emerald-50 text-emerald-600" />
      </div>
      <div className="mgr-analytics-v98__charts">
        <article className="mgr-analytics-v98__card">
          <h3>Incidentes por severidade</h3>
          <div className="mgr-analytics-v98__empty-chart"><BarChart3 aria-hidden="true" /><span>Não existe uma série de severidade disponível para este período.</span></div>
        </article>
        <article className="mgr-analytics-v98__card">
          <h3>Distribuição de clientes por setor</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectors}
                  dataKey="n"
                  nameKey="setor"
                  outerRadius={110}
                  label={(p) => {
                    const item = p.payload as { setor?: string; n?: number } | undefined;
                    return `${item?.setor ?? ''}: ${item?.n ?? p.value ?? ''}`;
                  }}
                >
                  {sectors.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
      <div className="mgr-analytics-v98__wide-card">
          <div className="mgr-analytics-v98__card-heading">
            <h3>Clientes com mais incidentes</h3>
            <button onClick={() => setPage('mgr-clients')}>Ver clientes <span aria-hidden="true">→</span></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={clientes.slice(0, 8).map(c => ({
                  nome: c.nome?.slice(0, 16) || 'Cliente',
                  incidentes: c.numero_incidentes || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="incidentes" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}

export function MgrClients({ setPage }: PageProps) {
  const [data, setData] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    clientesApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = !q ? data : data.filter((c) =>
    (c.nome || '').toLowerCase().includes(q.toLowerCase()) || (c.nif || '').includes(q),
  );
  const activeClients = data.filter((client) => client.ativo !== false).length;
  const incidentCount = data.reduce((total, client) => total + (client.numero_incidentes ?? client.total_incidentes ?? 0), 0);
  const assetCount = data.reduce((total, client) => total + (client.numero_ativos ?? client.total_ativos ?? 0), 0);
  const openClient = (client: ApiCliente) => {
    session.set({ ...session.get(), cliente: { id: client.id, nome: client.nome } });
    setPage('mgr-client-detail');
  };

  return (
    <div className="mgr-visual-page mgr-clients-v98">
      <PageHeader title="Clientes" subtitle="Visualize os clientes sob a sua gestão." />
      <section className="mgr-clients-v98__summary" aria-label="Resumo de clientes">
        <div><h2>Os Meus Clientes</h2><p>Visualize os clientes sob a sua gestão.</p></div>
        <div className="mgr-clients-v98__metrics">
          <div><strong>{data.length}</strong><span>Total</span></div>
          <div><strong>{activeClients}</strong><span>Ativos</span></div>
          <div><strong>{incidentCount}</strong><span>Incidentes</span></div>
          <div><strong>{assetCount}</strong><span>Ativos tecnológicos</span></div>
        </div>
      </section>
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : <>
        <section className="mgr-clients-v98__search" aria-label="Pesquisa de clientes">
          <label>
            <Search size={19} aria-hidden="true" />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Pesquisar por nome ou NIF..." />
          </label>
          <span>{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span>
        </section>
        {filtered.length === 0 ? <DataTable<ApiCliente> data={[]} columns={[]} emptyText="Nenhum cliente corresponde à pesquisa." /> : <section className="mgr-clients-v98__list" aria-label="Lista de clientes">
          {filtered.map((client) => {
            const initials = (client.nome || 'C').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
            const clientIncidents = client.numero_incidentes ?? client.total_incidentes ?? 0;
            const clientAssets = client.numero_ativos ?? client.total_ativos ?? 0;
            return <button key={client.id} type="button" onClick={() => openClient(client)} className="mgr-clients-v98__client">
              <span className="mgr-clients-v98__avatar" aria-hidden="true">{initials}</span>
              <span className="mgr-clients-v98__identity"><strong>{client.nome}</strong><small>{client.email || client.nif || 'Sem contacto indicado'}</small></span>
              <span className="mgr-clients-v98__badges"><span className={`badge ${client.ativo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{client.ativo !== false ? 'Ativo' : 'Inativo'}</span>{client.conformidade && <span className={`badge ${conformidadeColor(client.conformidade)}`}>{client.conformidade}</span>}</span>
              <span className="mgr-clients-v98__counts"><span><b>{clientIncidents}</b>Incidentes</span><span><b>{clientAssets}</b>Ativos</span></span>
              <span className="mgr-clients-v98__open" aria-label={`Abrir ${client.nome}`}>›</span>
            </button>;
          })}
        </section>}
      </>}
    </div>
  );
}

export function MgrClientDetail({ setPage, backPage = 'mgr-clients', backLabel = 'Clientes', clientId }: DetailProps) {
  const sess = session.get();
  const cid = clientId ?? (sess.cliente as any)?.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [assessmentNotice, setAssessmentNotice] = useState<string | null>(null);
  const tabs = [
    ['overview', 'Visão Geral'], ['nis2', 'NIS2'], ['assets', 'Ativos'], ['incidents', 'Incidentes'],
    ['documents', 'Documentos'], ['reports', 'Relatórios'], ['pentests', 'PenTests'], ['evidence', 'Evidências'],
    ['requests', 'Pedidos'], ['communication', 'Comunicação'],
  ] as const;
  type DetailTab = typeof tabs[number][0];
  const tabFromHash = (): DetailTab => {
    const hash = typeof window === 'undefined' ? '' : window.location.hash.replace('#', '');
    return tabs.some(([key]) => key === hash) ? hash as DetailTab : 'overview';
  };
  const [detailTab, setDetailTab] = useState<DetailTab>(tabFromHash);

  const refreshDetail = async () => {
    if (!cid) { setLoading(false); return; }
    setLoading(true); setErr(null);
    try { setData(await clienteDetalheApi(cid)); }
    catch (cause: any) { setErr(cause?.message || 'Erro'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void refreshDetail();
  }, [cid]);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!data || !data.cliente) return <ErrorCard msg="Cliente não encontrado. Volte à lista e selecione um cliente." />;

  const c = data.cliente;
  const res = data.resumo || {};
  const assets: ApiAtivo[] = Array.isArray(data.ativos) ? data.ativos : [];
  const incidents: ApiIncidente[] = Array.isArray(data.incidentes) ? data.incidentes : [];
  const documents: ApiDocumento[] = Array.isArray(data.documentos) ? data.documentos : [];
  const evaluations: ApiAvaliacao[] = Array.isArray(data.avaliacoes) ? data.avaliacoes : [];
  const requests: ApiPedido[] = Array.isArray(data.pedidos) ? data.pedidos : [];
  const latestEvaluation = [...evaluations].sort((a, b) => {
    const byDate = new Date(b.data_avaliacao || 0).getTime() - new Date(a.data_avaliacao || 0).getTime();
    return byDate || b.id - a.id;
  })[0];
  const conformity = c.conformidade || c.estado_conformidade || latestEvaluation?.estado_conformidade_nome || 'Sem avaliação';
  const risk = latestEvaluation?.nivel_risco || res.nivel_risco || 'Sem dados';
  const openIncidents = incidents.filter((incident) => !incident.resolvido_em && !incident.encerrado_em).length;
  const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
  const selectTab = (tab: DetailTab) => {
    setDetailTab(tab);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${tab}`);
  };
  const tabEmpty = (title: string, description: string) => <section className="mgr-client-detail-v98__empty"><FolderOpen aria-hidden="true" /><h3>{title}</h3><p>{description}</p></section>;

  const renderDocuments = (items: ApiDocumento[], emptyText: string) => <DataTable
    data={items}
    emptyText={emptyText}
    columns={[
      { key: 'titulo', label: 'Documento', render: (item) => <div><strong className="font-medium text-slate-900">{item.titulo}</strong><div className="mt-1 text-xs text-slate-500">{item.cliente_nome || c.nome}</div></div> },
      { key: 'tipo', label: 'Tipo', render: (item) => <span className="badge bg-blue-50 text-blue-700">{item.tipo || item.categoria || '—'}</span> },
      { key: 'formato', label: 'Formato', render: (item) => <span className="font-mono text-xs text-slate-600">{item.formato || item.tipo_mime || '—'}</span> },
      { key: 'submetido_em', label: 'Data', render: (item) => formatDate(item.submetido_em) },
    ]}
  />;

  return (
    <div className="mgr-visual-page mgr-client-detail-v98">
      <div className="mgr-client-detail-v98__breadcrumb"><button type="button" onClick={() => setPage(backPage)}>Gestor</button><span>/</span><button type="button" onClick={() => setPage(backPage)}>{backLabel}</button><span>/</span><strong>{c.nome}</strong></div>
      <header className="mgr-client-detail-v98__header">
        <span className="mgr-client-detail-v98__avatar" aria-hidden="true">{c.nome?.charAt(0)?.toUpperCase() || 'C'}</span>
        <div className="mgr-client-detail-v98__title"><h1>{c.nome}</h1><div><span>{c.setor_atividade || 'Setor não indicado'}</span><span className={`badge ${conformidadeColor(conformity)}`}>{conformity}</span><span className="badge bg-blue-100 text-blue-700">Risco: {risk}</span></div></div>
        <div className="mgr-client-detail-v98__actions"><button type="button" onClick={() => selectTab('communication')}><MessageSquare size={16} aria-hidden="true" />Mensagem</button><button type="button" onClick={() => selectTab('incidents')}><Plus size={17} aria-hidden="true" />Novo Incidente</button></div>
      </header>

      <nav aria-label="Detalhe do cliente" className="mgr-client-detail-v98__tabs">
        {tabs.map(([key, itemLabel]) => <button key={key} type="button" onClick={() => selectTab(key)} aria-current={detailTab === key ? 'page' : undefined} className={detailTab === key ? 'is-active' : ''}>{itemLabel}</button>)}
      </nav>

      {detailTab === 'overview' && <div className="mgr-client-detail-v98__overview">
        <section className="mgr-client-detail-v98__stats" aria-label="Indicadores do cliente">
          <StatCard label="Incidentes abertos" value={openIncidents} icon={<TriangleAlert size={22} aria-hidden="true" />} color="bg-rose-50 text-rose-600" />
          <StatCard label="Pontuação NIS2" value={latestEvaluation?.score ?? latestEvaluation?.pontuacao ?? '—'} icon={<CheckCircle2 size={22} aria-hidden="true" />} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Ativos" value={res.numero_ativos ?? assets.length} icon={<MonitorCog size={22} aria-hidden="true" />} color="bg-blue-50 text-blue-600" />
          <StatCard label="Pedidos em aberto" value={requests.filter((request) => !request.resolvido_em).length} icon={<MessageSquare size={22} aria-hidden="true" />} color="bg-amber-50 text-amber-600" />
          <StatCard label="Classificação seg." value={latestEvaluation?.pontuacao ?? latestEvaluation?.score ?? '—'} icon={<ShieldCheck size={22} aria-hidden="true" />} color="bg-violet-50 text-violet-600" />
        </section>
        <section className="mgr-client-detail-v98__overview-grid">
          <article className="mgr-client-detail-v98__panel"><h2>Informação da organização</h2><dl className="mgr-client-detail-v98__definition-list"><div><dt>Contacto</dt><dd>{c.email || '—'}</dd></div><div><dt>Telefone</dt><dd>{c.telefone || '—'}</dd></div><div><dt>Setor</dt><dd>{c.setor_atividade || '—'}</dd></div><div><dt>NIF</dt><dd>{c.nif || '—'}</dd></div></dl></article>
          <article className="mgr-client-detail-v98__panel"><div className="mgr-client-detail-v98__panel-heading"><h2>Incidentes recentes</h2><button type="button" onClick={() => selectTab('incidents')}>Ver todos</button></div>{incidents.length ? <div className="mgr-client-detail-v98__incident-list">{incidents.slice(0, 4).map((incident) => <button type="button" key={incident.id} onClick={() => selectTab('incidents')}><TriangleAlert aria-hidden="true" /><span><strong>{incident.titulo}</strong><small>{formatDate(incident.detetado_em || incident.criado_em)}</small></span><span className={`badge ${severityColor(incident.severidade || incident.gravidade)}`}>{incident.severidade || incident.gravidade || '—'}</span></button>)}</div> : <p className="mgr-client-detail-v98__muted">Sem incidentes registados.</p>}</article>
        </section>
      </div>}
      {detailTab === 'nis2' && <section className="mgr-client-detail-v98__panel">
        <div className="mgr-client-detail-v98__panel-heading"><h2>Avaliações NIS2</h2><div className="flex items-center gap-2"><span className={`badge ${conformidadeColor(conformity)}`}>{conformity}</span>{(sess.role === 'admin' || sess.role === 'manager') && <button type="button" onClick={() => { setAssessmentNotice(null); setAssessmentFormOpen(true); }}>Nova avaliação NIS2</button>}</div></div>
        {assessmentNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{assessmentNotice}</p>}
        {assessmentFormOpen && (sess.role === 'admin' || sess.role === 'manager') && <Nis2AssessmentForm role={sess.role} clients={[c as ApiCliente]} fixedClient={c as ApiCliente} onCancel={() => setAssessmentFormOpen(false)} onCreated={async () => { setAssessmentFormOpen(false); setAssessmentNotice('Avaliação NIS2 registada com sucesso.'); await refreshDetail(); }} />}
        <DataTable data={evaluations} emptyText="Sem avaliações NIS2 disponíveis." columns={[{ key: 'data_avaliacao', label: 'Data', render: (item) => formatDate(item.data_avaliacao) }, { key: 'estado_conformidade_nome', label: 'Estado', render: (item) => <span className={`badge ${conformidadeColor(item.estado_conformidade_nome)}`}>{item.estado_conformidade_nome || '—'}</span> }, { key: 'score', label: 'Pontuação', render: (item) => item.score ?? item.pontuacao ?? '—' }, { key: 'nivel_risco', label: 'Risco', render: (item) => item.nivel_risco || '—' }]} />
      </section>}
      {detailTab === 'assets' && <AssetsWorkspace role="manager" clientId={Number(cid)} compact title="Ativos Tecnológicos" subtitle="Inventário associado a este cliente" onChanged={() => void refreshDetail()} />}
      {detailTab === 'incidents' && <IncidentsWorkspace role="manager" clientId={Number(cid)} compact title="Incidentes de Segurança" subtitle="Incidentes associados a este cliente" onChanged={() => void refreshDetail()} />}
      {detailTab === 'documents' && <section className="mgr-client-detail-v98__panel"><h2>Documentos</h2>{renderDocuments(documents, 'Sem documentos disponíveis para este cliente.')}</section>}
      {detailTab === 'reports' && <section className="mgr-client-detail-v98__panel"><h2>Relatórios</h2>{renderDocuments(documents.filter((document) => `${document.tipo || ''} ${document.categoria || ''}`.toLowerCase().includes('relat')), 'Sem relatórios disponíveis para este cliente.')}</section>}
      {detailTab === 'pentests' && <section className="mgr-client-detail-v98__panel"><h2>Testes de penetração</h2>{renderDocuments(documents.filter((document) => `${document.tipo || ''} ${document.categoria || ''}`.toLowerCase().includes('pentest')), 'Sem documentos de PenTest disponíveis para este cliente.')}</section>}
      {detailTab === 'evidence' && <section className="mgr-client-detail-v98__panel"><h2>Evidências</h2>{renderDocuments(documents.filter((document) => `${document.tipo || ''} ${document.categoria || ''}`.toLowerCase().includes('evid')), 'Sem evidências disponíveis para este cliente.')}</section>}
      {detailTab === 'requests' && <section className="mgr-client-detail-v98__panel"><h2>Pedidos</h2><DataTable data={requests} emptyText="Sem pedidos submetidos por este cliente." columns={[{ key: 'assunto', label: 'Assunto', render: (item) => item.assunto }, { key: 'estado_nome', label: 'Estado', render: (item) => item.estado_nome || item.estado_codigo || '—' }, { key: 'prioridade', label: 'Prioridade', render: (item) => item.prioridade || '—' }, { key: 'criado_em', label: 'Data', render: (item) => formatDate(item.criado_em) }]} /></section>}
      {detailTab === 'communication' && tabEmpty('Comunicação', 'A comunicação segura para este cliente ainda não está disponível na API atual.')}
    </div>
  );
}

export function MgrIncidents({ setPage }: PageProps) {
  return <div className="mgr-visual-page mgr-incidents-v98"><IncidentsWorkspace role="manager" title="Incidentes" subtitle="Incidentes dos clientes que gere" /></div>;
}

export function MgrDocuments() {
  return <div className="mgr-visual-page"><DocumentsWorkspace role="manager" title="Documentos" subtitle="Documentos dos clientes sob a sua gestão." /></div>;
}

export function MgrRequests() {
  const [data, setData] = useState<ApiPedido[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPedido | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([pedidosApi(), clientesApi()])
      .then(([requests, associatedClients]) => {
        if (!active) return;
        setData(requests);
        setClients(associatedClients);
      })
      .catch((e) => active && setErr(e?.message || 'Erro'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(request: ApiPedido) {
    setEditing(request);
    setFormError(null);
    setFormOpen(true);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const priority = String(form.get('prioridade') ?? 'NORMAL') as 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
    try {
      if (editing) {
        const updated = await atualizarPedidoApi(editing.id, {
          assunto: String(form.get('assunto') ?? ''),
          descricao: String(form.get('descricao') ?? ''),
          prioridade: priority,
          estado: String(form.get('estado') ?? editing.estado_codigo ?? 'ABERTO') as 'ABERTO' | 'EM_ANALISE' | 'AGUARDA_CLIENTE' | 'RESOLVIDO' | 'FECHADO',
        });
        setData((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const clientId = Number(form.get('cliente_id'));
        if (!Number.isSafeInteger(clientId) || clientId < 1) throw new Error('Selecione uma organização associada.');
        const created = await criarPedidoApi({
          cliente_id: clientId,
          assunto: String(form.get('assunto') ?? ''),
          descricao: String(form.get('descricao') ?? ''),
          prioridade: priority,
        });
        setData((current) => [created, ...current]);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível guardar o pedido.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pedidos de Suporte"
        subtitle={`${data.filter(p => !p.resolvido_em).length} por resolver / ${data.length} total`}
        actions={<button type="button" onClick={openCreate} disabled={loading || clients.length === 0} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">+ Novo Pedido</button>}
      />
      {formOpen && (
        <form key={editing?.id ?? 'new'} onSubmit={submitRequest} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-display text-lg font-semibold text-slate-900">{editing ? 'Atualizar pedido' : 'Novo pedido'}</h2><p className="mt-1 text-sm text-slate-500">{editing ? 'Atualize o estado e a informação necessária.' : 'Selecione uma das organizações que lhe estão associadas.'}</p></div><button type="button" onClick={() => { setFormOpen(false); setEditing(null); }} className="text-sm font-medium text-slate-500 hover:text-slate-800">Cancelar</button></div>
          {!editing && <label className="mb-4 block text-sm font-medium text-slate-700">Organização<select required name="cliente_id" defaultValue="" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"><option value="" disabled>Selecionar organização</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}</select></label>}
          <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Assunto<input required name="assunto" maxLength={180} defaultValue={editing?.assunto ?? ''} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Prioridade<select name="prioridade" defaultValue={editing?.prioridade ?? 'NORMAL'} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"><option value="BAIXA">Baixa</option><option value="NORMAL">Normal</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label></div>
          {editing && <label className="mt-4 block text-sm font-medium text-slate-700">Estado<select name="estado" defaultValue={editing.estado_codigo ?? 'ABERTO'} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"><option value="ABERTO">Aberto</option><option value="EM_ANALISE">Em análise</option><option value="AGUARDA_CLIENTE">Aguarda cliente</option><option value="RESOLVIDO">Resolvido</option><option value="FECHADO">Fechado</option></select></label>}
          <label className="mt-4 block text-sm font-medium text-slate-700">Descrição<textarea required name="descricao" rows={4} maxLength={10000} defaultValue={editing?.descricao ?? ''} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" /></label>
          {formError && <p role="alert" className="mt-3 text-sm text-rose-700">{formError}</p>}
          <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'A guardar…' : editing ? 'Guardar alterações' : 'Submeter pedido'}</button></div>
        </form>
      )}
      {!loading && clients.length === 0 && !err && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Não existem organizações associadas a este Gestor para criar pedidos.</div>}
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'assunto', label: 'Assunto', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.assunto}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'estado_nome', label: 'Estado', render: (r) => <span className="badge bg-violet-100 text-violet-700">{r.estado_nome || '—'}</span> },
            { key: 'prioridade', label: 'Prioridade', render: (r) => (
              <span className={`badge ${severityColor(r.prioridade)}`}>{r.prioridade || 'Normal'}</span>
            )},
            { key: 'criado_em', label: 'Criado', render: (r) => r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-PT') : '—' },
            { key: '_acoes' as keyof ApiPedido, label: '', width: '100px', render: (r) => <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(r); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Editar</button> },
          ]}
        />
      )}
    </div>
  );
}

export function MgrAssets() {
  return <AssetsWorkspace role="manager" title="Ativos Tecnológicos" subtitle="Inventário dos clientes que gere" />;
}

export function MgrRisk({ setPage }: PageProps) {
  const [data, setData] = useState<ApiAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    avaliacoesApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const riskData = [
    { risco: 'Crítico', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('crit') || (a.nivel_risco || '').toLowerCase().includes('alt')).length, c: '#ef4444' },
    { risco: 'Alto', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('alt') && !(a.nivel_risco || '').toLowerCase().includes('crit')).length, c: '#f59e0b' },
    { risco: 'Médio', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('med')).length, c: '#8b5cf6' },
    { risco: 'Baixo', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('baix')).length, c: '#10b981' },
  ].filter(x => x.n > 0 || true);

  return (
    <div>
      <PageHeader title="Gestão de Riscos" subtitle="Avaliações e níveis de risco dos clientes" />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Avaliações Realizadas" value={data.length} icon="📊" color="bg-blue-50" />
        <StatCard label="Riscos Críticos" value={riskData.find(r => r.risco === 'Crítico')?.n ?? 0} icon="🔥" color="bg-rose-50" />
        <StatCard label="Score Médio" value={data.length ? (data.reduce((a, b) => a + (b.score || 0), 0) / data.length).toFixed(1) : '—'} icon="⭐" color="bg-amber-50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição por Nível de Risco</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="risco" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" radius={[8, 8, 0, 0]}>
                  {riskData.map((r, i) => <Cell key={i} fill={r.c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Ações Rápidas</h3>
          <div className="space-y-2">
            {[
              { p: 'mgr-nis2', l: 'Avaliações NIS2', i: '🛡️', c: 'from-blue-500 to-cyan-500' },
              { p: 'mgr-pentests', l: 'Documentos Pentest', i: '🔍', c: 'from-rose-500 to-pink-500' },
              { p: 'mgr-reports', l: 'Relatórios submetidos', i: '📈', c: 'from-violet-500 to-purple-500' },
              { p: 'mgr-evidence', l: 'Evidências', i: '🧾', c: 'from-emerald-500 to-teal-500' },
            ].map(x => (
              <button
                key={x.p}
                onClick={() => setPage(x.p as Page)}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 text-left"
              >
                <div className={`h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br text-white text-lg ${x.c}`}>{x.i}</div>
                <div className="font-semibold text-slate-800">{x.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Histórico de Avaliações</h3>
          {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
            <DataTable
              data={data}
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'cliente_nome', label: 'Cliente', render: (r) => r.cliente_nome || '—' },
                { key: 'data_avaliacao', label: 'Data', render: (r) => r.data_avaliacao ? new Date(r.data_avaliacao).toLocaleDateString('pt-PT') : '—' },
                { key: 'nivel_risco', label: 'Risco', render: (r) => (
                  <span className={`badge ${severityColor(r.nivel_risco)}`}>{r.nivel_risco || '—'}</span>
                )},
                { key: 'estado_conformidade_nome', label: 'Conformidade', render: (r) => (
                  <span className={`badge ${conformidadeColor(r.estado_conformidade_nome)}`}>{r.estado_conformidade_nome || '—'}</span>
                )},
                { key: 'score', label: 'Score', render: (r) => r.score ?? '—' },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function MgrNIS2(_props: PageProps) {
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [assessments, setAssessments] = useState<ApiAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const latestNis2Request = useRef(0);

  useEffect(() => {
    void refreshNis2();
  }, []);

  async function refreshNis2() {
    const requestId = ++latestNis2Request.current;
    setLoading(true);
    setErr(null);
    try {
      const [nextClients, nextAssessments] = await Promise.all([clientesApi(), avaliacoesApi()]);
      if (requestId !== latestNis2Request.current) return;
      setClients(nextClients);
      setAssessments(nextAssessments);
    } catch (cause) {
      if (requestId !== latestNis2Request.current) return;
      setErr(cause instanceof Error ? cause.message : 'Não foi possível atualizar as avaliações NIS2.');
    } finally {
      if (requestId === latestNis2Request.current) setLoading(false);
    }
  }

  const dist = [
    { estado: 'Conforme', n: clients.filter(c => (c.conformidade || '').toLowerCase().includes('conforme') && !(c.conformidade || '').toLowerCase().includes('nao')).length, c: '#10b981' },
    { estado: 'Em Revisão', n: clients.filter(c => (c.conformidade || '').toLowerCase().includes('revis') || (c.conformidade || '').toLowerCase().includes('avalia')).length, c: '#f59e0b' },
    { estado: 'Não Conforme', n: clients.filter(c => (c.conformidade || '').toLowerCase().includes('nao') || (c.conformidade || '').toLowerCase().includes('não')).length, c: '#ef4444' },
    { estado: 'Por Avaliar', n: clients.filter(c => !c.conformidade).length, c: '#94a3b8' },
  ];

  return (
    <div>
      <PageHeader title="Conformidade NIS2" subtitle="Estado de conformidade das organizações associadas" actions={<button type="button" onClick={() => { setNotice(null); setFormOpen(true); }} disabled={loading || clients.length === 0} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">+ Nova avaliação NIS2</button>} />
      {!loading && clients.length === 0 && !err && <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Não existem organizações associadas a este Gestor para avaliar.</p>}
      {notice && <p role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      {formOpen && <Nis2AssessmentForm role="manager" clients={clients} onCancel={() => setFormOpen(false)} onCreated={async () => { setFormOpen(false); setNotice('Avaliação NIS2 registada com sucesso.'); await refreshNis2(); }} />}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {dist.map(d => (
          <StatCard key={d.estado} label={d.estado} value={d.n} icon={d.estado === 'Conforme' ? '✅' : d.estado === 'Em Revisão' ? '⏳' : d.estado === 'Não Conforme' ? '⚠️' : '📋'} color="bg-blue-50" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição de Conformidade</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dist}
                  dataKey="n"
                  nameKey="estado"
                  outerRadius={110}
                  label={(p) => {
                    const item = p.payload as { estado?: string; n?: number } | undefined;
                    return `${item?.estado ?? ''}: ${item?.n ?? p.value ?? ''}`;
                  }}
                >
                  {dist.map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Avaliações NIS2 registadas</h3>
          {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
            <DataTable
              data={assessments.slice(0, 8)}
              emptyText="Sem avaliações NIS2 disponíveis."
              columns={[
                { key: 'cliente_nome', label: 'Cliente', render: (r) => r.cliente_nome || '—' },
                { key: 'data_avaliacao', label: 'Data', render: (r) => r.data_avaliacao ? new Date(r.data_avaliacao).toLocaleDateString('pt-PT') : '—' },
                { key: 'estado_conformidade_nome', label: 'Estado', render: (r) => <span className={`badge ${conformidadeColor(r.estado_conformidade_nome)}`}>{r.estado_conformidade_nome || '—'}</span> },
                { key: 'score', label: 'Pontuação', render: (r) => r.score ?? '—' },
              ]}
            />
          )}
        </div>
      </div>
      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Clientes - Estado NIS2</h3>
          {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
            <DataTable
              data={clients}
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'nome', label: 'Cliente', render: (r) => r.nome },
                { key: 'setor_atividade', label: 'Setor', render: (r) => r.setor_atividade || '—' },
                { key: 'conformidade', label: 'Estado', render: (r) => (
                  <span className={`badge ${conformidadeColor(r.conformidade)}`}>{r.conformidade || 'Por avaliar'}</span>
                )},
                { key: 'numero_ativos', label: 'Ativos', render: (r) => r.numero_ativos ?? 0 },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function MgrReports(_props: PageProps) {
  return <DocumentsWorkspace
    role="manager"
    title="Relatórios"
    subtitle="Relatórios efetivamente submetidos pelas organizações que gere."
    categoryScope={['RELATORIO', 'RELATORIO_CNCS']}
    emptyTitle="Ainda não existem relatórios"
    emptyDescription="Quando for submetido um documento das categorias Relatório ou Relatório CNCS, ficará disponível aqui."
  />;
}

export function MgrPentests(_props: PageProps) {
  return <DocumentsWorkspace
    role="manager"
    title="Testes de Penetração"
    subtitle="Documentos Pentest submetidos pelas organizações que gere."
    categoryScope={['PENTEST']}
    emptyTitle="Ainda não existem documentos Pentest"
    emptyDescription="A API atual não possui agendamentos de Pentest autónomos. Os resultados submetidos na categoria Pentest surgirão aqui."
  />;
}

export function MgrEvidence(_props: PageProps) {
  return <DocumentsWorkspace
    role="manager"
    title="Evidências de Conformidade"
    subtitle="Evidências documentais das organizações que gere."
    categoryScope={['EVIDENCIA']}
    emptyTitle="Ainda não existem evidências"
    emptyDescription="Quando for submetido um documento na categoria Evidência, ficará disponível aqui para consulta e revisão."
  />;
}

export function MgrExcelImport() {
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [history, setHistory] = useState<ApiImportacaoExcel[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [files, setFiles] = useState<Partial<Record<ApiImportacaoExcel['tipo'], File>>>({});
  const [preview, setPreview] = useState<ApiPrevisualizacaoExcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingType, setWorkingType] = useState<ApiImportacaoExcel['tipo'] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([clientesApi(), importacoesExcelApi()])
      .then(([associatedClients, previousImports]) => {
        if (!active) return;
        setClients(associatedClients);
        setHistory(previousImports);
        setSelectedClientId(associatedClients[0]?.id ?? null);
      })
      .catch((error) => active && setErr(error instanceof Error ? error.message : 'Não foi possível carregar as importações.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function previewImport(tipo: ApiImportacaoExcel['tipo']) {
    const file = files[tipo];
    if (!selectedClientId) { setErr('Selecione uma organização associada.'); return; }
    if (!file) { setErr('Selecione um ficheiro XLSX antes de continuar.'); return; }
    setErr(null);
    setWorkingType(tipo);
    try {
      setPreview(await previsualizarImportacaoExcelApi(tipo, selectedClientId, file));
    } catch (error) {
      setPreview(null);
      setErr(error instanceof Error ? error.message : 'Não foi possível validar o ficheiro XLSX.');
    } finally {
      setWorkingType(null);
    }
  }

  async function confirmImport() {
    if (!preview || !selectedClientId) return;
    const file = files[preview.tipo];
    if (!file) { setErr('O ficheiro selecionado já não está disponível. Faça novamente a pré-visualização.'); return; }
    setErr(null);
    setWorkingType(preview.tipo);
    try {
      const created = await confirmarImportacaoExcelApi(preview.tipo, selectedClientId, file);
      setHistory((current) => [created, ...current]);
      setPreview(null);
      setFiles((current) => ({ ...current, [created.tipo]: undefined }));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Não foi possível concluir a importação.');
    } finally {
      setWorkingType(null);
    }
  }

  const importCards: Array<{ titulo: string; descricao: string; icon: string; color: string; tipo: ApiImportacaoExcel['tipo'] | null; modelo: string }> = [
    { titulo: 'Importar Ativos', descricao: 'Modelo XLSX com dados de inventário e criticidade', icon: '💻', color: 'from-blue-500 to-cyan-500', tipo: 'ATIVOS', modelo: 'modelo_importacao_ativos.xlsx' },
    { titulo: 'Importar Incidentes', descricao: 'Histórico XLSX de incidentes ou dados externos', icon: '🚨', color: 'from-rose-500 to-pink-500', tipo: 'INCIDENTES', modelo: 'modelo_importacao_incidentes.xlsx' },
    { titulo: 'Importar Clientes', descricao: 'A criação de organizações continua no fluxo próprio de Clientes.', icon: '🏢', color: 'from-emerald-500 to-teal-500', tipo: null, modelo: '' },
  ];

  return (
    <div>
      <PageHeader
        title="Importação via Excel"
        subtitle="Importar em massa ativos e incidentes para organizações associadas"
      />
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block max-w-xl text-sm font-medium text-slate-700">Organização para a importação<select value={selectedClientId ?? ''} onChange={(event) => { setSelectedClientId(Number(event.target.value) || null); setPreview(null); }} disabled={loading || clients.length === 0} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"><option value="" disabled>{clients.length ? 'Selecionar organização' : 'Sem organizações associadas'}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}</select></label>
        {!loading && clients.length === 0 && <p className="mt-3 text-sm text-amber-800">Não existem organizações associadas a este Gestor para importar dados.</p>}
      </div>
      {err && <div role="alert" className="mb-6"><ErrorCard msg={err} /></div>}
      <div className="grid gap-6 lg:grid-cols-3">
        {importCards.map((card) => (
          <div key={card.titulo} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl mb-4`}>{card.icon}</div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{card.titulo}</h3>
            <p className="mt-1 text-sm text-slate-500">{card.descricao}</p>
            <div className="mt-5 space-y-2">
              {card.modelo && (
                <button type="button" disabled title="O modelo será disponibilizado numa fase posterior." className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400 disabled:cursor-not-allowed">
                  <span>📥</span> Descarregar modelo
                </button>
              )}
              {card.tipo ? <><label className="block">
                <input type="file" accept=".xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFiles((current) => ({ ...current, [card.tipo!]: file })); setPreview(null); setErr(null); } }} className="hidden" disabled={loading || !selectedClientId} />
                <div className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
                  <div className="text-2xl mb-1">📤</div>
                  {files[card.tipo]?.name ?? 'Selecionar ficheiro XLSX'}
                </div>
              </label>
              <button type="button" onClick={() => void previewImport(card.tipo!)} disabled={loading || workingType !== null || !selectedClientId || !files[card.tipo]} className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{workingType === card.tipo ? 'A validar…' : 'Validar & Pré-visualizar'}</button></> : <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">Use a gestão de Clientes para criar organizações e respetivas associações.</p>}
            </div>
          </div>
        ))}
      </div>

      {preview && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-display text-lg font-semibold text-slate-900">Pré-visualização: {preview.nome_ficheiro_original}</h3><p className="mt-1 text-sm text-slate-500">{preview.total_linhas} linhas · <span className="font-medium text-emerald-700">{preview.linhas_validas} válidas</span> · <span className="font-medium text-rose-700">{preview.linhas_rejeitadas} rejeitadas</span></p></div><button type="button" onClick={() => void confirmImport()} disabled={workingType !== null} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{workingType === preview.tipo ? 'A importar…' : 'Confirmar importação'}</button></div>{preview.linhas_rejeitadas > 0 && <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">{preview.linhas.filter((row) => row.estado === 'REJEITADA').slice(0, 10).map((row) => <li key={row.numero_linha} className="px-4 py-3 text-sm text-rose-700">Linha {row.numero_linha}: {row.erro || 'Dados inválidos.'}</li>)}</ul>}</section>}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Últimas Importações</h3>
        {loading ? <Loader text="A carregar importações..." /> : <DataTable
          data={history}
          emptyText="Ainda não existem importações para as organizações associadas."
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (row) => <span className="font-mono text-xs">#{row.id}</span> },
            { key: 'tipo', label: 'Tipo', render: (row) => <span className="badge bg-blue-50 text-blue-700">{row.tipo}</span> },
            { key: 'cliente_nome', label: 'Organização', render: (row) => row.cliente_nome || '—' },
            { key: 'importado_em', label: 'Data & Hora', render: (row) => row.importado_em ? new Date(row.importado_em).toLocaleString('pt-PT') : '—' },
            { key: 'importado_por_nome', label: 'Utilizador', render: (row) => row.importado_por_nome || '—' },
            { key: 'total_linhas', label: 'Linhas', render: (row) => row.total_linhas },
            { key: 'linhas_importadas', label: 'Sucesso', render: (row) => <span className="font-semibold text-emerald-600">{row.linhas_importadas}</span> },
            { key: 'linhas_rejeitadas', label: 'Erros', render: (row) => <span className={row.linhas_rejeitadas ? 'font-semibold text-rose-600' : ''}>{row.linhas_rejeitadas}</span> },
            { key: 'estado', label: 'Estado', render: (row) => <span className={`badge ${row.estado === 'PROCESSADO' ? 'bg-emerald-100 text-emerald-700' : row.estado === 'PARCIAL' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{row.estado}</span> },
          ]}
        />}
      </div>
    </div>
  );
}
