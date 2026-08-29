import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { getModels } from '../models/index.js';
import { recordAudit } from './audit-log.service.js';

export const DOCUMENT_UPLOAD_LIMIT_KEY = 'MAX_UPLOAD_MB';
export const DOCUMENT_UPLOAD_LIMIT_MIN_MB = 1;
export const DOCUMENT_UPLOAD_LIMIT_MAX_MB = 100;

export function validDocumentUploadLimit(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= DOCUMENT_UPLOAD_LIMIT_MIN_MB && value <= DOCUMENT_UPLOAD_LIMIT_MAX_MB) return value;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed >= DOCUMENT_UPLOAD_LIMIT_MIN_MB && parsed <= DOCUMENT_UPLOAD_LIMIT_MAX_MB ? parsed : null;
}

export function requiredDocumentUploadLimit(value) {
  const limit = validDocumentUploadLimit(value);
  if (!limit) throw httpError(400, `O limite deve ser um inteiro entre ${DOCUMENT_UPLOAD_LIMIT_MIN_MB} e ${DOCUMENT_UPLOAD_LIMIT_MAX_MB} MB.`);
  return limit;
}

export function resolveDocumentUploadLimit({ configuredValue, fallbackValue = env.maxUploadMb, safetyValue = env.documentUploadSafetyMaxMb } = {}) {
  const functional = validDocumentUploadLimit(configuredValue) ?? requiredDocumentUploadLimit(fallbackValue);
  const safety = requiredDocumentUploadLimit(safetyValue);
  return Math.min(functional, safety);
}

function settingOptions(transaction, lock = false) {
  return {
    where: { chave: DOCUMENT_UPLOAD_LIMIT_KEY },
    attributes: ['id', 'valor'],
    ...(transaction ? { transaction } : {}),
    ...(transaction && lock ? { lock: transaction.LOCK.UPDATE } : {}),
  };
}

export async function readDocumentUploadLimit({
  models = getModels(),
  fallbackValue = env.maxUploadMb,
  safetyValue = env.documentUploadSafetyMaxMb,
} = {}) {
  const row = await models.SystemConfiguration.findOne(settingOptions());
  const configuredLimit = validDocumentUploadLimit(row?.valor);
  return {
    maxUploadMb: resolveDocumentUploadLimit({ configuredValue: row?.valor, fallbackValue, safetyValue }),
    configuredUploadMb: configuredLimit,
    usesFallback: configuredLimit === null,
  };
}

export async function updateDocumentUploadLimit(auth, input, {
  models = getModels(),
  readOnly = env.readOnlyMode,
  audit = recordAudit,
} = {}) {
  if (auth?.role !== 'admin') throw httpError(403, 'Só o Administrador pode alterar o limite de upload.');
  if (readOnly) throw httpError(403, 'A configuração de upload está desativada em modo de leitura.');
  const limit = requiredDocumentUploadLimit(input?.max_upload_mb);
  const actorId = Number(auth.sub);

  return models.sequelize.transaction(async (transaction) => {
    const existing = await models.SystemConfiguration.findOne(settingOptions(transaction, true));
    const values = {
      valor: String(limit),
      atualizado_por: actorId,
      atualizado_em: new Date(),
    };
    const setting = existing
      ? await existing.update(values, { transaction })
      : await models.SystemConfiguration.create({
        chave: DOCUMENT_UPLOAD_LIMIT_KEY,
        descricao: 'Limite funcional de upload documental em MB.',
        criado_em: new Date(),
        ...values,
      }, { transaction });

    await audit({
      userId: actorId,
      action: existing ? 'ATUALIZAR' : 'CRIAR',
      entity: 'configuracoes_sistema',
      entityId: Number(setting.id),
      details: { chave: DOCUMENT_UPLOAD_LIMIT_KEY, max_upload_mb: limit },
    }, transaction);

    return {
      maxUploadMb: resolveDocumentUploadLimit({ configuredValue: String(limit) }),
      configuredUploadMb: limit,
      usesFallback: false,
    };
  });
}
