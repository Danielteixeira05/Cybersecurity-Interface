import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import type { Page } from '../types';
import {
  dashboardApi, clientesApi, utilizadoresApi, documentosApi,
  incidentesApi, logsApi, clienteDetalheApi,
  atualizarConteudoAdminApi, conteudosAdminApi, criarConteudoAdminApi,
  type ApiDashboardAdmin, type ApiCliente, type ApiUtilizador,
  type ApiConteudoSite, type ApiIncidente, type ApiDocumento, session,
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
export function AdminDashboard({ setPage }: PageProps) {
  const [data, setData] = useState<ApiDashboardAdmin | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi()
      .then((r) => setData(r as ApiDashboardAdmin))
      .catch((e) => setErr(e?.message || 'Erro ao carregar dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!data) return null;
  const s = data.stats || ({} as any);

  return (
    <div>
      <PageHeader title="Dashboard Administrador" subtitle="Visão global da plataforma CiberBoxSecur" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes" value={s.clientes ?? '—'} icon="🏢" color="bg-blue-50" />
        <StatCard label="Utilizadores" value={s.utilizadores ?? '—'} icon="👥" color="bg-violet-50" />
        <StatCard label="Ativos Registados" value={s.ativos ?? '—'} icon="💻" color="bg-emerald-50" />
        <StatCard label="Incidentes Abertos" value={s.incidentes_abertos ?? '—'} icon="🚨" color="bg-rose-50" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">Distribuição de Conformidade</h3>
              <p className="text-xs text-slate-500">Clientes por estado de conformidade NIS2</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.conformidade || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="estado" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="numero_clientes" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold text-slate-900">Utilizadores por Perfil</h3>
            <p className="text-xs text-slate-500">Distribuição global</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.utilizadores_perfil || []}
                  dataKey="total_utilizadores"
                  nameKey="perfil"
                  outerRadius={90}
                  label={(p) => {
                    const item = p.payload as { perfil?: string; total_utilizadores?: number } | undefined;
                    return `${item?.perfil ?? ''}: ${item?.total_utilizadores ?? p.value ?? ''}`;
                  }}
                  labelLine={false}
                >
                  {(data.utilizadores_perfil || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">Top Clientes por Incidentes</h3>
              <p className="text-xs text-slate-500">Total de incidentes registados</p>
            </div>
            <button
              onClick={() => setPage('admin-incidents')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_incidentes || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis dataKey="nome" type="category" width={140} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="total_incidentes" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">Pedidos por Estado</h3>
              <p className="text-xs text-slate-500">Tempo médio de resolução</p>
            </div>
            <button
              onClick={() => setPage('admin-clients')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Clientes →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pedidos_estado || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="estado" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="total_pedidos" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== ADMIN ANALYTICS ==========
export function AdminAnalytics() {
  const [data, setData] = useState<ApiDashboardAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi()
      .then((response) => setData(response as ApiDashboardAdmin))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro ao carregar as análises.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorCard msg={error} />;
  if (!data) return null;
  const stats = data.stats;
  const timeSamples = data.pedidos_estado.filter((item) => item.tempo_medio_resolucao_horas !== null && item.total_pedidos > 0);
  const totalTimedRequests = timeSamples.reduce((total, item) => total + item.total_pedidos, 0);
  const weightedMttr = totalTimedRequests > 0
    ? timeSamples.reduce((total, item) => total + (item.tempo_medio_resolucao_horas ?? 0) * item.total_pedidos, 0) / totalTimedRequests
    : null;
  const ChartEmpty = ({ text }: { text: string }) => <div className="flex h-full items-center justify-center text-sm text-slate-500">{text}</div>;

  return (
    <div>
      <PageHeader title="Análises & Relatórios" subtitle="Indicadores calculados a partir dos dados registados" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="MTTR (horas)" value={weightedMttr === null ? '—' : weightedMttr.toFixed(1)} icon="⏱️" color="bg-amber-50" />
        <StatCard label="Documentos" value={stats.documentos ?? '—'} icon="📄" color="bg-cyan-50" />
        <StatCard label="Pedidos" value={stats.pedidos ?? '—'} icon="✅" color="bg-emerald-50" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Clientes por Conformidade NIS2</h3>
          <div className="mt-4 h-72">
            {data.conformidade.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.conformidade}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="estado" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip /><Bar dataKey="numero_clientes" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty text="Sem dados de conformidade disponíveis." />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Utilizadores por Perfil</h3>
          <div className="mt-4 h-72">
            {data.utilizadores_perfil.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.utilizadores_perfil} dataKey="total_utilizadores" nameKey="perfil" outerRadius={90}>{data.utilizadores_perfil.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <ChartEmpty text="Sem dados de perfis disponíveis." />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Top Clientes por Incidentes</h3>
          <div className="mt-4 h-72">
            {data.top_incidentes.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.top_incidentes} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis dataKey="nome" type="category" width={130} tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip /><Bar dataKey="total_incidentes" fill="#ef4444" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty text="Sem incidentes disponíveis." />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Documentos Submetidos</h3>
          <div className="mt-4 h-72">
            {data.documentos_mes.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.documentos_mes}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip /><Bar dataKey="total_documentos" fill="#8b5cf6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty text="Sem documentos submetidos disponíveis." />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Pedidos por Estado</h3>
          <div className="mt-4 h-72">
            {data.pedidos_estado.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.pedidos_estado}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="estado" tick={{ fontSize: 11 }} stroke="#64748b" /><YAxis tick={{ fontSize: 11 }} stroke="#64748b" /><Tooltip /><Bar dataKey="total_pedidos" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty text="Sem pedidos disponíveis." />}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900">Incidentes — Tendência</h3>
          <div className="mt-4 h-72"><ChartEmpty text="Sem série histórica de incidentes disponível." /></div>
        </section>
      </div>
    </div>
  );
}

// ========== ADMIN USERS ==========
export function AdminUsers({ setPage }: PageProps) {
  const [users, setUsers] = useState<ApiUtilizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    utilizadoresApi(filter || undefined)
      .then(setUsers)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = users.filter((u) =>
    !search ||
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Gestão de Utilizadores"
        subtitle={`${users.length} utilizadores registados na plataforma`}
        actions={
          <>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos os perfis</option>
              <option value="ADMINISTRADOR">Administradores</option>
              <option value="COLABORADOR">Colaboradores</option>
              <option value="CLIENTE">Clientes</option>
            </select>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + Novo Utilizador
            </button>
          </>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={filtered}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs text-slate-500">#{r.id}</span> },
            { key: 'nome', label: 'Nome', render: (r) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white">
                  {r.nome?.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{r.nome}</div>
                  <div className="text-xs text-slate-500">{r.email}</div>
                </div>
              </div>
            )},
            { key: 'perfil_nome', label: 'Perfil', render: (r) => {
              const color =
                r.perfil_codigo === 'ADMINISTRADOR' ? 'bg-rose-100 text-rose-700' :
                r.perfil_codigo === 'COLABORADOR' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700';
              return <span className={`badge ${color}`}>{r.perfil_nome}</span>;
            }},
            { key: 'ativo', label: 'Estado', render: (r) => r.ativo ? (
              <span className="badge bg-emerald-100 text-emerald-700">Ativo</span>
            ) : (
              <span className="badge bg-slate-100 text-slate-700">Inativo</span>
            )},
            { key: 'ultimo_acesso_em', label: 'Último Acesso', render: (r) => r.ultimo_acesso_em ? (
              <span className="text-xs text-slate-600">{new Date(r.ultimo_acesso_em).toLocaleString('pt-PT')}</span>
            ) : <span className="text-xs text-slate-400">— Nunca —</span> },
            { key: 'clientes', label: 'Ações', width: '80px', render: (r) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (r.perfil_codigo === 'CLIENTE') {
                    const cid = r.cliente_id;
                    if (cid) {
                      (session as any).set({ ...session.get(), cliente: { id: cid, nome: r.nome } });
                      setPage('admin-user-client');
                    }
                  } else if (r.perfil_codigo === 'COLABORADOR') {
                    setPage('admin-user-manager');
                  }
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Detalhes
              </button>
            )},
          ]}
        />
      )}
    </div>
  );
}

// ========== ADMIN CLIENTS ==========
export function AdminClients({ setPage }: PageProps) {
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    clientesApi(q)
      .then(setClients)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = !q ? clients : clients.filter((c) =>
    (c.nome || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.nif || '').includes(q),
  );

  return (
    <div>
      <PageHeader
        title="Gestão de Clientes"
        subtitle={`${clients.length} clientes ativos na plataforma`}
        actions={
          <>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar cliente..."
                className="w-72 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + Novo Cliente
            </button>
          </>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={filtered}
          onRowClick={(r) => {
            (session as any).set({ ...session.get(), cliente: { id: r.id, nome: r.nome } });
            setPage('admin-client-detail');
          }}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs text-slate-500">#{r.id}</span> },
            { key: 'nome', label: 'Cliente', render: (r) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                  {(r.nome || 'C').charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{r.nome}</div>
                  <div className="text-xs text-slate-500">NIF: {r.nif || '—'} • {r.email}</div>
                </div>
              </div>
            )},
            { key: 'setor_atividade', label: 'Setor', render: (r) => (
              <span className="text-sm text-slate-600">{r.setor_atividade || '—'}</span>
            )},
            { key: 'numero_ativos', label: 'Ativos', render: (r) => (
              <span className="font-mono text-sm font-semibold text-slate-800">{r.numero_ativos ?? 0}</span>
            )},
            { key: 'numero_incidentes', label: 'Incidentes', render: (r) => (
              <span className="font-mono text-sm font-semibold text-slate-800">{r.numero_incidentes ?? 0}</span>
            )},
            { key: 'conformidade', label: 'Conformidade', render: (r) => {
              const c = r.conformidade;
              const color = c === 'CONFORME' || c?.includes('Conforme') ? 'bg-emerald-100 text-emerald-700' :
                c === 'EM_REVISAO' || c?.includes('Revis') ? 'bg-amber-100 text-amber-700' :
                c?.includes('Nao') || c === 'NAO_CONFORME' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-100 text-slate-700';
              return <span className={`badge ${color}`}>{c || 'Sem dados'}</span>;
            }},
          ]}
        />
      )}
    </div>
  );
}

// ========== ADMIN DOCUMENTS ==========
export function AdminDocuments() {
  const [data, setData] = useState<ApiDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    documentosApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Documentos da Plataforma"
        subtitle={`${data.length} documentos armazenados e encriptados`}
        actions={
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            + Submeter Documento
          </button>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs text-slate-500">#{r.id}</span> },
            { key: 'titulo', label: 'Título', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.titulo}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => (
              <span className="badge bg-blue-50 text-blue-700">{r.tipo || '—'}</span>
            )},
            { key: 'formato', label: 'Formato', render: (r) => (
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {r.formato || '—'}
              </span>
            )},
            { key: 'tamanho_bytes', label: 'Tamanho', render: (r) => {
              const b = r.tamanho_bytes || 0;
              return <span className="text-sm text-slate-600">{(b / 1024).toFixed(1)} KB</span>;
            }},
            { key: 'submetido_em', label: 'Submetido', render: (r) => r.submetido_em ? (
              <span className="text-xs text-slate-600">{new Date(r.submetido_em).toLocaleDateString('pt-PT')}</span>
            ) : '—' },
            { key: 'cliente_id', label: 'Ação', width: '80px', render: () => (
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Download
              </button>
            )},
          ]}
        />
      )}
    </div>
  );
}

// ========== ADMIN INCIDENTS ==========
export function AdminIncidents() {
  const [data, setData] = useState<ApiIncidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    incidentesApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Gestão de Incidentes"
        subtitle={`${data.filter((i) => !i.resolvido_em).length} incidentes abertos / ${data.length} total`}
        actions={
          <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            + Reportar Incidente
          </button>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'Ref', width: '70px', render: (r) => <span className="font-mono text-xs text-slate-500">INC-{r.id.toString().padStart(4, '0')}</span> },
            { key: 'titulo', label: 'Incidente', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.titulo}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'severidade', label: 'Severidade', render: (r) => {
              const s = (r.severidade || 'MEDIA').toLowerCase();
              const color = s.includes('alta') || s.includes('crit') ? 'bg-rose-100 text-rose-700' :
                s.includes('media') || s.includes('mod') ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700';
              return <span className={`badge ${color}`}>{r.severidade || 'Média'}</span>;
            }},
            { key: 'tipo', label: 'Tipo', render: (r) => (
              <span className="badge bg-slate-100 text-slate-700">{r.tipo || '—'}</span>
            )},
            { key: 'detetado_em', label: 'Deteção', render: (r) => r.detetado_em ? (
              <span className="text-xs text-slate-600">{new Date(r.detetado_em).toLocaleDateString('pt-PT')}</span>
            ) : '—' },
            { key: 'resolvido_em', label: 'Estado', render: (r) => r.resolvido_em ? (
              <span className="badge bg-emerald-100 text-emerald-700">✓ Resolvido</span>
            ) : (
              <span className="badge bg-rose-100 text-rose-700">● Aberto</span>
            )},
          ]}
        />
      )}
    </div>
  );
}

// ========== ADMIN LOGS ==========
export function AdminLogs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    logsApi(200)
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Logs de Auditoria"
        subtitle="Registo completo de atividades da plataforma (últimos 200 eventos)"
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
          <div className="max-h-[65vh] overflow-y-auto">
            <pre className="p-5 text-[11px] leading-6 text-slate-200 font-mono">
{data.map((l, i) => {
  const time = l.criado_em ? new Date(l.criado_em).toLocaleString('pt-PT') : '';
  const type = l.tipo || 'INFO';
  const color = type.includes('LOGIN') || type.includes('SUCESSO') ? 'text-emerald-400' :
    type.includes('FALHA') || type.includes('ERRO') ? 'text-rose-400' :
    type.includes('CRIAR') || type.includes('EDITAR') || type.includes('ELIMINAR') ? 'text-amber-400' :
    'text-sky-400';
  return (
    <div key={i} className="whitespace-pre-wrap break-words">
      <span className="text-slate-500">[{time}]</span>{' '}
      <span className={color}>[{type}]</span>{' '}
      <span className="text-violet-400">({l.tabela || '-'})</span>{' '}
      <span className="text-slate-100">{String(l.detalhes ? (typeof l.detalhes === 'string' ? l.detalhes : JSON.stringify(l.detalhes)) : l.mensagem || '').slice(0, 300)}</span>
    </div>
  );
})}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== ADMIN SITE CONTENT & PERMISSIONS ==========
export function AdminSiteContent() {
  type ContentDraft = Pick<ApiConteudoSite, 'chave' | 'titulo' | 'subtitulo' | 'corpo' | 'imagem_url' | 'ativo' | 'ordem'>;
  const emptyDraft = (): ContentDraft => ({ chave: '', titulo: '', subtitulo: '', corpo: '', imagem_url: '', ativo: true, ordem: 0 });
  const [items, setItems] = useState<ApiConteudoSite[]>([]);
  const [editing, setEditing] = useState<ApiConteudoSite | null>(null);
  const [draft, setDraft] = useState<ContentDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    conteudosAdminApi()
      .then(setItems)
      .catch((cause) => setLoadError(cause instanceof Error ? cause.message : 'Erro ao carregar conteúdos.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormOpen(true);
    setFormError(null);
  };

  const openEdit = (item: ApiConteudoSite) => {
    setEditing(item);
    setDraft({
      chave: item.chave, titulo: item.titulo, subtitulo: item.subtitulo ?? '', corpo: item.corpo ?? '',
      imagem_url: item.imagem_url ?? '', ativo: item.ativo, ordem: item.ordem,
    });
    setFormOpen(true);
    setFormError(null);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await atualizarConteudoAdminApi(editing.id, draft);
      else await criarConteudoAdminApi(draft);
      setEditing(null);
      setDraft(emptyDraft());
      setFormOpen(false);
      load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível guardar o conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gestão de Conteúdo do Site"
        subtitle="Conteúdos persistidos das páginas públicas"
        actions={<button type="button" onClick={openNew} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Novo Conteúdo</button>}
      />
      {formOpen && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label={editing ? 'Editar conteúdo' : 'Novo conteúdo'}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Chave<input value={draft.chave} onChange={(event) => setDraft({ ...draft, chave: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" required /></label>
            <label className="text-sm font-medium text-slate-700">Ordem<input value={draft.ordem} type="number" min="0" onChange={(event) => setDraft({ ...draft, ordem: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" required /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Título<input value={draft.titulo} onChange={(event) => setDraft({ ...draft, titulo: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" required /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Subtítulo<input value={draft.subtitulo ?? ''} onChange={(event) => setDraft({ ...draft, subtitulo: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Imagem URL<input value={draft.imagem_url ?? ''} onChange={(event) => setDraft({ ...draft, imagem_url: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="url" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Corpo<textarea value={draft.corpo ?? ''} onChange={(event) => setDraft({ ...draft, corpo: event.target.value })} className="mt-1 min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.ativo} onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })} />Publicado</label>
          {formError && <p className="mt-3 text-sm text-rose-700" role="alert">{formError}</p>}
          <div className="mt-5 flex gap-3"><button type="button" disabled={saving} onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button><button type="button" onClick={() => { setEditing(null); setDraft(emptyDraft()); setFormOpen(false); setFormError(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button></div>
        </section>
      )}
      {loading ? <Loader /> : loadError ? <ErrorCard msg={loadError} /> : items.length === 0 ? <DataTable data={[]} columns={[]} emptyText="Sem conteúdos institucionais disponíveis" /> : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl">📄</div>
              <span className={`badge ${item.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {item.ativo ? 'Publicado' : 'Inativo'}
              </span>
            </div>
            <h3 className="mt-4 font-display font-semibold text-slate-900">{item.titulo}</h3>
            <p className="mt-1 text-xs text-slate-500">{item.subtitulo || item.chave}</p>
            <button type="button" onClick={() => openEdit(item)} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Editar Conteúdo
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

export function AdminPermissions() {
  const roles = [
    { n: 'ADMINISTRADOR', d: 'Acesso total à plataforma. Gestão global de utilizadores, clientes e sistema.', c: 3, f: 12 },
    { n: 'COLABORADOR', d: 'Gestão operacional: clientes, ativos, incidentes, documentos e pedidos.', c: 8, f: 9 },
    { n: 'CLIENTE', d: 'Apenas aos dados da própria empresa: ativos, incidentes, documentos, pedidos.', c: 56, f: 5 },
  ];
  const features = [
    'Dashboard global', 'Gerir utilizadores', 'Gerir clientes', 'Logs de auditoria',
    'Gestão de ativos', 'Reportar incidentes', 'Submeter documentos',
    'Avaliações NIS2', 'Importar Excel', 'Configurações do sistema',
  ];
  const access: Record<string, boolean[]> = {
    ADMINISTRADOR: features.map(() => true),
    COLABORADOR: [true, false, true, false, true, true, true, true, true, false],
    CLIENTE: [false, false, false, false, true, true, true, true, false, false],
  };
  return (
    <div>
      <PageHeader title="Permissões & Perfis" subtitle="Matriz de acesso por perfil de utilizador" />
      <div className="grid gap-6 lg:grid-cols-3">
        {roles.map((r) => (
          <div key={r.n} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">{r.n}</h3>
                <p className="mt-1 text-sm text-slate-500">{r.d}</p>
              </div>
              <span className="badge bg-blue-100 text-blue-700">{r.c} users</span>
            </div>
            <ul className="mt-6 space-y-3">
              {features.slice(0, r.f).map((f, i) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    access[r.n][i] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {access[r.n][i] ? '✓' : '✕'}
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Personalizar permissões
            </button>
          </div>
        ))}
      </div>
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
