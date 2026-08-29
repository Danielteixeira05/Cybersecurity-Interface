import { env } from './config/env.js';
import { createRealtimeHttpServer } from './http-server.js';

const httpServer = createRealtimeHttpServer();

httpServer.listen(env.port, () => {
  console.log(`CiberBoxSecur Node API pronta em http://localhost:${env.port}`);
});
