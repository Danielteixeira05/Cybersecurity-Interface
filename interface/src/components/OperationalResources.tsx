import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Power, Search, X } from 'lucide-react';
import {
  ativosApi, ativoDetalheApi, atualizarAtivoApi, atualizarIncidenteApi, clientesApi,
  criarAtivoApi, criarIncidenteApi, incidenteDetalheApi, incidentesApi,
  type ApiAtivo, type ApiCliente, type ApiIncidente, type CriarAtivoPayload,
  type CriarIncidentePayload, type FiltrosAtivos, type FiltrosIncidentes,
} from '../apiClient';

type OperationalRole = 'admin' | 'manager' | 'client';

const CRITICALITIES = ['RESIDUAL', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const INCIDENT_STATES = ['ABERTO', 'EM_ANALISE', 'ENCERRADO'];

function label(value?: string | null) {
  return (value || '—').split('_').join(' ');
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-PT');
}

function dateTimeValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function badgeClass(value?: string | null) {
  const key = (value || '').toUpperCase();
  if (key.includes('CRIT') || key.includes('ALTA')) return 'bg-rose-100 text-rose-700';
  if (key.includes('MEDIA') || key.includes('ANALISE')) return 'bg-amber-100 text-amber-700';
  if (key.includes('ENCERR')) return 'bg-emerald-100 text-emerald-700';
  if (key.includes('BAIXA') || key.includes('RESIDUAL')) return 'bg-sky-100 text-sky-700';
  return 'bg-slate-100 text-slate-700';
}

function Input({ label: inputLabel, value, onChange, required, type = 'text', placeholder }: { label: string; value: string | number; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{inputLabel}<input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}

function Select({ label: selectLabel, value, onChange, children, disabled = false }: { label: string; value: string | number; onChange: (value: string) => void; children: React.ReactNode; disabled?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700">{selectLabel}<select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50">{children}</select></label>;
}

function Notice({ value, tone = 'error' }: { value: string | null; tone?: 'error' | 'success' }) {
  if (!value) return null;
  return <p role="status" className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{value}</p>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>;
}

type AssetDraft = Required<Pick<CriarAtivoPayload, 'cliente_id' | 'nome' | 'criticidade'>> & Omit<CriarAtivoPayload, 'cliente_id' | 'nome' | 'criticidade'> & { ativo: boolean };

function emptyAsset(clientId?: number): AssetDraft {
  return { cliente_id: clientId ?? 0, nome: '', tipo_equipamento: '', numero_inventario: '', sistema_operativo: '', criticidade: 'MEDIA', endereco_ip: '', endereco_mac: '', fqdn: '', tipologia: '', modelo_versao: '', numero_serie: '', fabricante: '', localizacao: '', observacoes: '', comunicado_cncs: false, programa_gestao_risco: false, ativo: true };
}

export function AssetsWorkspace({ role, clientId, title = 'Ativos Tecnológicos', subtitle, compact = false, onChanged }: { role: OperationalRole; clientId?: number; title?: string; subtitle?: string; compact?: boolean; onChanged?: () => void }) {
  const canManage = role !== 'client';
  const [items, setItems] = useState<ApiAtivo[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [filters, setFilters] = useState<FiltrosAtivos>({ cliente_id: clientId, q: '', criticidade: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(() => emptyAsset(clientId));
  const [editing, setEditing] = useState<ApiAtivo | null>(null);
  const [selected, setSelected] = useState<ApiAtivo | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (next = filters) => {
    setLoading(true); setError(null);
    try {
      const [assets, availableClients] = await Promise.all([ativosApi(next), clientesApi()]);
      setItems(assets); setClients(availableClients);
      if (!clientId && !draft.cliente_id && availableClients[0]) setDraft((current) => ({ ...current, cliente_id: availableClients[0].id }));
    } catch (cause: any) { setError(cause?.message || 'Não foi possível carregar os ativos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load({ cliente_id: clientId, q: '', criticidade: '' }); }, [clientId]);

  const openCreate = () => { setEditing(null); setDraft(emptyAsset(clientId || clients[0]?.id)); setError(null); setSuccess(null); setFormOpen(true); };
  const openEdit = (asset: ApiAtivo) => {
    setEditing(asset);
    setDraft({ ...emptyAsset(asset.cliente_id), ...asset, cliente_id: asset.cliente_id, nome: asset.nome, criticidade: asset.criticidade || asset.criticalidade || 'MEDIA', tipo_equipamento: asset.tipo_equipamento || asset.tipo || '', ativo: asset.ativo !== false });
    setError(null); setSuccess(null); setFormOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = { ...draft, cliente_id: Number(draft.cliente_id) };
      if (editing) await atualizarAtivoApi(editing.id, payload);
      else await criarAtivoApi(payload);
      setFormOpen(false); setSuccess(editing ? 'Ativo atualizado com sucesso.' : 'Ativo criado com sucesso.');
      await load(); onChanged?.();
    } catch (cause: any) { setError(cause?.message || 'Não foi possível guardar o ativo.'); }
    finally { setSaving(false); }
  };
  const deactivate = async (asset: ApiAtivo) => {
    setError(null); setSuccess(null);
    try { await atualizarAtivoApi(asset.id, { ativo: false }); setSuccess('Ativo desativado com sucesso.'); await load(); onChanged?.(); }
    catch (cause: any) { setError(cause?.message || 'Não foi possível desativar o ativo.'); }
  };
  const inspect = async (asset: ApiAtivo) => {
    setError(null);
    try { setSelected(await ativoDetalheApi(asset.id)); } catch (cause: any) { setError(cause?.message || 'Não foi possível abrir o ativo.'); }
  };

  return <section className={compact ? '' : 'space-y-5'}>
    <div className={`flex flex-wrap items-end justify-between gap-4 ${compact ? 'mb-4' : ''}`}><div>{compact ? <h2 className="font-display text-lg font-semibold text-slate-950">{title}</h2> : <h1 className="font-display text-2xl font-semibold text-slate-950">{title}</h1>}<p className="mt-1 text-sm text-slate-500">{subtitle ?? `${items.length} ativos tecnológicos disponíveis`}</p></div>{canManage && <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Plus size={16} />Novo Ativo</button>}</div>
    <Notice value={error} /> <Notice value={success} tone="success" />
    <Panel>
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500"><Search size={16} /><input value={filters.q || ''} onChange={(event) => setFilters({ ...filters, q: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="Pesquisar ativos..." className="w-full bg-transparent outline-none" /></label>
        {!clientId && <Select label="Cliente" value={filters.cliente_id || ''} onChange={(value) => setFilters({ ...filters, cliente_id: value ? Number(value) : undefined })}><option value="">Todos os clientes</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</Select>}
        <Select label="Criticidade" value={filters.criticidade || ''} onChange={(value) => setFilters({ ...filters, criticidade: value || undefined })}><option value="">Todas</option>{CRITICALITIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select>
        <button onClick={() => void load()} className="self-end rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Filtrar</button>
      </div>
      {loading ? <Empty text="A carregar ativos..." /> : items.length === 0 ? <Empty text="Sem ativos tecnológicos disponíveis." /> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Ativo</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Tipo / Plataforma</th><th className="px-4 py-3">IP / Identificador</th><th className="px-4 py-3">Criticidade</th><th className="px-4 py-3">Atualizado</th><th className="px-4 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((asset) => <tr key={asset.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{asset.nome}</td><td className="px-4 py-3 text-slate-600">{asset.cliente_nome || '—'}</td><td className="px-4 py-3 text-slate-600"><div>{asset.tipo_equipamento || asset.tipo || '—'}</div><div className="text-xs text-slate-400">{asset.sistema_operativo || '—'}</div></td><td className="px-4 py-3 font-mono text-xs text-slate-600"><div>{asset.endereco_ip || '—'}</div><div className="text-slate-400">{asset.numero_inventario || asset.fqdn || '—'}</div></td><td className="px-4 py-3"><span className={`badge ${badgeClass(asset.criticidade || asset.criticalidade)}`}>{label(asset.criticidade || asset.criticalidade)}</span></td><td className="px-4 py-3 text-xs text-slate-500">{formatDate(asset.atualizado_em || asset.criado_em)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button title="Ver detalhe" aria-label={`Ver detalhe de ${asset.nome}`} onClick={() => void inspect(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"><Eye size={16} /></button>{canManage && <><button title="Editar" aria-label={`Editar ${asset.nome}`} onClick={() => openEdit(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"><Pencil size={16} /></button><button title="Desativar" aria-label={`Desativar ${asset.nome}`} onClick={() => void deactivate(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Power size={16} /></button></>}</div></td></tr>)}</tbody></table></div>}
    </Panel>
    {formOpen && <div role="dialog" aria-modal="true" aria-label={editing ? 'Editar ativo' : 'Novo ativo'} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><form onSubmit={submit} className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold text-slate-950">{editing ? 'Editar Ativo' : 'Novo Ativo'}</h2><p className="mt-1 text-sm text-slate-500">Os campos marcados são obrigatórios.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><div className="grid gap-4 md:grid-cols-2"><Select label="Cliente" value={draft.cliente_id || ''} disabled={!!clientId} onChange={(value) => setDraft({ ...draft, cliente_id: Number(value) })}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</Select><Input label="Nome" required value={draft.nome} onChange={(value) => setDraft({ ...draft, nome: value })} /><Input label="Tipo de equipamento" value={draft.tipo_equipamento || ''} onChange={(value) => setDraft({ ...draft, tipo_equipamento: value })} /><Input label="Número de inventário" value={draft.numero_inventario || ''} onChange={(value) => setDraft({ ...draft, numero_inventario: value })} /><Input label="Endereço IP" value={draft.endereco_ip || ''} onChange={(value) => setDraft({ ...draft, endereco_ip: value })} placeholder="192.0.2.10" /><Input label="Sistema / plataforma" value={draft.sistema_operativo || ''} onChange={(value) => setDraft({ ...draft, sistema_operativo: value })} /><Select label="Criticidade" value={draft.criticidade} onChange={(value) => setDraft({ ...draft, criticidade: value })}>{CRITICALITIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select><Input label="FQDN" value={draft.fqdn || ''} onChange={(value) => setDraft({ ...draft, fqdn: value })} /><Input label="Fabricante" value={draft.fabricante || ''} onChange={(value) => setDraft({ ...draft, fabricante: value })} /><Input label="Modelo / versão" value={draft.modelo_versao || ''} onChange={(value) => setDraft({ ...draft, modelo_versao: value })} /></div><label className="mt-4 block text-sm font-medium text-slate-700">Observações<textarea value={draft.observacoes || ''} onChange={(event) => setDraft({ ...draft, observacoes: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.comunicado_cncs || false} onChange={(event) => setDraft({ ...draft, comunicado_cncs: event.target.checked })} />Comunicado CNCS</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.programa_gestao_risco || false} onChange={(event) => setDraft({ ...draft, programa_gestao_risco: event.target.checked })} />Programa de gestão de risco</label>{editing && <label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.ativo} onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })} />Ativo</label>}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button><button disabled={saving || !draft.cliente_id} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button></div></form></div>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Detalhe do ativo" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><div className="mx-auto my-12 max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold text-slate-950">{selected.nome}</h2><p className="mt-1 text-sm text-slate-500">{selected.cliente_nome || '—'}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Tipo</dt><dd className="mt-1 font-medium text-slate-900">{selected.tipo_equipamento || selected.tipo || '—'}</dd></div><div><dt className="text-slate-500">Criticidade</dt><dd className="mt-1"><span className={`badge ${badgeClass(selected.criticidade || selected.criticalidade)}`}>{label(selected.criticidade || selected.criticalidade)}</span></dd></div><div><dt className="text-slate-500">IP / FQDN</dt><dd className="mt-1 font-mono text-slate-900">{selected.endereco_ip || selected.fqdn || '—'}</dd></div><div><dt className="text-slate-500">Inventário</dt><dd className="mt-1 font-medium text-slate-900">{selected.numero_inventario || '—'}</dd></div><div><dt className="text-slate-500">Sistema</dt><dd className="mt-1 font-medium text-slate-900">{selected.sistema_operativo || '—'}</dd></div><div><dt className="text-slate-500">Atualizado</dt><dd className="mt-1 font-medium text-slate-900">{formatDate(selected.atualizado_em || selected.criado_em)}</dd></div></dl>{selected.observacoes && <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-700"><p className="font-medium text-slate-900">Observações</p><p className="mt-1 whitespace-pre-wrap">{selected.observacoes}</p></div>}</div></div>}
  </section>;
}

type IncidentDraft = Required<Pick<CriarIncidentePayload, 'cliente_id' | 'codigo' | 'data_hora_incidente' | 'tipo_incidente' | 'descricao' | 'gravidade'>> & Omit<CriarIncidentePayload, 'cliente_id' | 'codigo' | 'data_hora_incidente' | 'tipo_incidente' | 'descricao' | 'gravidade'> & { ativo: boolean; encerrado_em?: string | null };

function emptyIncident(clientId?: number): IncidentDraft {
  return { cliente_id: clientId ?? 0, codigo: '', data_hora_incidente: dateTimeValue(new Date().toISOString()), tipo_incidente: '', descricao: '', gravidade: 'MEDIA', estado: 'ABERTO', departamento: '', utilizadores_afetados: 0, dados_comprometidos: false, sistemas_afetados: '', origem_ataque: '', ip_atacante: '', resposta_imediata: '', medidas_corretivas: '', recomendacoes: '', ativo: true, encerrado_em: null };
}

export function IncidentsWorkspace({ role, clientId, title = 'Incidentes de Segurança', subtitle, compact = false, onChanged }: { role: OperationalRole; clientId?: number; title?: string; subtitle?: string; compact?: boolean; onChanged?: () => void }) {
  const canManage = role !== 'client';
  const [items, setItems] = useState<ApiIncidente[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [filters, setFilters] = useState<FiltrosIncidentes>({ cliente_id: clientId, q: '', estado: '', gravidade: '', de: '', ate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<IncidentDraft>(() => emptyIncident(clientId));
  const [editing, setEditing] = useState<ApiIncidente | null>(null);
  const [selected, setSelected] = useState<ApiIncidente | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (next = filters) => {
    setLoading(true); setError(null);
    try {
      const [incidents, availableClients] = await Promise.all([incidentesApi(next), clientesApi()]);
      setItems(incidents); setClients(availableClients);
      if (!clientId && !draft.cliente_id && availableClients[0]) setDraft((current) => ({ ...current, cliente_id: availableClients[0].id }));
    } catch (cause: any) { setError(cause?.message || 'Não foi possível carregar os incidentes.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load({ cliente_id: clientId, q: '', estado: '', gravidade: '', de: '', ate: '' }); }, [clientId]);
  const openCreate = () => { setEditing(null); setDraft(emptyIncident(clientId || clients[0]?.id)); setError(null); setSuccess(null); setFormOpen(true); };
  const openEdit = (incident: ApiIncidente) => {
    setEditing(incident);
    setDraft({ ...emptyIncident(incident.cliente_id), ...incident, cliente_id: incident.cliente_id, codigo: incident.codigo || '', data_hora_incidente: dateTimeValue(incident.data_hora_incidente || incident.detetado_em), tipo_incidente: incident.tipo_incidente || incident.tipo || incident.titulo, descricao: incident.descricao || '', gravidade: incident.gravidade || incident.severidade || 'MEDIA', estado: incident.estado || 'ABERTO', utilizadores_afetados: incident.utilizadores_afetados || 0, dados_comprometidos: incident.dados_comprometidos || false, ativo: incident.ativo !== false, encerrado_em: dateTimeValue(incident.encerrado_em || incident.resolvido_em) || null });
    setError(null); setSuccess(null); setFormOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = { ...draft, cliente_id: Number(draft.cliente_id), utilizadores_afetados: Number(draft.utilizadores_afetados), data_hora_incidente: new Date(draft.data_hora_incidente).toISOString(), encerrado_em: draft.encerrado_em ? new Date(draft.encerrado_em).toISOString() : null };
      if (editing) await atualizarIncidenteApi(editing.id, payload);
      else await criarIncidenteApi(payload);
      setFormOpen(false); setSuccess(editing ? 'Incidente atualizado com sucesso.' : 'Incidente reportado com sucesso.'); await load(); onChanged?.();
    } catch (cause: any) { setError(cause?.message || 'Não foi possível guardar o incidente.'); }
    finally { setSaving(false); }
  };
  const deactivate = async (incident: ApiIncidente) => {
    setError(null); setSuccess(null);
    try { await atualizarIncidenteApi(incident.id, { ativo: false }); setSuccess('Incidente desativado com sucesso.'); await load(); onChanged?.(); }
    catch (cause: any) { setError(cause?.message || 'Não foi possível desativar o incidente.'); }
  };
  const inspect = async (incident: ApiIncidente) => { setError(null); try { setSelected(await incidenteDetalheApi(incident.id)); } catch (cause: any) { setError(cause?.message || 'Não foi possível abrir o incidente.'); } };
  const openCount = items.filter((incident) => incident.estado !== 'ENCERRADO').length;

  return <section className={compact ? '' : 'space-y-5'}>
    <div className={`flex flex-wrap items-end justify-between gap-4 ${compact ? 'mb-4' : ''}`}><div>{compact ? <h2 className="font-display text-lg font-semibold text-slate-950">{title}</h2> : <h1 className="font-display text-2xl font-semibold text-slate-950">{title}</h1>}<p className="mt-1 text-sm text-slate-500">{subtitle ?? `${openCount} abertos / ${items.length} total`}</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"><Plus size={16} />Reportar Incidente</button></div>
    <Notice value={error} /> <Notice value={success} tone="success" />
    <Panel><div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_180px_160px_160px_150px_150px_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500"><Search size={16} /><input value={filters.q || ''} onChange={(event) => setFilters({ ...filters, q: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="Pesquisar incidentes..." className="w-full bg-transparent outline-none" /></label>{!clientId && <Select label="Cliente" value={filters.cliente_id || ''} onChange={(value) => setFilters({ ...filters, cliente_id: value ? Number(value) : undefined })}><option value="">Todos os clientes</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</Select>}<Select label="Estado" value={filters.estado || ''} onChange={(value) => setFilters({ ...filters, estado: value || undefined })}><option value="">Todos</option>{INCIDENT_STATES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select><Select label="Gravidade" value={filters.gravidade || ''} onChange={(value) => setFilters({ ...filters, gravidade: value || undefined })}><option value="">Todas</option>{CRITICALITIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select><Input label="De" type="date" value={filters.de || ''} onChange={(value) => setFilters({ ...filters, de: value || undefined })} /><Input label="Até" type="date" value={filters.ate || ''} onChange={(value) => setFilters({ ...filters, ate: value || undefined })} /><button onClick={() => void load()} className="self-end rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Filtrar</button></div>{loading ? <Empty text="A carregar incidentes..." /> : items.length === 0 ? <Empty text="Sem incidentes disponíveis." /> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Código / Incidente</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Gravidade</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Deteção</th><th className="px-4 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((incident) => <tr key={incident.id} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-mono text-xs text-slate-500">{incident.codigo || `#${incident.id}`}</div><div className="font-medium text-slate-900">{incident.titulo}</div></td><td className="px-4 py-3 text-slate-600">{incident.cliente_nome || '—'}</td><td className="px-4 py-3"><span className={`badge ${badgeClass(incident.gravidade || incident.severidade)}`}>{label(incident.gravidade || incident.severidade)}</span></td><td className="px-4 py-3"><span className={`badge ${badgeClass(incident.estado)}`}>{label(incident.estado)}</span></td><td className="px-4 py-3 text-xs text-slate-500">{formatDate(incident.data_hora_incidente || incident.detetado_em)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button title="Ver detalhe" aria-label={`Ver detalhe de ${incident.titulo}`} onClick={() => void inspect(incident)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"><Eye size={16} /></button>{canManage && <><button title="Editar" aria-label={`Editar ${incident.titulo}`} onClick={() => openEdit(incident)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"><Pencil size={16} /></button><button title="Desativar" aria-label={`Desativar ${incident.titulo}`} onClick={() => void deactivate(incident)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Power size={16} /></button></>}</div></td></tr>)}</tbody></table></div>}</Panel>
    {formOpen && <div role="dialog" aria-modal="true" aria-label={editing ? 'Editar incidente' : 'Reportar incidente'} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><form onSubmit={submit} className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold text-slate-950">{editing ? 'Editar Incidente' : 'Reportar Incidente'}</h2><p className="mt-1 text-sm text-slate-500">A associação ao cliente e os campos principais são obrigatórios.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><div className="grid gap-4 md:grid-cols-2"><Select label="Cliente" value={draft.cliente_id || ''} disabled={!!clientId} onChange={(value) => setDraft({ ...draft, cliente_id: Number(value) })}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</Select><Input label="Código" required value={draft.codigo} onChange={(value) => setDraft({ ...draft, codigo: value })} placeholder="INC-2026-001" /><Input label="Tipo" required value={draft.tipo_incidente} onChange={(value) => setDraft({ ...draft, tipo_incidente: value })} /><Input label="Data e hora de deteção" required type="datetime-local" value={draft.data_hora_incidente} onChange={(value) => setDraft({ ...draft, data_hora_incidente: value })} /><Select label="Gravidade" value={draft.gravidade} onChange={(value) => setDraft({ ...draft, gravidade: value })}>{CRITICALITIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select>{canManage && <Select label="Estado" value={draft.estado || 'ABERTO'} onChange={(value) => setDraft({ ...draft, estado: value })}>{INCIDENT_STATES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</Select>}<Input label="Departamento" value={draft.departamento || ''} onChange={(value) => setDraft({ ...draft, departamento: value })} /><Input label="Utilizadores afetados" type="number" value={draft.utilizadores_afetados ?? 0} onChange={(value) => setDraft({ ...draft, utilizadores_afetados: Number(value) })} /></div><label className="mt-4 block text-sm font-medium text-slate-700">Descrição<textarea required value={draft.descricao} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100" /></label><div className="mt-4 grid gap-4 md:grid-cols-2"><Input label="Sistemas afetados" value={draft.sistemas_afetados || ''} onChange={(value) => setDraft({ ...draft, sistemas_afetados: value })} /><Input label="IP do atacante" value={draft.ip_atacante || ''} onChange={(value) => setDraft({ ...draft, ip_atacante: value })} />{canManage && <Input label="Data de encerramento" type="datetime-local" value={draft.encerrado_em || ''} onChange={(value) => setDraft({ ...draft, encerrado_em: value || null })} />}</div><label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.dados_comprometidos || false} onChange={(event) => setDraft({ ...draft, dados_comprometidos: event.target.checked })} />Dados comprometidos</label>{editing && canManage && <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.ativo} onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })} />Incidente ativo</label>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button><button disabled={saving || !draft.cliente_id} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A guardar...' : editing ? 'Guardar alterações' : 'Reportar incidente'}</button></div></form></div>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Detalhe do incidente" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><div className="mx-auto my-12 max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-slate-500">{selected.codigo || `#${selected.id}`}</p><h2 className="font-display text-xl font-semibold text-slate-950">{selected.titulo}</h2><p className="mt-1 text-sm text-slate-500">{selected.cliente_nome || '—'}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Gravidade</dt><dd className="mt-1"><span className={`badge ${badgeClass(selected.gravidade || selected.severidade)}`}>{label(selected.gravidade || selected.severidade)}</span></dd></div><div><dt className="text-slate-500">Estado</dt><dd className="mt-1"><span className={`badge ${badgeClass(selected.estado)}`}>{label(selected.estado)}</span></dd></div><div><dt className="text-slate-500">Deteção</dt><dd className="mt-1 font-medium text-slate-900">{formatDate(selected.data_hora_incidente || selected.detetado_em)}</dd></div><div><dt className="text-slate-500">Encerramento</dt><dd className="mt-1 font-medium text-slate-900">{formatDate(selected.encerrado_em || selected.resolvido_em)}</dd></div></dl><div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-700"><p className="font-medium text-slate-900">Descrição</p><p className="mt-1 whitespace-pre-wrap">{selected.descricao || '—'}</p></div>{selected.sistemas_afetados && <div className="mt-4 text-sm text-slate-700"><p className="font-medium text-slate-900">Sistemas afetados</p><p className="mt-1 whitespace-pre-wrap">{selected.sistemas_afetados}</p></div>}</div></div>}
  </section>;
}
