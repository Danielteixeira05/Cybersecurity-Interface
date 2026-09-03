import { Router } from 'express';
import {
  adminContactMessageDetail, adminContactMessages, adminContentDetail, adminContents,
  adminNews, adminNewsDetail, publicContact, publicContents, publicNews, publicNewsDetail,
} from '../controllers/cms.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export function createPublicCmsRouter({ handlers = {} } = {}) {
  const router = Router();
  const resolved = {
    publicContents,
    publicNews,
    publicNewsDetail,
    publicContact,
    ...handlers,
  };
  router.get('/conteudos/', resolved.publicContents);
  router.get('/noticias/', resolved.publicNews);
  router.get('/noticias/:id/', resolved.publicNewsDetail);
  router.post('/contacto/', resolved.publicContact);
  return router;
}

export function createAdminCmsRouter({
  authenticateMiddleware = authenticate,
  requireRolesMiddleware = requireRoles,
  handlers = {},
} = {}) {
  const router = Router();
  const resolved = {
    adminContents,
    adminContentDetail,
    adminNews,
    adminNewsDetail,
    adminContactMessages,
    adminContactMessageDetail,
    ...handlers,
  };
  router.use(authenticateMiddleware, requireRolesMiddleware('admin'));
  router.route('/conteudos/').get(resolved.adminContents).post(resolved.adminContents);
  router.route('/conteudos/:id/').get(resolved.adminContentDetail).patch(resolved.adminContentDetail);
  router.route('/noticias/').get(resolved.adminNews).post(resolved.adminNews);
  router.route('/noticias/:id/').get(resolved.adminNewsDetail).patch(resolved.adminNewsDetail);
  router.get('/contactos/', resolved.adminContactMessages);
  router.patch('/contactos/:id/', resolved.adminContactMessageDetail);
  return router;
}

export const publicCmsRouter = createPublicCmsRouter();
export const adminCmsRouter = createAdminCmsRouter();
