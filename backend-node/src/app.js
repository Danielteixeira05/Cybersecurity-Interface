import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { legacyDetail, legacyList } from './controllers/clients.controller.js';
import { login, logout, me } from './controllers/auth.controller.js';
import { dashboard } from './controllers/dashboard.controller.js';
import { assets, documents, incidents } from './controllers/resources.controller.js';
import { authenticate, requireRoles } from './middleware/auth.js';
import { issueCsrfToken, requireCsrf } from './middleware/csrf.js';
import { authRouter } from './routes/auth.routes.js';
import { clientsRouter } from './routes/clients.routes.js';
import { adminCmsRouter, publicCmsRouter } from './routes/cms.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { logsRouter } from './routes/logs.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { incidentsRouter } from './routes/incidents.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { conversationsRouter } from './routes/conversations.routes.js';
import { documentsRouter } from './routes/documents.routes.js';
import { requestsRouter } from './routes/requests.routes.js';
import { excelImportRouter } from './routes/excel-import.routes.js';
import { assessmentsRouter } from './routes/assessments.routes.js';
import { legacyList as legacyRequestsList } from './controllers/requests.controller.js';
import { legacyList as legacyUsersList } from './controllers/users.controller.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'ciberboxsecur-node-api' });
});

app.use('/api/auth', requireCsrf, authRouter);
app.use('/api/clients', requireCsrf, clientsRouter);
app.use('/api/users', requireCsrf, usersRouter);
app.use('/api/logs', requireCsrf, logsRouter);
app.use('/api/assets', requireCsrf, assetsRouter);
app.use('/api/incidents', requireCsrf, incidentsRouter);
app.use('/api/notifications', requireCsrf, notificationsRouter);
app.use('/api/conversations', requireCsrf, conversationsRouter);
app.use('/api/documents', requireCsrf, documentsRouter);
app.use('/api/requests', requireCsrf, requestsRouter);
app.use('/api/excel-imports', requireCsrf, excelImportRouter);
app.use('/api/avaliacoes', requireCsrf, assessmentsRouter);
app.use('/api/public', requireCsrf, publicCmsRouter);
app.use('/api/admin', requireCsrf, adminCmsRouter);
// Rotas de compatibilidade para permitir a transição gradual do cliente React atual.
app.get('/api/csrf/', issueCsrfToken);
app.post('/api/login/', requireCsrf, login);
app.get('/api/me/', authenticate, me);
app.post('/api/logout/', requireCsrf, logout);
app.get('/api/dashboard/', authenticate, dashboard);
app.get('/api/clientes/', authenticate, legacyList);
app.get('/api/clientes/:clientId/', authenticate, legacyDetail);
app.get('/api/utilizadores/', authenticate, requireRoles('admin'), legacyUsersList);
app.get('/api/ativos/', authenticate, assets);
app.get('/api/incidentes/', authenticate, incidents);
app.get('/api/documentos/', authenticate, documents);
app.get('/api/pedidos/', authenticate, legacyRequestsList);
app.use(notFound);
app.use(errorHandler);
