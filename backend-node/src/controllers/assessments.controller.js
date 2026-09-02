import {
  assessmentClientId,
  createRiskAssessment,
  listConformityStatuses,
  listRiskAssessments,
} from '../services/assessments.service.js';

export function createAssessmentsControllers({
  listAssessments = listRiskAssessments,
  listStatuses = listConformityStatuses,
  createAssessment = createRiskAssessment,
} = {}) {
  return {
    async list(request, response, next) {
      try {
        return response.json(await listAssessments(request.auth, assessmentClientId(request.query.cliente_id)));
      } catch (error) { return next(error); }
    },
    async statuses(_request, response, next) {
      try { return response.json(await listStatuses()); } catch (error) { return next(error); }
    },
    async create(request, response, next) {
      try { return response.status(201).json(await createAssessment(request.auth, request.body)); } catch (error) { return next(error); }
    },
  };
}

export const assessmentsControllers = createAssessmentsControllers();
