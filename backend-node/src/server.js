import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`CiberBoxSecur Node API pronta em http://localhost:${env.port}`);
});
