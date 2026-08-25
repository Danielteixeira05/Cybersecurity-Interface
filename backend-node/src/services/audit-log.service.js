import { getModels } from '../models/index.js';

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
