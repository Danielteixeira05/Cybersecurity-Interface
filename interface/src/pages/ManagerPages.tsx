import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import type { Page } from '../types';
import {
  dashboardApi, clientesApi, ativosApi, incidentesApi, documentosApi,
  pedidosApi, avaliacoesApi, clienteDetalheApi, session,
  type ApiDashboardAdmin, type ApiCliente, type ApiAtivo, type ApiIncidente,
  type ApiDocumento, type ApiPedido, type ApiAvaliacao,
} from '../apiClient';

interface PageProps {
  setPage: (p: Page) => void;
}

interface DetailProps extends PageProps {
  backPage?: Page;
  backLabel?: string;
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

function severityColor(s: string | undefined) {
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
      <PageHeader title="Painel de Colaborador" subtitle="Visão operacional dos clientes e incidentes" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes Ativos" value={s.clientes ?? 0} icon="🏢" color="bg-blue-50" />
        <StatCard label="Ativos Geridos" value={s.ativos ?? 0} icon="💻" color="bg-emerald-50" />
        <StatCard label="Incidentes Abertos" value={s.incidentes_abertos ?? 0} icon="🚨" color="bg-rose-50" delta={`${s.incidentes ?? 0} total`} />
        <StatCard label="Pedidos Pendentes" value={s.pedidos_abertos ?? 0} icon="📨" color="bg-amber-50" delta={`${s.pedidos ?? 0} total`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Conformidade por Cliente</h3>
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
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Pedidos por Estado</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.pedidos_estado || []} dataKey="total_pedidos" nameKey="estado" outerRadius={90} label={(p) => p.estado}>
                  {(data.pedidos_estado || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-slate-900">Top Incidentes por Cliente</h3>
            <button onClick={() => setPage('mgr-incidents')} className="text-xs text-blue-600 hover:underline">Ver todos →</button>
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
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-slate-900">Ações Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { p: 'mgr-clients', l: 'Clientes', i: '🏢' },
              { p: 'mgr-incidents', l: 'Incidentes', i: '🚨' },
              { p: 'mgr-assets', l: 'Ativos', i: '💻' },
              { p: 'mgr-documents', l: 'Documentos', i: '📄' },
              { p: 'mgr-requests', l: 'Pedidos', i: '📨' },
              { p: 'mgr-excel', l: 'Importar', i: '📊' },
            ].map((x) => (
              <button
                key={x.p}
                onClick={() => setPage(x.p as Page)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 p-4 text-left transition"
              >
                <div className="text-2xl">{x.i}</div>
                <div className="mt-1 font-semibold text-sm text-slate-800">{x.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MgrAnalytics({ setPage }: PageProps) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [clientes, setClientes] = useState<ApiCliente[]>([]);

  useEffect(() => {
    Promise.all([
      dashboardApi() as Promise<ApiDashboardAdmin>,
      clientesApi(),
    ])
      .then(([d, c]) => {
        setStats(d.stats || {});
        setClientes(c);
      })
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const trendData = [
    { mes: 'Jul', incidentes: 12, ativos: 80, clientes: 30 },
    { mes: 'Ago', incidentes: 18, ativos: 100, clientes: 34 },
    { mes: 'Set', incidentes: 22, ativos: 120, clientes: 38 },
    { mes: 'Out', incidentes: 16, ativos: 140, clientes: 42 },
    { mes: 'Nov', incidentes: 28, ativos: 165, clientes: 48 },
    { mes: 'Dez', incidentes: 24, ativos: 190, clientes: 52 },
  ];

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;

  return (
    <div>
      <PageHeader title="Análises Operacionais" subtitle="Métricas de desempenho e tendências" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="MTTR (horas)" value="5.1" icon="⏱️" color="bg-amber-50" delta="-6% vs Q anterior" />
        <StatCard label="MTTD (min)" value="14.3" icon="🔎" color="bg-cyan-50" />
        <StatCard label="Taxa de Resolução" value="92.4%" icon="✅" color="bg-emerald-50" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Tendências (6 meses)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="incidentes" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="ativos" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="clientes" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição de Clientes por Setor</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { setor: 'Saúde', n: Math.round(clientes.length * 0.28) },
                    { setor: 'Finanças', n: Math.round(clientes.length * 0.22) },
                    { setor: 'Energia', n: Math.round(clientes.length * 0.18) },
                    { setor: 'Tecnologia', n: Math.round(clientes.length * 0.2) },
                    { setor: 'Outros', n: Math.round(clientes.length * 0.12) },
                  ].filter(x => x.n > 0)}
                  dataKey="n" nameKey="setor" outerRadius={110} label={(p) => `${p.setor}: ${p.n}`}
                >
                  {Array.from({ length: 10 }).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-slate-900">Clientes com Mais Incidentes</h3>
            <button onClick={() => setPage('mgr-clients')} className="text-xs text-blue-600 hover:underline">Gerir clientes →</button>
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

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${data.length} clientes registados`}
        actions={
          <>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar..."
                className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
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
            setPage('mgr-client-detail');
          }}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs text-slate-500">#{r.id}</span> },
            { key: 'nome', label: 'Cliente', render: (r) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {(r.nome || 'C').charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{r.nome}</div>
                  <div className="text-xs text-slate-500">NIF: {r.nif || '—'} • {r.email || '—'}</div>
                </div>
              </div>
            )},
            { key: 'setor_atividade', label: 'Setor', render: (r) => r.setor_atividade || '—' },
            { key: 'numero_ativos', label: 'Ativos', render: (r) => r.numero_ativos ?? 0 },
            { key: 'numero_incidentes', label: 'Incidentes', render: (r) => r.numero_incidentes ?? 0 },
            { key: 'conformidade', label: 'Conformidade', render: (r) => (
              <span className={`badge ${conformidadeColor(r.conformidade)}`}>{r.conformidade || 'Sem dados'}</span>
            )},
          ]}
        />
      )}
    </div>
  );
}

export function MgrClientDetail({ setPage, backPage = 'mgr-clients', backLabel = 'Clientes' }: DetailProps) {
  const sess = session.get();
  const cid = (sess.cliente as any)?.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!cid) { setLoading(false); return; }
    clienteDetalheApi(cid)
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, [cid]);

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;
  if (!data || !data.cliente) return <ErrorCard msg="Cliente não encontrado. Volte à lista e selecione um cliente." />;

  const c = data.cliente;
  const res = data.resumo || {};

  return (
    <div>
      <PageHeader
        title={c.nome}
        subtitle={`NIF ${c.nif || '—'} • Setor: ${c.setor_atividade || '—'}`}
        actions={
          <button
            onClick={() => setPage(backPage)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar a {backLabel}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Ativos" value={res.numero_ativos ?? data.ativos?.length ?? 0} icon="💻" color="bg-blue-50" />
        <StatCard label="Incidentes" value={res.numero_incidentes ?? data.incidentes?.length ?? 0} icon="🚨" color="bg-rose-50" />
        <StatCard label="Documentos" value={data.documentos?.length ?? 0} icon="📄" color="bg-violet-50" />
        <StatCard label="Conformidade" value={c.conformidade || '—'} icon="✅" color="bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Ativos</h3>
          <DataTable
            data={data.ativos || []}
            columns={[
              { key: 'id', label: 'ID', width: '50px', render: (r: ApiAtivo) => <span className="font-mono text-xs">#{r.id}</span> },
              { key: 'nome', label: 'Ativo', render: (r: ApiAtivo) => (
                <div>
                  <div className="font-medium text-slate-900">{r.nome}</div>
                  <div className="text-xs text-slate-500">{r.tipo || '—'}</div>
                </div>
              )},
              { key: 'criticalidade', label: 'Criticidade', render: (r: ApiAtivo) => (
                <span className={`badge ${severityColor(r.criticalidade)}`}>{r.criticalidade || '—'}</span>
              )},
              { key: 'endereco_ip', label: 'IP', render: (r: ApiAtivo) => r.endereco_ip || '—' },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Incidentes</h3>
          <DataTable
            data={data.incidentes || []}
            columns={[
              { key: 'id', label: 'Ref', width: '70px', render: (r: ApiIncidente) => <span className="font-mono text-xs">INC-{String(r.id).padStart(4,'0')}</span> },
              { key: 'titulo', label: 'Incidente', render: (r: ApiIncidente) => r.titulo },
              { key: 'severidade', label: 'Severidade', render: (r: ApiIncidente) => (
                <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade || '—'}</span>
              )},
              { key: 'resolvido_em', label: 'Estado', render: (r: ApiIncidente) => r.resolvido_em ? (
                <span className="badge bg-emerald-100 text-emerald-700">✓ Resolvido</span>
              ) : <span className="badge bg-rose-100 text-rose-700">● Aberto</span> },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Documentos</h3>
          <DataTable
            data={data.documentos || []}
            columns={[
              { key: 'id', label: 'ID', width: '50px', render: (r: ApiDocumento) => <span className="font-mono text-xs">#{r.id}</span> },
              { key: 'titulo', label: 'Título', render: (r: ApiDocumento) => r.titulo },
              { key: 'tipo', label: 'Tipo', render: (r: ApiDocumento) => r.tipo || '—' },
              { key: 'submetido_em', label: 'Data', render: (r: ApiDocumento) => r.submetido_em ? new Date(r.submetido_em).toLocaleDateString('pt-PT') : '—' },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Avaliações / Pedidos</h3>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Avaliações de Conformidade</h4>
            <DataTable
              data={data.avaliacoes || []}
              emptyText="Sem avaliações"
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r: ApiAvaliacao) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'data_avaliacao', label: 'Data', render: (r: ApiAvaliacao) => r.data_avaliacao ? new Date(r.data_avaliacao).toLocaleDateString('pt-PT') : '—' },
                { key: 'estado_conformidade_nome', label: 'Estado', render: (r: ApiAvaliacao) => (
                  <span className={`badge ${conformidadeColor(r.estado_conformidade_nome)}`}>{r.estado_conformidade_nome || '—'}</span>
                )},
                { key: 'score', label: 'Score', render: (r: ApiAvaliacao) => r.score ?? '—' },
              ]}
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Pedidos</h4>
            <DataTable
              data={data.pedidos || []}
              emptyText="Sem pedidos"
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r: ApiPedido) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'assunto', label: 'Assunto', render: (r: ApiPedido) => r.assunto },
                { key: 'estado_nome', label: 'Estado', render: (r: ApiPedido) => r.estado_nome || '—' },
                { key: 'criado_em', label: 'Data', render: (r: ApiPedido) => r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-PT') : '—' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MgrIncidents({ setPage }: PageProps) {
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
        title="Incidentes de Segurança"
        subtitle={`${data.filter(i => !i.resolvido_em).length} abertos / ${data.length} total`}
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
            { key: 'id', label: 'Ref', width: '70px', render: (r) => <span className="font-mono text-xs text-slate-500">INC-{String(r.id).padStart(4, '0')}</span> },
            { key: 'titulo', label: 'Incidente', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.titulo}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.tipo || '—'}</span> },
            { key: 'severidade', label: 'Severidade', render: (r) => (
              <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade || 'Média'}</span>
            )},
            { key: 'detetado_em', label: 'Deteção', render: (r) => r.detetado_em ? new Date(r.detetado_em).toLocaleDateString('pt-PT') : '—' },
            { key: 'resolvido_em', label: 'Estado', render: (r) => r.resolvido_em ? (
              <span className="badge bg-emerald-100 text-emerald-700">✓ Resolvido</span>
            ) : <span className="badge bg-rose-100 text-rose-700">● Aberto</span> },
            { key: 'id', label: '', width: '80px', render: (r) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (r.cliente_id) {
                    (session as any).set({ ...session.get(), cliente: { id: r.cliente_id, nome: r.cliente_nome } });
                    setPage('mgr-client-detail');
                  }
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Ver Cliente
              </button>
            )},
          ]}
        />
      )}
    </div>
  );
}

export function MgrDocuments() {
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
        title="Documentos"
        subtitle={`${data.length} documentos armazenados`}
        actions={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Submeter Documento</button>}
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'titulo', label: 'Título', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.titulo}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-blue-50 text-blue-700">{r.tipo || '—'}</span> },
            { key: 'formato', label: 'Formato', render: (r) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.formato || '—'}</span> },
            { key: 'tamanho_bytes', label: 'Tamanho', render: (r) => `${((r.tamanho_bytes || 0) / 1024).toFixed(1)} KB` },
            { key: 'submetido_em', label: 'Submetido', render: (r) => r.submetido_em ? new Date(r.submetido_em).toLocaleDateString('pt-PT') : '—' },
            { key: 'id', label: '', width: '80px', render: () => (
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Download</button>
            )},
          ]}
        />
      )}
    </div>
  );
}

export function MgrRequests() {
  const [data, setData] = useState<ApiPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    pedidosApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Pedidos de Suporte"
        subtitle={`${data.filter(p => !p.resolvido_em).length} por resolver / ${data.length} total`}
        actions={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Novo Pedido</button>}
      />
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
          ]}
        />
      )}
    </div>
  );
}

export function MgrAssets() {
  const [data, setData] = useState<ApiAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    ativosApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Ativos de TI"
        subtitle={`${data.length} ativos registados na plataforma`}
        actions={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Novo Ativo</button>}
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'nome', label: 'Ativo', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.nome}</div>
                <div className="text-xs text-slate-500">Cliente: {r.cliente_nome || '—'}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.tipo || '—'}</span> },
            { key: 'criticalidade', label: 'Criticidade', render: (r) => (
              <span className={`badge ${severityColor(r.criticalidade)}`}>{r.criticalidade || '—'}</span>
            )},
            { key: 'endereco_ip', label: 'Endereço IP', render: (r) => <span className="font-mono text-xs">{r.endereco_ip || '—'}</span> },
            { key: 'data_aquisicao', label: 'Aquisição', render: (r) => r.data_aquisicao ? new Date(r.data_aquisicao).toLocaleDateString('pt-PT') : '—' },
          ]}
        />
      )}
    </div>
  );
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
              { p: 'mgr-pentests', l: 'Pentests Agendados', i: '🔍', c: 'from-rose-500 to-pink-500' },
              { p: 'mgr-reports', l: 'Gerar Relatórios', i: '📈', c: 'from-violet-500 to-purple-500' },
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

export function MgrNIS2({ setPage }: PageProps) {
  const [data, setData] = useState<ApiCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    clientesApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const dist = [
    { estado: 'Conforme', n: data.filter(c => (c.conformidade || '').toLowerCase().includes('conforme') && !(c.conformidade || '').toLowerCase().includes('nao')).length, c: '#10b981' },
    { estado: 'Em Revisão', n: data.filter(c => (c.conformidade || '').toLowerCase().includes('revis') || (c.conformidade || '').toLowerCase().includes('avalia')).length, c: '#f59e0b' },
    { estado: 'Não Conforme', n: data.filter(c => (c.conformidade || '').toLowerCase().includes('nao') || (c.conformidade || '').toLowerCase().includes('não')).length, c: '#ef4444' },
    { estado: 'Por Avaliar', n: data.filter(c => !c.conformidade).length, c: '#94a3b8' },
  ];

  return (
    <div>
      <PageHeader title="Conformidade NIS2" subtitle="Diretiva NIS2 - Estado de conformidade dos clientes" />
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
                <Pie data={dist} dataKey="n" nameKey="estado" outerRadius={110} label={(p) => `${p.estado}: ${p.n}`}>
                  {dist.map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Checklist NIS2</h3>
          <ul className="space-y-3">
            {[
              { t: 'Políticas de segurança documentadas', ok: 88 },
              { t: 'Gestão de riscos implementada', ok: 76 },
              { t: 'Planos de resposta a incidentes', ok: 82 },
              { t: 'Formação de colaboradores', ok: 64 },
              { t: 'Monitorização contínua (24/7)', ok: 58 },
              { t: 'Notificação de incidentes (24h)', ok: 90 },
            ].map((it, i) => (
              <li key={i} className="rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-medium text-slate-800">{it.t}</span>
                  <span className="font-semibold text-slate-600">{it.ok}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${it.ok}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setPage('mgr-reports')}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-violet-700"
          >
            Gerar Relatório NIS2
          </button>
        </div>
      </div>
      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Clientes - Estado NIS2</h3>
          {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
            <DataTable
              data={data}
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

export function MgrReports({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Gerar e exportar relatórios de segurança e conformidade" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: 'Relatório de Conformidade NIS2', d: 'PDF completo com checklist e evidências', i: '🛡️', p: 'mgr-nis2', c: 'from-blue-500 to-cyan-500' },
          { t: 'Relatório de Incidentes (Trimestral)', d: 'Estatísticas, MTTD, MTTR e análise de tendências', i: '📊', p: 'mgr-analytics', c: 'from-rose-500 to-pink-500' },
          { t: 'Relatório de Riscos', d: 'Matriz de riscos, avaliações e recomendações', i: '⚠️', p: 'mgr-risk', c: 'from-amber-500 to-orange-500' },
          { t: 'Inventário de Ativos', d: 'Lista completa de ativos por cliente e criticidade', i: '💻', p: 'mgr-assets', c: 'from-emerald-500 to-teal-500' },
          { t: 'Relatório de Pentests', d: 'Resultados e recomendações de testes de penetração', i: '🔍', p: 'mgr-pentests', c: 'from-violet-500 to-purple-500' },
          { t: 'Evidências de Conformidade', d: 'Pacote de documentos para auditoria', i: '🧾', p: 'mgr-evidence', c: 'from-indigo-500 to-blue-500' },
        ].map(r => (
          <div key={r.t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.c} flex items-center justify-center text-2xl mb-4`}>{r.i}</div>
            <h3 className="font-display font-semibold text-slate-900">{r.t}</h3>
            <p className="mt-1 text-xs text-slate-500">{r.d}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800">Exportar PDF</button>
              <button
                onClick={() => setPage(r.p as Page)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MgrPentests({ setPage }: PageProps) {
  const items = [
    { id: 1, cliente: 'Empresa A', data: '2026-08-15', estado: 'Em curso', severidade: 'Alta', vulnerabilidades: 8, progresso: 65 },
    { id: 2, cliente: 'Empresa B', data: '2026-07-30', estado: 'Concluído', severidade: 'Média', vulnerabilidades: 3, progresso: 100 },
    { id: 3, cliente: 'Empresa C', data: '2026-09-10', estado: 'Agendado', severidade: '—', vulnerabilidades: 0, progresso: 0 },
  ];
  return (
    <div>
      <PageHeader
        title="Testes de Penetração (Pentests)"
        subtitle="Gestão de pentests e resultados"
        actions={
          <>
            <button onClick={() => setPage('mgr-evidence')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Ver Evidências
            </button>
            <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">+ Agendar Pentest</button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Agendados" value={items.filter(i => i.estado === 'Agendado').length} icon="📅" color="bg-blue-50" />
        <StatCard label="Em Curso" value={items.filter(i => i.estado === 'Em curso').length} icon="🔍" color="bg-amber-50" />
        <StatCard label="Concluídos (Trimestre)" value={items.filter(i => i.estado === 'Concluído').length} icon="✅" color="bg-emerald-50" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <DataTable
          data={items as any}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r: any) => <span className="font-mono text-xs">#PT-{String(r.id).padStart(4,'0')}</span> },
            { key: 'cliente', label: 'Cliente', render: (r: any) => r.cliente },
            { key: 'data', label: 'Data', render: (r: any) => new Date(r.data).toLocaleDateString('pt-PT') },
            { key: 'estado', label: 'Estado', render: (r: any) => (
              <span className={`badge ${r.estado === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : r.estado === 'Em curso' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.estado}</span>
            )},
            { key: 'severidade', label: 'Risco Máx.', render: (r: any) => <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade}</span> },
            { key: 'vulnerabilidades', label: 'Vulns.', render: (r: any) => r.vulnerabilidades || '—' },
            { key: 'progresso', label: 'Progresso', render: (r: any) => (
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Progresso</span><span className="font-semibold">{r.progresso}%</span></div>
                <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${r.progresso}%` }} /></div>
              </div>
            )},
          ]}
        />
      </div>
    </div>
  );
}

export function MgrEvidence({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader
        title="Evidências de Conformidade"
        subtitle="Armazenamento e catalogação de evidências para auditoria"
        actions={
          <>
            <button onClick={() => setPage('mgr-reports')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Gerar Pacote
            </button>
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">+ Adicionar Evidência</button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Evidências NIS2" value={24} icon="🛡️" color="bg-blue-50" />
        <StatCard label="Políticas Aprovadas" value={12} icon="📜" color="bg-violet-50" />
        <StatCard label="Logs Armazenados" value="2.1k" icon="📋" color="bg-emerald-50" />
        <StatCard label="Testes Realizados" value={18} icon="✅" color="bg-amber-50" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <DataTable
          data={[
            { id: 1, cat: 'Política', titulo: 'Política de Segurança da Informação v3.2', data: '2026-07-15', tipo: 'PDF', tam: '1.2 MB', status: 'Aprovada' },
            { id: 2, cat: 'Log', titulo: 'Logs de Firewall - Julho 2026', data: '2026-08-01', tipo: 'CSV', tam: '48 MB', status: 'Arquivado' },
            { id: 3, cat: 'Teste', titulo: 'Relatório Pentest Q3 - Infraestrutura', data: '2026-07-30', tipo: 'PDF', tam: '3.4 MB', status: 'Aprovada' },
            { id: 4, cat: 'Formação', titulo: 'Registo de Formação NIS2 (12 colaboradores)', data: '2026-06-20', tipo: 'XLSX', tam: '85 KB', status: 'Aprovada' },
            { id: 5, cat: 'Backup', titulo: 'Política e Procedimentos de Backup v2', data: '2026-05-10', tipo: 'PDF', tam: '680 KB', status: 'Aprovada' },
            { id: 6, cat: 'Plano', titulo: 'Plano de Resposta a Incidentes (IRP)', data: '2026-08-05', tipo: 'DOCX', tam: '420 KB', status: 'Revisão' },
          ] as any}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r: any) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'cat', label: 'Categoria', render: (r: any) => <span className="badge bg-blue-50 text-blue-700">{r.cat}</span> },
            { key: 'titulo', label: 'Título', render: (r: any) => <div className="font-medium text-slate-900">{r.titulo}</div> },
            { key: 'tipo', label: 'Fmt.', render: (r: any) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.tipo}</span> },
            { key: 'tam', label: 'Tam.', render: (r: any) => r.tam },
            { key: 'data', label: 'Data', render: (r: any) => new Date(r.data).toLocaleDateString('pt-PT') },
            { key: 'status', label: 'Estado', render: (r: any) => (
              <span className={`badge ${r.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Revisão' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
            )},
            { key: 'id', label: '', width: '70px', render: () => <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Ver</button> },
          ]}
        />
      </div>
    </div>
  );
}

export function MgrExcelImport() {
  return (
    <div>
      <PageHeader
        title="Importação via Excel"
        subtitle="Importar em massa ativos, incidentes ou dados de clientes"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { t: 'Importar Ativos', d: 'Modelo Excel com dados de inventário e criticidade', i: '💻', c: 'from-blue-500 to-cyan-500', modelo: 'modelo_importacao_ativos.xlsx' },
          { t: 'Importar Incidentes', d: 'Histórico de incidentes ou dados externos', i: '🚨', c: 'from-rose-500 to-pink-500', modelo: 'modelo_importacao_incidentes.xlsx' },
          { t: 'Importar Clientes', d: 'Dados cadastrais de novos clientes', i: '🏢', c: 'from-emerald-500 to-teal-500', modelo: '' },
        ].map(r => (
          <div key={r.t} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${r.c} flex items-center justify-center text-3xl mb-4`}>{r.i}</div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{r.t}</h3>
            <p className="mt-1 text-sm text-slate-500">{r.d}</p>
            <div className="mt-5 space-y-2">
              {r.modelo && (
                <button className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                  <span>📥</span> Descarregar modelo
                </button>
              )}
              <label className="block">
                <input type="file" accept=".xlsx,.xls" className="hidden" />
                <div className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-3 py-6 text-center cursor-pointer transition text-sm">
                  <div className="text-2xl mb-1">📤</div>
                  Selecionar ficheiro Excel
                </div>
              </label>
              <button className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white py-2.5 text-sm font-semibold hover:from-blue-700 hover:to-violet-700">
                Validar & Pré-visualizar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Últimas Importações</h3>
        <DataTable
          data={[
            { id: 1, tipo: 'Ativos', data: '2026-08-10 14:32', utilizador: 'Colaborador', total: 42, ok: 40, erros: 2, status: 'Concluído' },
            { id: 2, tipo: 'Incidentes', data: '2026-08-02 11:05', utilizador: 'Colaborador', total: 18, ok: 18, erros: 0, status: 'Concluído' },
            { id: 3, tipo: 'Ativos', data: '2026-07-21 09:15', utilizador: 'Admin', total: 87, ok: 85, erros: 2, status: 'Concluído' },
          ] as any}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r: any) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'tipo', label: 'Tipo', render: (r: any) => <span className="badge bg-blue-50 text-blue-700">{r.tipo}</span> },
            { key: 'data', label: 'Data & Hora', render: (r: any) => r.data },
            { key: 'utilizador', label: 'Utilizador', render: (r: any) => r.utilizador },
            { key: 'total', label: 'Linhas', render: (r: any) => r.total },
            { key: 'ok', label: 'Sucesso', render: (r: any) => <span className="text-emerald-600 font-semibold">{r.ok}</span> },
            { key: 'erros', label: 'Erros', render: (r: any) => <span className={r.erros ? 'text-rose-600 font-semibold' : ''}>{r.erros}</span> },
            { key: 'status', label: 'Estado', render: (r: any) => <span className="badge bg-emerald-100 text-emerald-700">{r.status}</span> },
          ]}
        />
      </div>
    </div>
  );
}
