import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { recordAudit } from './audit-log.service.js';
import { emitNotificationRead } from '../socket/events.js';

function serialise(notification) {
  const row = notification.get ? notification.get({ plain: true }) : notification;
  return {
    id: Number(row.id),
    incidente_id: row.incidente_id === null || row.incidente_id === undefined ? null : Number(row.incidente_id),
    documento_id: row.documento_id === null || row.documento_id === undefined ? null : Number(row.documento_id),
    cliente_id: Number(row.cliente_id),
    tipo: row.tipo,
    titulo: row.titulo,
    mensagem: row.mensagem,
    lida: Boolean(row.lida),
    lida_em: row.lida_em ?? null,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

async function activeRecipientIdsForClient(clientId, profileCode, transaction, { principalOnly = false } = {}) {
  const { Profile, User, UserClient } = getModels();
  const links = await UserClient.findAll({
    where: { cliente_id: clientId, ativo: true, ...(principalOnly ? { principal: true } : {}) },
    include: [{
      model: User, as: 'utilizador', required: true, where: { ativo: true }, attributes: ['id'],
      include: [{ model: Profile, as: 'perfil', required: true, where: { codigo: profileCode }, attributes: [] }],
    }],
    attributes: ['utilizador_id'], transaction,
  });
  return links.map((link) => Number(link.utilizador_id));
}

async function activeAdminIds(transaction) {
  const { Profile, User } = getModels();
  const admins = await User.findAll({
    where: { ativo: true }, attributes: ['id'], transaction,
    include: [{ model: Profile, as: 'perfil', required: true, where: { codigo: 'ADMINISTRADOR' }, attributes: [] }],
  });
  return admins.map((user) => Number(user.id));
}

function incidentLabel(incident) {
  return incident.codigo || `#${incident.id}`;
}

async function nis2RecipientIds(clientId, transaction) {
  const [admins, managerLinks, clientLinks] = await Promise.all([
    activeAdminIds(transaction),
    activeRecipientIdsForClient(clientId, 'COLABORADOR', transaction),
    activeRecipientIdsForClient(clientId, 'CLIENTE', transaction, { principalOnly: true }),
  ]);
  return [...new Set([
    ...admins,
    ...managerLinks,
    ...clientLinks,
  ])];
}

/**
 * Persiste a notificação antes de qualquer emissão Socket.IO. A constraint
 * única na base impede duplicação por destinatário/incidente/tipo.
 */
export async function createNis2Notifications({ incident, actorId, transaction }) {
  const { Notification } = getModels();
  const incidentRow = incident.get ? incident.get({ plain: true }) : incident;
  const recipientIds = await nis2RecipientIds(incidentRow.cliente_id, transaction);
  const created = [];
  for (const userId of recipientIds) {
    const [notification, wasCreated] = await Notification.findOrCreate({
      where: { utilizador_id: userId, incidente_id: incidentRow.id, tipo: 'INCIDENTE_NIS2' },
      defaults: {
        utilizador_id: userId,
        incidente_id: incidentRow.id,
        cliente_id: incidentRow.cliente_id,
        tipo: 'INCIDENTE_NIS2',
        titulo: `Incidente NIS2: ${incidentLabel(incidentRow)}`,
        mensagem: 'O incidente foi assinalado para notificação NIS2. Consulte o detalhe autorizado.',
        lida: false,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
      transaction,
    });
    if (wasCreated) created.push({ utilizador_id: userId, ...serialise(notification) });
  }
  if (created.length) {
    await recordAudit({
      userId: actorId, action: 'NOTIFICAR_NIS2', entity: 'incidentes', entityId: Number(incidentRow.id),
      details: { cliente_id: Number(incidentRow.cliente_id), destinatarios: created.map((notification) => notification.utilizador_id) },
    }, transaction);
  }
  return created;
}

const DOCUMENT_NOTIFICATION_TYPES = new Set(['DOCUMENTO_SUBMETIDO', 'DOCUMENTO_REVISTO', 'DOCUMENTO_NOVA_VERSAO']);

function documentLabel(document) {
  return document.titulo || `#${document.id}`;
}

async function activeDocumentAuthorId(document, transaction) {
  if (!document.submetido_por) return null;
  const { User } = getModels();
  const user = await User.findOne({ where: { id: document.submetido_por, ativo: true }, attributes: ['id'], transaction });
  return user ? Number(user.id) : null;
}

/**
 * Persiste notificações documentais antes da emissão Socket.IO. O índice único
 * parcial evita duplicados; uma revisão posterior atualiza e volta a assinalar
 * como não lida a mesma notificação do documento/destinatário/tipo.
 */
export async function createDocumentNotifications({ document, eventType, actorId, transaction, estado }) {
  if (!DOCUMENT_NOTIFICATION_TYPES.has(eventType)) throw httpError(400, 'Tipo de notificação documental inválido.');
  const { Notification } = getModels();
  const row = document.get ? document.get({ plain: true }) : document;
  const isSubmission = eventType === 'DOCUMENTO_SUBMETIDO' || eventType === 'DOCUMENTO_NOVA_VERSAO';
  const authorId = isSubmission ? null : await activeDocumentAuthorId(row, transaction);
  const recipients = isSubmission
    ? [...new Set([
      ...(await activeAdminIds(transaction)),
      ...(await activeRecipientIdsForClient(row.cliente_id, 'COLABORADOR', transaction)),
      ...(await activeRecipientIdsForClient(row.cliente_id, 'CLIENTE', transaction, { principalOnly: true })),
    ])].filter((userId) => userId !== Number(actorId))
    : [...new Set([
      ...(await activeRecipientIdsForClient(row.cliente_id, 'CLIENTE', transaction, { principalOnly: true })),
      ...(authorId ? [authorId] : []),
    ])];

  const title = isSubmission
    ? `Documento submetido: ${documentLabel(row)}`
    : `Documento revisto: ${documentLabel(row)}`;
  const message = isSubmission
    ? 'Existe um documento pendente de consulta na organização autorizada.'
    : `O estado do documento foi atualizado para ${estado ?? row.estado}.`;
  const notifications = [];
  for (const userId of recipients) {
    const existing = await Notification.findOne({ where: { utilizador_id: userId, documento_id: row.id, tipo: eventType }, transaction });
    const values = {
      cliente_id: row.cliente_id,
      titulo: title,
      mensagem: message,
      lida: false,
      lida_em: null,
      atualizado_em: new Date(),
    };
    const notification = existing
      ? await existing.update(values, { transaction })
      : await Notification.create({
        utilizador_id: userId, documento_id: row.id, incidente_id: null, tipo: eventType,
        criado_em: new Date(), ...values,
      }, { transaction });
    notifications.push({ utilizador_id: userId, ...serialise(notification) });
  }
  if (notifications.length) {
    await recordAudit({
      userId: actorId, action: 'NOTIFICAR_DOCUMENTO', entity: 'documentos', entityId: Number(row.id),
      details: { cliente_id: Number(row.cliente_id), tipo: eventType, destinatarios: notifications.map((item) => item.utilizador_id) },
    }, transaction);
  }
  return notifications;
}

export async function listNotifications(auth, { limit } = {}) {
  const { Notification } = getModels();
  const requested = Number(limit ?? 50);
  const boundedLimit = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, 100)) : 50;
  const rows = await Notification.findAll({
    where: { utilizador_id: Number(auth.sub) },
    order: [['criado_em', 'DESC'], ['id', 'DESC']],
    limit: boundedLimit,
  });
  return rows.map(serialise);
}

export async function markNotificationRead(auth, notificationId) {
  const id = Number(notificationId);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, 'Identificador de notificação inválido.');
  const { Notification, sequelize } = getModels();
  const notification = await Notification.findOne({ where: { id, utilizador_id: Number(auth.sub) } });
  if (!notification) throw httpError(404, 'Notificação não encontrada.');
  if (!notification.lida) {
    await sequelize.transaction(async (transaction) => {
      await notification.update({ lida: true, lida_em: new Date(), atualizado_em: new Date() }, { transaction });
      await recordAudit({
        userId: Number(auth.sub), action: 'LER_NOTIFICACAO', entity: 'notificacoes_utilizadores', entityId: id,
        details: {
          incidente_id: notification.incidente_id === null ? null : Number(notification.incidente_id),
          documento_id: notification.documento_id === null ? null : Number(notification.documento_id),
          cliente_id: Number(notification.cliente_id),
        },
      }, transaction);
    });
  }
  const result = serialise(notification);
  emitNotificationRead(Number(auth.sub), result);
  return result;
}
