import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './socket/index.js';

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`CiberBoxSecur Node API pronta em http://localhost:${env.port}`);
});
