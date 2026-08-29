-- REVIEW ONLY — technical rollback for 20260828_add_chat_conversations.up.sql.
-- WARNING: this rollback permanently removes persisted chat history.
BEGIN;

DROP TABLE public.conversas_leituras;
DROP TABLE public.mensagens;
DROP TABLE public.conversas;

COMMIT;
