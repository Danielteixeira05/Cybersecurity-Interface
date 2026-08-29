import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
export const SOCKET_IO_PATH = '/api/socket-io/socket.io';

function socketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configured) return configured;
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, '');
  return window.location.origin;
}

export function realtimeSocket() {
  if (!socket) {
    socket = io(socketUrl(), {
      autoConnect: false,
      withCredentials: true,
      path: SOCKET_IO_PATH,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 750,
      reconnectionDelayMax: 4000,
    });
  }
  return socket;
}

export function closeRealtimeSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
