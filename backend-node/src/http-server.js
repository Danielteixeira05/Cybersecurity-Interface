import { createServer } from 'node:http';
import { app } from './app.js';
import { createSocketServer } from './socket/index.js';

/**
 * Cria o servidor HTTP apenas para os processos que aceitam ligações diretas:
 * o arranque local e a Function dedicada ao Socket.IO. A aplicação Express
 * continua exportável isoladamente para a Function REST.
 */
export function createRealtimeHttpServer() {
  const httpServer = createServer(app);
  createSocketServer(httpServer);
  return httpServer;
}
