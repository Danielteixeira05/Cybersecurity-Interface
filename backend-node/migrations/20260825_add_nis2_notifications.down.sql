-- REVIEW ONLY — technical rollback for 20260825_add_nis2_notifications.up.sql.
-- WARNING: this rollback permanently removes persisted notification records.
BEGIN;

DROP TABLE public.notificacoes_utilizadores;

ALTER TABLE public.incidentes
  DROP CONSTRAINT fk_incidentes_notificado_nis2_por,
  DROP COLUMN notificado_nis2_por,
  DROP COLUMN notificado_nis2_em,
  DROP COLUMN notificado_nis2;

COMMIT;
