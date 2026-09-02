import { getModels } from '../models/index.js';

// Os detalhes de auditoria podem conter metadados de vários módulos. A sua
// leitura nunca deve transformar os logs num export genérico de JSON: só este
// subconjunto operacional é seguro e útil para o Administrador.
const ACTIVITY_DETAIL_SCALAR_FIELDS = new Set([
  'ativo', 'atribuido_a', 'categoria', 'chave', 'cliente_id', 'codigo',
  'conversa_id', 'criticidade', 'documento_anterior_id', 'documento_id',
  'estado', 'estado_anterior', 'estado_novo', 'gravidade', 'incidente_id',
  'linhas_importadas', 'linhas_rejeitadas', 'max_upload_mb', 'notificado_nis2',
  'perfil', 'prioridade', 'publicada', 'tamanho_bytes', 'tem_observacao',
  'tipo', 'total_linhas',
]);
const ACTIVITY_DETAIL_ARRAY_FIELDS = new Set(['campos', 'clientes_ids', 'destinatarios', 'gestores_ids']);
const ACTIVITY_DETAIL_FIELD_NAMES = new Set(['ativo', 'clientes_ids', 'email', 'nif', 'nome', 'telefone']);
const DANGEROUS_DETAIL_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_SANITISED_DETAIL_KEYS = 24;
const MAX_AUDIT_DETAIL_SOURCE_KEYS = 128;
const MAX_AUDIT_DETAIL_ARRAY_ITEMS = 50;

function safeActivityScalar(value) {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : undefined;
  if (typeof value === 'string') return value.length <= 160 ? value : undefined;
  return undefined;
}

function safeActivityIdList(value) {
  if (!Array.isArray(value)) return undefined;
  const limited = value.slice(0, MAX_AUDIT_DETAIL_ARRAY_ITEMS);
  if (!limited.every((item) => Number.isSafeInteger(item) && item > 0)) return undefined;
  return limited;
}

function safeActivityFieldList(value) {
  if (!Array.isArray(value)) return undefined;
  const limited = value.slice(0, MAX_AUDIT_DETAIL_ARRAY_ITEMS);
  if (!limited.every((item) => typeof item === 'string' && ACTIVITY_DETAIL_FIELD_NAMES.has(item))) {
    return undefined;
  }
  return limited;
}

/**
 * Remove todo o contexto de auditoria que não faça parte da allowlist.
 * Valores aninhados e arrays arbitrários são sempre descartados.
 */
export function sanitiseAuditDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const sanitised = {};
  let sourceKeys = 0;
  let acceptedKeys = 0;
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    sourceKeys += 1;
    if (sourceKeys > MAX_AUDIT_DETAIL_SOURCE_KEYS || acceptedKeys >= MAX_SANITISED_DETAIL_KEYS) break;
    if (DANGEROUS_DETAIL_KEYS.has(key)) continue;
    const detail = value[key];
    if (ACTIVITY_DETAIL_SCALAR_FIELDS.has(key)) {
      const safeValue = safeActivityScalar(detail);
      if (safeValue !== undefined) {
        sanitised[key] = safeValue;
        acceptedKeys += 1;
      }
      continue;
    }
    if (ACTIVITY_DETAIL_ARRAY_FIELDS.has(key)) {
      const safeValue = key === 'campos' ? safeActivityFieldList(detail) : safeActivityIdList(detail);
      if (safeValue !== undefined) {
        sanitised[key] = safeValue;
        acceptedKeys += 1;
      }
    }
  }
  return sanitised;
}

/**
 * Persiste apenas metadados operacionais seguros. Nunca recebe passwords,
 * tokens, cookies nem o corpo de mensagens de contacto.
 */
export async function recordAudit({ userId = null, action, entity, entityId = null, details = {} }, transaction) {
  const { ActivityLog } = getModels();
  return ActivityLog.create({
    utilizador_id: userId,
    acao: action,
    entidade: entity,
    entidade_id: entityId,
    detalhes: details,
    criado_em: new Date(),
  }, { transaction });
}
