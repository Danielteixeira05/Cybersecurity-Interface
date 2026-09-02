import { httpError } from '../middleware/errors.js';
import { getModels } from '../models/index.js';
import { sanitiseAuditDetails } from './audit-log.service.js';

export const DEFAULT_ACTIVITY_LOG_LIMIT = 50;
export const MAX_ACTIVITY_LOG_LIMIT = 100;

function plainRecord(record) {
  return record?.get ? record.get({ plain: true }) : record;
}

function parseCanonicalInteger(value, { field, minimum, fallback }) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/.test(value)) {
    throw httpError(400, `${field} inválido.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw httpError(400, `${field} inválido.`);
  }
  return parsed;
}

export function normaliseActivityLogPagination(query = {}) {
  const requestedLimit = parseCanonicalInteger(query.limit, {
    field: 'Limite', minimum: 1, fallback: DEFAULT_ACTIVITY_LOG_LIMIT,
  });
  const offset = parseCanonicalInteger(query.offset, {
    field: 'Offset', minimum: 0, fallback: 0,
  });
  return { limit: Math.min(requestedLimit, MAX_ACTIVITY_LOG_LIMIT), offset };
}

function serialiseActor(value) {
  const actor = plainRecord(value);
  const id = Number(actor?.id);
  if (!Number.isSafeInteger(id) || id < 1 || typeof actor?.nome !== 'string' || typeof actor?.email !== 'string') {
    return null;
  }
  return { id, nome: actor.nome, email: actor.email };
}

function serialiseTimestamp(value) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}

export function serialiseActivityLog(record) {
  const row = plainRecord(record) ?? {};
  const id = Number(row.id);
  const entityId = row.entidade_id == null ? null : Number(row.entidade_id);
  return {
    id: Number.isSafeInteger(id) ? id : null,
    utilizador: serialiseActor(row.utilizador),
    acao: typeof row.acao === 'string' ? row.acao : '',
    entidade: typeof row.entidade === 'string' ? row.entidade : '',
    entidade_id: Number.isSafeInteger(entityId) ? entityId : null,
    detalhes: sanitiseAuditDetails(row.detalhes),
    criado_em: serialiseTimestamp(row.criado_em),
  };
}

export function createActivityLogReader(modelsProvider = getModels) {
  return async function listActivityLogs(query) {
    const { limit, offset } = normaliseActivityLogPagination(query);
    const { ActivityLog, User } = modelsProvider();
    const { count, rows } = await ActivityLog.findAndCountAll({
      attributes: ['id', 'utilizador_id', 'acao', 'entidade', 'entidade_id', 'detalhes', 'criado_em'],
      include: [{ model: User, as: 'utilizador', attributes: ['id', 'nome', 'email'], required: false }],
      order: [['criado_em', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
    });
    const total = Number(count);
    if (!Number.isSafeInteger(total) || total < 0) throw httpError(500, 'Total de logs inválido.');
    const items = rows.map(serialiseActivityLog);
    const nextOffset = offset + items.length;

    return {
      items,
      pagination: {
        limit,
        offset,
        total,
        has_more: nextOffset < total,
        next_offset: nextOffset < total ? nextOffset : null,
      },
    };
  };
}

export const listActivityLogs = createActivityLogReader();
