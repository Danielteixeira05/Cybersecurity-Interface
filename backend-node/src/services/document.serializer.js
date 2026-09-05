function nullableNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Contrato público único dos metadados documentais.
 * Exclui deliberadamente chaves do armazenamento, hashes e nomes internos.
 */
export function serialiseDocument(value) {
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
    submetido_por: nullableNumber(row.submetido_por),
    submetido_por_nome: row.submetidoPor?.nome ?? row.submetido_por_nome ?? null,
    submetido_em: row.submetido_em,
    ativo: Boolean(row.ativo),
    estado: row.estado,
    versao: row.versao,
    data_documento: row.data_documento ?? null,
    documento_anterior_id: nullableNumber(row.documento_anterior_id),
    revisto_por: nullableNumber(row.revisto_por),
    revisto_por_nome: row.revistoPor?.nome ?? row.revisto_por_nome ?? null,
    revisto_em: row.revisto_em ?? null,
    atualizado_em: row.atualizado_em,
  };
}
