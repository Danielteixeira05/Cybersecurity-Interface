function asPlain(value) {
  return value?.get?.({ plain: true }) ?? value ?? {};
}

function nullableNumber(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Contrato público único para listagens, criação e detalhe de avaliações.
 * Nunca devolve instâncias Sequelize ou relações completas.
 */
export function serialiseRiskAssessment(value, { client, conformityStatus } = {}) {
  const assessment = asPlain(value);
  const relatedClient = asPlain(client ?? assessment.cliente);
  const relatedStatus = asPlain(conformityStatus ?? assessment.estadoConformidade);
  const score = nullableNumber(assessment.pontuacao ?? assessment.score);

  return {
    id: Number(assessment.id),
    cliente_id: Number(assessment.cliente_id),
    cliente_nome: relatedClient.nome ?? null,
    estado_conformidade_id: Number(assessment.estado_conformidade_id),
    estado_conformidade_codigo: relatedStatus.codigo ?? null,
    estado_conformidade_nome: relatedStatus.nome ?? null,
    data_avaliacao: assessment.data_avaliacao ?? null,
    nivel_risco: assessment.nivel_risco ?? null,
    pontuacao: score,
    score,
    resumo: assessment.resumo ?? null,
    recomendacoes: assessment.recomendacoes ?? null,
    criado_em: assessment.criado_em instanceof Date
      ? assessment.criado_em.toISOString()
      : assessment.criado_em ?? null,
  };
}
