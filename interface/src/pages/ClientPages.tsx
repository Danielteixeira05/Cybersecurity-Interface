import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, BellRing, ClipboardCheck, FileText, MessageSquare, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import type { Page } from '../types';
import {
  clienteDetalheApi, documentosApi, notificacoesApi, pedidosApi, avaliacoesApi, session,
  type ApiAtivo, type ApiIncidente, type ApiDocumento,
  type ApiPedido, type ApiAvaliacao, type ApiClienteDetalhe, type ApiNotificacao,
} from '../apiClient';
import { AssetsWorkspace, IncidentsWorkspace } from '../components/OperationalResources';
import { INCIDENT_CHANGED_EVENT } from '../realtime';

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

function formatDashboardDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function isPentestDocument(document: ApiDocumento) {
  return /pentest|teste de penetra/i.test(`${document.categoria || ''} ${document.tipo || ''}`);
}

function isCriticalAsset(asset: ApiAtivo) {
  return /crit|alt/i.test(asset.criticidade || asset.criticalidade || '');
}

function DashboardMetric({ label, value, detail, icon, tone = 'blue', onClick }: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone?: 'blue' | 'violet' | 'rose' | 'amber' | 'green';
  onClick?: () => void;
}) {
  const content = <>
    <span className="client-dashboard-page__metric-icon" aria-hidden="true">{icon}</span>
    <span className="client-dashboard-page__metric-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
    <strong>{value}</strong>
    <span>{label}</span>
    <small>{detail}</small>
  </>;
  return onClick
    ? <button type="button" className={`client-dashboard-page__metric client-dashboard-page__metric--${tone}`} onClick={onClick}>{content}</button>
    : <article className={`client-dashboard-page__metric client-dashboard-page__metric--${tone}`}>{content}</article>;
}

export function ClientDashboard({ setPage }: PageProps) {
  const sess = session.get();
  const clientId = sess.cliente?.id;
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ApiClienteDetalhe | null>(null);
  const [notifications, setNotifications] = useState<ApiNotificacao[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshToken((value) => value + 1);
    window.addEventListener(INCIDENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(INCIDENT_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setErr('A sessão não tem uma organização associada.');
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setErr(null);
    Promise.all([clienteDetalheApi(clientId), notificacoesApi(8)])
      .then(([nextDetail, nextNotifications]) => {
        if (!active) return;
        setDetail(nextDetail);
        setNotifications(nextNotifications.filter((notification) => notification.cliente_id === clientId));
      })
      .catch((cause) => {
        if (active) setErr(cause?.message || 'Não foi possível carregar o Dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [clientId, refreshToken]);

  const dashboard = useMemo(() => {
    const client = detail?.cliente;
    const assets = detail?.ativos ?? [];
    const incidents = detail?.incidentes ?? [];
    const documents = detail?.documentos ?? [];
    const assessments = detail?.avaliacoes ?? [];
    const openIncidents = incidents.filter((incident) => incident.estado === 'ABERTO').length;
    const pentestDocuments = documents.filter(isPentestDocument);
    const recommendations = [
      ...assessments.filter((assessment) => assessment.recomendacoes).map((assessment) => ({
        id: `assessment-${assessment.id}`,
        source: 'Avaliação de risco',
        priority: assessment.nivel_risco || 'Sem prioridade indicada',
        text: assessment.recomendacoes!,
      })),
      ...incidents.filter((incident) => incident.recomendacoes).map((incident) => ({
        id: `incident-${incident.id}`,
        source: incident.codigo || `Incidente #${incident.id}`,
        priority: incident.gravidade || incident.severidade || 'Sem prioridade indicada',
        text: incident.recomendacoes!,
      })),
    ];
    return { client, assets, incidents, documents, assessments, openIncidents, pentestDocuments, recommendations };
  }, [detail]);

  if (loading) return <Loader text="A carregar o Dashboard da organização..." />;
  if (err || !detail || !dashboard.client) return <ErrorCard msg={err || 'Organização não encontrada.'} />;

  const securityScore = dashboard.client.pontuacao;
  const scoreLabel = securityScore === null || securityScore === undefined ? '—' : securityScore;
  const classification = dashboard.client.nivel_risco || 'Sem avaliação';
  const nIS2State = dashboard.client.estado_conformidade || 'Sem dados disponíveis';
  const team = [
    ...detail.gestores.map((manager) => ({ id: `manager-${manager.id}`, role: 'Gestor associado', name: manager.nome, email: manager.email, initial: manager.nome.charAt(0) })),
    ...detail.contactos.map((contact) => ({
      id: `contact-${contact.id}`,
      role: contact.tipo === 'RESPONSAVEL_SEGURANCA' ? 'Responsável de Segurança' : contact.tipo === 'CONTACTO_PERMANENTE' ? 'Contacto Permanente' : contact.cargo || 'Contacto',
      name: contact.nome,
      email: contact.email,
      initial: contact.nome.charAt(0),
    })),
  ];

  return (
    <div className="client-dashboard-page">
      <header className="client-dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>{dashboard.client.nome} <span aria-hidden="true">·</span> {formatDashboardDate(new Date().toISOString())}</p>
        </div>
        <button type="button" onClick={() => setPage('cli-workspace')} className="client-dashboard-page__workspace-link">
          Área de Trabalho <ArrowRight size={17} aria-hidden="true" />
        </button>
      </header>

      <section className="client-dashboard-page__summary" aria-label="Resumo de segurança">
        <article className="client-dashboard-page__score-card">
          <span className="client-dashboard-page__eyebrow">Score de Segurança</span>
          <div className={`client-dashboard-page__score${securityScore === null || securityScore === undefined ? ' is-empty' : ''}`}>
            <strong>{scoreLabel}</strong>
            <span>{securityScore === null || securityScore === undefined ? 'Sem avaliação' : 'Avaliação atual'}</span>
          </div>
          <div className="client-dashboard-page__classification">
            <span>Classificação</span>
            <strong>{classification}</strong>
          </div>
          <dl className="client-dashboard-page__score-indicators">
            <div><dt>Ativos críticos</dt><dd>{dashboard.assets.filter(isCriticalAsset).length}</dd></div>
            <div><dt>Incidentes abertos</dt><dd>{dashboard.openIncidents}</dd></div>
            <div><dt>Documentos ativos</dt><dd>{dashboard.documents.length}</dd></div>
            <div><dt>Conformidade NIS2</dt><dd title={nIS2State}>{nIS2State}</dd></div>
          </dl>
        </article>
        <div className="client-dashboard-page__metrics" aria-label="Indicadores da organização">
          <DashboardMetric label="Documentos" value={dashboard.documents.length} detail={dashboard.documents.length ? 'Registos autorizados' : 'Sem documentos disponíveis'} icon={<FileText size={20} />} onClick={() => setPage('cli-documents')} />
          <DashboardMetric label="Findings totais" value="—" detail="Sem fonte de findings" icon={<ClipboardCheck size={20} />} tone="violet" />
          <DashboardMetric label="Findings críticos" value="—" detail="Sem fonte de findings" icon={<TriangleAlert size={20} />} tone="rose" />
          <DashboardMetric label="Pentests" value={dashboard.pentestDocuments.length} detail="Documentos classificados como Pentest" icon={<ShieldCheck size={20} />} tone="blue" onClick={() => setPage('cli-workspace')} />
          <DashboardMetric label="Incidentes" value={dashboard.incidents.length} detail={`${dashboard.openIncidents} abertos`} icon={<TriangleAlert size={20} />} tone="amber" onClick={() => setPage('cli-incidents')} />
          <DashboardMetric label="Score NIS2" value="—" detail={nIS2State} icon={<ShieldCheck size={20} />} tone="green" onClick={() => setPage('cli-reports')} />
        </div>
      </section>

      <section className="client-dashboard-page__insight-grid">
        <article className="client-dashboard-page__panel client-dashboard-page__team">
          <header><UsersRound size={20} aria-hidden="true" /><h2>Equipa de Segurança</h2></header>
          {team.length ? <ul>{team.map((member) => <li key={member.id}>
            <span className="client-dashboard-page__avatar" aria-hidden="true">{member.initial.toUpperCase()}</span>
            <span><strong>{member.name}</strong><small>{member.role}</small><a href={`mailto:${member.email}`}>{member.email}</a></span>
          </li>)}</ul> : <p className="client-dashboard-page__empty-copy">Sem contactos de segurança disponíveis.</p>}
          <button type="button" onClick={() => setPage('cli-communication')} className="client-dashboard-page__text-link"><MessageSquare size={16} aria-hidden="true" /> Ir para Comunicação</button>
        </article>
        <article className="client-dashboard-page__panel client-dashboard-page__recommendations">
          <header><ClipboardCheck size={20} aria-hidden="true" /><div><h2>Recomendações</h2><p>Ações pendentes identificadas</p></div></header>
          {dashboard.recommendations.length ? <ul>{dashboard.recommendations.slice(0, 4).map((recommendation) => <li key={recommendation.id}>
            <span className="client-dashboard-page__recommendation-priority">{recommendation.priority}</span>
            <span><strong>{recommendation.source}</strong><p>{recommendation.text}</p></span>
          </li>)}</ul> : <p className="client-dashboard-page__empty-copy">Não existem recomendações pendentes.</p>}
        </article>
      </section>

      <section className="client-dashboard-page__lists-grid">
        <article className="client-dashboard-page__panel client-dashboard-page__record-list">
          <header><FileText size={20} aria-hidden="true" /><h2>Documentos Recentes</h2><button type="button" onClick={() => setPage('cli-documents')}>Ver todos <ArrowRight size={15} aria-hidden="true" /></button></header>
          {dashboard.documents.length ? <ul>{dashboard.documents.slice(0, 4).map((document) => <li key={document.id}><FileText size={17} aria-hidden="true" /><span><strong title={document.titulo}>{document.titulo}</strong><small>{document.tipo || document.categoria || 'Tipo não indicado'} <span aria-hidden="true">·</span> {formatDashboardDate(document.submetido_em)}</small></span><em>Ativo</em></li>)}</ul> : <p className="client-dashboard-page__empty-copy">Sem documentos disponíveis.</p>}
        </article>
        <article className="client-dashboard-page__panel client-dashboard-page__record-list">
          <header><TriangleAlert size={20} aria-hidden="true" /><h2>Incidentes Recentes</h2><button type="button" onClick={() => setPage('cli-incidents')}>Ver todos <ArrowRight size={15} aria-hidden="true" /></button></header>
          {dashboard.incidents.length ? <ul>{dashboard.incidents.slice(0, 4).map((incident) => <li key={incident.id}><span className={`client-dashboard-page__severity-dot client-dashboard-page__severity-dot--${(incident.gravidade || incident.severidade || '').toLowerCase()}`} aria-hidden="true" /><span><strong title={incident.titulo}>{incident.titulo}</strong><small>{incident.codigo || `#${incident.id}`} <span aria-hidden="true">·</span> {formatDashboardDate(incident.data_hora_incidente || incident.detetado_em)}</small></span><em>{incident.gravidade || incident.severidade || '—'}</em></li>)}</ul> : <p className="client-dashboard-page__empty-copy">Sem incidentes registados.</p>}
        </article>
        <article className="client-dashboard-page__panel client-dashboard-page__record-list">
          <header><BellRing size={20} aria-hidden="true" /><h2>Atividade Recente</h2></header>
          {notifications.length ? <ul>{notifications.slice(0, 4).map((notification) => <li key={notification.id}><BellRing size={17} aria-hidden="true" /><span><strong title={notification.titulo}>{notification.titulo}</strong><small>{formatDashboardDate(notification.criado_em)}</small></span></li>)}</ul> : <p className="client-dashboard-page__empty-copy">Sem atividade recente disponível.</p>}
        </article>
      </section>

      <button type="button" onClick={() => setPage('cli-communication')} className="client-dashboard-page__communication">
        <span><MessageSquare size={24} aria-hidden="true" /></span>
        <span><strong>Comunicação com o Gestor</strong><small>Sem mensagens recentes</small></span>
        <ArrowRight size={20} aria-hidden="true" />
      </button>

      <section className="client-dashboard-page__bottom-grid">
        <article className="client-dashboard-page__panel client-dashboard-page__nis2">
          <header><ShieldCheck size={20} aria-hidden="true" /><div><h2>Estado NIS2</h2><p>Avaliação de conformidade atual</p></div></header>
          {dashboard.assessments[0] ? <dl><div><dt>Estado</dt><dd>{dashboard.client.estado_conformidade || '—'}</dd></div><div><dt>Risco</dt><dd>{dashboard.client.nivel_risco || '—'}</dd></div><div><dt>Pontuação</dt><dd>{dashboard.client.pontuacao ?? '—'}</dd></div><div><dt>Data</dt><dd>{formatDashboardDate(dashboard.assessments[0].data_avaliacao)}</dd></div></dl> : <p className="client-dashboard-page__empty-copy">Sem avaliação NIS2 disponível.</p>}
          <button type="button" onClick={() => setPage('cli-reports')} className="client-dashboard-page__text-link">Ver relatórios <ArrowRight size={16} aria-hidden="true" /></button>
        </article>
        <article className="client-dashboard-page__panel client-dashboard-page__pentests">
          <header><ShieldCheck size={20} aria-hidden="true" /><h2>Pentests</h2></header>
          {dashboard.pentestDocuments.length ? <ul>{dashboard.pentestDocuments.slice(0, 3).map((document) => <li key={document.id}><span><strong title={document.titulo}>{document.titulo}</strong><small>{formatDashboardDate(document.submetido_em)}</small></span></li>)}</ul> : <p className="client-dashboard-page__empty-copy">Sem pentests registados.</p>}
        </article>
      </section>
    </div>
  );
}

export function ClientWorkspace({ setPage }: PageProps) {
  return (
    <div>
      <PageHeader title="Área de Trabalho" subtitle="Aceda aos recursos disponíveis para a sua organização" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { p: 'cli-assets', t: 'Gestão de Ativos', d: 'Inventário dos seus sistemas e dispositivos', i: '💻', c: 'from-blue-500 to-cyan-500' },
          { p: 'cli-incidents', t: 'Incidentes', d: 'Consulte os incidentes de segurança da sua organização', i: '🚨', c: 'from-rose-500 to-pink-500' },
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
  return <AssetsWorkspace role="client" title="Meus Ativos" subtitle="Inventário associado à sua organização" />;
}

export function ClientIncidents() {
  return <IncidentsWorkspace role="client" title="Incidentes" subtitle="Consulte os incidentes da sua organização" />;
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
