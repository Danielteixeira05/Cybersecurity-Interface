import { getModels } from '../models/index.js';
import { httpError } from '../middleware/errors.js';
import { assertClientAccess, clientIdsForUser } from './clients.service.js';
import { recordAudit } from './audit-log.service.js';
import { serialiseRiskAssessment } from './risk-assessment.serializer.js';

const RISK_LEVELS = new Set(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']);
const MAX_SUMMARY_LENGTH = 4000;
const MAX_RECOMMENDATIONS_LENGTH = 8000;

function positiveInteger(value, field) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw httpError(400, `${field} tem de ser um inteiro positivo.`);
  }
  return value;
}

function strictDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, 'data_avaliacao tem de ter o formato AAAA-MM-DD.');
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw httpError(400, 'data_avaliacao não é uma data válida.');
  }
  return value;
}

function boundedText(value, field, maximum, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw httpError(400, `${field} é obrigatório.`);
    return null;
  }
  if (typeof value !== 'string') throw httpError(400, `${field} tem de ser texto.`);
  const text = value.trim();
  if (required && !text) throw httpError(400, `${field} é obrigatório.`);
  if (text.length > maximum) throw httpError(400, `${field} excede o máximo de ${maximum} caracteres.`);
  return text || null;
}

export function normaliseAssessmentPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'Dados da avaliação inválidos.');
  }
  const payload = input;
  for (const field of ['criado_por', 'criado_em', 'id']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw httpError(400, `${field} é definido pelo servidor.`);
    }
  }

  const nivelRisco = typeof payload.nivel_risco === 'string' ? payload.nivel_risco : '';
  if (!RISK_LEVELS.has(nivelRisco)) throw httpError(400, 'nivel_risco inválido.');
  const score = payload.pontuacao;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 10 || Math.round(score * 100) !== score * 100) {
    throw httpError(400, 'pontuacao tem de ser um número entre 0 e 10, com no máximo duas casas decimais.');
  }

  return {
    cliente_id: positiveInteger(payload.cliente_id, 'cliente_id'),
    estado_conformidade_id: positiveInteger(payload.estado_conformidade_id, 'estado_conformidade_id'),
    data_avaliacao: strictDate(payload.data_avaliacao),
    nivel_risco: nivelRisco,
    pontuacao: score,
    resumo: boundedText(payload.resumo, 'resumo', MAX_SUMMARY_LENGTH, { required: true }),
    recomendacoes: boundedText(payload.recomendacoes, 'recomendacoes', MAX_RECOMMENDATIONS_LENGTH),
  };
}

export function assessmentClientId(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw httpError(400, 'cliente_id inválido.');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw httpError(400, 'cliente_id inválido.');
  return id;
}

export function createRiskAssessmentReader(modelsReader = getModels, {
  assertAccess = assertClientAccess,
  idsForUser = clientIdsForUser,
} = {}) {
  return async function listRiskAssessments(auth, clientId) {
    const { RiskAssessment, ConformityStatus, Client } = modelsReader();
    let where;
    if (clientId !== undefined) {
      await assertAccess(auth, clientId);
      where = { cliente_id: clientId };
    } else if (auth.role === 'admin') {
      where = {};
    } else {
      where = { cliente_id: await idsForUser(auth.sub, { principalOnly: auth.role === 'client' }) };
    }
    const rows = await RiskAssessment.findAll({
      where,
      include: [
        { model: ConformityStatus, as: 'estadoConformidade', attributes: ['codigo', 'nome'] },
        { model: Client, as: 'cliente', attributes: ['nome'], where: { ativo: true }, required: true },
      ],
      order: [['data_avaliacao', 'DESC'], ['id', 'DESC']],
    });
    return rows.map(serialiseRiskAssessment);
  };
}

export const listRiskAssessments = createRiskAssessmentReader();

export function createConformityStatusReader(modelsReader = getModels) {
  return async function listConformityStatuses() {
    const { ConformityStatus } = modelsReader();
    const rows = await ConformityStatus.findAll({
      attributes: ['id', 'codigo', 'nome'],
      order: [['ordem', 'ASC'], ['id', 'ASC']],
    });
    return rows.map((row) => {
      const status = row.get?.({ plain: true }) ?? row;
      return { id: Number(status.id), codigo: status.codigo, nome: status.nome };
    });
  };
}

export const listConformityStatuses = createConformityStatusReader();

export function createRiskAssessmentCreator(modelsReader = getModels, {
  assertAccess = assertClientAccess,
  auditWriter = recordAudit,
} = {}) {
  return async function createRiskAssessment(auth, input) {
    const payload = normaliseAssessmentPayload(input);
    const { sequelize, Client, ConformityStatus, RiskAssessment } = modelsReader();
    const [client, status] = await Promise.all([
      Client.findOne({ where: { id: payload.cliente_id, ativo: true } }),
      ConformityStatus.findByPk(payload.estado_conformidade_id),
    ]);
    if (!client) throw httpError(404, 'Cliente não encontrado ou inativo.');
    if (!status) throw httpError(400, 'Estado de conformidade inválido.');
    await assertAccess(auth, payload.cliente_id);

    return sequelize.transaction(async (transaction) => {
      const created = await RiskAssessment.create({
        ...payload,
        criado_por: Number(auth.sub),
        criado_em: new Date(),
      }, { transaction });
      const createdId = Number(created.id ?? created.get?.({ plain: true })?.id);
      await auditWriter({
        userId: Number(auth.sub),
        action: 'CRIAR',
        entity: 'avaliacoes_risco',
        entityId: createdId,
        details: {
          cliente_id: payload.cliente_id,
          estado_conformidade_id: payload.estado_conformidade_id,
          nivel_risco: payload.nivel_risco,
          pontuacao: payload.pontuacao,
        },
      }, transaction);
      return serialiseRiskAssessment(created, { client, conformityStatus: status });
    });
  };
}

export const createRiskAssessment = createRiskAssessmentCreator();
