import { createRealtimeHttpServer } from '../src/http-server.js';

// A Vercel Function recebe o upgrade em /api/socket-io/socket.io.
export default createRealtimeHttpServer();
