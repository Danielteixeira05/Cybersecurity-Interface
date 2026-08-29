import axios, { type AxiosRequestConfig } from 'axios';
import type { Page, UserRole } from './types';

export type PerfilCodigo = 'ADMINISTRADOR' | 'COLABORADOR' | 'CLIENTE';
export const AUTH_EXPIRED_EVENT = 'ciberbox:auth-expired';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiUtilizador {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  nif?: string | null;
  ativo: boolean;
  perfil_id: number;
  perfil_codigo: PerfilCodigo;
  perfil_nome: string;
  ultimo_acesso_em?: string | null;
  criado_em?: string;
  role?: UserRole;
  clientes?: Array<{ id: number; nome: string; principal?: boolean }> | string | null;
  cliente_id?: number | null;
}

export interface ApiCliente {
  id: number;
  nome: string;
  nif?: string | null;
  email?: string | null;
  telefone?: string | null;
  morada?: string | null;
  setor_atividade?: string | null;
  numero_colaboradores?: number | null;
  volume_negocios?: string | number | null;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string | null;
  conformidade?: string | null;
  numero_ativos?: number;
  numero_incidentes?: number;
  // Campos canónicos devolvidos pelo Django atual. Os aliases acima mantêm as páginas existentes compatíveis.
  estado_conformidade?: string | null;
  nivel_risco?: string | null;
  pontuacao?: number | null;
  total_ativos?: number;
  total_incidentes?: number;
}

export interface ApiContactoCliente {
  id: number;
  tipo: 'RESPONSAVEL_SEGURANCA' | 'CONTACTO_PERMANENTE' | 'OUTRO';
  nome: string;
  cargo?: string | null;
  email: string;
  telefone?: string | null;
  comunicado_cncs?: boolean;
  ativo: boolean;
}

export interface CriarUtilizadorPayload {
  nome: string;
  email: string;
  telefone?: string | null;
  nif?: string | null;
  perfil_codigo: PerfilCodigo;
  clientes_ids?: number[];
  ativo?: true;
  confirmar_admin?: boolean;
}

export interface CriarUtilizadorResposta {
  user: ApiUtilizador;
  temporaryPassword: string;
}

export interface AtualizarUtilizadorPayload {
  nome?: string;
  email?: string;
  telefone?: string | null;
  nif?: string | null;
  password?: string;
  clientes_ids?: number[];
  ativo?: boolean;
}

export interface CriarClientePayload {
  nome: string;
  nif: string;
  email: string;
  telefone?: string | null;
  morada?: string | null;
  setor_atividade?: string | null;
  numero_colaboradores?: number | null;
  volume_negocios?: number | null;
  contactos: Array<Omit<ApiContactoCliente, 'id'>>;
  gestores_ids?: number[];
}

export interface ApiAtivo {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  nome: string;
  tipo?: string | null;
  descricao?: string | null;
  endereco_ip?: string | null;
  criticalidade?: string | null;
  tipo_equipamento?: string | null;
  criticidade?: string | null;
  numero_inventario?: string | null;
  tipologia?: string | null;
  modelo_versao?: string | null;
  numero_serie?: string | null;
  fabricante?: string | null;
  localizacao?: string | null;
  sistema_operativo?: string | null;
  endereco_mac?: string | null;
  fqdn?: string | null;
  servico_suportado?: string | null;
  responsavel_nome?: string | null;
  responsavel_contacto?: string | null;
  unidade_organica?: string | null;
  aplicacoes_servicos?: string | null;
  observacoes?: string | null;
  comunicado_cncs?: boolean;
  programa_gestao_risco?: boolean;
  ativo?: boolean;
  // Alias legado apenas de leitura. O esquema Neon não possui data de aquisição.
  data_aquisicao?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ApiIncidente {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  titulo: string;
  tipo?: string | null;
  severidade?: string | null;
  descricao?: string | null;
  detetado_em?: string | null;
  resolvido_em?: string | null;
  criado_em?: string;
  codigo?: string;
  tipo_incidente?: string;
  gravidade?: string | null;
  data_hora_incidente?: string | null;
  encerrado_em?: string | null;
  estado?: string | null;
  registado_por?: string | null;
  departamento?: string | null;
  utilizadores_afetados?: number;
  dados_comprometidos?: boolean;
  sistemas_afetados?: string | null;
  origem_ataque?: string | null;
  ip_atacante?: string | null;
  analise_log?: string | null;
  resposta_imediata?: string | null;
  medidas_corretivas?: string | null;
  entidades_internas?: string | null;
  entidades_externas?: string | null;
  probabilidade_reincidencia?: string | null;
  recomendacoes?: string | null;
  responsavel_encerramento?: string | null;
  ativo?: boolean;
  notificado_nis2?: boolean;
  notificado_nis2_em?: string | null;
  notificado_nis2_por?: number | null;
  atualizado_em?: string;
}

export interface ApiNotificacao {
  id: number;
  incidente_id: number | null;
  documento_id?: number | null;
  cliente_id: number;
  tipo: 'INCIDENTE_NIS2' | 'DOCUMENTO_SUBMETIDO' | 'DOCUMENTO_REVISTO' | 'DOCUMENTO_NOVA_VERSAO';
  titulo: string;
  mensagem: string;
  lida: boolean;
  lida_em?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ApiMensagemConversa {
  id: number;
  conversa_id: number;
  remetente_id: number;
  conteudo: string;
  criado_em: string;
  remetente: { id: number; nome: string; perfil_codigo: PerfilCodigo | null } | null;
}

export interface ApiConversa {
  id: number;
  cliente_id: number;
  cliente: { id: number; nome: string; nif: string | null } | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  ultima_mensagem: ApiMensagemConversa | null;
  nao_lidas: number;
  gestores: Array<{ id: number; nome: string }>;
}

export interface CriarAtivoPayload {
  cliente_id: number;
  nome: string;
  tipo_equipamento?: string | null;
  numero_inventario?: string | null;
  sistema_operativo?: string | null;
  criticidade: string;
  endereco_ip?: string | null;
  endereco_mac?: string | null;
  fqdn?: string | null;
  tipologia?: string | null;
  modelo_versao?: string | null;
  numero_serie?: string | null;
  fabricante?: string | null;
  localizacao?: string | null;
  observacoes?: string | null;
  comunicado_cncs?: boolean;
  programa_gestao_risco?: boolean;
}

export interface CriarIncidentePayload {
  cliente_id: number;
  codigo: string;
  data_hora_incidente: string;
  tipo_incidente: string;
  descricao: string;
  gravidade: string;
  estado?: string;
  departamento?: string | null;
  utilizadores_afetados?: number;
  dados_comprometidos?: boolean;
  sistemas_afetados?: string | null;
  origem_ataque?: string | null;
  ip_atacante?: string | null;
  resposta_imediata?: string | null;
  medidas_corretivas?: string | null;
  recomendacoes?: string | null;
  notificado_nis2?: boolean;
}

export interface FiltrosAtivos {
  cliente_id?: number;
  q?: string;
  criticidade?: string;
}

export interface FiltrosIncidentes {
  cliente_id?: number;
  q?: string;
  estado?: string;
  gravidade?: string;
  de?: string;
  ate?: string;
}

export interface ApiDocumento {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  titulo: string;
  tipo?: string | null;
  formato?: string | null;
  tamanho_bytes?: number | null;
  submetido_em?: string;
  categoria?: string | null;
  nome_ficheiro_original?: string;
  tipo_mime?: string | null;
  estado?: string | null;
  versao?: string | null;
  data_documento?: string | null;
  documento_anterior_id?: number | null;
  revisto_por?: number | null;
  revisto_em?: string | null;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string;
  descricao?: string | null;
  submetido_por?: { id: number; nome: string } | null;
  revisor?: { id: number; nome: string } | null;
}

export interface ApiRevisaoDocumento {
  id: number;
  documento_id: number;
  estado_anterior?: string | null;
  estado_novo: string;
  observacao?: string | null;
  criado_em?: string;
  autor?: { id: number; nome: string } | null;
}

export interface ApiDocumentoDetalhe extends ApiDocumento {
  historico?: ApiRevisaoDocumento[];
  versoes?: ApiDocumento[];
}

export interface ApiConfiguracaoDocumentos {
  max_upload_mb: number;
  configured_upload_mb?: number | null;
  uses_fallback_upload_limit?: boolean;
  can_update_upload_limit?: boolean;
  categorias: string[];
  estados: string[];
}

export interface FiltrosDocumentos {
  cliente_id?: number;
  q?: string;
  categoria?: string;
  estado?: string;
  de?: string;
  ate?: string;
}

export interface SubmeterDocumentoPayload {
  cliente_id?: number;
  titulo: string;
  categoria: string;
  descricao?: string;
  data_documento?: string;
  file: File;
}

export interface ApiPedido {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  assunto: string;
  descricao?: string | null;
  estado_id?: number;
  estado_codigo?: string;
  estado_nome?: string;
  criado_em?: string;
  resolvido_em?: string | null;
  prioridade?: string | null;
}

export interface ApiAvaliacao {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  data_avaliacao?: string;
  estado_conformidade_id?: number;
  estado_conformidade_codigo?: string;
  estado_conformidade_nome?: string;
  nivel_risco?: string | null;
  score?: number | null;
  pontuacao?: number | null;
  observacoes?: string | null;
  recomendacoes?: string | null;
}

export interface ApiClienteDetalhe {
  cliente: ApiCliente | null;
  contactos: ApiContactoCliente[];
  responsavelSeguranca: ApiContactoCliente | null;
  contactoPermanente: ApiContactoCliente | null;
  gestores: Array<Pick<ApiUtilizador, 'id' | 'nome' | 'email'>>;
  ativos: ApiAtivo[];
  incidentes: ApiIncidente[];
  documentos: ApiDocumento[];
  avaliacoes: ApiAvaliacao[];
  pedidos: ApiPedido[];
}

export interface ApiLoginResponse {
  utilizador: ApiUtilizador;
  cliente?: ApiCliente | null;
  csrf_token?: string;
}

export interface ApiDashboardAdmin {
  tipo: 'admin';
  stats: {
    clientes?: number;
    utilizadores?: number;
    ativos?: number;
    incidentes?: number;
    documentos?: number;
    pedidos?: number;
    incidentes_abertos?: number;
    pedidos_abertos?: number;
  };
  conformidade: Array<{ codigo: string; estado: string; numero_clientes: number }>;
  top_incidentes: Array<{ id: number; nome: string; total_incidentes: number }>;
  documentos_mes: Array<{ id: number; nome: string; mes: string; total_documentos: number }>;
  utilizadores_perfil: Array<{
    codigo: string;
    perfil: string;
    total_utilizadores: number;
    utilizadores_ativos: number;
  }>;
  pedidos_estado: Array<{
    codigo: string;
    estado: string;
    total_pedidos: number;
    tempo_medio_resolucao_horas: number | null;
  }>;
}

export interface ApiDashboardCliente {
  tipo: 'cliente';
  total_ativos?: number;
  total_incidentes?: number;
  total_documentos?: number;
  total_pedidos?: number;
  estado_conformidade?: string | null;
  nivel_risco?: string | null;
  pontuacao?: number | null;
  // Aliases legados consumidos pelos componentes atuais.
  numero_ativos?: number;
  numero_incidentes?: number;
  numero_documentos?: number;
  numero_pedidos?: number;
  conformidade_estado?: string | null;
  score_risco?: number | null;
}

export type ApiDashboard = ApiDashboardAdmin | ApiDashboardCliente;

export interface ApiMeResponse {
  autenticado: boolean;
  utilizador?: ApiUtilizador | null;
  cliente?: ApiCliente | null;
  csrf_token?: string;
  role?: UserRole;
}

const DEV_MODE = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

export function getApiBaseUrl(): string {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || ({} as Record<string, string | undefined>);
  const explicit = env.VITE_API_URL;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit.replace(/\/$/, '');
  if (DEV_MODE) return '';
  return 'https://cybersecurity-api.vercel.app';
}

export interface ApiConteudoSite {
  id: number;
  chave: string;
  titulo: string;
  subtitulo?: string | null;
  corpo?: string | null;
  imagem_url?: string | null;
  ativo: boolean;
  ordem: number;
  atualizado_por?: number | null;
  atualizado_por_nome?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ApiNoticia {
  id: number;
  titulo: string;
  resumo: string;
  corpo: string;
  imagem_url?: string | null;
  autor_id?: number | null;
  autor_nome?: string | null;
  publicada: boolean;
  ativo: boolean;
  publicada_em?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ApiMensagemContacto {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  empresa?: string | null;
  assunto: string;
  mensagem: string;
  estado: 'NOVA' | 'EM_ANALISE' | 'RESPONDIDA' | 'ARQUIVADA';
  respondida_por?: number | null;
  respondida_por_nome?: string | null;
  criado_em?: string;
  respondida_em?: string | null;
}

export interface ContactoPublicoPayload {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  assunto: string;
  mensagem: string;
}

let csrfToken = '';
export function setCsrfToken(t: string) {
  if (t) csrfToken = t;
}
export function getCsrfToken(): string {
  if (csrfToken) return csrfToken;
  const m = /csrftoken=([^;]+)/.exec(document.cookie || '');
  return m ? decodeURIComponent(m[1]) : '';
}

/**
 * Cliente HTTP único da aplicação. Durante a transição para o backend Node,
 * mantém o contrato de sessão/CSRF do Django para não interromper o login atual.
 */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = getCsrfToken();
    if (token) config.headers.set('X-CSRFToken', token);
  }
  return config;
});

export async function ensureCsrfToken(): Promise<void> {
  try {
    const r = await apiFetch<{ csrfToken?: string; csrf_token?: string }>('/api/csrf/', { method: 'GET', credentials: 'include' });
    if (r?.csrfToken) setCsrfToken(r.csrfToken);
    else if (r?.csrf_token) setCsrfToken(r.csrf_token);
  } catch {
  }
  if (!csrfToken) {
    try {
      const m = /csrftoken=([^;]+)/.exec(document.cookie || '');
      if (m) setCsrfToken(decodeURIComponent(m[1]));
    } catch {
    }
  }
}

class SessionStore {
  private key = 'cbsess_v1';
  get(): { utilizador: ApiUtilizador | null; cliente: ApiCliente | null; role: UserRole } {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { utilizador: null, cliente: null, role: null };
      const d = JSON.parse(raw);
      return {
        utilizador: d.utilizador || null,
        cliente: d.cliente || null,
        role: d.role || null,
      };
    } catch {
      return { utilizador: null, cliente: null, role: null };
    }
  }
  set(sess: { utilizador: ApiUtilizador | null; cliente: ApiCliente | null; role: UserRole }) {
    localStorage.setItem(this.key, JSON.stringify(sess));
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}

export const session = new SessionStore();

export function defaultHomePageForRole(role: UserRole): Page {
  if (role === 'admin') return 'admin-dashboard';
  if (role === 'manager') return 'mgr-dashboard';
  if (role === 'client') return 'cli-dashboard';
  return 'home';
}

export async function apiFetch<T = any>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers || {});
  const isJson = typeof init.body === 'string';
  if (isJson && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const request: AxiosRequestConfig = {
    url: endpoint,
    method: init.method || 'GET',
    headers: Object.fromEntries(headers.entries()),
    data: init.body,
  };

  try {
    const response = await api.request<T>(request);
    return response.data;
  } catch (cause) {
    if (axios.isAxiosError(cause)) {
      const data = cause.response?.data;
      const message = typeof data === 'object' && data && 'erro' in data
        ? String(data.erro)
        : cause.message || `HTTP ${cause.response?.status ?? 0}`;
      const error = new Error(message);
      (error as Error & { status?: number; data?: unknown }).status = cause.response?.status;
      (error as Error & { status?: number; data?: unknown }).data = data;
      if (cause.response?.status === 401) {
        session.clear();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
      throw error;
    }
    throw cause;
  }
}

export async function loginApi(payload: LoginPayload): Promise<ApiLoginResponse> {
  await ensureCsrfToken();
  const res = await apiFetch<ApiLoginResponse>('/api/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.csrf_token) setCsrfToken(res.csrf_token);
  res.utilizador.role = mapPerfilToRole(res.utilizador.perfil_codigo);
  session.set({
    utilizador: res.utilizador,
    cliente: res.cliente || null,
    role: res.utilizador.role,
  });
  return res;
}

export async function logoutApi(): Promise<void> {
  try {
    await ensureCsrfToken();
    await apiFetch('/api/logout/', { method: 'POST' });
  } finally {
    session.clear();
  }
}

export async function meApi(): Promise<ApiMeResponse> {
  const res = await apiFetch<ApiMeResponse>('/api/me/');
  if (res && res.autenticado && res.utilizador) {
    res.role = mapPerfilToRole(res.utilizador.perfil_codigo);
    res.utilizador.role = res.role;
    session.set({
      utilizador: res.utilizador,
      cliente: res.cliente || null,
      role: res.role,
    });
  }
  return res;
}

export function mapPerfilToRole(p?: PerfilCodigo | string | null): UserRole {
  if (p === 'ADMINISTRADOR') return 'admin';
  if (p === 'COLABORADOR') return 'manager';
  if (p === 'CLIENTE') return 'client';
  return null;
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function requiredNumber(value: unknown, field: string): number {
  const parsed = numericValue(value);
  if (parsed === undefined) throw new Error(`Resposta da API sem o campo numérico obrigatório: ${field}.`);
  return parsed;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Resposta da API sem o campo obrigatório: ${field}.`);
  }
  return value;
}

/**
 * Adaptadores temporários do contrato Django atual para o contrato de leitura
 * das páginas React. Não introduzem dados demonstrativos: quando um campo não
 * existe, o valor continua ausente e a página deve representar o estado vazio.
 */
export function normaliseCliente(value: unknown): ApiCliente {
  const raw = asRecord(value);
  const totalAtivos = numericValue(raw.total_ativos ?? raw.totalAtivos ?? raw.numero_ativos);
  const totalIncidentes = numericValue(raw.total_incidentes ?? raw.totalIncidentes ?? raw.numero_incidentes);
  const estadoConformidade = (raw.estado_conformidade ?? raw.estadoConformidade ?? raw.conformidade) as string | null | undefined;
  const nivelRisco = (raw.nivel_risco ?? raw.nivelRisco) as string | null | undefined;
  const pontuacao = numericValue(raw.pontuacao);
  return {
    ...(raw as unknown as ApiCliente),
    id: requiredNumber(raw.id, 'cliente.id'),
    nome: requiredString(raw.nome, 'cliente.nome'),
    estado_conformidade: estadoConformidade ?? null,
    conformidade: estadoConformidade ?? null,
    nivel_risco: nivelRisco ?? null,
    pontuacao: pontuacao ?? null,
    total_ativos: totalAtivos,
    numero_ativos: totalAtivos,
    total_incidentes: totalIncidentes,
    numero_incidentes: totalIncidentes,
  };
}

export function normaliseAtivo(value: unknown): ApiAtivo {
  const raw = asRecord(value);
  const tipo = (raw.tipo ?? raw.tipo_equipamento) as string | null | undefined;
  const criticidade = (raw.criticalidade ?? raw.criticidade) as string | null | undefined;
  return {
    ...(raw as unknown as ApiAtivo),
    id: requiredNumber(raw.id, 'ativo.id'),
    cliente_id: requiredNumber(raw.cliente_id, 'ativo.cliente_id'),
    nome: requiredString(raw.nome, 'ativo.nome'),
    tipo_equipamento: tipo ?? null,
    tipo: tipo ?? null,
    criticidade: criticidade ?? null,
    criticalidade: criticidade ?? null,
  };
}

export function normaliseIncidente(value: unknown): ApiIncidente {
  const raw = asRecord(value);
  const titulo = (raw.titulo ?? raw.tipo_incidente ?? raw.codigo) as string | undefined;
  const severidade = (raw.severidade ?? raw.gravidade) as string | null | undefined;
  const detetadoEm = (raw.detetado_em ?? raw.data_hora_incidente) as string | null | undefined;
  const resolvidoEm = (raw.resolvido_em ?? raw.encerrado_em) as string | null | undefined;
  return {
    ...(raw as unknown as ApiIncidente),
    id: requiredNumber(raw.id, 'incidente.id'),
    cliente_id: requiredNumber(raw.cliente_id, 'incidente.cliente_id'),
    titulo: requiredString(titulo, 'incidente.tipo_incidente ou incidente.codigo'),
    tipo: (raw.tipo ?? raw.tipo_incidente) as string | null | undefined,
    tipo_incidente: typeof raw.tipo_incidente === 'string' ? raw.tipo_incidente : undefined,
    codigo: typeof raw.codigo === 'string' ? raw.codigo : undefined,
    gravidade: severidade ?? null,
    severidade: severidade ?? null,
    data_hora_incidente: detetadoEm ?? null,
    detetado_em: detetadoEm ?? null,
    encerrado_em: resolvidoEm ?? null,
    resolvido_em: resolvidoEm ?? null,
    notificado_nis2: typeof raw.notificado_nis2 === 'boolean' ? raw.notificado_nis2 : false,
    notificado_nis2_em: typeof raw.notificado_nis2_em === 'string' ? raw.notificado_nis2_em : null,
    notificado_nis2_por: numericValue(raw.notificado_nis2_por) ?? null,
  };
}

function normaliseNotificacao(value: unknown): ApiNotificacao {
  const raw = asRecord(value);
  return {
    id: requiredNumber(raw.id, 'notificacao.id'),
    incidente_id: numericValue(raw.incidente_id) ?? null,
    documento_id: numericValue(raw.documento_id) ?? null,
    cliente_id: requiredNumber(raw.cliente_id, 'notificacao.cliente_id'),
    tipo: (typeof raw.tipo === 'string' ? raw.tipo : 'INCIDENTE_NIS2') as ApiNotificacao['tipo'],
    titulo: requiredString(raw.titulo, 'notificacao.titulo'),
    mensagem: requiredString(raw.mensagem, 'notificacao.mensagem'),
    lida: raw.lida === true,
    lida_em: typeof raw.lida_em === 'string' ? raw.lida_em : null,
    criado_em: typeof raw.criado_em === 'string' ? raw.criado_em : undefined,
    atualizado_em: typeof raw.atualizado_em === 'string' ? raw.atualizado_em : undefined,
  };
}

export function normaliseDocumento(value: unknown): ApiDocumento {
  const raw = asRecord(value);
  const tipo = (raw.tipo ?? raw.categoria ?? raw.tipo_mime) as string | null | undefined;
  return {
    ...(raw as unknown as ApiDocumento),
    id: requiredNumber(raw.id, 'documento.id'),
    cliente_id: requiredNumber(raw.cliente_id, 'documento.cliente_id'),
    titulo: requiredString(raw.titulo ?? raw.nome_ficheiro_original, 'documento.titulo ou documento.nome_ficheiro_original'),
    categoria: typeof raw.categoria === 'string' ? raw.categoria : null,
    tipo: tipo ?? null,
    formato: (raw.formato ?? raw.tipo_mime) as string | null | undefined,
    tamanho_bytes: numericValue(raw.tamanho_bytes) ?? null,
    estado: typeof raw.estado === 'string' ? raw.estado : null,
    versao: typeof raw.versao === 'string' ? raw.versao : null,
    data_documento: typeof raw.data_documento === 'string' ? raw.data_documento : null,
    documento_anterior_id: numericValue(raw.documento_anterior_id) ?? null,
    revisto_por: numericValue(raw.revisto_por) ?? null,
    revisto_em: typeof raw.revisto_em === 'string' ? raw.revisto_em : null,
    ativo: typeof raw.ativo === 'boolean' ? raw.ativo : undefined,
  };
}

export function normaliseAvaliacao(value: unknown): ApiAvaliacao {
  const raw = asRecord(value);
  const score = numericValue(raw.score ?? raw.pontuacao);
  return {
    ...(raw as unknown as ApiAvaliacao),
    id: requiredNumber(raw.id, 'avaliacao.id'),
    cliente_id: requiredNumber(raw.cliente_id, 'avaliacao.cliente_id'),
    pontuacao: score ?? null,
    score: score ?? null,
    recomendacoes: typeof raw.recomendacoes === 'string' ? raw.recomendacoes : null,
  };
}

function normaliseDashboard(value: unknown): ApiDashboard {
  const raw = asRecord(value);
  if (raw.tipo === 'cliente') {
    const totalAtivos = numericValue(raw.total_ativos);
    const totalIncidentes = numericValue(raw.total_incidentes);
    const totalDocumentos = numericValue(raw.total_documentos);
    const totalPedidos = numericValue(raw.total_pedidos);
    const pontuacao = numericValue(raw.pontuacao);
    return {
      ...(raw as unknown as ApiDashboardCliente),
      tipo: 'cliente',
      total_ativos: totalAtivos,
      total_incidentes: totalIncidentes,
      total_documentos: totalDocumentos,
      total_pedidos: totalPedidos,
      numero_ativos: totalAtivos,
      numero_incidentes: totalIncidentes,
      numero_documentos: totalDocumentos,
      numero_pedidos: totalPedidos,
      estado_conformidade: raw.estado_conformidade as string | null | undefined,
      conformidade_estado: raw.estado_conformidade as string | null | undefined,
      pontuacao: pontuacao ?? null,
      score_risco: pontuacao ?? null,
    };
  }

  const stats = asRecord(raw.stats);
  return {
    ...(raw as unknown as ApiDashboardAdmin),
    tipo: 'admin',
    stats: {
      clientes: numericValue(stats.clientes),
      utilizadores: numericValue(stats.utilizadores),
      ativos: numericValue(stats.ativos),
      incidentes: numericValue(stats.incidentes),
      documentos: numericValue(stats.documentos),
      pedidos: numericValue(stats.pedidos),
      incidentes_abertos: numericValue(stats.incidentes_abertos),
      pedidos_abertos: numericValue(stats.pedidos_abertos),
    },
    conformidade: Array.isArray(raw.conformidade) ? raw.conformidade as ApiDashboardAdmin['conformidade'] : [],
    top_incidentes: Array.isArray(raw.top_incidentes) ? raw.top_incidentes as ApiDashboardAdmin['top_incidentes'] : [],
    documentos_mes: Array.isArray(raw.documentos_mes) ? raw.documentos_mes as ApiDashboardAdmin['documentos_mes'] : [],
    utilizadores_perfil: Array.isArray(raw.utilizadores_perfil) ? raw.utilizadores_perfil as ApiDashboardAdmin['utilizadores_perfil'] : [],
    pedidos_estado: Array.isArray(raw.pedidos_estado) ? raw.pedidos_estado as ApiDashboardAdmin['pedidos_estado'] : [],
  };
}

export async function dashboardApi(): Promise<ApiDashboard> {
  return normaliseDashboard(await apiFetch('/api/dashboard/'));
}
export async function clientesApi(q?: string): Promise<ApiCliente[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const result = await apiFetch<unknown>(`/api/clients/${qs}`);
  const rows = Array.isArray(result) ? result : (asRecord(result).items as unknown);
  return Array.isArray(rows) ? rows.map(normaliseCliente) : [];
}
export async function clienteDetalheApi(id: number): Promise<ApiClienteDetalhe> {
  const result = asRecord(await apiFetch<unknown>(`/api/clients/${id}`));
  const contact = (value: unknown): ApiContactoCliente | null => {
    if (!value) return null;
    const raw = asRecord(value);
    return {
      id: requiredNumber(raw.id, 'contacto.id'),
      tipo: requiredString(raw.tipo, 'contacto.tipo') as ApiContactoCliente['tipo'],
      nome: requiredString(raw.nome, 'contacto.nome'),
      cargo: typeof raw.cargo === 'string' ? raw.cargo : null,
      email: requiredString(raw.email, 'contacto.email'),
      telefone: typeof raw.telefone === 'string' ? raw.telefone : null,
      comunicado_cncs: raw.comunicado_cncs === true,
      ativo: raw.ativo !== false,
    };
  };
  const contactos = Array.isArray(result.contactos)
    ? result.contactos.map(contact).filter((value): value is ApiContactoCliente => value !== null)
    : [];
  const gestores = Array.isArray(result.gestores)
    ? result.gestores.map((value) => {
      const raw = asRecord(value);
      return { id: requiredNumber(raw.id, 'gestor.id'), nome: requiredString(raw.nome, 'gestor.nome'), email: requiredString(raw.email, 'gestor.email') };
    })
    : [];
  return {
    cliente: result.cliente ? normaliseCliente(result.cliente) : null,
    contactos,
    responsavelSeguranca: contact(result.responsavelSeguranca),
    contactoPermanente: contact(result.contactoPermanente),
    gestores,
    ativos: Array.isArray(result.ativos) ? result.ativos.map(normaliseAtivo) : [],
    incidentes: Array.isArray(result.incidentes) ? result.incidentes.map(normaliseIncidente) : [],
    documentos: Array.isArray(result.documentos) ? result.documentos.map(normaliseDocumento) : [],
    avaliacoes: Array.isArray(result.avaliacoes) ? result.avaliacoes.map(normaliseAvaliacao) : [],
    pedidos: Array.isArray(result.pedidos) ? result.pedidos as ApiPedido[] : [],
  };
}
export async function utilizadoresApi(perfil?: string): Promise<ApiUtilizador[]> {
  const qs = perfil ? `?perfil=${encodeURIComponent(perfil)}` : '';
  const result = await apiFetch<unknown>(`/api/users/${qs}`);
  const rows = Array.isArray(result) ? result : (asRecord(result).items as unknown);
  return Array.isArray(rows) ? rows as ApiUtilizador[] : [];
}

export async function criarUtilizadorApi(payload: CriarUtilizadorPayload): Promise<CriarUtilizadorResposta> {
  await ensureCsrfToken();
  return apiFetch<CriarUtilizadorResposta>('/api/users/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function atualizarUtilizadorApi(id: number, payload: AtualizarUtilizadorPayload): Promise<ApiUtilizador> {
  await ensureCsrfToken();
  return apiFetch<ApiUtilizador>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function criarClienteApi(payload: CriarClientePayload): Promise<any> {
  await ensureCsrfToken();
  return apiFetch('/api/clients/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function atualizarClienteApi(id: number, payload: Partial<Omit<CriarClientePayload, 'contactos' | 'gestores_ids'>> & { ativo?: boolean }): Promise<any> {
  await ensureCsrfToken();
  return apiFetch(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function criarContactoClienteApi(clientId: number, payload: Omit<ApiContactoCliente, 'id'>): Promise<ApiContactoCliente> {
  await ensureCsrfToken();
  return apiFetch<ApiContactoCliente>(`/api/clients/${clientId}/contacts`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function atualizarContactoClienteApi(clientId: number, contactId: number, payload: Partial<Omit<ApiContactoCliente, 'id'>>): Promise<ApiContactoCliente> {
  await ensureCsrfToken();
  return apiFetch<ApiContactoCliente>(`/api/clients/${clientId}/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function associarGestoresClienteApi(clientId: number, gestoresIds: number[]): Promise<any> {
  await ensureCsrfToken();
  return apiFetch(`/api/clients/${clientId}/managers`, { method: 'PUT', body: JSON.stringify({ gestores_ids: gestoresIds }) });
}
function queryString(filters: object) {
  const params = new URLSearchParams();
  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function ativosApi(filters: FiltrosAtivos | number = {}): Promise<ApiAtivo[]> {
  const resolved = typeof filters === 'number' ? { cliente_id: filters } : filters;
  const result = await apiFetch<unknown>(`/api/assets/${queryString(resolved)}`);
  const rows = Array.isArray(result) ? result : (asRecord(result).items as unknown);
  return Array.isArray(rows) ? rows.map(normaliseAtivo) : [];
}

export async function ativoDetalheApi(id: number): Promise<ApiAtivo> {
  return normaliseAtivo(await apiFetch(`/api/assets/${id}`));
}

export async function criarAtivoApi(payload: CriarAtivoPayload): Promise<ApiAtivo> {
  await ensureCsrfToken();
  return normaliseAtivo(await apiFetch('/api/assets/', { method: 'POST', body: JSON.stringify(payload) }));
}

export async function atualizarAtivoApi(id: number, payload: Partial<CriarAtivoPayload> & { ativo?: boolean }): Promise<ApiAtivo> {
  await ensureCsrfToken();
  return normaliseAtivo(await apiFetch(`/api/assets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }));
}

export async function incidentesApi(filters: FiltrosIncidentes | number = {}): Promise<ApiIncidente[]> {
  const resolved = typeof filters === 'number' ? { cliente_id: filters } : filters;
  const result = await apiFetch<unknown>(`/api/incidents/${queryString(resolved)}`);
  const rows = Array.isArray(result) ? result : (asRecord(result).items as unknown);
  return Array.isArray(rows) ? rows.map(normaliseIncidente) : [];
}

export async function incidenteDetalheApi(id: number): Promise<ApiIncidente> {
  return normaliseIncidente(await apiFetch(`/api/incidents/${id}`));
}

export async function criarIncidenteApi(payload: CriarIncidentePayload): Promise<ApiIncidente> {
  await ensureCsrfToken();
  return normaliseIncidente(await apiFetch('/api/incidents/', { method: 'POST', body: JSON.stringify(payload) }));
}

export async function atualizarIncidenteApi(id: number, payload: Partial<CriarIncidentePayload> & { ativo?: boolean; encerrado_em?: string | null }): Promise<ApiIncidente> {
  await ensureCsrfToken();
  return normaliseIncidente(await apiFetch(`/api/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }));
}

export async function notificacoesApi(limit = 50): Promise<ApiNotificacao[]> {
  const result = await apiFetch<unknown>(`/api/notifications/?limit=${limit}`);
  const rows = Array.isArray(result) ? result : (asRecord(result).items as unknown);
  return Array.isArray(rows) ? rows.map(normaliseNotificacao) : [];
}

export async function marcarNotificacaoLidaApi(id: number): Promise<ApiNotificacao> {
  await ensureCsrfToken();
  return normaliseNotificacao(await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) }));
}

export async function conversasApi(): Promise<ApiConversa[]> {
  const result = await apiFetch<{ items?: ApiConversa[] }>('/api/conversations/');
  return Array.isArray(result?.items) ? result.items : [];
}

export async function garantirConversaApi(clienteId?: number): Promise<ApiConversa> {
  await ensureCsrfToken();
  return apiFetch<ApiConversa>('/api/conversations/ensure', {
    method: 'POST',
    body: JSON.stringify(clienteId ? { cliente_id: clienteId } : {}),
  });
}

export async function mensagensConversaApi(conversaId: number, before?: number): Promise<{ items: ApiMensagemConversa[]; next_cursor: string | null }> {
  const query = new URLSearchParams({ limit: '50' });
  if (before) query.set('before', String(before));
  return apiFetch<{ items: ApiMensagemConversa[]; next_cursor: string | null }>(`/api/conversations/${conversaId}/messages?${query.toString()}`);
}

export async function enviarMensagemConversaApi(conversaId: number, conteudo: string): Promise<ApiMensagemConversa> {
  await ensureCsrfToken();
  return apiFetch<ApiMensagemConversa>(`/api/conversations/${conversaId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ conteudo }),
  });
}

export async function marcarConversaLidaApi(conversaId: number): Promise<{ conversa_id: number; ultima_mensagem_id: number | null; atualizado_em: string }> {
  await ensureCsrfToken();
  return apiFetch(`/api/conversations/${conversaId}/read`, { method: 'PATCH', body: JSON.stringify({}) });
}
export async function documentosApi(filters: FiltrosDocumentos | number = {}): Promise<ApiDocumento[]> {
  const resolvedFilters: FiltrosDocumentos = typeof filters === 'number' ? { cliente_id: filters } : filters;
  const search = new URLSearchParams();
  Object.entries(resolvedFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString() ? `?${search.toString()}` : '';
  const result = await apiFetch<unknown>(`/api/documents/${qs}`);
  return Array.isArray(result) ? result.map(normaliseDocumento) : [];
}

export async function documentoDetalheApi(documentId: number): Promise<ApiDocumentoDetalhe> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/documents/${documentId}`);
  const document = normaliseDocumento(raw.documento);
  const history = Array.isArray(raw.historico) ? raw.historico.map((entry) => {
    const review = asRecord(entry);
    return {
      id: requiredNumber(review.id, 'revisao.id'),
      documento_id: requiredNumber(review.documento_id, 'revisao.documento_id'),
      estado_anterior: typeof review.estado_anterior === 'string' ? review.estado_anterior : null,
      estado_novo: requiredString(review.estado_novo, 'revisao.estado_novo'),
      observacao: typeof review.observacao === 'string' ? review.observacao : null,
      criado_em: typeof review.criado_em === 'string' ? review.criado_em : undefined,
      autor: review.autor && typeof review.autor === 'object' ? review.autor as ApiRevisaoDocumento['autor'] : null,
    } satisfies ApiRevisaoDocumento;
  }) : [];
  const versions = Array.isArray(raw.versoes_relacionadas) ? raw.versoes_relacionadas.map(normaliseDocumento) : [];
  return { ...document, historico: history, versoes: versions };
}

export async function configuracaoDocumentosApi(): Promise<ApiConfiguracaoDocumentos> {
  const raw = await apiFetch<Record<string, unknown>>('/api/documents/config');
  return {
    max_upload_mb: requiredNumber(raw.max_upload_mb, 'documentos.max_upload_mb'),
    configured_upload_mb: typeof raw.configured_upload_mb === 'number' && Number.isSafeInteger(raw.configured_upload_mb) ? raw.configured_upload_mb : null,
    uses_fallback_upload_limit: raw.uses_fallback_upload_limit === true,
    can_update_upload_limit: raw.can_update_upload_limit === true,
    categorias: Array.isArray(raw.categories) ? raw.categories.filter((item): item is string => typeof item === 'string') : [],
    estados: Array.isArray(raw.states) ? raw.states.filter((item): item is string => typeof item === 'string') : [],
  };
}

export async function atualizarLimiteUploadDocumentosApi(maxUploadMb: string): Promise<ApiConfiguracaoDocumentos> {
  await ensureCsrfToken();
  const raw = await apiFetch<Record<string, unknown>>('/api/documents/config/upload-limit', {
    method: 'PATCH', body: JSON.stringify({ max_upload_mb: maxUploadMb }),
  });
  return {
    max_upload_mb: requiredNumber(raw.max_upload_mb, 'documentos.max_upload_mb'),
    configured_upload_mb: typeof raw.configured_upload_mb === 'number' && Number.isSafeInteger(raw.configured_upload_mb) ? raw.configured_upload_mb : null,
    uses_fallback_upload_limit: raw.uses_fallback_upload_limit === true,
    can_update_upload_limit: raw.can_update_upload_limit === true,
    categorias: Array.isArray(raw.categories) ? raw.categories.filter((item): item is string => typeof item === 'string') : [],
    estados: Array.isArray(raw.states) ? raw.states.filter((item): item is string => typeof item === 'string') : [],
  };
}

function documentFormData(payload: SubmeterDocumentoPayload): FormData {
  const form = new FormData();
  if (payload.cliente_id) form.set('cliente_id', String(payload.cliente_id));
  form.set('titulo', payload.titulo);
  form.set('categoria', payload.categoria);
  if (payload.descricao) form.set('descricao', payload.descricao);
  if (payload.data_documento) form.set('data_documento', payload.data_documento);
  form.set('file', payload.file);
  return form;
}

export async function submeterDocumentoApi(payload: SubmeterDocumentoPayload): Promise<ApiDocumentoDetalhe> {
  await ensureCsrfToken();
  const raw = await apiFetch<Record<string, unknown>>('/api/documents', { method: 'POST', body: documentFormData(payload) });
  return documentoDetalheDeResposta(raw);
}

export async function submeterVersaoDocumentoApi(documentId: number, payload: SubmeterDocumentoPayload): Promise<ApiDocumentoDetalhe> {
  await ensureCsrfToken();
  const raw = await apiFetch<Record<string, unknown>>(`/api/documents/${documentId}/versions`, { method: 'POST', body: documentFormData(payload) });
  return documentoDetalheDeResposta(raw);
}

function documentoDetalheDeResposta(raw: Record<string, unknown>): ApiDocumentoDetalhe {
  const document = normaliseDocumento(raw.documento);
  return { ...document };
}

export async function reverDocumentoApi(documentId: number, payload: { estado: string; observacao?: string }): Promise<ApiDocumentoDetalhe> {
  await ensureCsrfToken();
  const raw = await apiFetch<Record<string, unknown>>(`/api/documents/${documentId}/review`, { method: 'PATCH', body: JSON.stringify(payload) });
  return documentoDetalheDeResposta(raw);
}

export async function desativarDocumentoApi(documentId: number): Promise<ApiDocumento> {
  await ensureCsrfToken();
  return normaliseDocumento(await apiFetch(`/api/documents/${documentId}/deactivate`, { method: 'PATCH', body: JSON.stringify({}) }));
}

export async function descarregarDocumentoApi(documentId: number): Promise<{ blob: Blob; filename: string }> {
  const response = await api.get<Blob>(`/api/documents/${documentId}/download`, { responseType: 'blob' });
  const header = response.headers['content-disposition'];
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header || '')?.[1];
  const simple = /filename="?([^";]+)"?/i.exec(header || '')?.[1];
  return { blob: response.data, filename: encoded ? decodeURIComponent(encoded) : (simple || 'documento') };
}
export async function pedidosApi(clienteId?: number): Promise<ApiPedido[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiPedido[]>(`/api/pedidos/${qs}`);
}
export async function avaliacoesApi(clienteId?: number): Promise<ApiAvaliacao[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  const result = await apiFetch<unknown>(`/api/avaliacoes/${qs}`);
  return Array.isArray(result) ? result.map(normaliseAvaliacao) : [];
}
export async function logsApi(limit = 200): Promise<any[]> {
  return apiFetch<any[]>(`/api/logs/?limit=${limit}`);
}
export async function opcoesApi(): Promise<any> {
  return apiFetch<any>('/api/opcoes/');
}

// Conteúdo público e CMS. As rotas já existem no Django e têm o mesmo
// contrato nas rotas Node equivalentes, para uma transição incremental.
export async function conteudosPublicosApi(chave?: string): Promise<ApiConteudoSite[]> {
  const qs = chave ? `?chave=${encodeURIComponent(chave)}` : '';
  return apiFetch<ApiConteudoSite[]>(`/api/public/conteudos/${qs}`);
}

export async function noticiasPublicasApi(): Promise<ApiNoticia[]> {
  return apiFetch<ApiNoticia[]>('/api/public/noticias/');
}

export async function noticiaPublicaDetalheApi(id: number): Promise<ApiNoticia> {
  return apiFetch<ApiNoticia>(`/api/public/noticias/${id}/`);
}

export async function enviarContactoPublicoApi(payload: ContactoPublicoPayload): Promise<{ mensagem: string; id: number }> {
  await ensureCsrfToken();
  return apiFetch<{ mensagem: string; id: number }>('/api/public/contacto/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function conteudosAdminApi(): Promise<ApiConteudoSite[]> {
  return apiFetch<ApiConteudoSite[]>('/api/admin/conteudos/');
}

export async function criarConteudoAdminApi(payload: Omit<ApiConteudoSite, 'id' | 'atualizado_por' | 'atualizado_por_nome' | 'criado_em' | 'atualizado_em'>): Promise<ApiConteudoSite> {
  await ensureCsrfToken();
  return apiFetch<ApiConteudoSite>('/api/admin/conteudos/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function atualizarConteudoAdminApi(id: number, payload: Partial<Omit<ApiConteudoSite, 'id' | 'atualizado_por' | 'atualizado_por_nome' | 'criado_em' | 'atualizado_em'>>): Promise<ApiConteudoSite> {
  await ensureCsrfToken();
  return apiFetch<ApiConteudoSite>(`/api/admin/conteudos/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function noticiasAdminApi(): Promise<ApiNoticia[]> {
  return apiFetch<ApiNoticia[]>('/api/admin/noticias/');
}

export async function criarNoticiaAdminApi(payload: Omit<ApiNoticia, 'id' | 'autor_id' | 'autor_nome' | 'publicada_em' | 'criado_em' | 'atualizado_em'>): Promise<ApiNoticia> {
  await ensureCsrfToken();
  return apiFetch<ApiNoticia>('/api/admin/noticias/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function atualizarNoticiaAdminApi(id: number, payload: Partial<Omit<ApiNoticia, 'id' | 'autor_id' | 'autor_nome' | 'publicada_em' | 'criado_em' | 'atualizado_em'>>): Promise<ApiNoticia> {
  await ensureCsrfToken();
  return apiFetch<ApiNoticia>(`/api/admin/noticias/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function mensagensContactoAdminApi(): Promise<ApiMensagemContacto[]> {
  return apiFetch<ApiMensagemContacto[]>('/api/admin/contactos/');
}

export async function atualizarMensagemContactoAdminApi(id: number, estado: ApiMensagemContacto['estado']): Promise<ApiMensagemContacto> {
  await ensureCsrfToken();
  return apiFetch<ApiMensagemContacto>(`/api/admin/contactos/${id}/`, { method: 'PATCH', body: JSON.stringify({ estado }) });
}
