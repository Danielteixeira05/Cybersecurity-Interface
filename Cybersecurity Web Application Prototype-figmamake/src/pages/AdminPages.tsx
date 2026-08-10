import { useState } from 'react';
import type { Page } from '../types';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  Users, Building2, Shield, Plus,
  Edit, Trash2, Eye, CheckCircle, TrendingUp, AlertCircle, Download,
  Mail, Phone, Calendar, Clock, BarChart3, FileText, MessageSquare,
  ChevronRight, Activity, Globe2, Image, Type, Newspaper, Save, Upload,
} from 'lucide-react';
import {
  Card, CardHeader, StatCard, Badge, Button, SearchInput,
  Table, Tr, Td, Modal, Input, Select, Textarea, Breadcrumb, Pagination,
} from '../components/DesignSystem';

const CHART_TOOLTIP = {
  contentStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a' },
};

const STATUS_PIE = [
  { name: 'Em Conformidade', value: 42, color: '#16a34a' },
  { name: 'Em Avaliação', value: 31, color: '#d97706' },
  { name: 'Problemas Pendentes', value: 18, color: '#dc2626' },
];
const TOP_INCIDENTS = [
  { name: 'TechCorp Portugal', incidentes: 14 },
  { name: 'Banco Norte', incidentes: 11 },
  { name: 'Saúde Digital', incidentes: 9 },
  { name: 'EnergiaPT', incidentes: 7 },
  { name: 'Logística Sul', incidentes: 5 },
];
const DOCS_BY_MONTH = [
  { mes: 'Jan', docs: 18 }, { mes: 'Fev', docs: 24 }, { mes: 'Mar', docs: 31 },
  { mes: 'Abr', docs: 22 }, { mes: 'Mai', docs: 38 }, { mes: 'Jun', docs: 29 },
];
const USERS_BY_PROFILE = [
  { name: 'Administrador', value: 4, color: '#9333ea' },
  { name: 'Gestor', value: 18, color: '#2563eb' },
  { name: 'Cliente', value: 91, color: '#16a34a' },
];
const TICKETS_BY_STATUS = [
  { name: 'Aberto', value: 23, color: '#dc2626' },
  { name: 'Em Progresso', value: 41, color: '#d97706' },
  { name: 'Resolvido', value: 87, color: '#16a34a' },
  { name: 'Fechado', value: 124, color: '#64748b' },
];

const INCIDENT_TREND = [
  { mes: 'Jan', abertos: 4, resolvidos: 3 }, { mes: 'Fev', abertos: 7, resolvidos: 6 },
  { mes: 'Mar', abertos: 11, resolvidos: 9 }, { mes: 'Abr', abertos: 8, resolvidos: 10 },
  { mes: 'Mai', abertos: 14, resolvidos: 12 }, { mes: 'Jun', abertos: 9, resolvidos: 7 },
];

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export function AdminDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const quickLinks = [
    { label: 'Utilizadores', icon: Users, page: 'admin-users' as Page, color: 'bg-purple-50 text-purple-600', count: '113 ativos' },
    { label: 'Clientes', icon: Building2, page: 'admin-clients' as Page, color: 'bg-blue-50 text-blue-600', count: '91 total' },
    { label: 'Documentos', icon: FileText, page: 'admin-documents' as Page, color: 'bg-green-50 text-green-600', count: '247 ficheiros' },
    { label: 'Incidentes', icon: AlertCircle, page: 'admin-incidents' as Page, color: 'bg-red-50 text-red-600', count: '23 abertos' },
    { label: 'Análises', icon: BarChart3, page: 'admin-analytics' as Page, color: 'bg-amber-50 text-amber-600', count: '6 gráficos' },
    { label: 'Logs', icon: Activity, page: 'admin-logs' as Page, color: 'bg-slate-50 text-slate-600', count: 'em tempo real' },
    { label: 'Conteúdo do Site', icon: Globe2, page: 'admin-site-content' as Page, color: 'bg-cyan-50 text-cyan-600', count: 'website público' },
  ];
  const recentLogs = [
    { user: 'Carlos Mendes', action: 'Estado NIS2 do TechCorp atualizado', time: 'há 12m', type: 'atualização' },
    { user: 'Sofia Pinto', action: 'Documento "Política v3" carregado', time: 'há 34m', type: 'upload' },
    { user: 'TechCorp Portugal', action: 'Pedido TK-0234 submetido', time: 'há 1h', type: 'ticket' },
    { user: 'Ana Rodrigues', action: 'Utilizador rafael.torres desativado', time: 'há 2h', type: 'admin' },
    { user: 'Sistema', action: 'Backup automático concluído', time: 'há 3h', type: 'sistema' },
  ];
  const logColors: Record<string, string> = {
    atualização: 'bg-amber-100 text-amber-700', upload: 'bg-blue-100 text-blue-700',
    ticket: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700', sistema: 'bg-slate-100 text-slate-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de Clientes" value="91" delta="+5" deltaLabel="este mês" icon={Building2} color="blue" />
        <StatCard label="Utilizadores Ativos" value="113" delta="+3" deltaLabel="este mês" icon={Users} color="purple" />
        <StatCard label="Incidentes Abertos" value="23" delta="+2" deltaLabel="esta semana" icon={AlertCircle} color="red" />
        <StatCard label="Tempo Médio Resolução" value="4,2d" delta="-0,3d" deltaLabel="melhoria" icon={TrendingUp} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Incidentes — Tendência" subtitle="Abertos vs. resolvidos · últimos 6 meses" action={
              <Button variant="ghost" size="sm" onClick={() => setPage('admin-analytics')}>Ver tudo →</Button>
            } />
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={INCIDENT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="abertos" stroke="#dc2626" strokeWidth={2} dot={false} name="Abertos" />
                <Line dataKey="resolvidos" stroke="#16a34a" strokeWidth={2} dot={false} name="Resolvidos" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <CardHeader title="NIS2 — Distribuição" />
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={STATUS_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                {STATUS_PIE.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {STATUS_PIE.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
                <span className="font-mono text-slate-400">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Atalhos */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Acesso Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quickLinks.map((l) => (
              <button key={l.label} onClick={() => setPage(l.page)}
                className="flex flex-col items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-base text-left">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.color}`}>
                  <l.icon size={15} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{l.label}</p>
                  <p className="text-xs text-slate-400">{l.count}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Logs recentes */}
        <Card>
          <CardHeader title="Atividade Recente" action={
            <Button variant="ghost" size="sm" onClick={() => setPage('admin-logs')}>Ver tudo</Button>
          } />
          <div className="space-y-3">
            {recentLogs.map((l, i) => (
              <div key={i} className="flex gap-2.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium shrink-0 mt-0.5 ${logColors[l.type]}`}>{l.type}</span>
                <div>
                  <p className="text-xs font-medium text-slate-700">{l.user}</p>
                  <p className="text-xs text-slate-400 leading-snug">{l.action}</p>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{l.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── ANÁLISES & GRÁFICOS ───────────────────────────────────────────────────────
export function AdminAnalytics() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Análises & Gráficos' }]} />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Análises & Gráficos</h1>
        <p className="text-sm text-slate-500">Visão analítica completa da plataforma</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader title="Clientes por Conformidade NIS2" subtitle="Distribuição atual" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={STATUS_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {STATUS_PIE.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {STATUS_PIE.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                <span className="font-mono text-slate-500">{s.value} clientes</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Top 5 por Incidentes" subtitle="Últimos 90 dias" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={TOP_INCIDENTS} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={88} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="incidentes" fill="#2563eb" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardHeader title="Utilizadores por Perfil" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={USERS_BY_PROFILE} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {USERS_BY_PROFILE.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {USERS_BY_PROFILE.map((u) => (
              <div key={u.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: u.color }} />{u.name}</span>
                <span className="font-mono text-slate-500">{u.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Incidentes — Tendência" subtitle="Abertos vs. resolvidos · últimos 6 meses" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={INCIDENT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="abertos" stroke="#dc2626" strokeWidth={2} dot={false} name="Abertos" />
              <Line dataKey="resolvidos" stroke="#16a34a" strokeWidth={2} dot={false} name="Resolvidos" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardHeader title="Documentos Submetidos" subtitle="Por mês, todos os clientes" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DOCS_BY_MONTH}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="docs" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <CardHeader title="Pedidos / Tickets por Estado"
          action={<span className="text-xs text-slate-400 font-mono">Tempo médio de resolução: 4,2 dias</span>}
        />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={TICKETS_BY_STATUS}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {TICKETS_BY_STATUS.map((e) => <Cell key={e.name} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── DOCUMENTOS (ADMIN) ────────────────────────────────────────────────────────
const ALL_DOCS = [
  { id: 1, name: 'Relatório NIS2 Q2 2025.pdf', client: 'TechCorp Portugal', type: 'Relatório NIS2', conf: 'Confidencial', status: 'Aprovado', date: '2025-06-10', size: '2,4 MB', manager: 'Carlos Mendes' },
  { id: 2, name: 'Política de Segurança v3.docx', client: 'Banco Norte', type: 'Política', conf: 'Interno', status: 'Rascunho', date: '2025-06-08', size: '1,1 MB', manager: 'Sofia Pinto' },
  { id: 3, name: 'Relatório PenTest Q1.pdf', client: 'Saúde Digital', type: 'Relatório de PenTest', conf: 'Restrito', status: 'Aprovado', date: '2025-06-05', size: '5,7 MB', manager: 'Carlos Mendes' },
  { id: 4, name: 'Inventário de Ativos.xlsx', client: 'EnergiaPT', type: 'Inventário de Ativos', conf: 'Interno', status: 'Em Revisão', date: '2025-06-01', size: '890 KB', manager: 'Rafael Torres' },
  { id: 5, name: 'Avaliação de Risco 2025.pdf', client: 'Logística Sul', type: 'Avaliação de Risco', conf: 'Confidencial', status: 'Aprovado', date: '2025-05-28', size: '3,2 MB', manager: 'Sofia Pinto' },
  { id: 6, name: 'Plano de Continuidade.docx', client: 'TechCorp Portugal', type: 'Continuidade', conf: 'Restrito', status: 'Em Revisão', date: '2025-05-20', size: '1,8 MB', manager: 'Carlos Mendes' },
];

export function AdminDocuments() {
  const [search, setSearch] = useState('');
  const filtered = ALL_DOCS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.client.toLowerCase().includes(search.toLowerCase())
  );
  const confVariant = (c: string) => c === 'Restrito' ? 'danger' : c === 'Confidencial' ? 'warning' : 'neutral';
  const statusVariant = (s: string) => s === 'Aprovado' ? 'success' : s === 'Rascunho' ? 'neutral' : 'warning';

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Documentos' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Documentos</h1>
          <p className="text-sm text-slate-500">Todos os documentos da plataforma — {ALL_DOCS.length} ficheiros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download size={14} /> Exportar</Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total de Documentos" value={String(ALL_DOCS.length)} icon={FileText} color="blue" />
        <StatCard label="Aprovados" value={String(ALL_DOCS.filter(d => d.status === 'Aprovado').length)} icon={CheckCircle} color="green" />
        <StatCard label="Em Revisão" value={String(ALL_DOCS.filter(d => d.status === 'Em Revisão').length)} icon={AlertCircle} color="amber" />
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome ou cliente..." />
        </div>
        <Table headers={['Nome', 'Cliente', 'Tipo', 'Confidencialidade', 'Estado', 'Gestor', 'Data', 'Tamanho', '']}>
          {filtered.map((d) => (
            <Tr key={d.id}>
              <Td><div className="flex items-center gap-2"><FileText size={13} className="text-blue-500 shrink-0" /><span className="text-xs font-medium text-slate-800">{d.name}</span></div></Td>
              <Td>{d.client}</Td>
              <Td>{d.type}</Td>
              <Td><Badge variant={confVariant(d.conf) as 'danger' | 'warning' | 'neutral'}>{d.conf}</Badge></Td>
              <Td><Badge variant={statusVariant(d.status) as 'success' | 'neutral' | 'warning'}>{d.status}</Badge></Td>
              <Td>{d.manager}</Td>
              <Td mono>{d.date}</Td>
              <Td mono>{d.size}</Td>
              <Td><Download size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-base" /></Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={filtered.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>
    </div>
  );
}

// ── INCIDENTES (ADMIN) ────────────────────────────────────────────────────────
const ALL_INCIDENTS = [
  { id: 'INC-0047', client: 'Banco Norte', title: 'Tentativa de acesso não autorizado à VPN', severity: 'Crítico', status: 'Aberto', date: '2025-06-10', manager: 'Carlos Mendes' },
  { id: 'INC-0046', client: 'TechCorp Portugal', title: 'Campanha de phishing detetada', severity: 'Alto', status: 'Em Progresso', date: '2025-06-09', manager: 'Carlos Mendes' },
  { id: 'INC-0045', client: 'Saúde Digital', title: 'Malware encontrado na estação de trabalho #12', severity: 'Médio', status: 'Resolvido', date: '2025-06-07', manager: 'Sofia Pinto' },
  { id: 'INC-0044', client: 'EnergiaPT', title: 'Ataque DDoS ao site público', severity: 'Alto', status: 'Resolvido', date: '2025-06-04', manager: 'Carlos Mendes' },
  { id: 'INC-0043', client: 'TechCorp Portugal', title: 'Tentativa de exfiltração de dados por USB', severity: 'Baixo', status: 'Fechado', date: '2025-06-01', manager: 'Carlos Mendes' },
  { id: 'INC-0042', client: 'Logística Sul', title: 'Acesso não autorizado a sistema de faturação', severity: 'Alto', status: 'Aberto', date: '2025-05-30', manager: 'Sofia Pinto' },
  { id: 'INC-0041', client: 'Banco Norte', title: 'Scan de portas detetado na DMZ', severity: 'Médio', status: 'Fechado', date: '2025-05-28', manager: 'Carlos Mendes' },
];

export function AdminIncidents() {
  const [search, setSearch] = useState('');
  const filtered = ALL_INCIDENTS.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.client.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase())
  );
  const sevVariant = (s: string) => s === 'Crítico' ? 'danger' : s === 'Alto' ? 'warning' : s === 'Médio' ? 'info' : 'neutral';
  const statVariant = (s: string) => s === 'Aberto' ? 'danger' : s === 'Em Progresso' ? 'warning' : s === 'Resolvido' ? 'success' : 'neutral';

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Incidentes' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Incidentes</h1>
          <p className="text-sm text-slate-500">Todos os incidentes da plataforma</p>
        </div>
        <Button variant="outline"><Download size={14} /> Exportar</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={String(ALL_INCIDENTS.length)} icon={AlertCircle} color="blue" />
        <StatCard label="Abertos" value={String(ALL_INCIDENTS.filter(i => i.status === 'Aberto').length)} icon={AlertCircle} color="red" />
        <StatCard label="Em Progresso" value={String(ALL_INCIDENTS.filter(i => i.status === 'Em Progresso').length)} icon={Clock} color="amber" />
        <StatCard label="Resolvidos" value={String(ALL_INCIDENTS.filter(i => i.status === 'Resolvido').length)} icon={CheckCircle} color="green" />
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar incidentes, clientes, ID..." />
        </div>
        <Table headers={['ID', 'Título', 'Cliente', 'Gravidade', 'Estado', 'Gestor', 'Data', '']}>
          {filtered.map((inc) => (
            <Tr key={inc.id}>
              <Td mono>{inc.id}</Td>
              <Td><span className="font-medium text-slate-800 text-xs">{inc.title}</span></Td>
              <Td>{inc.client}</Td>
              <Td><Badge variant={sevVariant(inc.severity) as 'danger' | 'warning' | 'info' | 'neutral'}>{inc.severity}</Badge></Td>
              <Td><Badge variant={statVariant(inc.status) as 'danger' | 'warning' | 'success' | 'neutral'}>{inc.status}</Badge></Td>
              <Td>{inc.manager}</Td>
              <Td mono>{inc.date}</Td>
              <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-base" /></Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={filtered.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>
    </div>
  );
}

// ── CONTEÚDO DO SITE ──────────────────────────────────────────────────────────
export function AdminSiteContent() {
  const [activeTab, setActiveTab] = useState<'hero' | 'services' | 'about' | 'news'>('hero');
  const tabs = [
    { id: 'hero', label: 'Hero / Página Inicial', icon: Image },
    { id: 'services', label: 'Serviços', icon: Globe2 },
    { id: 'about', label: 'Sobre Nós', icon: Type },
    { id: 'news', label: 'Artigos / Notícias', icon: Newspaper },
  ] as const;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Conteúdo do Site' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Conteúdo do Site</h1>
          <p className="text-sm text-slate-500">Gestão do conteúdo do website público</p>
        </div>
        <Button><Save size={14} /> Guardar Alterações</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-base border-b-2 -mb-px whitespace-nowrap ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'hero' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Texto Principal" />
            <div className="space-y-4">
              <Input label="Título" defaultValue="Segurança Digital para um Mundo Conectado" />
              <Input label="Subtítulo" defaultValue="Proteja a sua empresa contra ameaças digitais e garanta conformidade com as diretivas europeias de cibersegurança." />
              <Input label="CTA Primário" defaultValue="Explorar Serviços" />
              <Input label="CTA Secundário" defaultValue="Agendar Demo" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Métricas em Destaque" />
            <div className="space-y-3">
              {[['150+', 'Clientes Protegidos'], ['99,9%', 'SLA Disponibilidade'], ['24/7', 'SOC Ativo'], ['12+', 'Anos de Experiência']].map(([v, l]) => (
                <div key={l} className="grid grid-cols-2 gap-3">
                  <Input label="Valor" defaultValue={v} />
                  <Input label="Legenda" defaultValue={l} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          {[
            { title: 'Centro de Operações de Segurança (SOC)', price: 'A partir de 1.200€/mês' },
            { title: 'Programa de Conformidade NIS2', price: 'A partir de 3.500€' },
            { title: 'Testes de Penetração', price: 'A partir de 2.800€' },
            { title: 'Avaliação de Risco', price: 'A partir de 1.800€' },
          ].map((s, i) => (
            <Card key={i}>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome do Serviço" defaultValue={s.title} />
                <Input label="Preço" defaultValue={s.price} />
              </div>
            </Card>
          ))}
          <Button variant="secondary"><Plus size={14} /> Adicionar Serviço</Button>
        </div>
      )}

      {activeTab === 'about' && (
        <Card>
          <CardHeader title="Sobre a CiberBoxSecur" />
          <div className="space-y-4">
            <Textarea label="Descrição Principal" defaultValue="A CiberBoxSecur foi fundada por uma equipa de veteranos de cibersegurança do CNCS e do setor bancário português. Prestamos serviços de segurança de nível empresarial a organizações em Portugal e na UE." />
            <div className="grid lg:grid-cols-3 gap-4">
              {['Dr. Paulo Ferreira — CEO', 'Eng. Sofia Leal — CTO', 'Dra. Mariana Costa — Conformidade'].map((m) => (
                <Input key={m} label="Membro da Equipa" defaultValue={m} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button><Plus size={14} /> Novo Artigo</Button>
          </div>
          {[
            { title: 'Diretiva NIS2: O que as Empresas Portuguesas Devem Fazer', cat: 'Conformidade', date: '12 Jun 2025' },
            { title: 'Ataques de Ransomware na Saúde Portuguesa: Balanço de 2024', cat: 'Intel. de Ameaças', date: '28 Mai 2025' },
            { title: 'CiberBoxSecur Obtém Recertificação ISO/IEC 27001:2022', cat: 'Notícias da Empresa', date: '10 Mai 2025' },
          ].map((a, i) => (
            <Card key={i}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Newspaper size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input label="Título" defaultValue={a.title} />
                  <Input label="Categoria" defaultValue={a.cat} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-base"><Edit size={13} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-600 transition-base"><Trash2 size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GESTÃO DE UTILIZADORES ────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: 'Ana Rodrigues', email: 'ana.rodrigues@ciberboxsecur.pt', role: 'Administrador', status: 'Ativo', last: '2025-06-12 09:42', created: '2022-01-15' },
  { id: 2, name: 'Carlos Mendes', email: 'carlos.mendes@ciberboxsecur.pt', role: 'Gestor', status: 'Ativo', last: '2025-06-12 10:18', created: '2022-03-10' },
  { id: 3, name: 'Sofia Pinto', email: 'sofia.pinto@ciberboxsecur.pt', role: 'Gestor', status: 'Ativo', last: '2025-06-11 14:30', created: '2023-06-01' },
  { id: 4, name: 'Rafael Torres', email: 'rafael.torres@ciberboxsecur.pt', role: 'Gestor', status: 'Inativo', last: '2025-05-20 11:00', created: '2021-08-20' },
  { id: 5, name: 'TechCorp Portugal', email: 'it@techcorp.pt', role: 'Cliente', status: 'Ativo', last: '2025-06-12 08:55', created: '2023-02-14' },
  { id: 6, name: 'Banco Norte', email: 'sec@banconorte.pt', role: 'Cliente', status: 'Ativo', last: '2025-06-10 16:40', created: '2022-09-30' },
];

export function AdminUsers({ setPage }: { setPage: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleRowClick(u: typeof USERS[0]) {
    if (u.role === 'Cliente') setPage('admin-user-client');
    else if (u.role === 'Gestor') setPage('admin-user-manager');
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Gestão de Utilizadores' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Gestão de Utilizadores</h1>
          <p className="text-sm text-slate-500">{USERS.length} utilizadores registados · Clique num gestor ou cliente para ver detalhes</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={14} /> Adicionar Utilizador</Button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar utilizadores..." />
          </div>
          <select className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
            <option>Todos os Perfis</option><option>Administrador</option><option>Gestor</option><option>Cliente</option>
          </select>
          <select className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
            <option>Todos os Estados</option><option>Ativo</option><option>Inativo</option>
          </select>
        </div>
        <Table headers={['Utilizador', 'Email', 'Perfil', 'Estado', 'Último Acesso', 'Criado em', '']}>
          {filtered.map((u) => {
            const clickable = u.role === 'Gestor' || u.role === 'Cliente';
            return (
              <Tr key={u.id} onClick={clickable ? () => handleRowClick(u) : undefined}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.role === 'Administrador' ? 'bg-purple-600' : u.role === 'Gestor' ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800 text-xs">{u.name}</span>
                  </div>
                </Td>
                <Td mono>{u.email}</Td>
                <Td>
                  <Badge variant={u.role === 'Administrador' ? 'purple' : u.role === 'Gestor' ? 'info' : 'success'}>
                    {u.role}
                  </Badge>
                </Td>
                <Td><Badge variant={u.status === 'Ativo' ? 'success' : 'neutral'}>{u.status}</Badge></Td>
                <Td mono>{u.last}</Td>
                <Td mono>{u.created}</Td>
                <Td>
                  <div className="flex gap-1">
                    {clickable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(u); }}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-base"
                        title="Ver detalhes"
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    <button className="p-1 text-slate-400 hover:text-blue-600 transition-base" title="Editar"><Edit size={13} /></button>
                    <button className="p-1 text-slate-400 hover:text-red-600 transition-base" title="Eliminar"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={filtered.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adicionar Novo Utilizador">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" placeholder="Ana" />
            <Input label="Apelido" placeholder="Rodrigues" />
          </div>
          <Input label="Email" type="email" placeholder="ana@ciberboxsecur.pt" />
          <Select label="Perfil">
            <option>Gestor</option><option>Administrador</option><option>Cliente</option>
          </Select>
          <Select label="Estado">
            <option>Ativo</option><option>Inativo</option>
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={() => setShowModal(false)}>Criar Utilizador</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── DETALHE DO GESTOR (visto pelo admin) ──────────────────────────────────────
export function AdminManagerDetail({ setPage }: { setPage: (p: Page) => void }) {
  const manager = {
    name: 'Carlos Mendes', email: 'carlos.mendes@ciberboxsecur.pt',
    phone: '+351 21 000 0002', role: 'Gestor de Segurança Sénior',
    status: 'Ativo', created: '2022-03-10', last: '2025-06-12 10:18',
    certifications: ['CISSP', 'ISO 27001 Lead Auditor', 'CEH'],
  };
  const assignedClients = [
    { name: 'TechCorp Portugal, S.A.', sector: 'Tecnologia', nis2: 'Em Conformidade', incidents: 3, since: '2023-02-14' },
    { name: 'Saúde Digital, Lda.', sector: 'Saúde', nis2: 'Problemas Pendentes', incidents: 9, since: '2021-06-05' },
    { name: 'RetailPT Logística', sector: 'Logística', nis2: 'Em Avaliação', incidents: 2, since: '2024-03-20' },
  ];
  const recentActivity = [
    { text: 'Estado NIS2 do cliente TechCorp atualizado', time: '2025-06-12 10:18', type: 'atualização' },
    { text: 'Incidente INC-0047 fechado — TechCorp Portugal', time: '2025-06-11 17:40', type: 'incidente' },
    { text: 'Documento "Relatório PenTest Q1" carregado', time: '2025-06-11 14:22', type: 'documento' },
    { text: 'Reunião de revisão NIS2 com Saúde Digital', time: '2025-06-10 11:00', type: 'reunião' },
    { text: 'Novo pedido TK-0234 atribuído — TechCorp', time: '2025-06-10 09:15', type: 'ticket' },
  ];

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Administrador' },
        { label: 'Gestão de Utilizadores', onClick: () => setPage('admin-users') },
        { label: manager.name },
      ]} />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white font-display shrink-0">
          {manager.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-display">{manager.name}</h1>
            <Badge variant="info">Gestor</Badge>
            <Badge variant={manager.status === 'Ativo' ? 'success' : 'neutral'}>{manager.status}</Badge>
          </div>
          <p className="text-sm text-slate-500 mb-2">{manager.role}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Mail size={11} />{manager.email}</span>
            <span className="flex items-center gap-1.5"><Phone size={11} />{manager.phone}</span>
            <span className="flex items-center gap-1.5"><Calendar size={11} />Desde {manager.created}</span>
            <span className="flex items-center gap-1.5"><Clock size={11} />Último acesso {manager.last}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm"><Edit size={13} /> Editar</Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={13} /> Desativar</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Clientes Atribuídos" value={String(assignedClients.length)} icon={Building2} color="blue" />
        <StatCard label="Incidentes Abertos" value="4" icon={AlertCircle} color="red" />
        <StatCard label="Pedidos Ativos" value="7" icon={MessageSquare} color="amber" />
        <StatCard label="Docs. este Mês" value="12" icon={FileText} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clientes atribuídos */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding={false}>
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 font-display">Clientes Atribuídos</h3>
            </div>
            <Table headers={['Cliente', 'Setor', 'NIS2', 'Incidentes', 'Desde', '']}>
              {assignedClients.map((c) => (
                <Tr key={c.name} onClick={() => setPage('admin-user-client')}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{c.name.charAt(0)}</div>
                      <span className="font-medium text-slate-800 text-xs">{c.name}</span>
                    </div>
                  </Td>
                  <Td>{c.sector}</Td>
                  <Td><Badge variant={c.nis2 === 'Em Conformidade' ? 'success' : c.nis2 === 'Em Avaliação' ? 'warning' : 'danger'}>{c.nis2}</Badge></Td>
                  <Td mono>{c.incidents}</Td>
                  <Td mono>{c.since}</Td>
                  <Td><ChevronRight size={13} className="text-slate-300" /></Td>
                </Tr>
              ))}
            </Table>
          </Card>

          {/* Certificações */}
          <Card>
            <CardHeader title="Certificações e Competências" />
            <div className="flex flex-wrap gap-2">
              {manager.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                  <CheckCircle size={11} />{cert}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Atividade recente */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Atividade Recente" action={<Activity size={13} className="text-slate-400" />} />
            <div className="space-y-3">
              {recentActivity.map((a, i) => {
                const colors: Record<string, string> = {
                  atualização: 'bg-amber-50 text-amber-600',
                  incidente: 'bg-red-50 text-red-600',
                  documento: 'bg-blue-50 text-blue-600',
                  reunião: 'bg-purple-50 text-purple-600',
                  ticket: 'bg-green-50 text-green-600',
                };
                return (
                  <div key={i} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${colors[a.type] || 'bg-slate-50 text-slate-500'}`}>{a.type}</span>
                    <div>
                      <p className="text-xs text-slate-700 leading-snug">{a.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Desempenho" subtitle="Últimos 30 dias" />
            <div className="space-y-3">
              {[
                { label: 'Incidentes Resolvidos', value: 11, max: 15 },
                { label: 'Pedidos Fechados', value: 18, max: 25 },
                { label: 'Relatórios Emitidos', value: 6, max: 8 },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{m.label}</span>
                    <span className="font-mono text-slate-400">{m.value}/{m.max}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(m.value / m.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── PERFIS E PERMISSÕES ───────────────────────────────────────────────────────
export function AdminPermissions() {
  const permissions = [
    { module: 'Painel de Controlo', admin: true, manager: true, client: true },
    { module: 'Gestão de Utilizadores', admin: true, manager: false, client: false },
    { module: 'Gestão de Clientes', admin: true, manager: true, client: false },
    { module: 'Incidentes (ver todos)', admin: true, manager: true, client: false },
    { module: 'Incidentes (apenas próprios)', admin: true, manager: true, client: true },
    { module: 'Documentos (carregar)', admin: true, manager: true, client: true },
    { module: 'Documentos (eliminar)', admin: true, manager: true, client: false },
    { module: 'Avaliação NIS2', admin: true, manager: true, client: false },
    { module: 'Testes de Penetração', admin: true, manager: true, client: false },
    { module: 'Relatórios', admin: true, manager: true, client: true },
    { module: 'Registos de Atividade', admin: true, manager: false, client: false },
    { module: 'Importação Excel', admin: true, manager: true, client: false },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Perfis e Permissões' }]} />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Perfis e Permissões</h1>
        <p className="text-sm text-slate-500">Matriz de controlo de acesso por perfil</p>
      </div>
      <Card padding={false}>
        <Table headers={['Módulo / Funcionalidade', 'Administrador', 'Gestor', 'Cliente']}>
          {permissions.map((p) => (
            <Tr key={p.module}>
              <Td><span className="text-xs font-medium text-slate-800">{p.module}</span></Td>
              <Td>
                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${p.admin ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {p.admin ? <CheckCircle size={13} /> : <span className="text-xs font-mono">—</span>}
                </span>
              </Td>
              <Td>
                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${p.manager ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {p.manager ? <CheckCircle size={13} /> : <span className="text-xs font-mono">—</span>}
                </span>
              </Td>
              <Td>
                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${p.client ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {p.client ? <CheckCircle size={13} /> : <span className="text-xs font-mono">—</span>}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── GESTÃO DE CLIENTES ────────────────────────────────────────────────────────
const CLIENTS = [
  { id: 1, name: 'TechCorp Portugal, S.A.', sector: 'Tecnologia', manager: 'Carlos Mendes', nis2: 'Em Conformidade', incidents: 14, risk: 'Baixo', contact: 'João Antunes', since: '2023-02-14', status: 'Ativo' },
  { id: 2, name: 'Banco Norte, S.A.', sector: 'Financeiro', manager: 'Sofia Pinto', nis2: 'Em Avaliação', incidents: 11, risk: 'Médio', contact: 'Filipa Sousa', since: '2022-09-30', status: 'Ativo' },
  { id: 3, name: 'Saúde Digital, Lda.', sector: 'Saúde', manager: 'Carlos Mendes', nis2: 'Problemas Pendentes', incidents: 9, risk: 'Alto', contact: 'Nuno Ferreira', since: '2021-06-05', status: 'Ativo' },
  { id: 4, name: 'EnergiaPT, S.A.', sector: 'Energia', manager: 'Rafael Torres', nis2: 'Em Conformidade', incidents: 7, risk: 'Baixo', contact: 'Lara Costa', since: '2020-11-22', status: 'Ativo' },
  { id: 5, name: 'Logística Sul, Lda.', sector: 'Logística', manager: 'Sofia Pinto', nis2: 'Em Avaliação', incidents: 5, risk: 'Médio', contact: 'Rui Duarte', since: '2024-01-08', status: 'Ativo' },
  { id: 6, name: 'RetailPT Comércio, S.A.', sector: 'Retalho', manager: 'Carlos Mendes', nis2: 'Em Conformidade', incidents: 3, risk: 'Baixo', contact: 'Ana Gomes', since: '2023-07-15', status: 'Ativo' },
  { id: 7, name: 'Construtora Atlântico', sector: 'Construção', manager: 'Sofia Pinto', nis2: 'Em Avaliação', incidents: 2, risk: 'Baixo', contact: 'Pedro Lima', since: '2024-03-20', status: 'Inativo' },
];

function riskVariant(r: string) { return r === 'Alto' ? 'danger' : r === 'Médio' ? 'warning' : 'success'; }
function nis2Variant(n: string) { return n === 'Em Conformidade' ? 'success' : n === 'Em Avaliação' ? 'warning' : 'danger'; }

export function AdminClients({ setPage }: { setPage: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const [filterManager, setFilterManager] = useState('Todos');
  const [filterNis2, setFilterNis2] = useState('Todos');
  const [showModal, setShowModal] = useState(false);

  const managers = ['Todos', ...Array.from(new Set(CLIENTS.map(c => c.manager)))];

  const filtered = CLIENTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase());
    const matchManager = filterManager === 'Todos' || c.manager === filterManager;
    const matchNis2 = filterNis2 === 'Todos' || c.nis2 === filterNis2;
    return matchSearch && matchManager && matchNis2;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Gestão de Clientes' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Gestão de Clientes</h1>
          <p className="text-sm text-slate-500">{CLIENTS.length} clientes em gestão — {CLIENTS.filter(c => c.status === 'Ativo').length} ativos</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={14} /> Adicionar Cliente</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de Clientes" value={String(CLIENTS.length)} icon={Building2} color="blue" />
        <StatCard label="Em Conformidade NIS2" value={String(CLIENTS.filter(c => c.nis2 === 'Em Conformidade').length)} icon={CheckCircle} color="green" />
        <StatCard label="Em Avaliação" value={String(CLIENTS.filter(c => c.nis2 === 'Em Avaliação').length)} icon={TrendingUp} color="amber" />
        <StatCard label="Problemas Pendentes" value={String(CLIENTS.filter(c => c.nis2 === 'Problemas Pendentes').length)} icon={AlertCircle} color="red" />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar clientes, contactos, setor..." />
          </div>
          <select
            value={filterManager} onChange={e => setFilterManager(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700"
          >
            {managers.map(m => <option key={m}>{m}</option>)}
          </select>
          <select
            value={filterNis2} onChange={e => setFilterNis2(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700"
          >
            <option>Todos</option>
            <option>Em Conformidade</option>
            <option>Em Avaliação</option>
            <option>Problemas Pendentes</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 border border-slate-300 rounded-md hover:bg-slate-50 transition-base">
            <Download size={12} /> Exportar
          </button>
        </div>

        <Table headers={['Cliente', 'Setor', 'Contacto', 'Gestor', 'NIS2', 'Risco', 'Incidentes', 'Desde', '']}>
          {filtered.map((c) => (
            <Tr key={c.id} onClick={() => setPage('admin-client-detail')}>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">{c.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-slate-800 text-xs">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.status === 'Inativo' ? '— Inativo' : ''}</p>
                  </div>
                </div>
              </Td>
              <Td>{c.sector}</Td>
              <Td>{c.contact}</Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{c.manager.charAt(0)}</div>
                  <span className="text-xs text-slate-600">{c.manager}</span>
                </div>
              </Td>
              <Td><Badge variant={nis2Variant(c.nis2) as 'success' | 'warning' | 'danger'}>{c.nis2}</Badge></Td>
              <Td><Badge variant={riskVariant(c.risk) as 'success' | 'warning' | 'danger'}>{c.risk}</Badge></Td>
              <Td mono>{c.incidents}</Td>
              <Td mono>{c.since}</Td>
              <Td>
                <button
                  onClick={(e) => { e.stopPropagation(); setPage('admin-client-detail'); }}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-base"
                  title="Ver detalhes"
                >
                  <Eye size={13} />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={filtered.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adicionar Novo Cliente">
        <div className="space-y-4">
          <Input label="Nome da Organização" placeholder="Empresa, S.A." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="NIF" placeholder="500000000" />
            <Input label="Setor" placeholder="Tecnologia" />
          </div>
          <Input label="Email de Contacto" type="email" placeholder="it@empresa.pt" />
          <Select label="Gestor Atribuído">
            {managers.filter(m => m !== 'Todos').map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={() => setShowModal(false)}>Criar Cliente</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── REGISTOS DE ATIVIDADE ─────────────────────────────────────────────────────
const LOGS = [
  { id: 1, user: 'Ana Rodrigues', action: 'Utilizador sofia.pinto criado', ip: '10.0.0.1', time: '2025-06-12 10:42:13', type: 'criação' },
  { id: 2, user: 'Carlos Mendes', action: 'Estado NIS2 do cliente TechCorp atualizado', ip: '10.0.0.8', time: '2025-06-12 10:18:05', type: 'atualização' },
  { id: 3, user: 'Sofia Pinto', action: 'Documento "Relatório Anual 2025" carregado', ip: '10.0.0.12', time: '2025-06-12 09:55:30', type: 'carregamento' },
  { id: 4, user: 'Sistema', action: 'Email de redefinição de palavra-passe enviado para rafael.torres', ip: 'sistema', time: '2025-06-12 09:30:00', type: 'sistema' },
  { id: 5, user: 'TechCorp Portugal', action: 'Pedido #TK-0234 submetido', ip: '185.92.1.10', time: '2025-06-12 09:15:22', type: 'criação' },
  { id: 6, user: 'Carlos Mendes', action: 'Incidente INC-0047 fechado', ip: '10.0.0.8', time: '2025-06-11 17:40:11', type: 'atualização' },
  { id: 7, user: 'Ana Rodrigues', action: 'Lista de utilizadores exportada para CSV', ip: '10.0.0.1', time: '2025-06-11 16:22:45', type: 'exportação' },
  { id: 8, user: 'Banco Norte', action: 'Relatório de conformidade NIS2 consultado', ip: '192.168.5.4', time: '2025-06-11 15:10:00', type: 'visualização' },
];

const logVariant: Record<string, 'info' | 'warning' | 'success' | 'neutral' | 'purple'> = {
  criação: 'info', atualização: 'warning', carregamento: 'success',
  sistema: 'neutral', exportação: 'purple', visualização: 'neutral',
};

export function AdminLogs() {
  const [search, setSearch] = useState('');
  const filtered = LOGS.filter(l =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Breadcrumb items={[{ label: 'Administrador' }, { label: 'Registos de Atividade' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Registos de Atividade</h1>
          <p className="text-sm text-slate-500">Trilha de auditoria completa de todas as ações na plataforma</p>
        </div>
        <Button variant="outline"><Download size={14} /> Exportar CSV</Button>
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar registos..." />
          </div>
          <input type="date" className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700" />
          <input type="date" className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700" />
        </div>
        <Table headers={['Data/Hora', 'Utilizador', 'Ação', 'Endereço IP', 'Tipo']}>
          {filtered.map((l) => (
            <Tr key={l.id}>
              <Td mono>{l.time}</Td>
              <Td><span className="font-medium text-slate-800 text-xs">{l.user}</span></Td>
              <Td>{l.action}</Td>
              <Td mono>{l.ip}</Td>
              <Td><Badge variant={logVariant[l.type] || 'neutral'}>{l.type}</Badge></Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={filtered.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>
    </div>
  );
}
