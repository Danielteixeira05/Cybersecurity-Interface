import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Download, Eye, FilePlus2, FileText, History, LoaderCircle, RefreshCw, Search, Settings2, ShieldCheck, Upload, X } from 'lucide-react';
import {
  configuracaoDocumentosApi,
  descarregarDocumentoApi,
  desativarDocumentoApi,
  documentoDetalheApi,
  documentosApi,
  reverDocumentoApi,
  submeterDocumentoApi,
  submeterVersaoDocumentoApi,
  atualizarLimiteUploadDocumentosApi,
  clientesApi,
  type ApiCliente,
  type ApiConfiguracaoDocumentos,
  type ApiDocumento,
  type ApiDocumentoDetalhe,
  type FiltrosDocumentos,
} from '../apiClient';
import { DOCUMENT_CHANGED_EVENT } from '../realtime';

type DocumentRole = 'admin' | 'manager' | 'client';

type DocumentsWorkspaceProps = {
  role: DocumentRole;
  title?: string;
  subtitle?: string;
  clientId?: number;
  compact?: boolean;
  /** Limita a vista a categorias reais de documentos sem alargar as permissões da API. */
  categoryScope?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
};

const FALLBACK_CONFIG: ApiConfiguracaoDocumentos = {
  max_upload_mb: 10,
  categorias: [],
  estados: ['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES'],
};

function labelFor(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
}

function formatBytes(value: number | null | undefined) {
  if (!value) return '—';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function stateClass(value: string | null | undefined) {
  if (value === 'APROVADO') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (value === 'REJEITADO') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (value === 'REQUER_ALTERACOES') return 'bg-amber-50 text-amber-800 ring-amber-200';
  if (value === 'EM_ANALISE') return 'bg-sky-50 text-sky-700 ring-sky-200';
  return 'bg-violet-50 text-violet-700 ring-violet-200';
}

function errorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  return error instanceof Error && error.message ? error.message : fallback;
}

function saveDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EmptyState({ role, title, description }: { role: DocumentRole; title?: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <FileText className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title || 'Ainda não existem documentos'}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        {description || (role === 'client' ? 'Quando submeter documentos para a sua organização, estes aparecerão aqui.' : 'Os documentos das organizações autorizadas aparecerão aqui assim que forem submetidos.')}
      </p>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" role="presentation" onMouseDown={onClose}>
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="documents-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="documents-modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar"><X size={19} /></button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

export function DocumentsWorkspace({ role, title, subtitle, clientId, compact = false, categoryScope, emptyTitle, emptyDescription }: DocumentsWorkspaceProps) {
  const [documents, setDocuments] = useState<ApiDocumento[]>([]);
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [config, setConfig] = useState<ApiConfiguracaoDocumentos>(FALLBACK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltrosDocumentos>(clientId ? { cliente_id: clientId } : {});
  const [draftFilters, setDraftFilters] = useState<FiltrosDocumentos>(clientId ? { cliente_id: clientId } : {});
  const [selected, setSelected] = useState<ApiDocumentoDetalhe | null>(null);
  const [uploadTarget, setUploadTarget] = useState<ApiDocumento | null | 'new'>(null);
  const [reviewTarget, setReviewTarget] = useState<ApiDocumento | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadLimitDraft, setUploadLimitDraft] = useState('');
  const [savingUploadLimit, setSavingUploadLimit] = useState(false);

  const scopedCategories = useMemo(() => Array.from(new Set(
    (categoryScope ?? []).map((category) => category.trim().toUpperCase()).filter(Boolean),
  )), [categoryScope]);
  const requestFilters = useMemo(() => (
    scopedCategories.length === 1 ? { ...filters, categoria: scopedCategories[0] } : filters
  ), [filters, scopedCategories]);

  const pageTitle = title || (role === 'admin' ? 'Documentos da Plataforma' : role === 'manager' ? 'Documentos dos Clientes' : 'Os Meus Documentos');
  const pageSubtitle = subtitle || (role === 'client' ? 'Documentos privados associados à sua organização.' : 'Documentos das organizações a que tem acesso.');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks: [Promise<ApiDocumento[]>, Promise<ApiConfiguracaoDocumentos>, Promise<ApiCliente[]>?] = [documentosApi(requestFilters), configuracaoDocumentosApi()];
      if (role !== 'client' && !clientId) tasks[2] = clientesApi();
      const [rows, nextConfig, availableClients] = await Promise.all(tasks);
      setDocuments(rows);
      setConfig(nextConfig);
      if (availableClients) setClients(availableClients);
    } catch (cause) {
      setError(errorMessage(cause, 'Não foi possível carregar os documentos.'));
    } finally {
      setLoading(false);
    }
  }, [clientId, requestFilters, role]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    setUploadLimitDraft(String(config.configured_upload_mb ?? config.max_upload_mb));
  }, [config.configured_upload_mb, config.max_upload_mb]);
  useEffect(() => {
    const refresh = () => { void reload(); };
    window.addEventListener(DOCUMENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DOCUMENT_CHANGED_EVENT, refresh);
  }, [reload]);

  const visibleClients = useMemo(() => clients.filter((client) => client.ativo !== false), [clients]);
  const categories = scopedCategories.length ? scopedCategories : (config.categorias.length ? config.categorias : Array.from(new Set(documents.map((document) => document.categoria).filter((value): value is string => Boolean(value)))));
  const visibleDocuments = useMemo(() => (
    scopedCategories.length
      ? documents.filter((document) => document.categoria ? scopedCategories.includes(document.categoria.toUpperCase()) : false)
      : documents
  ), [documents, scopedCategories]);
  const canSubmit = true;
  const canReview = role === 'manager' || role === 'admin';

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const next = { ...draftFilters, ...(clientId ? { cliente_id: clientId } : {}) };
    setFilters(next);
  };

  const openDetail = async (document: ApiDocumento) => {
    setBusy(true);
    setActionError(null);
    try {
      setSelected(await documentoDetalheApi(document.id));
    } catch (cause) {
      setActionError(errorMessage(cause, 'Não foi possível abrir o documento.'));
    } finally {
      setBusy(false);
    }
  };

  const download = async (document: ApiDocumento) => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await descarregarDocumentoApi(document.id);
      saveDownload(result.blob, result.filename);
    } catch (cause) {
      setActionError(errorMessage(cause, 'Não foi possível descarregar o documento.'));
    } finally {
      setBusy(false);
    }
  };

  const onUploaded = async () => {
    setUploadTarget(null);
    await reload();
  };

  const onReviewed = async () => {
    setReviewTarget(null);
    setSelected(null);
    await reload();
  };

  const deactivate = async (document: ApiDocumento) => {
    if (!window.confirm(`Desativar “${document.titulo}”? O ficheiro deixa de estar disponível, sem ser apagado.`)) return;
    setBusy(true);
    setActionError(null);
    try {
      await desativarDocumentoApi(document.id);
      setSelected(null);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const saveUploadLimit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingUploadLimit(true);
    setActionError(null);
    try {
      setConfig(await atualizarLimiteUploadDocumentosApi(uploadLimitDraft));
    } catch (cause) {
      setActionError(errorMessage(cause, 'Não foi possível atualizar o limite de upload.'));
    } finally {
      setSavingUploadLimit(false);
    }
  };

  return (
    <div className={compact ? '' : 'space-y-6'}>
      {!compact && <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="font-display text-2xl font-bold text-slate-900">{pageTitle}</h1><p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void reload()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Atualizar</button>
          {canSubmit && <button type="button" onClick={() => setUploadTarget('new')} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><FilePlus2 size={17} />Submeter documento</button>}
        </div>
      </header>}

      {!compact && role === 'admin' && config.can_update_upload_limit && <form onSubmit={saveUploadLimit} className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 font-semibold text-slate-900"><Settings2 size={17} className="text-blue-600" />Limite funcional de upload</div><p className="mt-1 text-sm text-slate-600">Aplicado imediatamente a todos os documentos e limitado pelo teto técnico do servidor.</p></div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">MB<input required inputMode="numeric" pattern="[0-9]*" min="1" max="100" value={uploadLimitDraft} onChange={(event) => setUploadLimitDraft(event.target.value)} className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right font-normal" /><button disabled={savingUploadLimit} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{savingUploadLimit ? 'A guardar…' : 'Guardar limite'}</button></label>
      </form>}

      {actionError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span className="flex gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0" />{actionError}</span><button type="button" onClick={() => setActionError(null)} aria-label="Fechar aviso"><X size={18} /></button></div>}

      {!compact && <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:col-span-2"><Search size={17} className="text-slate-400" /><span className="sr-only">Pesquisar documentos</span><input value={draftFilters.q || ''} onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar título ou ficheiro" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        {role !== 'client' && !clientId && <label><span className="sr-only">Organização</span><select value={draftFilters.cliente_id || ''} onChange={(event) => setDraftFilters((current) => ({ ...current, cliente_id: event.target.value ? Number(event.target.value) : undefined }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Todas as organizações</option>{visibleClients.map((client) => <option key={client.id} value={client.id}>{client.nome}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}</select></label>}
        {scopedCategories.length === 0 && <label><span className="sr-only">Categoria</span><select value={draftFilters.categoria || ''} onChange={(event) => setDraftFilters((current) => ({ ...current, categoria: event.target.value || undefined }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Todas as categorias</option>{categories.map((category) => <option key={category} value={category}>{labelFor(category)}</option>)}</select></label>}
        <label><span className="sr-only">Estado</span><select value={draftFilters.estado || ''} onChange={(event) => setDraftFilters((current) => ({ ...current, estado: event.target.value || undefined }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Todos os estados</option>{config.estados.map((state) => <option key={state} value={state}>{labelFor(state)}</option>)}</select></label>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Aplicar filtros</button>
      </form>}

      {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={20} />A carregar documentos…</div> : error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><strong>Não foi possível carregar os documentos.</strong><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => void reload()} className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold">Tentar novamente</button></div> : visibleDocuments.length === 0 ? <EmptyState role={role} title={emptyTitle} description={emptyDescription} /> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Lista de documentos">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_9rem_7rem_12rem] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Documento</span><span>Organização</span><span>Estado</span><span>Versão</span><span className="text-right">Ações</span></div>
        <div className="divide-y divide-slate-100">{visibleDocuments.map((document) => <article key={document.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_9rem_7rem_12rem] md:items-center md:gap-4">
          <div className="min-w-0"><div className="flex items-start gap-3"><span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600"><FileText size={19} /></span><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{document.titulo}</strong><small className="mt-0.5 block truncate text-slate-500">{document.nome_ficheiro_original || 'Ficheiro privado'} · {formatBytes(document.tamanho_bytes)} · {formatDate(document.submetido_em)}</small></span></div></div>
          <div className="text-sm text-slate-600"><span className="md:hidden text-xs font-semibold uppercase text-slate-400">Organização: </span>{document.cliente_nome || '—'}</div>
          <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stateClass(document.estado)}`}>{labelFor(document.estado)}</span></div>
          <div className="text-sm text-slate-600"><span className="md:hidden text-xs font-semibold uppercase text-slate-400">Versão: </span>{document.versao || '1.0'}</div>
          <div className="flex flex-wrap justify-start gap-2 md:justify-end"><button type="button" onClick={() => void openDetail(document)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye size={15} />Ver</button><button type="button" onClick={() => void download(document)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download size={15} />Download</button></div>
        </article>)}</div>
      </section>}

      {selected && <DocumentDetailModal document={selected} role={role} busy={busy} onClose={() => setSelected(null)} onDownload={() => void download(selected)} onReview={() => setReviewTarget(selected)} onNewVersion={() => setUploadTarget(selected)} onDeactivate={() => void deactivate(selected)} />}
      {uploadTarget && <UploadModal role={role} clients={visibleClients} config={{ ...config, categorias: categories }} versionOf={uploadTarget === 'new' ? null : uploadTarget} onClose={() => setUploadTarget(null)} onSuccess={onUploaded} setActionError={setActionError} />}
      {reviewTarget && <ReviewModal document={reviewTarget} states={config.estados} onClose={() => setReviewTarget(null)} onSuccess={onReviewed} setActionError={setActionError} />}
    </div>
  );
}

function DocumentDetailModal({ document, role, busy, onClose, onDownload, onReview, onNewVersion, onDeactivate }: { document: ApiDocumentoDetalhe; role: DocumentRole; busy: boolean; onClose: () => void; onDownload: () => void; onReview: () => void; onNewVersion: () => void; onDeactivate: () => void }) {
  const clientCanVersion = role === 'client' && document.estado === 'REQUER_ALTERACOES';
  const clientCanDeactivate = role === 'client' && document.estado === 'SUBMETIDO';
  return <Modal title={document.titulo} onClose={onClose}>
    <div className="space-y-5"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stateClass(document.estado)}`}>{labelFor(document.estado)}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Versão {document.versao || '1.0'}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{labelFor(document.categoria)}</span></div>
    <dl className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Organização</dt><dd className="font-medium text-slate-900">{document.cliente_nome || '—'}</dd></div><div><dt className="text-slate-500">Ficheiro</dt><dd className="break-all font-medium text-slate-900">{document.nome_ficheiro_original || '—'}</dd></div><div><dt className="text-slate-500">Submetido</dt><dd className="font-medium text-slate-900">{formatDate(document.submetido_em)}</dd></div><div><dt className="text-slate-500">Tamanho</dt><dd className="font-medium text-slate-900">{formatBytes(document.tamanho_bytes)}</dd></div></dl>
    {document.descricao && <section><h3 className="font-semibold text-slate-900">Descrição</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{document.descricao}</p></section>}
    <section><h3 className="flex items-center gap-2 font-semibold text-slate-900"><History size={17} />Histórico</h3>{document.historico?.length ? <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">{document.historico.map((review) => <li key={review.id} className="relative text-sm"><span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-blue-500" /><strong className="text-slate-800">{labelFor(review.estado_novo)}</strong><span className="text-slate-500"> · {formatDate(review.criado_em)}{review.autor?.nome ? ` · ${review.autor.nome}` : ''}</span>{review.observacao && <p className="mt-1 text-slate-600">{review.observacao}</p>}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Sem entradas de histórico.</p>}</section>
    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onDownload} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Download size={16} />Download</button>{(role === 'admin' || role === 'manager') && <button type="button" onClick={onReview} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><ShieldCheck size={16} />Rever</button>}{clientCanVersion && <button type="button" onClick={onNewVersion} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Upload size={16} />Nova versão</button>}{(role === 'admin' || clientCanDeactivate) && <button type="button" onClick={onDeactivate} disabled={busy} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Desativar</button>}</div></div>
  </Modal>;
}

function UploadModal({ role, clients, config, versionOf, onClose, onSuccess, setActionError }: { role: DocumentRole; clients: ApiCliente[]; config: ApiConfiguracaoDocumentos; versionOf: ApiDocumento | null; onClose: () => void; onSuccess: () => Promise<void>; setActionError: (value: string | null) => void }) {
  const [title, setTitle] = useState(versionOf?.titulo || '');
  const [category, setCategory] = useState(versionOf?.categoria || config.categorias[0] || 'OUTRO');
  const [description, setDescription] = useState(versionOf?.descricao || '');
  const [documentDate, setDocumentDate] = useState(versionOf?.data_documento || '');
  const [clientId, setClientId] = useState(versionOf?.cliente_id ? String(versionOf.cliente_id) : '');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!file) { setActionError('Selecione um ficheiro antes de submeter.'); return; } if (role !== 'client' && !versionOf && !clientId) { setActionError('Selecione a organização a que o documento pertence.'); return; } setSubmitting(true); setActionError(null); try { const payload = { cliente_id: clientId ? Number(clientId) : undefined, titulo: title, categoria: category, descricao: description, data_documento: documentDate, file }; if (versionOf) await submeterVersaoDocumentoApi(versionOf.id, payload); else await submeterDocumentoApi(payload); await onSuccess(); } catch (cause) { setActionError(errorMessage(cause)); } finally { setSubmitting(false); } };
  return <Modal title={versionOf ? 'Submeter nova versão' : 'Submeter documento'} onClose={onClose}><form onSubmit={submit} className="space-y-4"><p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Ficheiro privado. Limite atual: {config.max_upload_mb} MB.</p>{role !== 'client' && !versionOf && <label className="block text-sm font-semibold text-slate-700">Organização<select required value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="">Selecionar organização</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nome}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}</select></label>}<label className="block text-sm font-semibold text-slate-700">Título<input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">Categoria<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal">{config.categorias.map((item) => <option key={item} value={item}>{labelFor(item)}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Data do documento<input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={6000} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">Ficheiro<input required type="file" accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /></label><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Cancelar</button><button disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Upload size={16} />{submitting ? 'A submeter…' : 'Submeter'}</button></div></form></Modal>;
}

function ReviewModal({ document, states, onClose, onSuccess, setActionError }: { document: ApiDocumento; states: string[]; onClose: () => void; onSuccess: () => Promise<void>; setActionError: (value: string | null) => void }) {
  const [state, setState] = useState(document.estado || 'EM_ANALISE'); const [note, setNote] = useState(''); const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); setActionError(null); try { await reverDocumentoApi(document.id, { estado: state, observacao: note }); await onSuccess(); } catch (cause) { setActionError(errorMessage(cause)); } finally { setSubmitting(false); } };
  return <Modal title="Rever documento" onClose={onClose}><form onSubmit={submit} className="space-y-4"><p className="text-sm text-slate-600">{document.titulo}</p><label className="block text-sm font-semibold text-slate-700">Estado<select value={state} onChange={(event) => setState(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal">{states.map((item) => <option key={item} value={item}>{labelFor(item)}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Observação<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={6000} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Cancelar</button><button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Guardar revisão</button></div></form></Modal>;
}
