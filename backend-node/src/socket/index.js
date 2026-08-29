import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { getModels } from '../models/index.js';
import { roleForProfile } from '../middleware/auth.js';
import { clientIdsForUser } from '../services/clients.service.js';
import { ADMIN_ROOM, roomForClient, roomForUser, setRealtimeServer } from './events.js';

export const SOCKET_IO_PATH = '/api/socket-io/socket.io';
export const SOCKET_IO_TRANSPORTS = Object.freeze(['websocket']);

function cookieValue(header, name) {
  if (typeof header !== 'string') return null;
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) return decodeURIComponent(entry.slice(prefix.length));
  }
  return null;
}

function origins() {
  return env.socketCorsOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
}

async function socketIdentity(socket) {
  if (!env.jwtSecret) throw new Error('Sessão indisponível.');
  const token = cookieValue(socket.request.headers.cookie, 'cbsess_node');
  if (!token) throw new Error('Autenticação necessária.');
  const payload = jwt.verify(token, env.jwtSecret);
  const { User, Profile, Client } = getModels();
  const user = await User.findByPk(payload.sub, {
    include: [{ model: Profile, as: 'perfil', attributes: ['codigo'] }],
  });
  const role = user?.ativo ? roleForProfile(user.perfil?.codigo) : null;
  if (!role) throw new Error('Sessão inválida.');

  const linkedIds = role === 'admin' ? [] : await clientIdsForUser(user.id, { principalOnly: role === 'client' });
  const activeClients = linkedIds.length ? await Client.findAll({ where: { id: linkedIds, ativo: true }, attributes: ['id'] }) : [];
  return { userId: Number(user.id), role, clientIds: activeClients.map((client) => Number(client.id)) };
}

export function roomsForIdentity(identity) {
  const rooms = [roomForUser(identity.userId)];
  if (identity.role === 'admin') rooms.push(ADMIN_ROOM);
  for (const clientId of identity.clientIds) rooms.push(roomForClient(clientId));
  return rooms;
}

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: SOCKET_IO_PATH,
    transports: SOCKET_IO_TRANSPORTS,
    cors: { origin: origins(), credentials: true, methods: ['GET', 'POST'] },
  });
  io.use(async (socket, next) => {
    try {
      socket.data.identity = await socketIdentity(socket);
      return next();
    } catch {
      return next(new Error('Não autorizado.'));
    }
  });
  io.on('connection', (socket) => {
    for (const room of roomsForIdentity(socket.data.identity)) socket.join(room);
    // Não há evento de "join" do browser: as salas são integralmente atribuídas no servidor.
  });
  setRealtimeServer(io);
  return io;
}
