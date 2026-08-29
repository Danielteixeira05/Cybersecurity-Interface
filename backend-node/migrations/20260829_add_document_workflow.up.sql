-- REVIEW ONLY — not executed automatically by the Node backend.
-- Additive document workflow, review history and document notification support.
BEGIN;

-- Keep all existing categories and extend the validated set with the required
-- document categories. Replacing this CHECK is necessary because PostgreSQL
-- cannot append values to an existing CHECK expression.
ALTER TABLE public.documentos
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
      'DOCUMENTO_INTERNO',
      'ATIVOS_EXCEL',
      'OUTRO'
    )),
  ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'SUBMETIDO',
  ADD COLUMN versao VARCHAR(40) NOT NULL DEFAULT '1.0',
  ADD COLUMN data_documento DATE NULL,
  ADD COLUMN documento_anterior_id BIGINT NULL,
  ADD COLUMN revisto_por BIGINT NULL,
  ADD COLUMN revisto_em TIMESTAMPTZ NULL,
  ADD COLUMN atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD CONSTRAINT ck_documentos_estado
    CHECK (estado IN ('SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES')),
  ADD CONSTRAINT ck_documentos_versao
    CHECK (length(BTRIM(versao)) > 0),
  ADD CONSTRAINT fk_documentos_documento_anterior
    FOREIGN KEY (documento_anterior_id)
    REFERENCES public.documentos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_documentos_revisto_por
    FOREIGN KEY (revisto_por)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE INDEX ix_documentos_cliente_estado_submetido
  ON public.documentos (cliente_id, estado, submetido_em DESC, id DESC)
  WHERE ativo = TRUE;

CREATE INDEX ix_documentos_submetido_por
  ON public.documentos (submetido_por, submetido_em DESC)
  WHERE ativo = TRUE;

CREATE INDEX ix_documentos_documento_anterior
  ON public.documentos (documento_anterior_id)
  WHERE documento_anterior_id IS NOT NULL;

CREATE TABLE public.documentos_revisoes (
  id BIGSERIAL PRIMARY KEY,
  documento_id BIGINT NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_novo VARCHAR(30) NOT NULL,
  observacao TEXT NULL,
  autor_id BIGINT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_documentos_revisoes_estado_anterior
    CHECK (estado_anterior IS NULL OR estado_anterior IN ('SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES')),
  CONSTRAINT ck_documentos_revisoes_estado_novo
    CHECK (estado_novo IN ('SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REQUER_ALTERACOES')),
  CONSTRAINT fk_documentos_revisoes_documento
    FOREIGN KEY (documento_id)
    REFERENCES public.documentos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentos_revisoes_autor
    FOREIGN KEY (autor_id)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX ix_documentos_revisoes_documento_data
  ON public.documentos_revisoes (documento_id, criado_em ASC, id ASC);

CREATE INDEX ix_documentos_revisoes_autor_data
  ON public.documentos_revisoes (autor_id, criado_em DESC);

-- Generalise the notification reference without changing existing NIS2 rows.
-- The pair of partial unique indexes preserves NIS2 de-duplication and adds
-- equivalent protection for document notifications.
ALTER TABLE public.notificacoes_utilizadores
  DROP CONSTRAINT ck_notificacoes_utilizadores_tipo,
  DROP CONSTRAINT uq_notificacoes_utilizadores_destinatario_incidente_tipo,
  ALTER COLUMN incidente_id DROP NOT NULL,
  ADD COLUMN documento_id BIGINT NULL,
  ADD CONSTRAINT ck_notificacoes_utilizadores_tipo
    CHECK (tipo IN ('INCIDENTE_NIS2', 'DOCUMENTO_SUBMETIDO', 'DOCUMENTO_REVISTO', 'DOCUMENTO_NOVA_VERSAO')),
  ADD CONSTRAINT ck_notificacoes_utilizadores_referencia
    CHECK (
      (incidente_id IS NOT NULL AND documento_id IS NULL)
      OR (incidente_id IS NULL AND documento_id IS NOT NULL)
    ),
  ADD CONSTRAINT fk_notificacoes_utilizadores_documento
    FOREIGN KEY (documento_id)
    REFERENCES public.documentos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE INDEX ix_notificacoes_utilizadores_documento
  ON public.notificacoes_utilizadores (documento_id)
  WHERE documento_id IS NOT NULL;

CREATE UNIQUE INDEX ux_notificacoes_destinatario_incidente_tipo
  ON public.notificacoes_utilizadores (utilizador_id, incidente_id, tipo)
  WHERE incidente_id IS NOT NULL;

CREATE UNIQUE INDEX ux_notificacoes_destinatario_documento_tipo
  ON public.notificacoes_utilizadores (utilizador_id, documento_id, tipo)
  WHERE documento_id IS NOT NULL;

COMMIT;
