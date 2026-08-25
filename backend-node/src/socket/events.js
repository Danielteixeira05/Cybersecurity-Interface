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
    incidente_id: Number(notification.incidente_id),
    cliente_id: Number(notification.cliente_id),
    data: notification.criado_em ?? new Date().toISOString(),
  });
}

export function emitNotificationRead(userId, notification) {
  if (!io) return;
  io.to(roomForUser(userId)).emit('notification:read', {
    id: Number(notification.id), tipo: notification.tipo, incidente_id: Number(notification.incidente_id),
    cliente_id: Number(notification.cliente_id), data: notification.atualizado_em ?? new Date().toISOString(),
  });
}
