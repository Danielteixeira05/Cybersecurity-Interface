import { createHash, randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { getModels } from '../models/index.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';
import { createDocumentNotifications } from './notifications.service.js';
import { emitDocumentChanged, emitNotification } from '../socket/events.js';
import { ALLOWED_DOCUMENT_TYPES, createVercelBlobStorage, validateDocumentFile } from './document-storage.service.js';

export const DOCUMENT_CATEGORIES = Object.freeze([
  'PENTEST', 'PLANO_SEGURANCA', 'RELATORIO_CNCS', 'FORMACAO',
  'DOCUMENTO_INTERNO', 'ATIVOS_EXCEL', 'OUTRO',
  // Categorias legadas que continuam aceites pelo schema já existente.
  'DOCUMENTACAO', 'RELATORIO', 'EVIDENCIA',
]);
export const DOCUMENT_STATES = Object.freeze(['SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES']);

const CATEGORY_SET = new Set(DOCUMENT_CATEGORIES);
const STATE_SET = new Set(DOCUMENT_STATES);
const UPLOAD_WINDOW_MS = 5 * 60 * 1000;
const UPLOAD_LIMIT_PER_WINDOW = 5;
const uploadAttempts = new Map();
let testStorage = null;

function asNumber(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function cleanText(value, maximum, { required = false } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw httpError(400, 'Campo obrigatório.');
  if (text.length > maximum) throw httpError(400, `Máximo de ${maximum} caracteres.`);
  return text;
}

function cleanDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = cleanText(value, 10, { required: true });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, 'Data de documento inválida.');
  return date;
}

function requestedClientId(value) {
  if (value === undefined || value === null || value === '') return null;
  const id = asNumber(value);
  if (!id) throw httpError(400, 'Identificador de organização inválido.');
  return id;
}

function documentFields(input) {
  const categoria = cleanText(input.categoria, 30, { required: true }).toUpperCase();
  if (!CATEGORY_SET.has(categoria)) throw httpError(400, 'Categoria documental inválida.');
  return {
    categoria,
    titulo: cleanText(input.titulo, 180, { required: true }),
    descricao: cleanText(input.descricao, 6000) || null,
    versao: cleanText(input.versao ?? '1.0', 40, { required: true }),
    data_documento: cleanDate(input.data_documento),
  };
}

function serialiseDocument(value) {
  const row = value?.get ? value.get({ plain: true }) : value;
  if (!row) return null;
  return {
    id: Number(row.id),
    cliente_id: Number(row.cliente_id),
    cliente_nome: row.cliente?.nome ?? row.cliente_nome ?? null,
    cliente_nif: row.cliente?.nif ?? row.cliente_nif ?? null,
    categoria: row.categoria,
    titulo: row.titulo,
    descricao: row.descricao ?? null,
    nome_ficheiro_original: row.nome_ficheiro_original,
    tipo_mime: row.tipo_mime,
    tamanho_bytes: Number(row.tamanho_bytes),
    privado: Boolean(row.privado),
    submetido_por: row.submetido_por === null ? null : Number(row.submetido_por),
    submetido_por_nome: row.submetidoPor?.nome ?? row.submetido_por_nome ?? null,
    submetido_em: row.submetido_em,
    ativo: Boolean(row.ativo),
    estado: row.estado,
    versao: row.versao,
    data_documento: row.data_documento ?? null,
    documento_anterior_id: row.documento_anterior_id === null ? null : Number(row.documento_anterior_id),
    revisto_por: row.revisto_por === null ? null : Number(row.revisto_por),
    revisto_por_nome: row.revistoPor?.nome ?? row.revisto_por_nome ?? null,
    revisto_em: row.revisto_em ?? null,
    atualizado_em: row.atualizado_em,
  };
}

function serialiseReview(value) {
  const row = value?.get ? value.get({ plain: true }) : value;
  return {
    id: Number(row.id), documento_id: Number(row.documento_id), estado_anterior: row.estado_anterior ?? null,
    estado_novo: row.estado_novo, observacao: row.observacao ?? null, autor_id: Number(row.autor_id),
    autor_nome: row.autor?.nome ?? null, criado_em: row.criado_em,
  };
}

function storage() {
  return testStorage ?? createVercelBlobStorage();
}

export function setDocumentStorageForTests(value = null) {
  testStorage = value;
}

export function resetDocumentUploadRateLimitForTests() {
  uploadAttempts.clear();
}

function assertWritable() {
  if (env.readOnlyMode) throw httpError(403, 'As operações documentais estão desativadas em modo de leitura.');
}

function reserveUploadAttempt(userId) {
  const now = Date.now();
  const key = String(userId);
  const recent = (uploadAttempts.get(key) ?? []).filter((entry) => entry > now - UPLOAD_WINDOW_MS);
  if (recent.length >= UPLOAD_LIMIT_PER_WINDOW) throw httpError(429, 'Limite temporário de submissões atingido. Tente novamente mais tarde.');
  recent.push(now);
  uploadAttempts.set(key, recent);
}

async function activeClientIds(auth) {
  if (auth.role === 'admin') return null;
  const ids = (await clientIdsForUser(auth.sub, { principalOnly: auth.role === 'client' })).map(Number);
  if (auth.role === 'client' && ids.length !== 1) {
    throw httpError(403, 'Não existe uma organização ativa associada a este Cliente.');
  }
  return ids;
}

async function listWhere(auth, filters = {}) {
  const allowedIds = await activeClientIds(auth);
  const filterClientId = requestedClientId(filters.cliente_id);
  if (filterClientId) {
    if (auth.role === 'client' && allowedIds[0] !== filterClientId) throw httpError(403, 'O Cliente não pode selecionar outra organização.');
    if (auth.role === 'manager') await assertClientAccess(auth, filterClientId);
  }
  const where = { ativo: true };
  if (filterClientId) where.cliente_id = filterClientId;
  else if (allowedIds !== null) where.cliente_id = allowedIds;
  const categoria = cleanText(filters.categoria, 30).toUpperCase();
  if (categoria) {
    if (!CATEGORY_SET.has(categoria)) throw httpError(400, 'Categoria documental inválida.');
    where.categoria = categoria;
  }
  const estado = cleanText(filters.estado, 30).toUpperCase();
  if (estado) {
    if (!STATE_SET.has(estado)) throw httpError(400, 'Estado documental inválido.');
    where.estado = estado;
  }
  const q = cleanText(filters.q, 120);
  if (q) where[Op.or] = ['titulo', 'descricao', 'nome_ficheiro_original'].map((field) => ({ [field]: { [Op.iLike]: `%${q}%` } }));
  const de = cleanDate(filters.de);
  const ate = cleanDate(filters.ate);
  if (de || ate) where.submetido_em = { ...(de ? { [Op.gte]: de } : {}), ...(ate ? { [Op.lte]: `${ate}T23:59:59.999Z` } : {}) };
  return where;
}

function documentInclude() {
  const { Client, User } = getModels();
  return [
    { model: Client, as: 'cliente', attributes: ['id', 'nome', 'nif'] },
    { model: User, as: 'submetidoPor', attributes: ['id', 'nome'] },
    { model: User, as: 'revistoPor', attributes: ['id', 'nome'] },
  ];
}

async function findAuthorizedDocument(auth, documentId, { includeInactive = false } = {}) {
  const id = asNumber(documentId);
  if (!id) throw httpError(400, 'Identificador de documento inválido.');
  const { Document } = getModels();
  const document = await Document.findByPk(id, { include: documentInclude() });
  if (!document || (!includeInactive && !document.ativo)) throw httpError(404, 'Documento não encontrado.');
  await assertClientAccess(auth, document.cliente_id);
  return document;
}

async function effectiveUploadLimitBytes() {
  return Math.min(env.maxUploadMb, env.documentUploadSafetyMaxMb) * 1024 * 1024;
}

async function getDocumentWithDetails(auth, documentId) {
  const document = await findAuthorizedDocument(auth, documentId, { includeInactive: auth.role === 'admin' });
  const { Document, DocumentReview, User } = getModels();
  const [reviews, linkedVersions] = await Promise.all([
    DocumentReview.findAll({
      where: { documento_id: document.id }, include: [{ model: User, as: 'autor', attributes: ['id', 'nome'] }],
      order: [['criado_em', 'ASC'], ['id', 'ASC']],
    }),
    Document.findAll({
      where: { [Op.or]: [{ id: document.id }, { documento_anterior_id: document.id }, ...(document.documento_anterior_id ? [{ id: document.documento_anterior_id }] : [])] },
      include: documentInclude(), order: [['submetido_em', 'ASC'], ['id', 'ASC']],
    }),
  ]);
  return {
    documento: serialiseDocument(document),
    historico: reviews.map(serialiseReview),
    versoes_relacionadas: linkedVersions.map(serialiseDocument),
  };
}

export async function listDocuments(auth, filters) {
  const { Document } = getModels();
  const rows = await Document.findAll({ where: await listWhere(auth, filters), include: documentInclude(), order: [['submetido_em', 'DESC'], ['id', 'DESC']] });
  return rows.map(serialiseDocument);
}

export async function documentDetail(auth, documentId) {
  return getDocumentWithDetails(auth, documentId);
}

export async function documentHistory(auth, documentId) {
  return (await getDocumentWithDetails(auth, documentId)).historico;
}

async function createSubmission(auth, input, file, previousDocument = null) {
  if (auth.role !== 'client') throw httpError(403, 'A submissão documental está reservada ao Cliente associado.');
  assertWritable();
  const [clientId] = await activeClientIds(auth);
  const maximumBytes = await effectiveUploadLimitBytes();
  const fields = documentFields(input);
  const validatedFile = await validateDocumentFile(file, maximumBytes);
  reserveUploadAttempt(auth.sub);
  const objectKey = `documents/${clientId}/${randomUUID()}/${validatedFile.storageName}`;
  let uploaded = false;
  try {
    const stored = await storage().put({ key: objectKey, buffer: validatedFile.buffer, contentType: validatedFile.mime });
    uploaded = true;
    const { Document, DocumentReview, sequelize } = getModels();
    let document;
    let notifications;
    await sequelize.transaction(async (transaction) => {
      document = await Document.create({
        cliente_id: clientId,
        ...fields,
        nome_ficheiro_original: validatedFile.originalName,
        nome_ficheiro_guardado: validatedFile.storageName,
        caminho_ficheiro: stored.key,
        tipo_mime: validatedFile.mime,
        tamanho_bytes: validatedFile.size,
        hash_sha256: validatedFile.checksum,
        privado: true,
        submetido_por: Number(auth.sub),
        submetido_em: new Date(),
        ativo: true,
        estado: 'SUBMETIDO',
        documento_anterior_id: previousDocument ? Number(previousDocument.id) : null,
        revisto_por: null,
        revisto_em: null,
        atualizado_em: new Date(),
      }, { transaction });
      await DocumentReview.create({
        documento_id: document.id, estado_anterior: null, estado_novo: 'SUBMETIDO', observacao: null,
        autor_id: Number(auth.sub), criado_em: new Date(),
      }, { transaction });
      notifications = await createDocumentNotifications({
        document, eventType: previousDocument ? 'DOCUMENTO_NOVA_VERSAO' : 'DOCUMENTO_SUBMETIDO', actorId: Number(auth.sub), transaction,
      });
      await recordAudit({
        userId: Number(auth.sub), action: previousDocument ? 'SUBMETER_NOVA_VERSAO_DOCUMENTO' : 'SUBMETER_DOCUMENTO',
        entity: 'documentos', entityId: Number(document.id),
        details: { cliente_id: clientId, categoria: fields.categoria, tamanho_bytes: validatedFile.size, documento_anterior_id: previousDocument ? Number(previousDocument.id) : null },
      }, transaction);
    });
    for (const notification of notifications) emitNotification(notification);
    emitDocumentChanged('submitted', document, notifications.map((notification) => notification.utilizador_id));
    return getDocumentWithDetails(auth, document.id);
  } catch (error) {
    if (uploaded) {
      try { await storage().delete(objectKey); } catch { /* O erro original continua a ser devolvido sem expor a chave. */ }
    }
    throw error;
  }
}

export async function submitDocument(auth, input, file) {
  return createSubmission(auth, input, file);
}

export async function submitDocumentVersion(auth, documentId, input, file) {
  const previous = await findAuthorizedDocument(auth, documentId);
  if (auth.role !== 'client' || Number(previous.submetido_por) !== Number(auth.sub) || previous.estado !== 'REQUER_ALTERACOES') {
    throw httpError(403, 'Só o autor pode submeter nova versão quando foram pedidas alterações.');
  }
  return createSubmission(auth, input, file, previous);
}

export async function reviewDocument(auth, documentId, input) {
  if (!['admin', 'manager'].includes(auth.role)) throw httpError(403, 'Sem permissão para rever documentos.');
  assertWritable();
  const initial = await findAuthorizedDocument(auth, documentId);
  const requestedState = input.estado === undefined ? initial.estado : cleanText(input.estado, 30, { required: true }).toUpperCase();
  if (!STATE_SET.has(requestedState)) throw httpError(400, 'Estado documental inválido.');
  const observation = cleanText(input.observacao, 6000) || null;
  if (requestedState === initial.estado && !observation) throw httpError(400, 'Indique uma observação ou altere o estado do documento.');

  const { Document, DocumentReview, sequelize } = getModels();
  let document;
  let notifications;
  await sequelize.transaction(async (transaction) => {
    document = await Document.findByPk(initial.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!document || !document.ativo) throw httpError(404, 'Documento não encontrado.');
    await assertClientAccess(auth, document.cliente_id);
    const previousState = document.estado;
    await document.update({ estado: requestedState, revisto_por: Number(auth.sub), revisto_em: new Date(), atualizado_em: new Date() }, { transaction });
    await DocumentReview.create({
      documento_id: document.id, estado_anterior: previousState, estado_novo: requestedState,
      observacao: observation, autor_id: Number(auth.sub), criado_em: new Date(),
    }, { transaction });
    notifications = await createDocumentNotifications({ document, eventType: 'DOCUMENTO_REVISTO', actorId: Number(auth.sub), transaction, estado: requestedState });
    await recordAudit({
      userId: Number(auth.sub), action: 'REVER_DOCUMENTO', entity: 'documentos', entityId: Number(document.id),
      details: { cliente_id: Number(document.cliente_id), estado_anterior: previousState, estado_novo: requestedState, tem_observacao: Boolean(observation) },
    }, transaction);
  });
  for (const notification of notifications) emitNotification(notification);
  emitDocumentChanged('reviewed', document, notifications.map((notification) => notification.utilizador_id));
  return getDocumentWithDetails(auth, document.id);
}

export async function deactivateDocument(auth, documentId) {
  assertWritable();
  const document = await findAuthorizedDocument(auth, documentId);
  const clientAllowed = auth.role === 'client' && Number(document.submetido_por) === Number(auth.sub) && document.estado === 'SUBMETIDO';
  if (auth.role !== 'admin' && !clientAllowed) throw httpError(403, 'Não tem permissão para desativar este documento.');
  const { sequelize } = getModels();
  await sequelize.transaction(async (transaction) => {
    await document.update({ ativo: false, atualizado_em: new Date() }, { transaction });
    await recordAudit({
      userId: Number(auth.sub), action: 'DESATIVAR_DOCUMENTO', entity: 'documentos', entityId: Number(document.id),
      details: { cliente_id: Number(document.cliente_id), estado: document.estado },
    }, transaction);
  });
  return serialiseDocument(document);
}

export async function downloadDocument(auth, documentId) {
  const document = await findAuthorizedDocument(auth, documentId, { includeInactive: auth.role === 'admin' });
  const object = await storage().get(document.caminho_ficheiro);
  return { document: serialiseDocument(document), stream: object.stream, contentType: object.contentType || document.tipo_mime, size: object.size || Number(document.tamanho_bytes) };
}

export async function documentUploadConfig(auth) {
  await activeClientIds(auth);
  const bytes = await effectiveUploadLimitBytes();
  return {
    max_upload_mb: Math.floor(bytes / (1024 * 1024)),
    allowed_extensions: Object.keys(ALLOWED_DOCUMENT_TYPES),
    categories: DOCUMENT_CATEGORIES,
    states: DOCUMENT_STATES,
  };
}

export function documentFileSha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
