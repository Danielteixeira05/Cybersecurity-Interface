-- REVIEW ONLY — not executed automatically by the Node backend.
-- Additive persistence for organisation-scoped real-time chat.
BEGIN;

CREATE TABLE public.conversas (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversas_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES public.clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_conversas_cliente_ativa
  ON public.conversas (cliente_id)
  WHERE ativo = TRUE;

CREATE INDEX ix_conversas_ativas_atualizadas
  ON public.conversas (atualizado_em DESC, id DESC)
  WHERE ativo = TRUE;

CREATE TABLE public.mensagens (
  id BIGSERIAL PRIMARY KEY,
  conversa_id BIGINT NOT NULL,
  remetente_id BIGINT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_mensagens_conteudo
    CHECK (length(TRIM(BOTH FROM conteudo)) > 0 AND length(conteudo) <= 2000),
  CONSTRAINT fk_mensagens_conversa
    FOREIGN KEY (conversa_id)
    REFERENCES public.conversas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_mensagens_remetente
    FOREIGN KEY (remetente_id)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX ix_mensagens_conversa_ordem
  ON public.mensagens (conversa_id, criado_em DESC, id DESC)
  WHERE ativo = TRUE;

CREATE INDEX ix_mensagens_remetente
  ON public.mensagens (remetente_id, criado_em DESC)
  WHERE ativo = TRUE;

CREATE TABLE public.conversas_leituras (
  conversa_id BIGINT NOT NULL,
  utilizador_id BIGINT NOT NULL,
  ultima_mensagem_id BIGINT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT conversas_leituras_pkey PRIMARY KEY (conversa_id, utilizador_id),
  CONSTRAINT fk_conversas_leituras_conversa
    FOREIGN KEY (conversa_id)
    REFERENCES public.conversas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_conversas_leituras_utilizador
    FOREIGN KEY (utilizador_id)
    REFERENCES public.utilizadores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_conversas_leituras_ultima_mensagem
    FOREIGN KEY (ultima_mensagem_id)
    REFERENCES public.mensagens(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX ix_conversas_leituras_utilizador
  ON public.conversas_leituras (utilizador_id, atualizado_em DESC);

COMMIT;
