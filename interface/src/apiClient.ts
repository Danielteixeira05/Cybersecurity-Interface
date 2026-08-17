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
  titulo: string;
  tipo?: string | null;
  severidade?: string | null;
  descricao?: string | null;
  detetado_em?: string | null;
  resolvido_em?: string | null;
  criado_em?: string;
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

const DEV_MODE = typeof import.meta !== 'undefined' && !!import.meta.dev;

export function getApiBaseUrl(): string {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || ({} as Record<string, string | undefined>);
  const explicit = env.VITE_API_BASE_URL;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit.replace(/\/$/, '');
  if (!DEV_MODE) {
    return 'https://cybersecurity-api.vercel.app';
  }
  return `http://localhost:${(import.meta.env as any)?.VITE_DJANGO_PORT || '8000'}`;
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
export async function clienteDetalheApi(id: number): Promise<any> {
  return apiFetch<any>(`/api/clientes/${id}/`);
}
export async function utilizadoresApi(perfil?: string): Promise<ApiUtilizador[]> {
  const qs = perfil ? `?perfil=${encodeURIComponent(perfil)}` : '';
  return apiFetch<ApiUtilizador[]>(`/api/utilizadores/${qs}`);
}
export async function ativosApi(clienteId?: number): Promise<ApiAtivo[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiAtivo[]>(`/api/ativos/${qs}`);
}
export async function incidentesApi(clienteId?: number): Promise<ApiIncidente[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiIncidente[]>(`/api/incidentes/${qs}`);
}
export async function documentosApi(clienteId?: number): Promise<ApiDocumento[]> {
  const qs = clienteId ? `?cliente_id=${clienteId}` : '';
  return apiFetch<ApiDocumento[]>(`/api/documentos/${qs}`);
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
