import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  criarAvaliacaoApi,
  estadosConformidadeApi,
  type ApiAvaliacao,
  type ApiCliente,
  type ApiEstadoConformidade,
  type CriarAvaliacaoPayload,
} from '../apiClient';

type AssessmentRole = 'admin' | 'manager';

interface Nis2AssessmentFormProps {
  role: AssessmentRole;
  clients: ApiCliente[];
  fixedClient?: ApiCliente | null;
  onCreated: (assessment: ApiAvaliacao) => void | Promise<void>;
  onCancel: () => void;
}

function todayAsIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function asPositiveInteger(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function formError(message: string) {
  return new Error(message);
}

/** Formulário partilhado por Administração e Gestão; a API mantém a autorização final. */
export function Nis2AssessmentForm({ role, clients, fixedClient = null, onCreated, onCancel }: Nis2AssessmentFormProps) {
  const [statuses, setStatuses] = useState<ApiEstadoConformidade[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState(fixedClient ? String(fixedClient.id) : '');
  const [statusId, setStatusId] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(todayAsIsoDate);
  const [risk, setRisk] = useState<CriarAvaliacaoPayload['nivel_risco']>('MEDIO');
  const [score, setScore] = useState('');
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    let active = true;
    estadosConformidadeApi()
      .then((items) => {
        if (!active) return;
        setStatuses(items);
        setStatusId((current) => current || (items[0] ? String(items[0].id) : ''));
      })
      .catch((cause: unknown) => active && setStatusError(cause instanceof Error ? cause.message : 'Não foi possível carregar os estados de conformidade.'))
      .finally(() => active && setLoadingStatuses(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setSelectedClient(fixedClient ? String(fixedClient.id) : '');
  }, [fixedClient?.id]);

  const availableClients = useMemo(() => clients.filter((client) => client.ativo !== false), [clients]);
  const hasSelectableClient = fixedClient ? true : availableClients.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    try {
      const clientId = fixedClient?.id ?? asPositiveInteger(selectedClient);
      const conformityStatusId = asPositiveInteger(statusId);
      if (!clientId) throw formError('Selecione uma organização associada.');
      if (!conformityStatusId) throw formError('Selecione um estado de conformidade.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) throw formError('Indique uma data de avaliação válida.');
      if (!/^\d{1,2}(?:\.\d{1,2})?$/.test(score)) throw formError('A pontuação deve ter no máximo duas casas decimais.');
      const numericScore = Number(score);
      if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 10) throw formError('A pontuação deve situar-se entre 0 e 10.');
      const cleanSummary = summary.trim();
      if (!cleanSummary) throw formError('O resumo é obrigatório.');

      const payload: CriarAvaliacaoPayload = {
        cliente_id: clientId,
        estado_conformidade_id: conformityStatusId,
        data_avaliacao: assessmentDate,
        nivel_risco: risk,
        pontuacao: numericScore,
        resumo: cleanSummary,
        recomendacoes: recommendations.trim() || null,
      };
      setSaving(true);
      await onCreated(await criarAvaliacaoApi(payload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível guardar a avaliação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm" aria-label="Nova avaliação NIS2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">Nova avaliação NIS2</h2>
          <p className="mt-1 text-sm text-slate-600">Registe a avaliação para atualizar o histórico e os indicadores da organização.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-60">Cancelar</button>
      </div>
      {!hasSelectableClient && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Não existem organizações associadas a este {role === 'manager' ? 'Gestor' : 'Administrador'}.</p>}
      {statusError && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{statusError}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {fixedClient ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Organização</span><strong className="mt-1 block text-slate-900">{fixedClient.nome}{fixedClient.nif ? ` — NIF ${fixedClient.nif}` : ''}</strong></div>
        ) : (
          <label className="block text-sm font-medium text-slate-700">Organização<select required value={selectedClient} onChange={(event) => setSelectedClient(event.target.value)} disabled={saving || !hasSelectableClient} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:opacity-60"><option value="" disabled>Selecionar organização</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.nome}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}</select></label>
        )}
        <label className="block text-sm font-medium text-slate-700">Estado de conformidade<select required value={statusId} onChange={(event) => setStatusId(event.target.value)} disabled={saving || loadingStatuses || statuses.length === 0} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:opacity-60"><option value="" disabled>{loadingStatuses ? 'A carregar estados…' : 'Selecionar estado'}</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.nome} ({status.codigo})</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Data da avaliação<input required type="date" value={assessmentDate} onChange={(event) => setAssessmentDate(event.target.value)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Nível de risco<select value={risk} onChange={(event) => setRisk(event.target.value as CriarAvaliacaoPayload['nivel_risco'])} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="BAIXO">Baixo</option><option value="MEDIO">Médio</option><option value="ALTO">Alto</option><option value="CRITICO">Crítico</option></select></label>
        <label className="block text-sm font-medium text-slate-700">Pontuação (0–10)<input required inputMode="decimal" type="number" min="0" max="10" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700">Resumo<textarea required maxLength={4000} value={summary} onChange={(event) => setSummary(event.target.value)} disabled={saving} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <label className="mt-4 block text-sm font-medium text-slate-700">Recomendações <span className="font-normal text-slate-500">(opcional)</span><textarea maxLength={8000} value={recommendations} onChange={(event) => setRecommendations(event.target.value)} disabled={saving} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
      <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">Metodologia interna: a pontuação de 0 a 10 apoia a avaliação operacional. O estado de conformidade é escolhido a partir do catálogo configurado pela organização; este formulário não altera a diretiva ou os seus estados.</p>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
      <div className="mt-5 flex justify-end"><button type="submit" disabled={saving || loadingStatuses || !!statusError || !hasSelectableClient} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'A guardar…' : 'Guardar avaliação'}</button></div>
    </form>
  );
}
