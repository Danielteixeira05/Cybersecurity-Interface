let io;

export const roomForUser = (userId) => `user:${userId}`;
export const roomForClient = (clientId) => `client:${clientId}`;
export const ADMIN_ROOM = 'role:admin';

export function setRealtimeServer(server) {
  io = server;
}

function eventPayload(incident) {
  return {
    id: Number(incident.id),
    cliente_id: Number(incident.cliente_id),
    tipo: 'INCIDENTE',
    data: new Date().toISOString(),
  };
}

export function emitIncidentChanged(kind, incident) {
  if (!io || !incident) return;
  const payload = eventPayload(incident);
  io.to(roomForClient(payload.cliente_id)).emit(`incident:${kind}`, payload);
  io.to(ADMIN_ROOM).emit(`incident:${kind}`, payload);
  io.to(roomForClient(payload.cliente_id)).emit('summary:updated', payload);
  io.to(ADMIN_ROOM).emit('summary:updated', payload);
}

export function emitNotification(notification) {
  if (!io || !notification) return;
  io.to(roomForUser(notification.utilizador_id)).emit('notification:new', {
    id: Number(notification.id),
    tipo: notification.tipo,
    incidente_id: notification.incidente_id === null || notification.incidente_id === undefined ? null : Number(notification.incidente_id),
    documento_id: notification.documento_id === null || notification.documento_id === undefined ? null : Number(notification.documento_id),
    cliente_id: Number(notification.cliente_id),
    data: notification.criado_em ?? new Date().toISOString(),
  });
}

export function emitNotificationRead(userId, notification) {
  if (!io) return;
  io.to(roomForUser(userId)).emit('notification:read', {
    id: Number(notification.id), tipo: notification.tipo,
    incidente_id: notification.incidente_id === null || notification.incidente_id === undefined ? null : Number(notification.incidente_id),
    documento_id: notification.documento_id === null || notification.documento_id === undefined ? null : Number(notification.documento_id),
    cliente_id: Number(notification.cliente_id), data: notification.atualizado_em ?? new Date().toISOString(),
  });
}

/** Eventos documentais só chegam a utilizadores já autorizados pelo serviço. */
export function emitDocumentChanged(kind, document, recipientIds) {
  if (!io || !document) return;
  const payload = {
    id: Number(document.id), cliente_id: Number(document.cliente_id), estado: document.estado,
    tipo: 'DOCUMENTO', data: new Date().toISOString(),
  };
  for (const userId of recipientIds) {
    io.to(roomForUser(userId)).emit(`document:${kind}`, payload);
    io.to(roomForUser(userId)).emit('summary:updated', payload);
  }
}

/**
 * As mensagens são emitidas apenas para salas individuais autorizadas. Isto
 * evita entregar conteúdo a sockets cuja associação à organização mudou depois
 * de se terem ligado à sala genérica do cliente.
 */
export function emitChatMessage(message, recipientIds, senderId, clientId) {
  if (!io || !message) return;
  const payload = { ...message, cliente_id: Number(clientId) };
  for (const userId of recipientIds) {
    io.to(roomForUser(userId)).emit('chat:message', payload);
    if (Number(userId) !== Number(senderId)) {
      io.to(roomForUser(userId)).emit('chat:unread', {
        conversa_id: Number(message.conversa_id), cliente_id: Number(clientId), mensagem_id: Number(message.id),
      });
    }
  }
}

export function emitChatRead(userId, read) {
  if (!io || !read) return;
  io.to(roomForUser(userId)).emit('chat:read', {
    conversa_id: Number(read.conversa_id), ultima_mensagem_id: read.ultima_mensagem_id ?? null, data: read.atualizado_em,
  });
}
