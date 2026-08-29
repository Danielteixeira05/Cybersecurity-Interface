-- REVIEW ONLY — never run automatically. This rollback refuses to destroy
-- document workflow data and succeeds only before the feature receives data.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.documentos_revisoes)
    OR EXISTS (SELECT 1 FROM public.notificacoes_utilizadores WHERE documento_id IS NOT NULL)
    OR EXISTS (
      SELECT 1
      FROM public.documentos
      WHERE estado <> 'SUBMETIDO'
        OR versao <> '1.0'
        OR data_documento IS NOT NULL
        OR documento_anterior_id IS NOT NULL
        OR revisto_por IS NOT NULL
        OR revisto_em IS NOT NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.documentos
      WHERE categoria IN ('DOCUMENTO_INTERNO', 'ATIVOS_EXCEL')
    )
  THEN
    RAISE EXCEPTION 'Rollback blocked: document workflow data exists and must be retained.';
  END IF;
END
$$;

DROP INDEX public.ux_notificacoes_destinatario_documento_tipo;
DROP INDEX public.ux_notificacoes_destinatario_incidente_tipo;
DROP INDEX public.ix_notificacoes_utilizadores_documento;

ALTER TABLE public.notificacoes_utilizadores
  DROP CONSTRAINT fk_notificacoes_utilizadores_documento,
  DROP CONSTRAINT ck_notificacoes_utilizadores_referencia,
  DROP CONSTRAINT ck_notificacoes_utilizadores_tipo,
  DROP COLUMN documento_id,
  ALTER COLUMN incidente_id SET NOT NULL,
  ADD CONSTRAINT ck_notificacoes_utilizadores_tipo
    CHECK (tipo IN ('INCIDENTE_NIS2')),
  ADD CONSTRAINT uq_notificacoes_utilizadores_destinatario_incidente_tipo
    UNIQUE (utilizador_id, incidente_id, tipo);

DROP INDEX public.ix_documentos_revisoes_autor_data;
DROP INDEX public.ix_documentos_revisoes_documento_data;
DROP TABLE public.documentos_revisoes;

DROP INDEX public.ix_documentos_documento_anterior;
DROP INDEX public.ix_documentos_submetido_por;
DROP INDEX public.ix_documentos_cliente_estado_submetido;

ALTER TABLE public.documentos
  DROP CONSTRAINT fk_documentos_revisto_por,
  DROP CONSTRAINT fk_documentos_documento_anterior,
  DROP CONSTRAINT ck_documentos_versao,
  DROP CONSTRAINT ck_documentos_estado,
  DROP COLUMN atualizado_em,
  DROP COLUMN revisto_em,
  DROP COLUMN revisto_por,
  DROP COLUMN documento_anterior_id,
  DROP COLUMN data_documento,
  DROP COLUMN versao,
  DROP COLUMN estado,
  DROP CONSTRAINT ck_documentos_categoria;

ALTER TABLE public.documentos
  ADD CONSTRAINT ck_documentos_categoria
    CHECK (categoria IN (
      'DOCUMENTACAO',
      'RELATORIO',
      'PENTEST',
      'EVIDENCIA',
      'PLANO_SEGURANCA',
      'RELATORIO_CNCS',
      'FORMACAO',
      'OUTRO'
    ));

COMMIT;
