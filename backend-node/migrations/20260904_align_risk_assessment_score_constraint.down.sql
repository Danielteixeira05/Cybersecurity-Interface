BEGIN;

ALTER TABLE avaliacoes_risco
DROP CONSTRAINT IF EXISTS ck_avaliacoes_risco_pontuacao;

ALTER TABLE avaliacoes_risco
ADD CONSTRAINT ck_avaliacoes_risco_pontuacao
CHECK (
  pontuacao IS NULL
  OR (pontuacao >= 0 AND pontuacao <= 100)
);

COMMIT;
