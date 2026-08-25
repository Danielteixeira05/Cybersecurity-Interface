import { Router } from 'express';
import {
  adminContactMessageDetail, adminContactMessages, adminContentDetail, adminContents,
  adminNews, adminNewsDetail, publicContact, publicContents, publicNews, publicNewsDetail,
} from '../controllers/cms.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const publicCmsRouter = Router();
publicCmsRouter.get('/conteudos/', publicContents);
publicCmsRouter.get('/noticias/', publicNews);
publicCmsRouter.get('/noticias/:id/', publicNewsDetail);
publicCmsRouter.post('/contacto/', publicContact);

export const adminCmsRouter = Router();
adminCmsRouter.use(authenticate, requireRoles('admin'));
adminCmsRouter.route('/conteudos/').get(adminContents).post(adminContents);
adminCmsRouter.route('/conteudos/:id/').get(adminContentDetail).patch(adminContentDetail);
adminCmsRouter.route('/noticias/').get(adminNews).post(adminNews);
adminCmsRouter.route('/noticias/:id/').get(adminNewsDetail).patch(adminNewsDetail);
adminCmsRouter.get('/contactos/', adminContactMessages);
adminCmsRouter.patch('/contactos/:id/', adminContactMessageDetail);
