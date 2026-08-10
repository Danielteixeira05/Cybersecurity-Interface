import { useState } from 'react';
import type { Page } from '../types';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  Building2, AlertTriangle, FileText, CheckSquare, Plus, Eye, Download,
  Upload, Calendar, MessageSquare, Zap, BarChart3, Clock,
  Package, FileCheck, ChevronRight, ArrowLeft, TrendingUp, Shield,
} from 'lucide-react';
import {
  Card, CardHeader, StatCard, Badge, Button, SearchInput, Table, Tr, Td,
  Modal, Input, Select, Textarea, Breadcrumb, Tabs, Pagination,
  FileUploadArea, Alert,
} from '../components/DesignSystem';

const CHART_TOOLTIP = {
  contentStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a' },
};

// ── DADOS ─────────────────────────────────────────────────────────────────────
const CLIENTS = [
  { id: 1, name: 'TechCorp Portugal, S.A.', sector: 'Tecnologia', manager: 'Carlos Mendes', nis2: 'Em Conformidade', incidents: 14, risk: 'Baixo', contact: 'João Antunes' },
  { id: 2, name: 'Banco Norte, S.A.', sector: 'Financeiro', manager: 'Carlos Mendes', nis2: 'Em Avaliação', incidents: 11, risk: 'Médio', contact: 'Filipa Sousa' },
  { id: 3, name: 'Saúde Digital, Lda.', sector: 'Saúde', manager: 'Carlos Mendes', nis2: 'Problemas Pendentes', incidents: 9, risk: 'Alto', contact: 'Nuno Ferreira' },
  { id: 4, name: 'EnergiaPT, S.A.', sector: 'Energia', manager: 'Carlos Mendes', nis2: 'Em Conformidade', incidents: 7, risk: 'Baixo', contact: 'Lara Costa' },
  { id: 5, name: 'Logística Sul, Lda.', sector: 'Logística', manager: 'Carlos Mendes', nis2: 'Em Avaliação', incidents: 5, risk: 'Médio', contact: 'Rui Duarte' },
];

const INCIDENTS = [
  { id: 'INC-0047', client: 'Banco Norte', title: 'Tentativa de acesso não autorizado à VPN', severity: 'Crítico', status: 'Aberto', date: '2025-06-10', manager: 'Carlos Mendes' },
  { id: 'INC-0046', client: 'TechCorp Portugal', title: 'Campanha de phishing detetada', severity: 'Alto', status: 'Em Progresso', date: '2025-06-09', manager: 'Carlos Mendes' },
  { id: 'INC-0045', client: 'Saúde Digital', title: 'Malware encontrado na estação de trabalho #12', severity: 'Médio', status: 'Resolvido', date: '2025-06-07', manager: 'Sofia Pinto' },
  { id: 'INC-0044', client: 'EnergiaPT', title: 'Ataque DDoS ao site público', severity: 'Alto', status: 'Resolvido', date: '2025-06-04', manager: 'Carlos Mendes' },
  { id: 'INC-0043', client: 'TechCorp Portugal', title: 'Tentativa de exfiltração de dados por USB', severity: 'Baixo', status: 'Fechado', date: '2025-06-01', manager: 'Carlos Mendes' },
];

const DOCUMENTS = [
  { id: 1, name: 'Relatório NIS2 Q2 2025.pdf', client: 'TechCorp Portugal', type: 'Relatório NIS2', confidentiality: 'Confidencial', status: 'Aprovado', date: '2025-06-10', size: '2,4 MB' },
  { id: 2, name: 'Política de Segurança v3.docx', client: 'Banco Norte', type: 'Política', confidentiality: 'Interno', status: 'Rascunho', date: '2025-06-08', size: '1,1 MB' },
  { id: 3, name: 'Relatório PenTest Q1.pdf', client: 'Saúde Digital', type: 'Relatório de PenTest', confidentiality: 'Restrito', status: 'Aprovado', date: '2025-06-05', size: '5,7 MB' },
  { id: 4, name: 'Inventário de Ativos.xlsx', client: 'EnergiaPT', type: 'Inventário de Ativos', confidentiality: 'Interno', status: 'Em Revisão', date: '2025-06-01', size: '890 KB' },
];

const REQUESTS = [
  { id: 'TK-0234', client: 'TechCorp Portugal', title: 'Solicitar análise de vulnerabilidades', status: 'Aberto', priority: 'Alto', created: '2025-06-12', updated: '2025-06-12', manager: 'Carlos Mendes' },
  { id: 'TK-0233', client: 'Banco Norte', title: 'Revisão de política de firewall', status: 'Em Progresso', priority: 'Médio', created: '2025-06-10', updated: '2025-06-11', manager: 'Sofia Pinto' },
  { id: 'TK-0232', client: 'Saúde Digital', title: 'Acesso a relatório de incidente', status: 'Resolvido', priority: 'Baixo', created: '2025-06-08', updated: '2025-06-09', manager: 'Carlos Mendes' },
  { id: 'TK-0231', client: 'EnergiaPT', title: 'Auditoria NIS2 — documentação adicional', status: 'Pendente', priority: 'Alto', created: '2025-06-07', updated: '2025-06-07', manager: 'Carlos Mendes' },
];

const incidentTrend = [
  { mes: 'Jan', abertos: 4, resolvidos: 3 }, { mes: 'Fev', abertos: 6, resolvidos: 5 },
  { mes: 'Mar', abertos: 8, resolvidos: 7 }, { mes: 'Abr', abertos: 5, resolvidos: 6 },
  { mes: 'Mai', abertos: 9, resolvidos: 8 }, { mes: 'Jun', abertos: 3, resolvidos: 2 },
];

const severityData = [
  { name: 'Crítico', value: 2 },
  { name: 'Alto', value: 2 },
  { name: 'Médio', value: 1 },
  { name: 'Baixo', value: 1 },
];
const SEV_COLORS = ['#dc2626', '#f97316', '#2563eb', '#16a34a'];

const findingsData = [
  { client: 'TechCorp', criticos: 2, altos: 5 },
  { client: 'Banco Norte', criticos: 0, altos: 3 },
  { client: 'Saúde Digital', criticos: 1, altos: 2 },
  { client: 'EnergiaPT', criticos: 0, altos: 4 },
  { client: 'Logística Sul', criticos: 1, altos: 2 },
];

function riskVariant(risk: string): 'success' | 'warning' | 'danger' {
  if (risk === 'Baixo' || risk === 'Low') return 'success';
  if (risk === 'Médio' || risk === 'Medium') return 'warning';
  return 'danger';
}
function statusVariant(s: string): 'danger' | 'warning' | 'success' | 'neutral' | 'info' {
  if (s === 'Aberto' || s === 'Open') return 'danger';
  if (s === 'Em Progresso' || s === 'In Progress') return 'warning';
  if (s === 'Resolvido' || s === 'Resolved') return 'success';
  return 'neutral';
}
function severityVariant(s: string): 'danger' | 'warning' | 'info' | 'neutral' {
  if (s === 'Crítico' || s === 'Critical') return 'danger';
  if (s === 'Alto' || s === 'High') return 'warning';
  if (s === 'Médio' || s === 'Medium') return 'info';
  return 'neutral';
}
function nis2Variant(s: string): 'success' | 'warning' | 'danger' {
  if (s === 'Em Conformidade') return 'success';
  if (s === 'Em Avaliação') return 'warning';
  return 'danger';
}
function confVariant(s: string): 'danger' | 'warning' | 'neutral' {
  if (s === 'Restrito') return 'danger';
  if (s === 'Confidencial') return 'warning';
  return 'neutral';
}
function docStatusVariant(s: string): 'success' | 'neutral' | 'warning' {
  if (s === 'Aprovado') return 'success';
  if (s === 'Rascunho') return 'neutral';
  return 'warning';
}
function priorityVariant(p: string): 'danger' | 'warning' | 'neutral' {
  if (p === 'Alto' || p === 'High') return 'danger';
  if (p === 'Médio' || p === 'Medium') return 'warning';
  return 'neutral';
}

// ── PAINEL DO GESTOR ──────────────────────────────────────────────────────────
export function MgrDashboard({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-display">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">CyberBoxSecur — Área Gestor</p>
      </div>

      {/* Welcome banner */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)' }}>
        <p className="text-lg font-bold text-white mb-1">Olá, Carlos 👋</p>
        <p className="text-sm text-blue-100 mb-5">Aqui está o resumo dos seus clientes e atividades.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: 'Clientes Ativos', value: '5', page: 'mgr-clients' },
            { label: 'Incidentes Abertos', value: '3', page: 'mgr-incidents' },
            { label: 'Pentests Ativos', value: '1', page: 'mgr-analytics' },
            { label: 'Documentos', value: '4', page: 'mgr-documents' },
          ] as { label: string; value: string; page: Page }[]).map((s) => (
            <button
              key={s.label}
              onClick={() => setPage(s.page)}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-center transition-colors"
            >
              <p className="text-2xl font-bold text-white font-display">{s.value}</p>
              <p className="text-xs text-blue-100 mt-1">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie — Incidentes por Severidade */}
        <Card>
          <CardHeader title="Incidentes por Severidade" />
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {severityData.map((_entry, i) => (
                    <Cell key={i} fill={SEV_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 mt-1">
              {severityData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEV_COLORS[i] }} />
                  <span className="text-xs text-slate-600">{d.name}: <span className="font-semibold text-slate-800">{d.value}</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Bar — Findings por Cliente */}
        <Card>
          <CardHeader title="Findings de Pentests por Cliente" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={findingsData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="client" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="altos" name="Altos" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="criticos" name="Críticos" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incidentes Recentes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Incidentes Recentes</h3>
            <button onClick={() => setPage('mgr-incidents')} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {INCIDENTS.map((inc) => {
              const dotColor = inc.severity === 'Crítico' ? '#dc2626' : inc.severity === 'Alto' ? '#f97316' : '#eab308';
              return (
                <div
                  key={inc.id}
                  onClick={() => setPage('mgr-incidents')}
                  className="flex items-center gap-3 py-1 cursor-pointer group"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">{inc.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{inc.date}</p>
                  </div>
                  <Badge variant={statusVariant(inc.status)}>{inc.status}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Os Meus Clientes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 font-display">Os Meus Clientes</h3>
            <button onClick={() => setPage('mgr-clients')} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {CLIENTS.map((c) => (
              <div
                key={c.id}
                onClick={() => setPage('mgr-client-detail')}
                className="flex items-center gap-3 py-1 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate font-mono">{c.contact.toLowerCase().replace(' ', '.')}@{c.sector.toLowerCase().replace(/[^a-z]/g, '')}.pt</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Ativo
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── ANÁLISES ──────────────────────────────────────────────────────────────────
const PENTESTS = [
  { id: 'PT-0012', client: 'TechCorp Portugal', type: 'Externo', scope: 'Aplicação Web', status: 'Concluído', date: '2025-03-15', findings: '2 Críticos, 5 Altos' },
  { id: 'PT-0011', client: 'Banco Norte', type: 'Interno', scope: 'Perímetro de Rede', status: 'Concluído', date: '2025-01-20', findings: '0 Críticos, 3 Altos' },
  { id: 'PT-0010', client: 'Saúde Digital', type: 'Eng. Social', scope: 'Phishing por Email', status: 'Agendado', date: '2025-07-01', findings: '—' },
  { id: 'PT-0009', client: 'EnergiaPT', type: 'Externo', scope: 'Infraestrutura Cloud', status: 'Em Progresso', date: '2025-06-01', findings: '—' },
];

const FINDINGS = [
  { id: 'F-001', pentest: 'PT-0012', title: 'SQL Injection no endpoint /api/users', severity: 'Crítico', status: 'Aberto', client: 'TechCorp Portugal' },
  { id: 'F-002', pentest: 'PT-0012', title: 'XSS Refletido no módulo de pesquisa', severity: 'Alto', status: 'Em Remediação', client: 'TechCorp Portugal' },
  { id: 'F-003', pentest: 'PT-0011', title: 'Credenciais por omissão em switch de rede', severity: 'Alto', status: 'Resolvido', client: 'Banco Norte' },
  { id: 'F-004', pentest: 'PT-0011', title: 'Certificado SSL expirado em servidor interno', severity: 'Médio', status: 'Resolvido', client: 'Banco Norte' },
];

const NIS2_STATUS = [
  { client: 'TechCorp Portugal', score: 92, status: 'Em Conformidade', lastAudit: '2025-05-10', nextAudit: '2025-11-10' },
  { client: 'Banco Norte', score: 74, status: 'Em Avaliação', lastAudit: '2025-04-01', nextAudit: '2025-10-01' },
  { client: 'Saúde Digital', score: 55, status: 'Problemas Pendentes', lastAudit: '2025-03-15', nextAudit: '2025-09-15' },
  { client: 'EnergiaPT', score: 88, status: 'Em Conformidade', lastAudit: '2025-05-20', nextAudit: '2025-11-20' },
  { client: 'Logística Sul', score: 68, status: 'Em Avaliação', lastAudit: '2025-04-10', nextAudit: '2025-10-10' },
];

export function MgrAnalytics({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState('pentests');

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Análises' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Análises de Segurança</h1>
        <Button onClick={() => setPage('mgr-clients')}><Plus size={14} /> Agendar PenTest</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="PenTests Concluídos" value="2" icon={Zap} color="purple" />
        <StatCard label="Findings Críticos" value="1" icon={AlertTriangle} color="red" />
        <StatCard label="Em Remediação" value="1" icon={Clock} color="amber" />
        <StatCard label="Conformidade NIS2 Média" value="75%" icon={CheckSquare} color="green" />
      </div>

      <div className="mb-6">
        <Tabs tabs={[
          { id: 'pentests', label: 'PenTests' },
          { id: 'findings', label: 'Findings' },
          { id: 'nis2', label: 'Conformidade NIS2' },
          { id: 'reports', label: 'Relatórios' },
        ]} active={tab} onChange={setTab} />
      </div>

      {tab === 'pentests' && (
        <Card padding={false}>
          <Table headers={['ID', 'Cliente', 'Tipo', 'Âmbito', 'Estado', 'Data', 'Descobertas', '']}>
            {PENTESTS.map((p) => (
              <Tr key={p.id} onClick={() => setPage('mgr-client-detail')}>
                <Td mono>{p.id}</Td>
                <Td><span className="text-xs font-medium text-slate-800">{p.client}</span></Td>
                <Td>{p.type}</Td>
                <Td>{p.scope}</Td>
                <Td><Badge variant={p.status === 'Concluído' ? 'success' : p.status === 'Em Progresso' ? 'warning' : 'info'}>{p.status}</Badge></Td>
                <Td mono>{p.date}</Td>
                <Td><span className="text-xs text-slate-500">{p.findings}</span></Td>
                <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'findings' && (
        <Card padding={false}>
          <Table headers={['ID', 'PenTest', 'Cliente', 'Finding', 'Severidade', 'Estado', '']}>
            {FINDINGS.map((f) => (
              <Tr key={f.id} onClick={() => setPage('mgr-client-detail')}>
                <Td mono>{f.id}</Td>
                <Td mono>{f.pentest}</Td>
                <Td><span className="text-xs text-slate-700">{f.client}</span></Td>
                <Td><span className="text-xs font-medium text-slate-800">{f.title}</span></Td>
                <Td><Badge variant={severityVariant(f.severity)}>{f.severity}</Badge></Td>
                <Td><Badge variant={statusVariant(f.status)}>{f.status}</Badge></Td>
                <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'nis2' && (
        <Card padding={false}>
          <Table headers={['Cliente', 'Pontuação', 'Estado NIS2', 'Última Auditoria', 'Próxima Auditoria', '']}>
            {NIS2_STATUS.map((n) => (
              <Tr key={n.client} onClick={() => setPage('mgr-client-detail')}>
                <Td><span className="text-xs font-medium text-slate-800">{n.client}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-16">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${n.score}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-700">{n.score}%</span>
                  </div>
                </Td>
                <Td><Badge variant={nis2Variant(n.status)}>{n.status}</Badge></Td>
                <Td mono>{n.lastAudit}</Td>
                <Td mono>{n.nextAudit}</Td>
                <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Resumo de Segurança Q1 2025', date: '2025-04-01', type: 'Resumo' },
            { name: 'Relatório de Conformidade NIS2', date: '2025-05-15', type: 'NIS2' },
            { name: 'Resultados PenTest Q1 — TechCorp', date: '2025-03-20', type: 'PenTest' },
            { name: 'Relatório de Risco Consolidado', date: '2025-06-01', type: 'Risco' },
          ].map((r) => (
            <Card key={r.name}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{r.type} · {r.date}</p>
                </div>
                <Button variant="ghost" size="sm"><Download size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LISTA DE CLIENTES ─────────────────────────────────────────────────────────
export function MgrClients({ setPage }: { setPage: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const filtered = CLIENTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Clientes' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Clientes</h1>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total" value={CLIENTS.length} icon={Building2} color="blue" />
        <StatCard label="Em Conformidade NIS2" value={CLIENTS.filter(c => c.nis2 === 'Em Conformidade').length} icon={CheckSquare} color="green" />
        <StatCard label="Com Problemas" value={CLIENTS.filter(c => c.nis2 === 'Problemas Pendentes').length} icon={AlertTriangle} color="red" />
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar clientes..." />
        </div>
        <Table headers={['Cliente', 'Setor', 'Contacto', 'NIS2', 'Incidentes', 'Risco', '']}>
          {filtered.map((c) => (
            <Tr key={c.id} onClick={() => setPage('mgr-client-detail')}>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{c.name.charAt(0)}</div>
                  <span className="font-medium text-slate-800 text-xs">{c.name}</span>
                </div>
              </Td>
              <Td>{c.sector}</Td>
              <Td>{c.contact}</Td>
              <Td><Badge variant={nis2Variant(c.nis2)}>{c.nis2}</Badge></Td>
              <Td mono>{c.incidents}</Td>
              <Td><Badge variant={riskVariant(c.risk)}>{c.risk}</Badge></Td>
              <Td>
                <button onClick={(e) => { e.stopPropagation(); setPage('mgr-client-detail'); }} className="p-1 text-slate-400 hover:text-blue-600 transition-base">
                  <Eye size={13} />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── DETALHE DO CLIENTE ────────────────────────────────────────────────────────
export function MgrClientDetail({ setPage, backPage = 'mgr-clients', backLabel = 'Gestor' }: {
  setPage: (p: Page) => void; backPage?: Page; backLabel?: string;
}) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'nis2', label: 'NIS2' },
    { id: 'assets', label: 'Ativos' },
    { id: 'incidents', label: 'Incidentes' },
    { id: 'documents', label: 'Documentos' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'pentests', label: 'PenTests' },
    { id: 'evidence', label: 'Evidências' },
    { id: 'requests', label: 'Pedidos' },
  ];
  const client = CLIENTS[0];

  return (
    <div>
      <Breadcrumb items={[{ label: backLabel }, { label: 'Clientes', onClick: () => setPage(backPage) }, { label: client.name }]} />
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white font-display">{client.name.charAt(0)}</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">{client.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500">{client.sector}</span>
              <Badge variant="success">{client.nis2}</Badge>
              <Badge variant="info">Risco: {client.risk}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><MessageSquare size={13} /> Mensagem</Button>
          <Button size="sm"><Plus size={13} /> Novo Incidente</Button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Incidentes Abertos" value="3" icon={AlertTriangle} color="red" />
            <StatCard label="Pontuação NIS2" value="78%" icon={CheckSquare} color="green" />
            <StatCard label="Ativos" value="47" icon={Package} color="blue" />
            <StatCard label="Pedidos em Aberto" value="2" icon={MessageSquare} color="amber" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Informação da Organização" />
              <div className="space-y-3">
                {[
                  ['Contacto', client.contact], ['Setor', client.sector],
                  ['Gestor', client.manager], ['Cliente Desde', '2023-02-14'],
                  ['Estado NIS2', client.nis2], ['Nível de Risco', client.risk],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Incidentes Recentes" action={<button onClick={() => setTab('incidents')} className="text-xs text-blue-600 hover:text-blue-700">Ver todos</button>} />
              <div className="space-y-2">
                {INCIDENTS.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-md border border-slate-100">
                    <AlertTriangle size={13} className={inc.severity === 'Crítico' ? 'text-red-500' : inc.severity === 'Alto' ? 'text-amber-500' : 'text-yellow-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{inc.title}</p>
                      <p className="text-xs text-slate-400 font-mono">{inc.date}</p>
                    </div>
                    <Badge variant={statusVariant(inc.status)}>{inc.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'nis2' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Pontuação NIS2" value="78%" icon={CheckSquare} color="green" />
            <StatCard label="Controlos Conformes" value="31/40" icon={Shield} color="blue" />
            <StatCard label="Última Avaliação" value="Mai 2025" icon={Calendar} color="purple" />
          </div>
          <Card>
            <CardHeader title="Áreas de Controlo NIS2" />
            <div className="space-y-3">
              {[
                { area: 'Gestão de Risco', score: 90, status: 'Em Conformidade' },
                { area: 'Gestão de Incidentes', score: 85, status: 'Em Conformidade' },
                { area: 'Continuidade de Negócio', score: 70, status: 'Em Revisão' },
                { area: 'Segurança da Cadeia de Abastecimento', score: 55, status: 'Problemas Pendentes' },
                { area: 'Segurança de Redes e SI', score: 88, status: 'Em Conformidade' },
                { area: 'Controlo de Acesso', score: 92, status: 'Em Conformidade' },
                { area: 'Criptografia', score: 65, status: 'Em Revisão' },
                { area: 'Sensibilização para a Segurança', score: 75, status: 'Em Conformidade' },
              ].map((item) => (
                <div key={item.area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-700">{item.area}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500">{item.score}%</span>
                      <Badge variant={item.status === 'Em Conformidade' ? 'success' : item.status === 'Em Revisão' ? 'warning' : 'danger'}>{item.status}</Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'assets' && (
        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Ativos Tecnológicos</h3>
            <Button size="sm"><Plus size={13} /> Adicionar Ativo</Button>
          </div>
          <Table headers={['Nome do Ativo', 'Tipo', 'IP / Identificador', 'SO / Plataforma', 'Risco', 'Última Análise']}>
            {[
              { name: 'PRODWEB-01', type: 'Servidor Web', ip: '10.0.1.10', os: 'Ubuntu 22.04', risk: 'Baixo', scan: '2025-06-10' },
              { name: 'DB-MAIN', type: 'Base de Dados', ip: '10.0.1.20', os: 'PostgreSQL 15', risk: 'Médio', scan: '2025-06-08' },
              { name: 'FW-PERIMETER', type: 'Firewall', ip: '192.168.1.1', os: 'FortiOS 7.4', risk: 'Baixo', scan: '2025-06-12' },
              { name: 'VPN-GW-01', type: 'Gateway VPN', ip: '203.0.113.1', os: 'OpenVPN', risk: 'Alto', scan: '2025-06-05' },
              { name: 'WORKSTATION-12', type: 'Estação de Trabalho', ip: '10.0.2.12', os: 'Windows 11', risk: 'Médio', scan: '2025-06-09' },
            ].map((a) => (
              <Tr key={a.name}>
                <Td><span className="font-medium text-slate-800 text-xs font-mono">{a.name}</span></Td>
                <Td>{a.type}</Td>
                <Td mono>{a.ip}</Td>
                <Td>{a.os}</Td>
                <Td><Badge variant={riskVariant(a.risk)}>{a.risk}</Badge></Td>
                <Td mono>{a.scan}</Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'incidents' && (
        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Incidentes de Segurança</h3>
            <Button size="sm"><Plus size={13} /> Novo Incidente</Button>
          </div>
          <Table headers={['ID', 'Título', 'Gravidade', 'Estado', 'Data', '']}>
            {INCIDENTS.map((inc) => (
              <Tr key={inc.id}>
                <Td mono>{inc.id}</Td>
                <Td><span className="font-medium text-slate-800 text-xs">{inc.title}</span></Td>
                <Td><Badge variant={severityVariant(inc.severity)}>{inc.severity}</Badge></Td>
                <Td><Badge variant={statusVariant(inc.status)}>{inc.status}</Badge></Td>
                <Td mono>{inc.date}</Td>
                <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 transition-base cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'documents' && (
        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Documentos</h3>
            <Button size="sm"><Upload size={13} /> Carregar</Button>
          </div>
          <Table headers={['Nome', 'Tipo', 'Confidencialidade', 'Estado', 'Data', 'Tamanho', '']}>
            {DOCUMENTS.map((d) => (
              <Tr key={d.id}>
                <Td><div className="flex items-center gap-2"><FileText size={13} className="text-blue-500 shrink-0" /><span className="text-xs font-medium text-slate-800">{d.name}</span></div></Td>
                <Td>{d.type}</Td>
                <Td><Badge variant={confVariant(d.confidentiality)}>{d.confidentiality}</Badge></Td>
                <Td><Badge variant={docStatusVariant(d.status)}>{d.status}</Badge></Td>
                <Td mono>{d.date}</Td>
                <Td mono>{d.size}</Td>
                <Td><Download size={13} className="text-slate-400 hover:text-blue-600 transition-base cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-2 gap-4">
          {['Resumo de Segurança Q1 2025', 'Relatório de Conformidade NIS2', 'Resultados PenTest Q1', 'Avaliação de Risco 2024'].map((r) => (
            <Card key={r}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><FileText size={16} className="text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r}</p>
                  <p className="text-xs text-slate-400">PDF · 2025-06-10</p>
                </div>
                <Button variant="ghost" size="sm"><Download size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'pentests' && (
        <Card padding={false}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Testes de Penetração</h3>
            <Button size="sm"><Plus size={13} /> Agendar PenTest</Button>
          </div>
          <Table headers={['PenTest', 'Tipo', 'Âmbito', 'Estado', 'Data', 'Descobertas']}>
            {[
              { id: 'PT-0012', type: 'Externo', scope: 'Aplicação Web', status: 'Concluído', date: '2025-03-15', findings: '2 Críticos, 5 Altos' },
              { id: 'PT-0011', type: 'Interno', scope: 'Perímetro de Rede', status: 'Concluído', date: '2025-01-20', findings: '0 Críticos, 3 Altos' },
              { id: 'PT-0010', type: 'Eng. Social', scope: 'Phishing por Email', status: 'Agendado', date: '2025-07-01', findings: '—' },
            ].map((p) => (
              <Tr key={p.id}>
                <Td mono>{p.id}</Td>
                <Td>{p.type}</Td>
                <Td>{p.scope}</Td>
                <Td><Badge variant={p.status === 'Concluído' ? 'success' : 'info'}>{p.status}</Badge></Td>
                <Td mono>{p.date}</Td>
                <Td><span className="text-xs text-slate-500">{p.findings}</span></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">Ficheiros de Evidência</h3>
            <Button size="sm"><Upload size={13} /> Carregar Evidência</Button>
          </div>
          <FileUploadArea label="Arraste evidências aqui (capturas de ecrã, logs, exportações)" hint="Formatos suportados: PDF, PNG, JPG, XLSX, CSV, ZIP · Máx. 50MB" />
          <Table headers={['Ficheiro', 'Incidente', 'Carregado por', 'Data', '']}>
            {[
              { file: 'captura_falha_login.png', incident: 'INC-0047', by: 'Carlos Mendes', date: '2025-06-10' },
              { file: 'exportacao_log_auth.csv', incident: 'INC-0047', by: 'Carlos Mendes', date: '2025-06-10' },
              { file: 'captura_rede.pcap', incident: 'INC-0046', by: 'Sofia Pinto', date: '2025-06-09' },
            ].map((e) => (
              <Tr key={e.file}>
                <Td><div className="flex items-center gap-2"><FileCheck size={13} className="text-green-600" /><span className="text-xs font-mono text-slate-800">{e.file}</span></div></Td>
                <Td mono>{e.incident}</Td>
                <Td>{e.by}</Td>
                <Td mono>{e.date}</Td>
                <Td><Download size={13} className="text-slate-400 hover:text-blue-600 transition-base cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      {tab === 'requests' && (
        <Card padding={false}>
          <Table headers={['ID', 'Título', 'Estado', 'Prioridade', 'Criado em', '']}>
            {REQUESTS.map((r) => (
              <Tr key={r.id}>
                <Td mono>{r.id}</Td>
                <Td><span className="text-xs font-medium text-slate-800">{r.title}</span></Td>
                <Td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></Td>
                <Td><Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge></Td>
                <Td mono>{r.created}</Td>
                <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 transition-base cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── INCIDENTES ────────────────────────────────────────────────────────────────
export function MgrIncidents({ setPage }: { setPage: (p: Page) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [detailInc, setDetailInc] = useState<typeof INCIDENTS[0] | null>(null);
  const [search, setSearch] = useState('');

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Incidentes de Segurança' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Incidentes de Segurança</h1>
        <Button onClick={() => setShowModal(true)}><Plus size={14} /> Criar Incidente</Button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Abertos', count: 3, color: 'red' },
          { label: 'Em Progresso', count: 4, color: 'amber' },
          { label: 'Resolvidos', count: 12, color: 'green' },
          { label: 'Fechados', count: 28, color: 'blue' },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.count} icon={AlertTriangle} color={s.color as any} />
        ))}
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar incidentes..." />
          </div>
          <Select><option>Todas as Gravidades</option><option>Crítico</option><option>Alto</option><option>Médio</option><option>Baixo</option></Select>
          <Select><option>Todos os Estados</option><option>Aberto</option><option>Em Progresso</option><option>Resolvido</option><option>Fechado</option></Select>
        </div>
        <Table headers={['ID', 'Título', 'Cliente', 'Gravidade', 'Estado', 'Gestor', 'Data', '']}>
          {INCIDENTS.map((inc) => (
            <Tr key={inc.id} onClick={() => setDetailInc(inc)}>
              <Td mono>{inc.id}</Td>
              <Td><span className="font-medium text-slate-800 text-xs">{inc.title}</span></Td>
              <Td>{inc.client}</Td>
              <Td><Badge variant={severityVariant(inc.severity)}>{inc.severity}</Badge></Td>
              <Td><Badge variant={statusVariant(inc.status)}>{inc.status}</Badge></Td>
              <Td>{inc.manager}</Td>
              <Td mono>{inc.date}</Td>
              <Td>
                <button onClick={(e) => { e.stopPropagation(); setDetailInc(inc); }} className="p-1 text-slate-400 hover:text-blue-600 transition-base">
                  <Eye size={13} />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={INCIDENTS.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Criar Incidente de Segurança" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cliente"><option>TechCorp Portugal</option><option>Banco Norte</option><option>Saúde Digital</option></Select>
            <Select label="Gravidade"><option>Crítico</option><option>Alto</option><option>Médio</option><option>Baixo</option></Select>
          </div>
          <Input label="Título do Incidente" placeholder="Descrição breve do incidente" />
          <Textarea label="Descrição" placeholder="Descrição detalhada do incidente, sistemas afetados, cronologia..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado"><option>Aberto</option><option>Em Progresso</option></Select>
            <Select label="Gestor Responsável"><option>Carlos Mendes</option><option>Sofia Pinto</option></Select>
          </div>
          <Input label="Sistemas Afetados" placeholder="ex: PRODWEB-01, DB-MAIN" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={() => setShowModal(false)}>Criar Incidente</Button>
          </div>
        </div>
      </Modal>

      {detailInc && (
        <Modal open={!!detailInc} onClose={() => setDetailInc(null)} title={`Detalhe — ${detailInc.id}`} size="lg">
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Badge variant={severityVariant(detailInc.severity)}>{detailInc.severity}</Badge>
              <Badge variant={statusVariant(detailInc.status)}>{detailInc.status}</Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Título</p>
              <p className="text-sm font-semibold text-slate-800">{detailInc.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-sm text-slate-800">{detailInc.client}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Gestor</p>
                <p className="text-sm text-slate-800">{detailInc.manager}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Data</p>
                <p className="text-sm font-mono text-slate-800">{detailInc.date}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">ID</p>
                <p className="text-sm font-mono text-slate-800">{detailInc.id}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDetailInc(null)}>Fechar</Button>
              <Button onClick={() => { setDetailInc(null); setPage('mgr-client-detail'); }}>Ver Cliente</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── DOCUMENTOS ────────────────────────────────────────────────────────────────
export function MgrDocuments() {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Documentos' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Gestão de Documentos</h1>
        <Button onClick={() => setShowUpload(true)}><Upload size={14} /> Carregar Documento</Button>
      </div>
      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar documentos..." />
          </div>
          <Select><option>Todos os Tipos</option><option>Relatório NIS2</option><option>Relatório de PenTest</option><option>Política</option><option>Evidência</option></Select>
          <Select><option>Todos os Clientes</option><option>TechCorp Portugal</option><option>Banco Norte</option></Select>
        </div>
        <Table headers={['Documento', 'Cliente', 'Tipo', 'Confidencialidade', 'Estado', 'Data', 'Tamanho', '']}>
          {DOCUMENTS.map((d) => (
            <Tr key={d.id}>
              <Td><div className="flex items-center gap-2"><FileText size={13} className="text-blue-500 shrink-0" /><span className="text-xs font-medium text-slate-800">{d.name}</span></div></Td>
              <Td>{d.client}</Td>
              <Td>{d.type}</Td>
              <Td><Badge variant={confVariant(d.confidentiality)}>{d.confidentiality}</Badge></Td>
              <Td><Badge variant={docStatusVariant(d.status)}>{d.status}</Badge></Td>
              <Td mono>{d.date}</Td>
              <Td mono>{d.size}</Td>
              <Td>
                <div className="flex gap-1">
                  <Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-base" />
                  <Download size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-base" />
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={DOCUMENTS.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Carregar Documento" size="lg">
        <div className="space-y-4">
          <FileUploadArea label="Arraste o documento aqui ou clique para selecionar" hint="PDF, DOCX, XLSX até 50MB" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cliente"><option>TechCorp Portugal</option><option>Banco Norte</option><option>Saúde Digital</option><option>EnergiaPT</option></Select>
            <Select label="Tipo de Documento"><option>Relatório NIS2</option><option>Relatório de PenTest</option><option>Política</option><option>Inventário de Ativos</option><option>Evidência</option><option>Outro</option></Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Nível de Confidencialidade"><option>Público</option><option>Interno</option><option>Confidencial</option><option>Restrito</option></Select>
            <Select label="Estado"><option>Rascunho</option><option>Em Revisão</option><option>Aprovado</option></Select>
          </div>
          <Input label="Nome do Documento" placeholder="ex: Relatório NIS2 Q2 2025" />
          <Textarea label="Notas" placeholder="Contexto adicional ou observações..." rows={2} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={() => setShowUpload(false)}>Carregar Documento</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── PEDIDOS / TICKETS ─────────────────────────────────────────────────────────
export function MgrRequests() {
  const [selected, setSelected] = useState<typeof REQUESTS[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { from: 'client', text: 'Precisamos de uma análise de vulnerabilidades urgente para o servidor de produção.', time: '2025-06-12 09:15' },
    { from: 'manager', text: 'Recebido. Vou agendar para amanhã de manhã. Pode confirmar o IP do servidor?', time: '2025-06-12 09:42' },
    { from: 'client', text: 'Sim, é o 10.0.1.10 (PRODWEB-01). Obrigado!', time: '2025-06-12 10:03' },
  ]);

  if (selected) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Pedidos / Tickets', onClick: () => setSelected(null) }, { label: selected.id }]} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-400">{selected.id}</span>
                    <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                    <Badge variant={priorityVariant(selected.priority)}>{selected.priority}</Badge>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-display">{selected.title}</h2>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}><ArrowLeft size={13} /> Voltar</Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Histórico de Mensagens" />
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.from === 'manager' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.from === 'manager' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {m.from === 'manager' ? 'G' : 'C'}
                    </div>
                    <div className={`max-w-xs flex flex-col ${m.from === 'manager' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-lg text-xs ${m.from === 'manager' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {m.text}
                      </div>
                      <span className="text-xs text-slate-400 mt-1 font-mono">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-200 pt-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && message.trim()) {
                      setMessages([...messages, { from: 'manager', text: message, time: new Date().toLocaleString('pt-PT') }]);
                      setMessage('');
                    }
                  }}
                />
                <Button onClick={() => {
                  if (message.trim()) {
                    setMessages([...messages, { from: 'manager', text: message, time: new Date().toLocaleString('pt-PT') }]);
                    setMessage('');
                  }
                }}>Enviar</Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Detalhes do Pedido" />
              <div className="space-y-3">
                {[
                  ['Cliente', selected.client], ['Gestor', selected.manager],
                  ['Prioridade', selected.priority], ['Criado em', selected.created],
                  ['Última Atualização', selected.updated],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Anexos" />
              <FileUploadArea label="Arraste ficheiros aqui" hint="Máx. 20MB" />
            </Card>
            <div className="flex flex-col gap-2">
              <Button className="w-full justify-center">Marcar como Resolvido</Button>
              <Button variant="outline" className="w-full justify-center">Fechar Ticket</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Pedidos / Tickets' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Pedidos / Tickets</h1>
        <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Novo Pedido</Button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Abertos" value="4" icon={AlertTriangle} color="red" />
        <StatCard label="Em Progresso" value="3" icon={Clock} color="amber" />
        <StatCard label="Resolvidos" value="12" icon={CheckSquare} color="green" />
        <StatCard label="Tempo Médio" value="4,2 dias" icon={TrendingUp} color="blue" />
      </div>
      <Card padding={false}>
        <Table headers={['ID', 'Título', 'Cliente', 'Estado', 'Prioridade', 'Gestor', 'Criado', 'Atualizado', '']}>
          {REQUESTS.map((r) => (
            <Tr key={r.id} onClick={() => setSelected(r)}>
              <Td mono>{r.id}</Td>
              <Td><span className="font-medium text-slate-800 text-xs">{r.title}</span></Td>
              <Td>{r.client}</Td>
              <Td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></Td>
              <Td><Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge></Td>
              <Td>{r.manager}</Td>
              <Td mono>{r.created}</Td>
              <Td mono>{r.updated}</Td>
              <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 transition-base" /></Td>
            </Tr>
          ))}
        </Table>
        <div className="px-4">
          <Pagination page={1} total={REQUESTS.length} perPage={10} onChange={() => {}} />
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Criar Novo Pedido" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cliente"><option>TechCorp Portugal</option><option>Banco Norte</option></Select>
            <Select label="Prioridade"><option>Alto</option><option>Médio</option><option>Baixo</option></Select>
          </div>
          <Input label="Título" placeholder="Título breve do pedido" />
          <Textarea label="Descrição" placeholder="Descrição detalhada do pedido..." />
          <Select label="Gestor Atribuído"><option>Carlos Mendes</option><option>Sofia Pinto</option></Select>
          <FileUploadArea label="Anexar ficheiros (opcional)" hint="Máx. 20MB" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => setShowCreate(false)}>Criar Pedido</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── IMPORTAÇÃO EXCEL ──────────────────────────────────────────────────────────
export function MgrExcelImport() {
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'confirm' | 'result'>('upload');

  const preview = {
    valid: [
      { row: 2, name: 'PRODWEB-01', type: 'Servidor Web', ip: '10.0.1.10', risk: 'Baixo' },
      { row: 3, name: 'DB-MAIN', type: 'Base de Dados', ip: '10.0.1.20', risk: 'Médio' },
      { row: 4, name: 'FW-PERIMETER', type: 'Firewall', ip: '192.168.1.1', risk: 'Baixo' },
    ],
    invalid: [
      { row: 5, error: "Endereço IP inválido '10.0.1.abc'", raw: 'SWITCH-01, Dispositivo de Rede, 10.0.1.abc, Baixo' },
    ],
    duplicates: [
      { row: 6, reason: 'O ativo PRODWEB-01 já existe', raw: 'PRODWEB-01, Servidor Web, 10.0.1.10, Baixo' },
    ],
  };

  const steps: Array<typeof step> = ['upload', 'validate', 'preview', 'confirm', 'result'];
  const stepLabels = ['Carregar', 'Validar', 'Pré-visualizar', 'Confirmar', 'Resultado'];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Importação Excel' }]} />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Importação de Dados Excel</h1>
        <p className="text-sm text-slate-500">Importar ativos, incidentes ou clientes a partir de uma folha de cálculo Excel</p>
      </div>

      {/* Indicador de passos */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-base ${
              step === s ? 'bg-blue-600 text-white' :
              steps.indexOf(step) > i ? 'text-green-600 bg-green-50 border border-green-200' :
              'text-slate-400 bg-slate-50 border border-slate-200'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === s ? 'bg-white text-blue-600' :
                steps.indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>{i + 1}</span>
              {stepLabels[i]}
            </div>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-slate-300 mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">1. Carregar Ficheiro Excel</h3>
          <FileUploadArea label="Arraste o seu ficheiro Excel aqui ou clique para selecionar" accept=".xlsx,.xls,.csv" hint="Ficheiros .xlsx, .xls, .csv até 10MB" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Select label="Tipo de Importação">
              <option>Ativos Tecnológicos</option>
              <option>Incidentes de Segurança</option>
              <option>Lista de Clientes</option>
            </Select>
            <Select label="Cliente Destino">
              <option>TechCorp Portugal</option>
              <option>Banco Norte</option>
            </Select>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep('validate')}>Carregar e Validar →</Button>
          </div>
        </Card>
      )}

      {step === 'validate' && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">2. A Validar Ficheiro...</h3>
          <div className="space-y-3">
            {[
              'Verificação do formato do ficheiro',
              'Validação dos cabeçalhos das colunas',
              'Verificação dos tipos de dados',
              'Deteção de duplicados',
              'Verificação de regras de negócio',
            ].map((v) => (
              <div key={v} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <CheckSquare size={14} className="text-green-500" />
                <span className="text-sm text-slate-700">{v}</span>
                <Badge variant="success" className="ml-auto">OK</Badge>
              </div>
            ))}
          </div>
          <Alert type="success" message="Ficheiro validado com sucesso. 3 linhas válidas, 1 linha inválida, 1 duplicado encontrado." className="mt-4" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('upload')}>← Voltar</Button>
            <Button onClick={() => setStep('preview')}>Pré-visualizar Dados →</Button>
          </div>
        </Card>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare size={15} className="text-green-600" />
              <h3 className="text-sm font-semibold text-slate-800">Linhas Válidas ({preview.valid.length})</h3>
            </div>
            <Table headers={['Linha', 'Nome', 'Tipo', 'IP', 'Risco']}>
              {preview.valid.map((r) => (
                <Tr key={r.row}>
                  <Td mono>#{r.row}</Td>
                  <Td mono>{r.name}</Td>
                  <Td>{r.type}</Td>
                  <Td mono>{r.ip}</Td>
                  <Td><Badge variant={riskVariant(r.risk)}>{r.risk}</Badge></Td>
                </Tr>
              ))}
            </Table>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} className="text-red-500" />
              <h3 className="text-sm font-semibold text-slate-800">Linhas Inválidas ({preview.invalid.length})</h3>
            </div>
            {preview.invalid.map((r) => (
              <div key={r.row} className="p-3 bg-red-50 border border-red-200 rounded-md text-xs">
                <span className="font-mono text-red-600 mr-2">Linha #{r.row}:</span>
                <span className="text-red-700">{r.error}</span>
                <p className="text-slate-400 mt-1 font-mono">{r.raw}</p>
              </div>
            ))}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-800">Duplicados ({preview.duplicates.length})</h3>
            </div>
            {preview.duplicates.map((r) => (
              <div key={r.row} className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs">
                <span className="font-mono text-amber-700 mr-2">Linha #{r.row}:</span>
                <span className="text-amber-800">{r.reason}</span>
              </div>
            ))}
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('validate')}>← Voltar</Button>
            <Button onClick={() => setStep('confirm')}>Confirmar Importação ({preview.valid.length} linhas) →</Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">4. Confirmar Importação</h3>
          <Alert type="warning" title="Reveja antes de importar" message="Vai importar 3 registos para o inventário de ativos da TechCorp Portugal. As linhas inválidas e duplicadas serão ignoradas." />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600 font-mono">3</p>
              <p className="text-xs text-green-600/80 mt-1">Serão importados</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600 font-mono">1</p>
              <p className="text-xs text-red-600/80 mt-1">Inválidos (ignorados)</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600 font-mono">1</p>
              <p className="text-xs text-amber-600/80 mt-1">Duplicados (ignorados)</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('preview')}>← Voltar</Button>
            <Button onClick={() => setStep('result')}>Confirmar e Importar</Button>
          </div>
        </Card>
      )}

      {step === 'result' && (
        <Card>
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={26} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display mb-2">Importação Concluída</h3>
            <p className="text-sm text-slate-500 mb-6">3 registos importados com sucesso para o inventário de ativos da TechCorp Portugal.</p>
            <div className="flex justify-center gap-8 mb-8">
              {[
                { label: 'Importados', value: '3', color: 'text-green-600' },
                { label: 'Ignorados (inválidos)', value: '1', color: 'text-red-500' },
                { label: 'Ignorados (duplicados)', value: '1', color: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>Importar Outro Ficheiro</Button>
              <Button><Download size={13} /> Descarregar Relatório</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── AVALIAÇÃO DE RISCO ────────────────────────────────────────────────────────
export function MgrRisk() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Avaliação de Risco' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Avaliação de Risco</h1>
        <Button><Plus size={14} /> Nova Avaliação</Button>
      </div>
      <Card padding={false}>
        <Table headers={['Avaliação', 'Cliente', 'Framework', 'Estado', 'Pontuação de Risco', 'Data', '']}>
          {[
            { id: 'AR-2025-05', client: 'TechCorp Portugal', fw: 'ISO 27005', status: 'Concluída', score: 'Baixo (24)', date: '2025-05-20' },
            { id: 'AR-2025-04', client: 'Banco Norte', fw: 'NIST CSF', status: 'Em Progresso', score: 'Médio (52)', date: '2025-06-01' },
            { id: 'AR-2025-03', client: 'Saúde Digital', fw: 'ISO 27005', status: 'Concluída', score: 'Alto (71)', date: '2025-04-15' },
            { id: 'AR-2025-02', client: 'EnergiaPT', fw: 'NIST CSF', status: 'Concluída', score: 'Baixo (18)', date: '2025-03-28' },
          ].map((r) => (
            <Tr key={r.id}>
              <Td mono>{r.id}</Td>
              <Td>{r.client}</Td>
              <Td><Badge variant="info">{r.fw}</Badge></Td>
              <Td><Badge variant={r.status === 'Concluída' ? 'success' : 'warning'}>{r.status}</Badge></Td>
              <Td><Badge variant={r.score.startsWith('Baixo') ? 'success' : r.score.startsWith('Médio') ? 'warning' : 'danger'}>{r.score}</Badge></Td>
              <Td mono>{r.date}</Td>
              <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── CONFORMIDADE NIS2 ─────────────────────────────────────────────────────────
export function MgrNIS2() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Conformidade NIS2' }]} />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Conformidade NIS2</h1>
        <p className="text-sm text-slate-500">Visão geral de todos os clientes</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Em Conformidade" value="2" icon={CheckSquare} color="green" />
        <StatCard label="Em Avaliação" value="2" icon={Clock} color="amber" />
        <StatCard label="Problemas Pendentes" value="1" icon={AlertTriangle} color="red" />
      </div>
      <Card padding={false}>
        <Table headers={['Cliente', 'Pontuação NIS2', 'Estado', 'Última Avaliação', 'Próxima Revisão', 'Ações']}>
          {CLIENTS.map((c) => (
            <Tr key={c.id}>
              <Td><span className="font-medium text-slate-800 text-xs">{c.name}</span></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-slate-100 rounded-full">
                    <div className={`h-full rounded-full ${c.nis2 === 'Em Conformidade' ? 'bg-green-500 w-4/5' : c.nis2 === 'Em Avaliação' ? 'bg-amber-500 w-1/2' : 'bg-red-500 w-1/3'}`} />
                  </div>
                  <span className="text-xs font-mono text-slate-500">{c.nis2 === 'Em Conformidade' ? '88%' : c.nis2 === 'Em Avaliação' ? '52%' : '31%'}</span>
                </div>
              </Td>
              <Td><Badge variant={nis2Variant(c.nis2)}>{c.nis2}</Badge></Td>
              <Td mono>2025-05-20</Td>
              <Td mono>2025-08-20</Td>
              <Td><Button variant="ghost" size="sm"><Eye size={12} /> Consultar</Button></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── ATIVOS TECNOLÓGICOS ───────────────────────────────────────────────────────
export function MgrAssets() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Ativos Tecnológicos' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Ativos Tecnológicos</h1>
        <Button><Plus size={14} /> Adicionar Ativo</Button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total de Ativos" value="47" icon={Package} color="blue" />
        <StatCard label="Alto Risco" value="4" icon={AlertTriangle} color="red" />
        <StatCard label="Última Análise" value="Hoje" icon={Clock} color="green" />
      </div>
      <Card padding={false}>
        <Table headers={['Ativo', 'Cliente', 'Tipo', 'IP / Identificador', 'SO', 'Risco', 'Última Análise']}>
          {[
            { name: 'PRODWEB-01', client: 'TechCorp', type: 'Servidor Web', ip: '10.0.1.10', os: 'Ubuntu 22.04', risk: 'Baixo', scan: '2025-06-10' },
            { name: 'DB-MAIN', client: 'TechCorp', type: 'Base de Dados', ip: '10.0.1.20', os: 'PostgreSQL 15', risk: 'Médio', scan: '2025-06-08' },
            { name: 'VPN-GW-01', client: 'Banco Norte', type: 'Gateway VPN', ip: '203.0.113.1', os: 'OpenVPN', risk: 'Alto', scan: '2025-06-05' },
            { name: 'MAIL-RELAY', client: 'Saúde Digital', type: 'Servidor de Email', ip: '10.2.0.5', os: 'Postfix 3.6', risk: 'Médio', scan: '2025-06-07' },
          ].map((a) => (
            <Tr key={a.name}>
              <Td mono>{a.name}</Td>
              <Td>{a.client}</Td>
              <Td>{a.type}</Td>
              <Td mono>{a.ip}</Td>
              <Td>{a.os}</Td>
              <Td><Badge variant={riskVariant(a.risk)}>{a.risk}</Badge></Td>
              <Td mono>{a.scan}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── RELATÓRIOS ────────────────────────────────────────────────────────────────
export function MgrReports() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Relatórios' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Relatórios</h1>
        <Button><Plus size={14} /> Gerar Relatório</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Resumo de Segurança Q2 2025', client: 'TechCorp Portugal', type: 'Trimestral', date: '2025-06-10', size: '4,2 MB' },
          { title: 'Relatório de Auditoria de Conformidade NIS2', client: 'Banco Norte', type: 'Conformidade', date: '2025-06-05', size: '2,8 MB' },
          { title: 'Resultados do PenTest — App Web', client: 'Saúde Digital', type: 'PenTest', date: '2025-05-28', size: '6,1 MB' },
          { title: 'Resumo de Avaliação de Risco', client: 'EnergiaPT', type: 'Risco', date: '2025-05-20', size: '1,9 MB' },
          { title: 'Relatório do Incidente INC-0047', client: 'Banco Norte', type: 'Incidente', date: '2025-06-11', size: '890 KB' },
          { title: 'Revisão Anual de Segurança 2024', client: 'TechCorp Portugal', type: 'Anual', date: '2025-01-15', size: '8,4 MB' },
        ].map((r) => (
          <Card key={r.title} className="hover:shadow-md transition-base">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><FileText size={16} className="text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 mb-1 leading-snug">{r.title}</p>
                <p className="text-xs text-slate-400">{r.client}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info">{r.type}</Badge>
                  <span className="text-xs text-slate-400 font-mono">{r.size}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" className="flex-1 justify-center"><Eye size={12} /> Consultar</Button>
              <Button variant="ghost" size="sm" className="flex-1 justify-center"><Download size={12} /> Descarregar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── TESTES DE PENETRAÇÃO ──────────────────────────────────────────────────────
export function MgrPentests() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Testes de Penetração' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Testes de Penetração</h1>
        <Button><Plus size={14} /> Agendar PenTest</Button>
      </div>
      <Card padding={false}>
        <Table headers={['ID', 'Cliente', 'Tipo', 'Âmbito', 'Estado', 'Data', 'Críticos', 'Altos', '']}>
          {[
            { id: 'PT-0012', client: 'TechCorp', type: 'Externo', scope: 'Aplicação Web', status: 'Concluído', date: '2025-03-15', crit: 2, high: 5 },
            { id: 'PT-0011', client: 'Banco Norte', type: 'Interno', scope: 'Rede', status: 'Concluído', date: '2025-01-20', crit: 0, high: 3 },
            { id: 'PT-0010', client: 'Saúde Digital', type: 'Eng. Social', scope: 'Phishing', status: 'Agendado', date: '2025-07-01', crit: 0, high: 0 },
            { id: 'PT-0009', client: 'EnergiaPT', type: 'Externo', scope: 'Âmbito Total', status: 'Em Progresso', date: '2025-06-01', crit: 1, high: 2 },
          ].map((p) => (
            <Tr key={p.id}>
              <Td mono>{p.id}</Td>
              <Td>{p.client}</Td>
              <Td><Badge variant="info">{p.type}</Badge></Td>
              <Td>{p.scope}</Td>
              <Td><Badge variant={p.status === 'Concluído' ? 'success' : p.status === 'Agendado' ? 'neutral' : 'warning'}>{p.status}</Badge></Td>
              <Td mono>{p.date}</Td>
              <Td><span className={`font-mono text-xs font-semibold ${p.crit > 0 ? 'text-red-600' : 'text-slate-400'}`}>{p.crit}</span></Td>
              <Td><span className={`font-mono text-xs font-semibold ${p.high > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{p.high}</span></Td>
              <Td><Eye size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── EVIDÊNCIAS ────────────────────────────────────────────────────────────────
export function MgrEvidence() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Gestor' }, { label: 'Evidências' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Evidências</h1>
        <Button><Upload size={14} /> Carregar Evidência</Button>
      </div>
      <FileUploadArea label="Arraste ficheiros de evidência aqui (capturas de ecrã, logs, exportações)" hint="Suportado: PDF, PNG, JPG, XLSX, CSV, ZIP · Máx. 50MB" />
      <div className="mt-6">
        <Card padding={false}>
          <Table headers={['Ficheiro', 'Cliente', 'Incidente', 'Tipo', 'Carregado por', 'Data', '']}>
            {[
              { file: 'captura_falha_login.png', client: 'Banco Norte', incident: 'INC-0047', type: 'Captura de Ecrã', by: 'Carlos Mendes', date: '2025-06-10' },
              { file: 'exportacao_log_auth.csv', client: 'Banco Norte', incident: 'INC-0047', type: 'Exportação de Log', by: 'Carlos Mendes', date: '2025-06-10' },
              { file: 'captura_rede.pcap', client: 'TechCorp', incident: 'INC-0046', type: 'Captura de Rede', by: 'Sofia Pinto', date: '2025-06-09' },
            ].map((e) => (
              <Tr key={e.file}>
                <Td><div className="flex items-center gap-2"><FileCheck size={13} className="text-green-600" /><span className="font-mono text-xs text-slate-800">{e.file}</span></div></Td>
                <Td>{e.client}</Td>
                <Td mono>{e.incident}</Td>
                <Td>{e.type}</Td>
                <Td>{e.by}</Td>
                <Td mono>{e.date}</Td>
                <Td><Download size={13} className="text-slate-400 hover:text-blue-600 cursor-pointer" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
