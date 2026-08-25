import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { recordAudit } from './audit-log.service.js';
import { emitNotificationRead } from '../socket/events.js';

function serialise(notification) {
  const row = notification.get ? notification.get({ plain: true }) : notification;
  return {
    id: Number(row.id),
    incidente_id: Number(row.incidente_id),
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

function incidentLabel(incident) {
  return incident.codigo || `#${incident.id}`;
}

async function nis2RecipientIds(clientId, transaction) {
  const { Profile, User, UserClient } = getModels();
  const admins = await User.findAll({
    where: { ativo: true },
    include: [{ model: Profile, as: 'perfil', where: { codigo: 'ADMINISTRADOR' }, attributes: [] }],
    attributes: ['id'], transaction,
  });
  const managerLinks = await UserClient.findAll({
    where: { cliente_id: clientId, ativo: true },
    include: [{
      model: User, as: 'utilizador', required: true, where: { ativo: true }, attributes: ['id'],
      include: [{ model: Profile, as: 'perfil', required: true, where: { codigo: 'COLABORADOR' }, attributes: [] }],
    }],
    attributes: ['utilizador_id'], transaction,
  });
  const clientLinks = await UserClient.findAll({
    where: { cliente_id: clientId, ativo: true, principal: true },
    include: [{
      model: User, as: 'utilizador', required: true, where: { ativo: true }, attributes: ['id'],
      include: [{ model: Profile, as: 'perfil', required: true, where: { codigo: 'CLIENTE' }, attributes: [] }],
    }],
    attributes: ['utilizador_id'], transaction,
  });
  return [...new Set([
    ...admins.map((user) => Number(user.id)),
    ...managerLinks.map((link) => Number(link.utilizador_id)),
    ...clientLinks.map((link) => Number(link.utilizador_id)),
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
        details: { incidente_id: Number(notification.incidente_id), cliente_id: Number(notification.cliente_id) },
      }, transaction);
    });
  }
  const result = serialise(notification);
  emitNotificationRead(Number(auth.sub), result);
  return result;
}
