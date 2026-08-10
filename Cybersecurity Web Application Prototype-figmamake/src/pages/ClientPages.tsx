import { useState } from 'react';
import type { Page } from '../types';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  FileText, AlertTriangle, CheckSquare, MessageSquare, ClipboardList,
  ChevronRight, Plus, Download, Eye, Shield, Mail, Phone, Calendar,
  CheckCircle, Clock, Send, Search, Filter, X, Upload, TestTube,
  BarChart3, Activity, Bell, Home,
} from 'lucide-react';
import {
  Card, CardHeader, Badge, Button, SearchInput,
  Table, Tr, Td, Modal, Input, Select, Textarea, Breadcrumb,
} from '../components/DesignSystem';

// ── Dados ─────────────────────────────────────────────────────────────────────
const COMPANY = {
  name: 'TechCorp Portugal, S.A.', initials: 'TC', status: 'Conta ativa',
  email: 'seguranca@techcorp.pt', phone: '+351 215 000 100', since: '20/05/2024',
  sector: 'Tecnologia', nif: '500123456',
};
const SECURITY_MGR = { name: 'Carlos Mendes', email: 'c.mendes@techcorp.pt', phone: '+351 916 000 004', role: 'Resp. Segurança' };
const PERM_CONTACT = { name: 'Sofia Lopes', email: 's.lopes@techcorp.pt', phone: '+351 917 000 005', role: 'Contacto Permanente' };

const DOCS = [
  { id: 1, name: 'Política de Segurança da Informação NIS2', desc: 'Política geral de segurança conforme diretiva NIS2...', type: 'Política', owner: 'TechCorp Portugal', version: 'v3.1', updated: '2025-02-15', status: 'Ativo', expired: false },
  { id: 2, name: 'Relatório de Pentest — Infraestrutura Web', desc: 'Relatório completo do teste de intrusão à infraestrutura web...', type: 'Pentest', owner: 'TechCorp Portugal', version: 'v1.0', updated: '2025-01-30', status: 'Ativo', expired: false },
  { id: 3, name: 'Plano de Continuidade de Negócio', desc: 'BCP conforme requisitos NIS2 artigo 21...', type: 'Política', owner: 'Retail Group SA', version: 'v2.0', updated: '2025-03-01', status: 'Em Revisão', expired: false },
  { id: 4, name: 'Contrato de Prestação de Serviços', desc: 'Contrato de cibersegurança gerida 2024-2026...', type: 'Contrato', owner: 'TechCorp Portugal', version: 'v1.2', updated: '2024-05-20', status: 'Expirado', expired: true },
  { id: 5, name: 'Relatório NIS2 Q2 2025', desc: 'Avaliação de conformidade NIS2 segundo trimestre...', type: 'NIS2', owner: 'TechCorp Portugal', version: 'v1.0', updated: '2025-06-10', status: 'Ativo', expired: false },
  { id: 6, name: 'Auditoria Interna — Controlo de Acessos', desc: 'Resultado da auditoria ao sistema de controlo de acessos...', type: 'Auditoria', owner: 'TechCorp Portugal', version: 'v1.0', updated: '2025-04-15', status: 'Ativo', expired: false },
];

const PENTESTS = [
  { id: 'PT-2025-003', name: 'Aplicação Web — Portal de Cliente', type: 'Externo', status: 'Agendado', date: '2025-07-02', findings: null, critical: 0, analyst: 'Sofia Leal' },
  { id: 'PT-2025-002', name: 'Infraestrutura Interna — Perímetro', type: 'Interno', status: 'Concluído', date: '2025-04-15', findings: 12, critical: 1, analyst: 'Rui Fonseca' },
  { id: 'PT-2025-001', name: 'API REST — Sistema de Pagamentos', type: 'Externo', status: 'Concluído', date: '2025-02-10', findings: 8, critical: 0, analyst: 'Sofia Leal' },
];

const INCIDENTS = [
  { id: 'INC-0047', title: 'Ransomware — Servidores de Ficheiros', severity: 'Crítico', status: 'Resolvido', date: '2025-02-10', manager: 'Carlos Mendes' },
  { id: 'INC-0046', title: 'Acesso Não Autorizado — VPN', severity: 'Alto', status: 'Aberto', date: '2025-06-09', manager: 'Carlos Mendes' },
  { id: 'INC-0045', title: 'Campanha de Phishing Direcionada', severity: 'Médio', status: 'Resolvido', date: '2025-05-20', manager: 'Carlos Mendes' },
];

type Message = { from: 'client' | 'manager'; text: string; time: string };
const INITIAL_MESSAGES: Message[] = [
  { from: 'manager', text: 'Bom dia! O agendamento do pentest à aplicação web foi confirmado para 2 de julho às 10h00.', time: '2025-06-12 09:15' },
  { from: 'client', text: 'Obrigado pela confirmação. Vamos garantir que o ambiente está disponível.', time: '2025-06-12 09:42' },
  { from: 'manager', text: 'Perfeito. Por favor confirme também os IPs e URLs em âmbito até quinta-feira.', time: '2025-06-12 10:03' },
  { from: 'client', text: 'Confirmado. Envio a lista completa amanhã.', time: '2025-06-12 10:15' },
];

type Ticket = { id: string; title: string; status: string; priority: string; created: string };
const INITIAL_TICKETS: Ticket[] = [
  { id: 'TK-0234', title: 'Solicitar análise de vulnerabilidades ao servidor de produção', status: 'Aberto', priority: 'Alto', created: '2025-06-12' },
  { id: 'TK-0232', title: 'Acesso a relatório do incidente INC-0046', status: 'Resolvido', priority: 'Baixo', created: '2025-06-08' },
];

const CHART_TOOLTIP = { contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a' } };

// ── Helpers ───────────────────────────────────────────────────────────────────
function sevVariant(s: string): 'danger' | 'warning' | 'info' | 'neutral' {
  return s === 'Crítico' ? 'danger' : s === 'Alto' ? 'warning' : s === 'Médio' ? 'info' : 'neutral';
}
function statVariant(s: string): 'danger' | 'warning' | 'success' | 'neutral' {
  return s === 'Aberto' ? 'danger' : s === 'Em Progresso' ? 'warning' : s === 'Resolvido' ? 'success' : 'neutral';
}
function docStatVariant(s: string): 'success' | 'warning' | 'danger' | 'neutral' {
  return s === 'Ativo' ? 'success' : s === 'Em Revisão' ? 'warning' : s === 'Expirado' ? 'danger' : 'neutral';
}
function ptStatVariant(s: string): 'info' | 'success' | 'warning' {
  return s === 'Agendado' ? 'info' : s === 'Concluído' ? 'success' : 'warning';
}
function typeColor(t: string) {
  const m: Record<string, string> = {
    'Política': 'bg-blue-100 text-blue-700', 'Pentest': 'bg-purple-100 text-purple-700',
    'Contrato': 'bg-green-100 text-green-700', 'Auditoria': 'bg-amber-100 text-amber-700',
    'NIS2': 'bg-cyan-100 text-cyan-700', 'Relatório': 'bg-slate-100 text-slate-700',
  };
  return m[t] || 'bg-slate-100 text-slate-600';
}

// ── Security Score SVG ────────────────────────────────────────────────────────
function ScoreGauge({ score, size = 88 }: { score: number; size?: number }) {
  const r = (size / 2) * 0.75;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.1} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
          strokeDasharray={`${circ * score / 100} ${circ * (1 - score / 100)}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-slate-900 font-display" style={{ fontSize: size * 0.22 }}>{score}</span>
        <span className="font-semibold" style={{ fontSize: size * 0.13, color }}>{score >= 80 ? 'Bom' : score >= 60 ? 'Médio' : 'Crítico'}</span>
      </div>
    </div>
  );
}

// ── Company Header Card ───────────────────────────────────────────────────────
function CompanyHeader() {
  return (
    <Card className="mb-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white font-display shrink-0">
          {COMPANY.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-slate-900 font-display">{COMPANY.name}</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <CheckCircle size={10} />{COMPANY.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Mail size={11} />{COMPANY.email}</span>
            <span className="flex items-center gap-1"><Phone size={11} />{COMPANY.phone}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />Cliente desde {COMPANY.since}</span>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex flex-wrap gap-3 mt-4">
        {[
          { label: 'Documentos', value: '3/3', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Pentests ativos', value: '0/2', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Incidentes abertos', value: '1/3', bg: 'bg-red-50 text-red-700 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`flex flex-col items-center px-4 py-2 rounded-lg border text-xs ${s.bg}`}>
            <span className="text-lg font-bold font-display leading-none mb-0.5">{s.value}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Responsáveis */}
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {[SECURITY_MGR, PERM_CONTACT].map((p) => (
          <div key={p.name} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${p.role === 'Resp. Segurança' ? 'bg-blue-600' : 'bg-green-600'}`}>
              {p.role === 'Resp. Segurança' ? <Shield size={14} /> : p.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-mono">{p.role}</p>
              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-500 truncate">{p.email} · {p.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export function ClientDashboard({ setPage }: { setPage: (p: Page) => void }) {
  const secScore = 76;
  const nis2Score = 78;

  const kpis = [
    { label: 'Documentos', value: '6', sub: '1 expirado', color: 'blue', icon: FileText, page: 'cli-documents' as Page },
    { label: 'Findings totais', value: '20', sub: '1 crítico', color: 'purple', icon: Shield, page: 'cli-workspace' as Page },
    { label: 'Findings Críticos', value: '1', sub: 'requer ação', color: 'red', icon: AlertTriangle, page: 'cli-workspace' as Page },
    { label: 'Pentests', value: '3', sub: '1 agendado', color: 'indigo', icon: TestTube, page: 'cli-workspace' as Page },
    { label: 'Incidentes', value: '3', sub: '1 aberto', color: 'amber', icon: AlertTriangle, page: 'cli-workspace' as Page },
    { label: 'Score NIS2', value: `${nis2Score}%`, sub: 'Em Conformidade', color: 'green', icon: CheckSquare, page: 'cli-reports' as Page },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  };

  const recs = [
    { text: 'Renovar o contrato de prestação de serviços (expirado)', urgency: 'Urgente' },
    { text: 'Rever o Plano de Continuidade de Negócio — em revisão desde Mar 2025', urgency: 'Médio' },
    { text: 'Confirmar âmbito do PenTest agendado para 2 de julho', urgency: 'Ação' },
    { text: 'Corrigir finding crítico detetado no PenTest PT-2025-002', urgency: 'Urgente' },
  ];
  const recColor: Record<string, string> = {
    Urgente: 'bg-red-50 text-red-700 border-red-200',
    Médio: 'bg-amber-50 text-amber-700 border-amber-200',
    Ação: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Dashboard</h1>
          <p className="text-sm text-slate-500">{COMPANY.name} · {new Date().toLocaleDateString('pt-PT')}</p>
        </div>
        <button onClick={() => setPage('cli-workspace')} className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Área de Trabalho <ChevronRight size={13} />
        </button>
      </div>

      {/* Score + KPIs */}
      <div className="grid lg:grid-cols-4 gap-4 mb-5">
        {/* Score de segurança */}
        <Card className="flex flex-col items-center justify-center gap-2 py-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-mono">Score de Segurança</p>
          <ScoreGauge score={secScore} size={100} />
          <div className="w-full space-y-1.5 mt-1">
            {[
              { label: 'SSL / TLS', score: 95 }, { label: 'Aplicações', score: 70 },
              { label: 'Vulnerabilidades', score: 82 }, { label: 'Exposição', score: 45 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 w-24 truncate">{item.label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${item.score}%` }} />
                </div>
                <span className="font-mono text-slate-400 w-6 text-right">{item.score}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* KPI grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpis.map((k) => (
            <button key={k.label} onClick={() => setPage(k.page)}
              className={`flex flex-col items-start gap-1 p-4 rounded-lg border bg-white hover:shadow-md transition-all text-left ${colorMap[k.color]}`}>
              <div className="flex items-center justify-between w-full">
                <k.icon size={15} />
                <ChevronRight size={12} className="opacity-50" />
              </div>
              <span className="text-2xl font-bold font-display text-slate-900">{k.value}</span>
              <span className="text-xs font-medium text-slate-700">{k.label}</span>
              <span className="text-xs text-slate-400">{k.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Responsáveis */}
        <Card>
          <CardHeader title="Equipa de Segurança" />
          <div className="space-y-3">
            {[SECURITY_MGR, PERM_CONTACT].map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${p.role === 'Resp. Segurança' ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.role}</p>
                  <p className="text-xs text-blue-600 font-mono truncate">{p.email}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setPage('cli-workspace')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium pt-1 transition-colors">
              <MessageSquare size={12} /> Enviar Mensagem
            </button>
          </div>
        </Card>

        {/* Recomendações */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recomendações" subtitle="Ações pendentes identificadas" />
          <div className="space-y-2">
            {recs.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${recColor[r.urgency]}`}>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 ${recColor[r.urgency]}`}>{r.urgency}</span>
                <p className="text-slate-700 leading-snug">{r.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Documentos recentes + Incidentes recentes */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Documentos Recentes</h3>
            <button onClick={() => setPage('cli-documents')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {DOCS.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setPage('cli-documents')}>
                <FileText size={14} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{d.version} · {d.updated}</p>
                </div>
                <Badge variant={docStatVariant(d.status)}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Incidentes Recentes</h3>
            <button onClick={() => setPage('cli-workspace')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {INCIDENTS.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setPage('cli-workspace')}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${inc.status === 'Aberto' ? 'bg-red-500' : inc.status === 'Em Progresso' ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{inc.title}</p>
                  <p className="text-xs text-slate-400 font-mono">{inc.id} · {inc.date}</p>
                </div>
                <Badge variant={sevVariant(inc.severity)}>{inc.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÁREA DE TRABALHO
// ══════════════════════════════════════════════════════════════════════════════
export function ClientWorkspace({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<'resumo' | 'documentos' | 'pentests' | 'incidentes' | 'comunicacao'>('resumo');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [msgInput, setMsgInput] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', priority: 'Médio', desc: '' });

  const tabs = [
    { id: 'resumo', label: 'Resumo', icon: Activity },
    { id: 'documentos', label: `Documentos`, badge: DOCS.length, icon: FileText },
    { id: 'pentests', label: `Pentests`, badge: PENTESTS.length, icon: TestTube },
    { id: 'incidentes', label: `Incidentes`, badge: INCIDENTS.length, icon: AlertTriangle },
    { id: 'comunicacao', label: 'Comunicação', badge: messages.length, icon: MessageSquare },
  ] as const;

  function sendMessage() {
    if (!msgInput.trim()) return;
    setMessages(prev => [...prev, { from: 'client', text: msgInput, time: new Date().toLocaleTimeString('pt-PT') }]);
    setMsgInput('');
  }

  function submitTicket() {
    if (!newTicket.title.trim()) return;
    const id = `TK-0${235 + tickets.length}`;
    setTickets(prev => [{ id, title: newTicket.title, status: 'Aberto', priority: newTicket.priority, created: new Date().toISOString().slice(0, 10) }, ...prev]);
    setNewTicket({ title: '', priority: 'Médio', desc: '' });
    setShowTicketModal(false);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', onClick: () => setPage('cli-dashboard') }, { label: 'Área de Trabalho' }]} />

      <CompanyHeader />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-base border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} />
            {t.label}
            {'badge' in t && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-mono font-bold ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Resumo ── */}
      {tab === 'resumo' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total de documentos', value: String(DOCS.length), sub: `${DOCS.filter(d => d.status === 'Ativo').length} ativos`, icon: FileText, color: 'text-blue-600' },
              { label: 'Findings totais', value: '20', sub: '1 com críticos', icon: Shield, color: 'text-purple-600' },
              { label: 'Incidentes totais', value: String(INCIDENTS.length), sub: `${INCIDENTS.filter(i => i.status === 'Aberto').length} abertos`, icon: AlertTriangle, color: 'text-red-600' },
              { label: 'Mensagens trocadas', value: String(messages.length), sub: 'no histórico', icon: MessageSquare, color: 'text-green-600' },
            ].map((k) => (
              <Card key={k.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{k.label}</span>
                  <k.icon size={14} className={k.color} />
                </div>
                <span className={`text-3xl font-bold font-display ${k.color}`}>{k.value}</span>
                <span className="text-xs text-slate-400">{k.sub}</span>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card padding={false}>
              <div className="p-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800 font-display">Documentos recentes</h3></div>
              {DOCS.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setTab('documentos')}>
                  <FileText size={14} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{d.version} · {d.updated}</p>
                  </div>
                  <Badge variant={docStatVariant(d.status)}>{d.status}</Badge>
                </div>
              ))}
            </Card>
            <Card padding={false}>
              <div className="p-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800 font-display">Incidentes recentes</h3></div>
              {INCIDENTS.map((inc) => (
                <div key={inc.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setTab('incidentes')}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${inc.status === 'Aberto' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{inc.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{inc.date}</p>
                  </div>
                  <Badge variant={statVariant(inc.status)}>{inc.status}</Badge>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ── Documentos ── */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input placeholder="Pesquisar documentos..." className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400" />
            </div>
            <select className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
              <option>Todos os tipos</option><option>Política</option><option>Pentest</option><option>NIS2</option><option>Auditoria</option><option>Contrato</option>
            </select>
            <select className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
              <option>Todos os estados</option><option>Ativo</option><option>Em Revisão</option><option>Expirado</option>
            </select>
          </div>
          <Card padding={false}>
            <Table headers={['Documento', 'Tipo', 'Proprietário', 'Versão', 'Atualizado', 'Estado', 'Ações']}>
              {DOCS.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-800">{d.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{d.desc}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor(d.type)}`}>{d.type}</span></Td>
                  <Td>{d.owner}</Td>
                  <Td mono>{d.version}</Td>
                  <Td mono>{d.updated}</Td>
                  <Td><Badge variant={docStatVariant(d.status)}>{d.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button className="p-1 text-slate-400 hover:text-blue-600 transition-base" title="Ver"><Eye size={13} /></button>
                      <button className="p-1 text-slate-400 hover:text-blue-600 transition-base" title="Descarregar"><Download size={13} /></button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* ── Pentests ── */}
      {tab === 'pentests' && (
        <div className="space-y-4">
          {PENTESTS.map((pt) => (
            <Card key={pt.id}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pt.status === 'Agendado' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  <TestTube size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{pt.name}</p>
                    <Badge variant={ptStatVariant(pt.status)}>{pt.status}</Badge>
                    <Badge variant="neutral">{pt.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="font-mono">{pt.id}</span>
                    <span>Analista: {pt.analyst}</span>
                    <span>Data: {pt.date}</span>
                  </div>
                  {pt.findings !== null && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-slate-500">Findings:</span>
                      {pt.critical > 0 && <Badge variant="danger">{pt.critical} Crítico</Badge>}
                      <Badge variant="neutral">{pt.findings} total</Badge>
                    </div>
                  )}
                </div>
                {pt.status === 'Concluído' && (
                  <Button variant="outline" size="sm"><Eye size={12} /> Ver Relatório</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Incidentes ── */}
      {tab === 'incidentes' && (
        <Card padding={false}>
          <Table headers={['ID', 'Título', 'Gravidade', 'Estado', 'Data', 'Responsável']}>
            {INCIDENTS.map((inc) => (
              <Tr key={inc.id}>
                <Td mono>{inc.id}</Td>
                <Td><span className="font-medium text-slate-800 text-xs">{inc.title}</span></Td>
                <Td><Badge variant={sevVariant(inc.severity)}>{inc.severity}</Badge></Td>
                <Td><Badge variant={statVariant(inc.status)}>{inc.status}</Badge></Td>
                <Td mono>{inc.date}</Td>
                <Td>{inc.manager}</Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {/* ── Comunicação ── */}
      {tab === 'comunicacao' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Chat */}
          <div className="lg:col-span-2">
            <Card padding={false}>
              <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">C</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{SECURITY_MGR.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" />Online</div>
                </div>
              </div>
              <div className="p-4 space-y-4 min-h-72 max-h-96 overflow-y-auto bg-slate-50/50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.from === 'client' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.from === 'client' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {m.from === 'client' ? 'T' : 'C'}
                    </div>
                    <div className={`flex flex-col ${m.from === 'client' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-xs shadow-sm ${m.from === 'client' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                        {m.text}
                      </div>
                      <span className="text-xs text-slate-400 mt-1 font-mono">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-200 flex gap-2">
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs placeholder:text-slate-400 focus:border-blue-500 transition-base" />
                <Button size="sm" onClick={sendMessage}><Send size={13} /> Enviar</Button>
              </div>
            </Card>
          </div>

          {/* Pedidos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 font-display">Pedidos / Tickets</h3>
              <Button size="sm" onClick={() => setShowTicketModal(true)}><Plus size={13} /> Novo</Button>
            </div>
            <div className="space-y-2">
              {tickets.map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{t.id}</span>
                    <Badge variant={t.status === 'Aberto' ? 'danger' : t.status === 'Resolvido' ? 'success' : 'warning'}>{t.status}</Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-snug">{t.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={t.priority === 'Alto' ? 'danger' : t.priority === 'Médio' ? 'warning' : 'neutral'}>{t.priority}</Badge>
                    <span className="text-xs text-slate-400 font-mono">{t.created}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={showTicketModal} onClose={() => setShowTicketModal(false)} title="Novo Pedido">
        <div className="space-y-4">
          <Input label="Título" placeholder="Descreva o pedido brevemente"
            value={newTicket.title} onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))} />
          <Select label="Prioridade" value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}>
            <option>Baixo</option><option>Médio</option><option>Alto</option>
          </Select>
          <Textarea label="Descrição" placeholder="Detalhe o pedido..."
            value={newTicket.desc} onChange={e => setNewTicket(p => ({ ...p, desc: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowTicketModal(false)}>Cancelar</Button>
            <Button onClick={submitTicket}>Submeter Pedido</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OS MEUS DOCUMENTOS
// ══════════════════════════════════════════════════════════════════════════════
export function ClientDocuments({ setPage }: { setPage: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Todos os tipos');
  const [filterStatus, setFilterStatus] = useState('Todos os estados');
  const [showUpload, setShowUpload] = useState(false);

  const templates = [
    { label: 'Política', icon: FileText, color: 'text-blue-500 bg-blue-50' },
    { label: 'Relatório', icon: ClipboardList, color: 'text-green-500 bg-green-50' },
    { label: 'Contrato', icon: CheckSquare, color: 'text-purple-500 bg-purple-50' },
    { label: 'Auditoria', icon: Eye, color: 'text-amber-500 bg-amber-50' },
    { label: 'NIS2', icon: Shield, color: 'text-cyan-500 bg-cyan-50' },
    { label: 'Pentest', icon: TestTube, color: 'text-red-500 bg-red-50' },
  ];

  const filtered = DOCS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'Todos os tipos' || d.type === filterType;
    const matchStatus = filterStatus === 'Todos os estados' || d.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const expired = DOCS.filter(d => d.expired || d.status === 'Expirado').length;
  const inReview = DOCS.filter(d => d.status === 'Em Revisão').length;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', onClick: () => setPage('cli-dashboard') }, { label: 'Os Meus Documentos' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Gestão de Documentos</h1>
          <p className="text-sm text-slate-500">{DOCS.length} documentos · {inReview} em revisão · {expired} expirado{expired !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download size={14} /> Templates</Button>
          <Button onClick={() => setShowUpload(true)}><Plus size={14} /> Novo Documento</Button>
        </div>
      </div>

      {/* Templates */}
      <Card className="mb-5">
        <CardHeader title="Templates & Importação" subtitle="Descarregar template por tipo de documento:" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {templates.map((t) => (
            <button key={t.label}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-base">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.color}`}>
                <t.icon size={16} />
              </div>
              <span className="text-xs text-slate-600 font-medium">{t.label}</span>
              <Download size={11} className="text-slate-400" />
            </button>
          ))}
        </div>
        {/* Drop zone */}
        <button onClick={() => setShowUpload(true)}
          className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 transition-base">
          <Upload size={20} className="text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Importar documento</p>
          <p className="text-xs text-slate-400">Arraste ou clique para selecionar</p>
        </button>
      </Card>

      {/* Alertas */}
      {expired > 0 && (
        <button onClick={() => setFilterStatus('Expirado')}
          className="w-full mb-3 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium hover:bg-red-100 transition-colors text-left">
          <AlertTriangle size={14} className="shrink-0" />
          {expired} documento(s) expirado(s) requerem renovação — clique para filtrar
        </button>
      )}
      {inReview > 0 && (
        <button onClick={() => setFilterStatus('Em Revisão')}
          className="w-full mb-5 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors text-left">
          <Bell size={14} className="shrink-0" />
          {inReview} lembrete(s) de documentos em revisão — clique para filtrar
        </button>
      )}

      {/* Pesquisa e filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-48 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar documentos..."
            className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-base" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
          <option>Todos os tipos</option><option>Política</option><option>Pentest</option><option>NIS2</option><option>Auditoria</option><option>Contrato</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
          <option>Todos os estados</option><option>Ativo</option><option>Em Revisão</option><option>Expirado</option>
        </select>
        {(filterType !== 'Todos os tipos' || filterStatus !== 'Todos os estados') && (
          <button onClick={() => { setFilterType('Todos os tipos'); setFilterStatus('Todos os estados'); }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 border border-slate-300 rounded-md hover:bg-slate-50 transition-base">
            <X size={11} /> Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      <Card padding={false}>
        <Table headers={['Documento', 'Tipo', 'Proprietário', 'Versão', 'Atualizado', 'Estado', 'Ações']}>
          {filtered.map((d) => (
            <Tr key={d.id}>
              <Td>
                <div className="flex items-start gap-2">
                  <FileText size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{d.desc}</p>
                  </div>
                </div>
              </Td>
              <Td><span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor(d.type)}`}>{d.type}</span></Td>
              <Td>{d.owner}</Td>
              <Td mono>{d.version}</Td>
              <Td mono>{d.updated}</Td>
              <Td><Badge variant={docStatVariant(d.status)}>{d.status}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <button className="p-1 text-slate-400 hover:text-blue-600 transition-base" title="Ver documento"><Eye size={13} /></button>
                  {d.status !== 'Expirado' && (
                    <button className="p-1 text-slate-400 hover:text-blue-600 transition-base" title="Descarregar"><Download size={13} /></button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">Nenhum documento encontrado para os filtros selecionados.</div>
        )}
      </Card>

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Carregar Novo Documento">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Upload size={20} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Arraste ou clique para selecionar</p>
            <p className="text-xs text-slate-400">PDF, DOCX, XLSX — máx. 50MB</p>
          </div>
          <Select label="Tipo de Documento">
            <option>Política</option><option>Relatório</option><option>Contrato</option><option>Auditoria</option><option>NIS2</option><option>Pentest</option>
          </Select>
          <Input label="Versão" placeholder="v1.0" />
          <Textarea label="Notas" placeholder="Notas opcionais..." />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={() => setShowUpload(false)}>Carregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RELATÓRIOS
// ══════════════════════════════════════════════════════════════════════════════
const INC_BY_MONTH = [
  { mes: 'Jan', abertos: 0, resolvidos: 1 }, { mes: 'Fev', abertos: 1, resolvidos: 1 },
  { mes: 'Mar', abertos: 0, resolvidos: 0 }, { mes: 'Abr', abertos: 0, resolvidos: 1 },
  { mes: 'Mai', abertos: 0, resolvidos: 1 }, { mes: 'Jun', abertos: 1, resolvidos: 0 },
];
const FINDINGS_SEV = [
  { name: 'Crítico', value: 1, color: '#dc2626' },
  { name: 'Alto', value: 5, color: '#d97706' },
  { name: 'Médio', value: 9, color: '#2563eb' },
  { name: 'Baixo', value: 5, color: '#64748b' },
];
const PT_TYPES = [
  { type: 'Externo', value: 2 }, { type: 'Interno', value: 1 },
];
const NIS2_TREND = [
  { mes: 'Jan', score: 62 }, { mes: 'Fev', score: 65 }, { mes: 'Mar', score: 70 },
  { mes: 'Abr', score: 72 }, { mes: 'Mai', score: 75 }, { mes: 'Jun', score: 78 },
];
const NIS2_AREAS = [
  { area: 'Gestão de Risco', score: 90 }, { area: 'Gestão de Incidentes', score: 85 },
  { area: 'Continuidade de Negócio', score: 70 }, { area: 'Cadeia de Abastecimento', score: 55 },
  { area: 'Controlo de Acesso', score: 92 }, { area: 'Criptografia', score: 65 },
];

export function ClientReports({ setPage }: { setPage: (p: Page) => void }) {
  const [period, setPeriod] = useState('2025');

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', onClick: () => setPage('cli-dashboard') }, { label: 'Relatórios' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Relatórios</h1>
          <p className="text-sm text-slate-500">Análise de segurança — {COMPANY.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="6m">Últimos 6 meses</option>
          </select>
          <Button variant="outline" size="sm"><Download size={13} /> Exportar PDF</Button>
        </div>
      </div>

      {/* Score NIS2 topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Score NIS2', value: '78%', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Score de Segurança', value: '76/100', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Findings Totais', value: '20', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Tempo Médio Resolução', value: '8 dias', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        ].map((k) => (
          <Card key={k.label} className={`border ${k.bg}`}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold font-display ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Incidentes */}
        <Card>
          <CardHeader title="Incidentes" subtitle="Abertos vs. resolvidos por mês" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={INC_BY_MONTH}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="abertos" fill="#dc2626" radius={[3, 3, 0, 0]} name="Abertos" />
              <Bar dataKey="resolvidos" fill="#16a34a" radius={[3, 3, 0, 0]} name="Resolvidos" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Findings por severidade */}
        <Card>
          <CardHeader title="Findings por Severidade" subtitle="Todos os pentests — {period}" />
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={FINDINGS_SEV} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                  {FINDINGS_SEV.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {FINDINGS_SEV.map((f) => (
                <div key={f.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />{f.name}</span>
                  <span className="font-mono font-bold text-slate-700">{f.value}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Total</span><span className="font-mono">20</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Pentests */}
        <Card>
          <CardHeader title="Pentests" subtitle="Por tipo e estado" />
          <div className="space-y-3 mb-4">
            {PENTESTS.map((pt) => (
              <div key={pt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TestTube size={14} className="text-purple-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{pt.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{pt.id} · {pt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pt.findings !== null && <span className="text-xs font-mono text-slate-500">{pt.findings} findings</span>}
                  <Badge variant={ptStatVariant(pt.status)}>{pt.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <CardHeader title="Tipos de Alvo" subtitle="Distribuição dos pentests" />
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={PT_TYPES} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} width={60} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* NIS2 */}
        <Card>
          <CardHeader title="Conformidade NIS2" subtitle="Evolução do score" />
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={NIS2_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Line dataKey="score" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Score NIS2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {NIS2_AREAS.map((a) => (
              <div key={a.area}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{a.area}</span>
                  <span className="font-mono text-slate-400">{a.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div className={`h-full rounded-full ${a.score >= 80 ? 'bg-green-500' : a.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${a.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Legacy exports kept for routing compatibility
export function ClientProfile() { return <ClientDocuments setPage={() => {}} />; }
export function ClientAssets() { return <ClientWorkspace setPage={() => {}} />; }
export function ClientIncidents() { return <ClientWorkspace setPage={() => {}} />; }
export function ClientNIS2() { return <ClientReports setPage={() => {}} />; }
export function ClientRisk() { return <ClientReports setPage={() => {}} />; }
export function ClientRequests({ setPage }: { setPage: (p: Page) => void }) { return <ClientWorkspace setPage={setPage} />; }
export function ClientCommunication() { return <ClientWorkspace setPage={() => {}} />; }
export function ClientPentests() { return <ClientWorkspace setPage={() => {}} />; }
