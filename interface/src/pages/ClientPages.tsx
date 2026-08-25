import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import type { Page } from '../types';
import {
  dashboardApi, ativosApi, incidentesApi, documentosApi,
  pedidosApi, avaliacoesApi, session,
  type ApiAtivo, type ApiIncidente, type ApiDocumento,
  type ApiPedido, type ApiAvaliacao,
} from '../apiClient';

interface PageProps {
  setPage: (p: Page) => void;
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

export function ClientDashboard({ setPage }: PageProps) {
  const sess = session.get();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<any>({});
  const [ativos, setAtivos] = useState<ApiAtivo[]>([]);
  const [incidentes, setIncidentes] = useState<ApiIncidente[]>([]);

  useEffect(() => {
    Promise.all([
      dashboardApi() as Promise<any>,
      ativosApi(),
      incidentesApi(),
    ])
      .then(([d, a, i]) => {
        setResumo(d || {});
        setAtivos(a || []);
        setIncidentes(i || []);
      })
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const criticidade = [
    { t: 'Alta', n: ativos.filter(a => (a.criticalidade || '').toLowerCase().includes('alt') || (a.criticalidade || '').toLowerCase().includes('crit')).length, c: '#ef4444' },
    { t: 'Média', n: ativos.filter(a => (a.criticalidade || '').toLowerCase().includes('med')).length, c: '#f59e0b' },
    { t: 'Baixa', n: ativos.filter(a => (a.criticalidade || '').toLowerCase().includes('baix')).length, c: '#10b981' },
  ];

  if (loading) return <Loader />;
  if (err) return <ErrorCard msg={err} />;

  const clienteNome = sess.cliente?.nome || 'Cliente';
  const abertos = incidentes.filter((incidente) => incidente.estado === 'ABERTO').length;
  const hasCriticidade = criticidade.some((item) => item.n > 0);

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${clienteNome}`}
        subtitle="Painel de controlo da sua segurança e conformidade"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Meus Ativos" value={ativos.length} icon="💻" color="bg-blue-50" />
        <StatCard label="Incidentes Abertos" value={abertos} icon="🚨" color="bg-rose-50" />
        <StatCard label="Conformidade NIS2" value={resumo.conformidade_estado || '—'} icon="🛡️" color="bg-emerald-50" />
        <StatCard label="Score Risco" value={resumo.score_risco ?? '—'} icon="⭐" color="bg-amber-50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Evolução (6 meses)</h3>
          <div className="flex h-72 items-center justify-center text-center text-sm text-slate-500">
            Sem série histórica disponível.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Ativos por Criticidade</h3>
          {hasCriticidade ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={criticidade.filter((item) => item.n > 0)}
                    dataKey="n"
                    nameKey="t"
                    outerRadius={95}
                    label={(p) => {
                      const item = p.payload as { t?: string; n?: number } | undefined;
                      return `${item?.t ?? ''}: ${item?.n ?? p.value ?? ''}`;
                    }}
                  >
                    {criticidade.filter((item) => item.n > 0).map((item) => <Cell key={item.t} fill={item.c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="flex h-72 items-center justify-center text-center text-sm text-slate-500">Sem ativos classificados disponíveis.</div>}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-slate-900">Últimos Incidentes</h3>
            <button onClick={() => setPage('cli-incidents')} className="text-xs text-blue-600 hover:underline">Ver todos →</button>
          </div>
          <DataTable
            data={incidentes.slice(0, 5)}
            emptyText="Sem incidentes registados"
            columns={[
              { key: 'codigo', label: 'Ref.', width: '70px', render: (r) => <span className="font-mono text-xs">{r.codigo || `#${r.id}`}</span> },
              { key: 'titulo', label: 'Incidente', render: (r) => (
                <div>
                  <div className="font-medium text-slate-900">{r.titulo}</div>
                  <div className="text-xs text-slate-500">{r.detetado_em ? new Date(r.detetado_em).toLocaleDateString('pt-PT') : '—'}</div>
                </div>
              )},
              { key: 'severidade', label: 'Sev.', render: (r) => <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade || '—'}</span> },
              { key: 'estado', label: 'Estado', render: (r) => <span className={`badge ${r.estado === 'ABERTO' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.estado || '—'}</span> },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-slate-900">Atalhos Rápidos</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { p: 'cli-assets', l: 'Meus Ativos', i: '💻', c: 'from-blue-500 to-cyan-500' },
              { p: 'cli-incidents', l: 'Incidentes', i: '🚨', c: 'from-rose-500 to-pink-500' },
              { p: 'cli-documents', l: 'Documentos', i: '📄', c: 'from-violet-500 to-purple-500' },
              { p: 'cli-requests', l: 'Pedidos', i: '📨', c: 'from-amber-500 to-orange-500' },
              { p: 'cli-risk', l: 'Riscos', i: '⚠️', c: 'from-rose-500 to-amber-500' },
              { p: 'cli-nis2', l: 'NIS2', i: '🛡️', c: 'from-emerald-500 to-teal-500' },
              { p: 'cli-reports', l: 'Relatórios', i: '📈', c: 'from-indigo-500 to-blue-500' },
              { p: 'cli-communication', l: 'Contacto', i: '💬', c: 'from-sky-500 to-blue-500' },
            ].map(x => (
              <button
                key={x.p}
                onClick={() => setPage(x.p as Page)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-4 text-left transition group"
              >
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${x.c} flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition`}>{x.i}</div>
                <div className="font-semibold text-sm text-slate-800">{x.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientWorkspace({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader title="Espaço de Trabalho" subtitle="Aceda a todos os recursos da sua conta" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { p: 'cli-assets', t: 'Gestão de Ativos', d: 'Inventário dos seus sistemas e dispositivos', i: '💻', c: 'from-blue-500 to-cyan-500' },
          { p: 'cli-incidents', t: 'Incidentes', d: 'Reportar e acompanhar incidentes de segurança', i: '🚨', c: 'from-rose-500 to-pink-500' },
          { p: 'cli-documents', t: 'Documentos', d: 'Submeter e descarregar documentos da sua conta', i: '📄', c: 'from-violet-500 to-purple-500' },
          { p: 'cli-requests', t: 'Pedidos / Suporte', d: 'Abrir e acompanhar pedidos de suporte', i: '📨', c: 'from-amber-500 to-orange-500' },
          { p: 'cli-nis2', t: 'Conformidade NIS2', d: 'Ver o estado de conformidade com a diretiva', i: '🛡️', c: 'from-emerald-500 to-teal-500' },
          { p: 'cli-risk', t: 'Análise de Riscos', d: 'Avaliações e níveis de risco atualizados', i: '⚠️', c: 'from-amber-500 to-rose-500' },
          { p: 'cli-reports', t: 'Relatórios', d: 'Relatórios automáticos de segurança', i: '📈', c: 'from-indigo-500 to-blue-500' },
          { p: 'cli-communication', t: 'Comunicação', d: 'Contactos com a equipa CiberBoxSecur', i: '💬', c: 'from-sky-500 to-indigo-500' },
          { p: 'cli-pentests', t: 'Pentests', d: 'Agendar e ver resultados de testes de penetração', i: '🔍', c: 'from-fuchsia-500 to-violet-500' },
        ].map(r => (
          <button
            key={r.p}
            onClick={() => setPage(r.p as Page)}
            className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.c} flex items-center justify-center text-2xl mb-4`}>{r.i}</div>
            <h3 className="font-display font-semibold text-slate-900">{r.t}</h3>
            <p className="mt-1 text-xs text-slate-500">{r.d}</p>
            <div className="mt-3 text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
              Abrir <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClientAssets() {
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
      <PageHeader title="Meus Ativos" subtitle={`${data.length} ativos registados na sua conta`} />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'nome', label: 'Ativo', render: (r) => (
              <div>
                <div className="font-semibold text-slate-900">{r.nome}</div>
                <div className="text-xs text-slate-500">{r.descricao || ''}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.tipo || '—'}</span> },
            { key: 'criticalidade', label: 'Criticidade', render: (r) => (
              <span className={`badge ${severityColor(r.criticalidade)}`}>{r.criticalidade || '—'}</span>
            )},
            { key: 'endereco_ip', label: 'IP', render: (r) => <span className="font-mono text-xs">{r.endereco_ip || '—'}</span> },
            { key: 'data_aquisicao', label: 'Aquisição', render: (r) => r.data_aquisicao ? new Date(r.data_aquisicao).toLocaleDateString('pt-PT') : '—' },
          ]}
        />
      )}
    </div>
  );
}

export function ClientIncidents() {
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
        title="Incidentes"
        subtitle={`${data.filter(i => !i.resolvido_em).length} em aberto / ${data.length} total`}
        actions={<button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">+ Reportar Incidente</button>}
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'Ref.', width: '70px', render: (r) => <span className="font-mono text-xs text-slate-500">INC-{String(r.id).padStart(4, '0')}</span> },
            { key: 'titulo', label: 'Incidente', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.titulo}</div>
                <div className="text-xs text-slate-500">{r.descricao ? String(r.descricao).slice(0, 80) + '...' : ''}</div>
              </div>
            )},
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.tipo || '—'}</span> },
            { key: 'severidade', label: 'Severidade', render: (r) => <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade || '—'}</span> },
            { key: 'detetado_em', label: 'Deteção', render: (r) => r.detetado_em ? new Date(r.detetado_em).toLocaleDateString('pt-PT') : '—' },
            { key: 'resolvido_em', label: 'Estado', render: (r) => r.resolvido_em ? (
              <span className="badge bg-emerald-100 text-emerald-700">✓ Resolvido</span>
            ) : <span className="badge bg-rose-100 text-rose-700">● Aberto</span> },
          ]}
        />
      )}
    </div>
  );
}

export function ClientDocuments({ setPage }: PageProps) {
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
        subtitle={`${data.length} documentos associados à sua conta`}
        actions={
          <>
            <button onClick={() => setPage('cli-reports')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Relatórios
            </button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Submeter</button>
          </>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'titulo', label: 'Título', render: (r) => <div className="font-medium text-slate-900">{r.titulo}</div> },
            { key: 'tipo', label: 'Tipo', render: (r) => <span className="badge bg-blue-50 text-blue-700">{r.tipo || '—'}</span> },
            { key: 'formato', label: 'Formato', render: (r) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.formato || '—'}</span> },
            { key: 'tamanho_bytes', label: 'Tamanho', render: (r) => `${((r.tamanho_bytes || 0) / 1024).toFixed(1)} KB` },
            { key: 'submetido_em', label: 'Submetido', render: (r) => r.submetido_em ? new Date(r.submetido_em).toLocaleDateString('pt-PT') : '—' },
            { key: 'id', label: '', width: '80px', render: () => <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Download</button> },
          ]}
        />
      )}
    </div>
  );
}

export function ClientRequests({ setPage }: PageProps) {
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
        actions={
          <>
            <button onClick={() => setPage('cli-communication')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Comunicação
            </button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Novo Pedido</button>
          </>
        }
      />
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <DataTable
          data={data}
          columns={[
            { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'assunto', label: 'Assunto', render: (r) => (
              <div>
                <div className="font-medium text-slate-900">{r.assunto}</div>
                <div className="text-xs text-slate-500">{r.descricao ? String(r.descricao).slice(0, 90) : ''}</div>
              </div>
            )},
            { key: 'estado_nome', label: 'Estado', render: (r) => <span className="badge bg-violet-100 text-violet-700">{r.estado_nome || '—'}</span> },
            { key: 'prioridade', label: 'Prioridade', render: (r) => <span className={`badge ${severityColor(r.prioridade)}`}>{r.prioridade || 'Normal'}</span> },
            { key: 'criado_em', label: 'Criado', render: (r) => r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-PT') : '—' },
            { key: 'resolvido_em', label: 'Resolvido', render: (r) => r.resolvido_em ? new Date(r.resolvido_em).toLocaleDateString('pt-PT') : '—' },
          ]}
        />
      )}
    </div>
  );
}

export function ClientReports({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Relatórios disponíveis para a sua conta" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: 'Relatório de Conformidade NIS2', d: 'Estado atual, checklist e recomendações', i: '🛡️', c: 'from-blue-500 to-cyan-500', p: 'cli-nis2' },
          { t: 'Relatório Trimestral', d: 'Atividade, incidentes e evolução de ativos', i: '📊', c: 'from-rose-500 to-pink-500', p: 'cli-dashboard' },
          { t: 'Análise de Riscos', d: 'Avaliação de riscos e medidas a adotar', i: '⚠️', c: 'from-amber-500 to-orange-500', p: 'cli-risk' },
          { t: 'Inventário de Ativos', d: 'Lista completa dos seus ativos de TI', i: '💻', c: 'from-emerald-500 to-teal-500', p: 'cli-assets' },
          { t: 'Histórico de Incidentes', d: 'Registo completo e análise de incidentes', i: '🚨', c: 'from-rose-500 to-orange-500', p: 'cli-incidents' },
          { t: 'Resultados de Pentests', d: 'Se tiver pentests contratados', i: '🔍', c: 'from-violet-500 to-purple-500', p: 'cli-pentests' },
        ].map(r => (
          <div key={r.t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.c} flex items-center justify-center text-2xl mb-4`}>{r.i}</div>
            <h3 className="font-display font-semibold text-slate-900">{r.t}</h3>
            <p className="mt-1 text-xs text-slate-500">{r.d}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800">Descarregar PDF</button>
              <button
                onClick={() => setPage(r.p as Page)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientProfile() {
  const sess = session.get();
  const u = sess.utilizador;
  const c = sess.cliente;
  return (
    <div>
      <PageHeader title="Meu Perfil" subtitle="Dados da sua conta e empresa" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-4xl font-bold text-white">
            {(u?.nome || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">{u?.nome || 'Utilizador'}</h3>
          <span className="badge mt-2 bg-emerald-100 text-emerald-700">CLIENTE</span>
          <div className="mt-4 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-800">{u?.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Telefone</span><span className="text-slate-800">{u?.telefone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">NIF</span><span className="text-slate-800">{u?.nif || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Desde</span><span className="text-slate-800">{u?.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-PT') : '—'}</span></div>
          </div>
          <button className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50">
            Editar dados
          </button>
          <button className="mt-2 w-full rounded-xl bg-slate-900 text-white px-3 py-2.5 text-sm font-semibold hover:bg-slate-800">
            Alterar senha
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Dados da Empresa</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { k: 'Nome', v: c?.nome || '—' },
              { k: 'NIF', v: c?.nif || '—' },
              { k: 'Ativo', v: c?.ativo === false ? 'Não' : 'Sim' },
              { k: 'Criado em', v: c?.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-PT') : '—' },
            ].map(f => (
              <div key={f.k} className="rounded-xl border border-slate-100 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{f.k}</div>
                <div className="mt-1 font-semibold text-slate-800">{f.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-semibold text-slate-900">Precisa de ajuda?</div>
                <p className="mt-1 text-sm text-slate-600">
                  Para alterar os dados da sua empresa, contacte o seu gestor de conta ou abra um pedido de suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientRisk() {
  const [data, setData] = useState<ApiAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    avaliacoesApi()
      .then(setData)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const riskDist = [
    { t: 'Crítico', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('crit')).length, c: '#ef4444' },
    { t: 'Alto', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('alt') && !(a.nivel_risco || '').toLowerCase().includes('crit')).length, c: '#f59e0b' },
    { t: 'Médio', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('med')).length, c: '#8b5cf6' },
    { t: 'Baixo', n: data.filter(a => (a.nivel_risco || '').toLowerCase().includes('baix')).length, c: '#10b981' },
  ];

  return (
    <div>
      <PageHeader title="Análise de Riscos" subtitle="Avaliações e níveis de risco da sua conta" />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Avaliações" value={data.length} icon="📊" color="bg-blue-50" />
        <StatCard label="Risco Atual" value={data.length ? (data[0].nivel_risco || 'Médio') : 'Médio'} icon="⚠️" color="bg-amber-50" />
        <StatCard label="Score (última)" value={data.length ? (data[0].score ?? '—') : '—'} icon="⭐" color="bg-emerald-50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição por Nível</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" radius={[8, 8, 0, 0]}>
                  {riskDist.map((d, i) => <Cell key={i} fill={d.c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Evolução do Score</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(0, 10).map((a, i) => ({
                aval: `#${i + 1}`,
                score: a.score ?? 70 - i * 2,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="aval" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Histórico de Avaliações</h3>
          <DataTable
            data={data}
            emptyText="Sem avaliações disponíveis"
            columns={[
              { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
              { key: 'data_avaliacao', label: 'Data', render: (r) => r.data_avaliacao ? new Date(r.data_avaliacao).toLocaleDateString('pt-PT') : '—' },
              { key: 'estado_conformidade_nome', label: 'Conformidade', render: (r) => (
                <span className={`badge ${conformidadeColor(r.estado_conformidade_nome)}`}>{r.estado_conformidade_nome || '—'}</span>
              )},
              { key: 'nivel_risco', label: 'Risco', render: (r) => <span className={`badge ${severityColor(r.nivel_risco)}`}>{r.nivel_risco || '—'}</span> },
              { key: 'score', label: 'Score', render: (r) => r.score ?? '—' },
              { key: 'observacoes', label: 'Observações', render: (r) => (r.observacoes ? String(r.observacoes).slice(0, 60) + '...' : '—') },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export function ClientNIS2() {
  const [avals, setAvals] = useState<ApiAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    avaliacoesApi()
      .then(setAvals)
      .catch((e) => setErr(e?.message || 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  const ultima = avals[0];
  const estado = ultima?.estado_conformidade_nome || 'Em avaliação';

  const items = [
    { t: 'Políticas e procedimentos', ok: 92 },
    { t: 'Gestão de riscos', ok: 84 },
    { t: 'Resposta a incidentes', ok: 76 },
    { t: 'Monitorização 24/7', ok: 68 },
    { t: 'Formação colaboradores', ok: 58 },
    { t: 'Backup e recuperação', ok: 88 },
    { t: 'Gestão de fornecedores', ok: 72 },
    { t: 'Criptografia', ok: 90 },
  ];

  return (
    <div>
      <PageHeader title="Conformidade NIS2" subtitle={`Estado atual: ${estado}`} />
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 mb-6 text-white">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative flex-shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              <circle cx="70" cy="70" r="60" stroke="url(#g)" strokeWidth="12" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60 * 0.78} ${2 * Math.PI * 60}`}
                transform="rotate(-90 70 70)" />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold font-display">78%</div>
              <div className="text-xs text-slate-300">Conformidade</div>
            </div>
          </div>
          <div className="flex-1 min-w-[280px]">
            <h2 className="font-display text-2xl font-bold">Diretiva NIS 2</h2>
            <p className="mt-1 text-sm text-slate-300 max-w-lg">
              Monitorização contínua do cumprimento dos requisitos da Diretiva (UE) 2022/2555 (NIS2). 
              A equipa CiberBoxSecur acompanha a sua implementação.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Incidentes report.</div>
                <div className="font-semibold mt-0.5">24h</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Próxima audit.</div>
                <div className="font-semibold mt-0.5">15/10/2026</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400">Itens a tratar</div>
                <div className="font-semibold mt-0.5 text-amber-300">3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Checklist de Implementação</h3>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3">
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-medium text-slate-800">{it.t}</span>
                  <span className="font-semibold text-slate-600">{it.ok}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${it.ok >= 85 ? 'bg-emerald-500' : it.ok >= 70 ? 'bg-blue-500' : it.ok >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${it.ok}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Histórico de Avaliações</h3>
          {loading ? <Loader /> : err ? <ErrorCard msg={err} /> : (
            <DataTable
              data={avals}
              emptyText="Sem avaliações NIS2 registadas"
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'data_avaliacao', label: 'Data', render: (r) => r.data_avaliacao ? new Date(r.data_avaliacao).toLocaleDateString('pt-PT') : '—' },
                { key: 'estado_conformidade_nome', label: 'Estado', render: (r) => (
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

export function ClientCommunication({ setPage }: PageProps) {
  const [pedidos, setPedidos] = useState<ApiPedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pedidosApi()
      .then(setPedidos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Comunicação & Suporte"
        subtitle="Contacte a equipa CiberBoxSecur ou acompanhe os seus pedidos"
      />
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {[
          { t: 'Email', v: 'suporte@ciberboxsecur.pt', i: '✉️', c: 'from-blue-500 to-cyan-500' },
          { t: 'Telefone', v: '+351 210 000 000', i: '📞', c: 'from-emerald-500 to-teal-500' },
          { t: 'Gestor de Conta', v: 'Nome do Gestor', i: '👤', c: 'from-violet-500 to-purple-500' },
        ].map(c => (
          <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.c} flex items-center justify-center text-2xl mb-4`}>{c.i}</div>
            <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{c.t}</div>
            <div className="mt-1 font-display text-lg font-bold text-slate-900">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Enviar Mensagem</h3>
          <form className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Assunto</label>
              <input type="text" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Assunto da mensagem..." />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Prioridade</label>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white">
                <option>Normal</option>
                <option>Urgente</option>
                <option>Baixa</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mensagem</label>
              <textarea rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Escreva a sua mensagem..." />
            </div>
            <button
              type="button"
              onClick={() => setPage('cli-requests')}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white py-2.5 text-sm font-semibold hover:from-blue-700 hover:to-violet-700"
            >
              Enviar e Criar Pedido
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-semibold text-slate-900">Pedidos Recentes</h3>
            <button onClick={() => setPage('cli-requests')} className="text-xs text-blue-600 hover:underline">Ver todos →</button>
          </div>
          {loading ? <Loader text="A carregar pedidos..." /> : (
            <DataTable
              data={pedidos.slice(0, 6)}
              emptyText="Sem pedidos recentes"
              columns={[
                { key: 'id', label: 'ID', width: '50px', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
                { key: 'assunto', label: 'Assunto', render: (r) => <div className="font-medium text-slate-900">{r.assunto}</div> },
                { key: 'estado_nome', label: 'Estado', render: (r) => <span className="badge bg-violet-100 text-violet-700">{r.estado_nome || '—'}</span> },
                { key: 'criado_em', label: 'Data', render: (r) => r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-PT') : '—' },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientPentests() {
  const items = [
    { id: 1, titulo: 'Pentest Website e App', data: '2026-06-30', estado: 'Concluído', severidade: 'Média', vulns: 4, score: 88, progresso: 100 },
    { id: 2, titulo: 'Pentest Infraestrutura Externa', data: '2026-09-15', estado: 'Agendado', severidade: '—', vulns: 0, score: null, progresso: 0 },
  ];
  return (
    <div>
      <PageHeader
        title="Testes de Penetração"
        subtitle="Resultados e agendamentos de pentests contratados"
        actions={<button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">+ Solicitar Pentest</button>}
      />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Agendados" value={items.filter(i => i.estado === 'Agendado').length} icon="📅" color="bg-blue-50" />
        <StatCard label="Concluídos" value={items.filter(i => i.estado === 'Concluído').length} icon="✅" color="bg-emerald-50" />
        <StatCard label="Média Score" value={items.filter(i => i.score).length ? (items.filter(i => i.score).reduce((a, b) => a + (b.score || 0), 0) / items.filter(i => i.score).length).toFixed(0) : '—'} icon="⭐" color="bg-amber-50" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <DataTable
          data={items as any}
          columns={[
            { key: 'id', label: 'ID', width: '70px', render: (r: any) => <span className="font-mono text-xs">#PT-{String(r.id).padStart(4,'0')}</span> },
            { key: 'titulo', label: 'Teste', render: (r: any) => <div className="font-semibold text-slate-900">{r.titulo}</div> },
            { key: 'data', label: 'Data', render: (r: any) => new Date(r.data).toLocaleDateString('pt-PT') },
            { key: 'estado', label: 'Estado', render: (r: any) => (
              <span className={`badge ${r.estado === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : r.estado === 'Em curso' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.estado}</span>
            )},
            { key: 'severidade', label: 'Risco Máx.', render: (r: any) => <span className={`badge ${severityColor(r.severidade)}`}>{r.severidade}</span> },
            { key: 'vulns', label: 'Vulns.', render: (r: any) => r.vulns || '—' },
            { key: 'score', label: 'Score', render: (r: any) => r.score ?? '—' },
            { key: 'progresso', label: '', width: '80px', render: () => (
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                Detalhes
              </button>
            )},
          ]}
        />
      </div>
    </div>
  );
}
