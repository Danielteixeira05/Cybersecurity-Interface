import type { Page, UserRole } from './types';

export type PerfilCodigo = 'ADMINISTRADOR' | 'COLABORADOR' | 'CLIENTE';

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
  clientes?: string | null;
  cliente_id?: number | null;
}

export interface ApiUtilizadorPayload {
  nome: string;
  email: string;
  telefone?: string;
  nif?: string;
  password?: string;
  ativo?: boolean;
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
  estado_conformidade?: string | null;
  nivel_risco?: string | null;
  pontuacao?: string | number | null;
  data_avaliacao?: string | null;
  resumo_avaliacao?: string | null;
  recomendacoes?: string | null;
  total_ativos?: number;
  total_incidentes?: number;
}

export interface ApiContactoCliente {
  id: number;
  cliente_id: number;
  tipo: 'RESPONSAVEL_SEGURANCA' | 'CONTACTO_PERMANENTE' | 'OUTRO';
  nome: string;
  cargo?: string | null;
  email: string;
  telefone?: string | null;
  comunicado_cncs?: boolean;
  ativo?: boolean;
}

export interface ApiContactoClientePayload {
  nome: string;
  cargo?: string;
  email: string;
  telefone?: string;
  comunicado_cncs?: boolean;
}

export interface ApiClientePayload {
  nome: string;
  nif: string;
  email: string;
  telefone?: string;
  morada?: string;
  setor_atividade?: string;
  numero_colaboradores?: number | null;
  volume_negocios?: number | null;
  responsavel_seguranca?: ApiContactoClientePayload;
  contacto_permanente?: ApiContactoClientePayload;
}

export interface ApiClienteDetalhe {
  cliente: ApiCliente;
  contactos: ApiContactoCliente[];
  ativos: ApiAtivo[];
  incidentes: ApiIncidente[];
  documentos: ApiDocumento[];
  avaliacoes: ApiAvaliacao[];
  pedidos: ApiPedido[];
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
  data_aquisicao?: string | null;
  criado_em?: string;
}

export interface ApiIncidente {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  codigo: string;
  data_hora_incidente: string;
  registado_por?: string | null;
  departamento?: string | null;
  tipo_incidente: string;
  descricao?: string | null;
  utilizadores_afetados?: number;
  dados_comprometidos?: boolean;
  sistemas_afetados?: string | null;
  origem_ataque?: string | null;
  ip_atacante?: string | null;
  analise_log?: string | null;
  resposta_imediata?: string | null;
  medidas_corretivas?: string | null;
  gravidade?: string | null;
  probabilidade_reincidencia?: string | null;
  recomendacoes?: string | null;
  estado?: 'ABERTO' | 'EM_ANALISE' | 'ENCERRADO' | string;
  encerrado_em?: string | null;
  responsavel_encerramento?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ApiIncidentePayload {
  cliente_id: number;
  codigo: string;
  data_hora_incidente: string;
  registado_por?: string;
  departamento?: string;
  tipo_incidente: string;
  descricao: string;
  utilizadores_afetados?: number;
  dados_comprometidos?: boolean;
  sistemas_afetados?: string;
  origem_ataque?: string;
  ip_atacante?: string;
  analise_log?: string;
  resposta_imediata?: string;
  medidas_corretivas?: string;
  gravidade: string;
  probabilidade_reincidencia?: string;
  recomendacoes?: string;
  estado: string;
  encerrado_em?: string | null;
  responsavel_encerramento?: string;
}

export interface ApiDocumento {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  titulo: string;
  categoria?: string | null;
  descricao?: string | null;
  nome_ficheiro_original?: string | null;
  tipo_mime?: string | null;
  tamanho_bytes?: number | null;
  submetido_em?: string;
  submetido_por_nome?: string | null;
  privado?: boolean;
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
  observacoes?: string | null;
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

export type ApiConteudoSitePayload = Pick<
  ApiConteudoSite,
  'chave' | 'titulo' | 'subtitulo' | 'corpo' | 'imagem_url' | 'ativo' | 'ordem'
>;

export interface ApiNoticia {
  id: number;
  titulo: string;
  resumo: string;
  corpo: string;
  imagem_url?: string | null;
  autor_id?: number | null;
  autor_nome?: string | null;
  publicada: boolean;
  publicada_em?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export type ApiNoticiaPayload = Pick<
  ApiNoticia,
  'titulo' | 'resumo' | 'corpo' | 'imagem_url' | 'publicada'
>;

export type EstadoMensagemContacto = 'NOVA' | 'EM_ANALISE' | 'RESPONDIDA' | 'ARQUIVADA';

export interface ApiMensagemContacto {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  empresa?: string | null;
  assunto: string;
  mensagem: string;
  estado: EstadoMensagemContacto;
  respondida_por?: number | null;
  respondida_por_nome?: string | null;
  criado_em?: string;
  respondida_em?: string | null;
}

export interface ApiMensagemContactoPayload {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  assunto: string;
  mensagem: string;
}

export interface ApiLoginResponse {
  utilizador: ApiUtilizador;
  cliente?: ApiCliente | null;
  csrf_token?: string;
}

export interface ApiDashboardAdmin {
  tipo: 'admin';
  stats: {
    clientes: number;
    utilizadores: number;
    ativos: number;
    incidentes: number;
    documentos: number;
    pedidos: number;
    incidentes_abertos: number;
    pedidos_abertos: number;
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
  const explicit = env.VITE_API_BASE_URL;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit.replace(/\/$/, '');
  if (DEV_MODE) return '';
  return 'https://cybersecurity-api.vercel.app';
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
  if (role === 'cliente') return 'cli-dashboard';
  return 'home';
}

export async function apiFetch<T = any>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
  const headers = new Headers(init.headers || {});
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const t = getCsrfToken();
    if (t) headers.set('X-CSRFToken', t);
  }
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  const contentType = res.headers.get('Content-Type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'erro' in data ? data.erro : `HTTP ${res.status}`;
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data as T;
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
  if (p === 'CLIENTE') return 'cliente';
  return null;
}

export async function dashboardApi(): Promise<ApiDashboard> {
  return apiFetch<ApiDashboard>('/api/dashboard/');
}
export async function clientesApi(q?: string): Promise<ApiCliente[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<ApiCliente[]>(`/api/clientes/${qs}`);
}
export async function clienteDetalheApi(id: number): Promise<ApiClienteDetalhe> {
  return apiFetch<ApiClienteDetalhe>(`/api/clientes/${id}/`);
}
export async function criarClienteApi(payload: ApiClientePayload): Promise<ApiClienteDetalhe> {
  await ensureCsrfToken();
  return apiFetch<ApiClienteDetalhe>('/api/clientes/', {
    method: 'POST', body: JSON.stringify(payload),
  });
}
export async function atualizarClienteApi(id: number, payload: ApiClientePayload): Promise<ApiClienteDetalhe> {
  await ensureCsrfToken();
  return apiFetch<ApiClienteDetalhe>(`/api/clientes/${id}/`, {
    method: 'PATCH', body: JSON.stringify(payload),
  });
}
export async function alterarEstadoClienteApi(id: number, ativo: boolean): Promise<ApiCliente> {
  await ensureCsrfToken();
  return apiFetch<ApiCliente>(`/api/clientes/${id}/estado/`, {
    method: 'PATCH', body: JSON.stringify({ ativo }),
  });
}
export async function utilizadoresApi(perfil?: string): Promise<ApiUtilizador[]> {
  const qs = perfil ? `?perfil=${encodeURIComponent(perfil)}` : '';
  return apiFetch<ApiUtilizador[]>(`/api/utilizadores/${qs}`);
}
export async function utilizadorDetalheApi(id: number): Promise<ApiUtilizador> {
  return apiFetch<ApiUtilizador>(`/api/utilizadores/${id}/`);
}
export async function criarGestorApi(payload: ApiUtilizadorPayload): Promise<ApiUtilizador> {
  await ensureCsrfToken();
  return apiFetch<ApiUtilizador>('/api/utilizadores/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function atualizarUtilizadorApi(id: number, payload: ApiUtilizadorPayload): Promise<ApiUtilizador> {
  await ensureCsrfToken();
  return apiFetch<ApiUtilizador>(`/api/utilizadores/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
export async function alterarEstadoUtilizadorApi(id: number, ativo: boolean): Promise<ApiUtilizador> {
  await ensureCsrfToken();
  return apiFetch<ApiUtilizador>(`/api/utilizadores/${id}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}
export async function ativosApi(clienteId?: number): Promise<ApiAtivo[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiAtivo[]>(`/api/ativos/${qs}`);
}
export async function incidentesApi(clienteId?: number): Promise<ApiIncidente[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiIncidente[]>(`/api/incidentes/${qs}`);
}
export async function incidenteDetalheApi(id: number): Promise<ApiIncidente> {
  return apiFetch<ApiIncidente>(`/api/incidentes/${id}/`);
}
export async function criarIncidenteApi(payload: ApiIncidentePayload): Promise<ApiIncidente> {
  await ensureCsrfToken();
  return apiFetch<ApiIncidente>('/api/incidentes/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function atualizarIncidenteApi(id: number, payload: ApiIncidentePayload): Promise<ApiIncidente> {
  await ensureCsrfToken();
  return apiFetch<ApiIncidente>(`/api/incidentes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function documentosApi(clienteId?: number): Promise<ApiDocumento[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiDocumento[]>(`/api/documentos/${qs}`);
}
export async function submeterDocumentoApi(payload: {
  clienteId: number; categoria: string; titulo: string; descricao?: string; ficheiro: File;
}): Promise<ApiDocumento> {
  await ensureCsrfToken();
  const body = new FormData();
  body.set('cliente_id', String(payload.clienteId));
  body.set('categoria', payload.categoria);
  body.set('titulo', payload.titulo);
  body.set('descricao', payload.descricao || '');
  body.set('ficheiro', payload.ficheiro);
  return apiFetch<ApiDocumento>('/api/documentos/', { method: 'POST', body });
}
export async function atualizarDocumentoApi(id: number, payload: { categoria: string; titulo: string; descricao?: string }): Promise<ApiDocumento> {
  await ensureCsrfToken();
  return apiFetch<ApiDocumento>(`/api/documentos/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function descarregarDocumentoApi(id: number): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/documentos/${id}/download/`, { credentials: 'include' });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try { const data = await response.json(); message = data?.erro || message; } catch { /* resposta não JSON */ }
    throw new Error(message);
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  return { blob: await response.blob(), filename: encoded ? decodeURIComponent(encoded) : plain || `documento-${id}` };
}
export async function pedidosApi(clienteId?: number): Promise<ApiPedido[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiPedido[]>(`/api/pedidos/${qs}`);
}
export async function avaliacoesApi(clienteId?: number): Promise<ApiAvaliacao[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiAvaliacao[]>(`/api/avaliacoes/${qs}`);
}
export async function logsApi(limit = 200): Promise<any[]> {
  return apiFetch<any[]>(`/api/logs/?limit=${limit}`);
}
export async function opcoesApi(): Promise<any> {
  return apiFetch<any>('/api/opcoes/');
}

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

export async function enviarMensagemContactoApi(payload: ApiMensagemContactoPayload): Promise<{ mensagem: string; id: number }> {
  await ensureCsrfToken();
  return apiFetch<{ mensagem: string; id: number }>('/api/public/contacto/', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function conteudosAdminApi(): Promise<ApiConteudoSite[]> {
  return apiFetch<ApiConteudoSite[]>('/api/admin/conteudos/');
}

export async function criarConteudoAdminApi(payload: ApiConteudoSitePayload): Promise<ApiConteudoSite> {
  await ensureCsrfToken();
  return apiFetch<ApiConteudoSite>('/api/admin/conteudos/', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function atualizarConteudoAdminApi(id: number, payload: ApiConteudoSitePayload): Promise<ApiConteudoSite> {
  await ensureCsrfToken();
  return apiFetch<ApiConteudoSite>(`/api/admin/conteudos/${id}/`, {
    method: 'PATCH', body: JSON.stringify(payload),
  });
}

export async function noticiasAdminApi(): Promise<ApiNoticia[]> {
  return apiFetch<ApiNoticia[]>('/api/admin/noticias/');
}

export async function criarNoticiaAdminApi(payload: ApiNoticiaPayload): Promise<ApiNoticia> {
  await ensureCsrfToken();
  return apiFetch<ApiNoticia>('/api/admin/noticias/', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function atualizarNoticiaAdminApi(id: number, payload: ApiNoticiaPayload): Promise<ApiNoticia> {
  await ensureCsrfToken();
  return apiFetch<ApiNoticia>(`/api/admin/noticias/${id}/`, {
    method: 'PATCH', body: JSON.stringify(payload),
  });
}

export async function contactosAdminApi(): Promise<ApiMensagemContacto[]> {
  return apiFetch<ApiMensagemContacto[]>('/api/admin/contactos/');
}

export async function atualizarEstadoContactoAdminApi(
  id: number,
  estado: EstadoMensagemContacto,
): Promise<ApiMensagemContacto> {
  await ensureCsrfToken();
  return apiFetch<ApiMensagemContacto>(`/api/admin/contactos/${id}/`, {
    method: 'PATCH', body: JSON.stringify({ estado }),
  });
}
