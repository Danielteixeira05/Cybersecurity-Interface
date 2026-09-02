import { Router } from 'express';
import { commit, list, preview, receiveExcelFile } from '../controllers/excel-import.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

export const excelImportRouter = Router();
excelImportRouter.use(authenticate, requireRoles('admin', 'manager', 'client'));
excelImportRouter.get('/', list);
excelImportRouter.post('/preview', receiveExcelFile, preview);
excelImportRouter.post('/', receiveExcelFile, commit);
