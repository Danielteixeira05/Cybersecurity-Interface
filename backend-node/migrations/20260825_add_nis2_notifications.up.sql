-- REVIEW ONLY — not executed automatically by the Node backend.
-- Additive schema change for NIS2 incident notifications.
BEGIN;

ALTER TABLE public.incidentes
  ADD COLUMN notificado_nis2 BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN notificado_nis2_em TIMESTAMPTZ NULL,
  ADD COLUMN notificado_nis2_por BIGINT NULL;

ALTER TABLE public.incidentes
  ADD CONSTRAINT fk_incidentes_notificado_nis2_por
    FOREIGN KEY (notificado_nis2_por)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE TABLE public.notificacoes_utilizadores (
  id BIGSERIAL PRIMARY KEY,
  utilizador_id BIGINT NOT NULL,
  incidente_id BIGINT NOT NULL,
  cliente_id BIGINT NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em TIMESTAMPTZ NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_notificacoes_utilizadores_tipo
    CHECK (tipo IN ('INCIDENTE_NIS2')),
  CONSTRAINT ck_notificacoes_utilizadores_leitura
    CHECK (
      (lida = FALSE AND lida_em IS NULL)
      OR (lida = TRUE AND lida_em IS NOT NULL)
    ),
  CONSTRAINT uq_notificacoes_utilizadores_destinatario_incidente_tipo
    UNIQUE (utilizador_id, incidente_id, tipo),
  CONSTRAINT fk_notificacoes_utilizadores_utilizador
    FOREIGN KEY (utilizador_id)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_notificacoes_utilizadores_incidente
    FOREIGN KEY (incidente_id)
    REFERENCES public.incidentes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_notificacoes_utilizadores_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES public.clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX ix_notificacoes_utilizadores_nao_lidas
  ON public.notificacoes_utilizadores (utilizador_id, criado_em DESC)
  WHERE lida = FALSE;

CREATE INDEX ix_notificacoes_utilizadores_recentes
  ON public.notificacoes_utilizadores (utilizador_id, criado_em DESC);

CREATE INDEX ix_notificacoes_utilizadores_incidente
  ON public.notificacoes_utilizadores (incidente_id);

CREATE INDEX ix_notificacoes_utilizadores_cliente
  ON public.notificacoes_utilizadores (cliente_id);

COMMIT;
