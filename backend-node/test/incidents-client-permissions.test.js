import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseClientIncidentSubmission } from '../src/services/incidents.service.js';

test('o Cliente submete o report com estado inicial aberto e sem notificação NIS2', () => {
  const payload = normaliseClientIncidentSubmission({
    cliente_id: 8,
    codigo: 'INC-CLIENTE-001',
    estado: 'ABERTO',
    notificado_nis2: false,
  });

  assert.equal(payload.estado, 'ABERTO');
  assert.equal(payload.ativo, true);
  assert.equal(payload.notificado_nis2, false);
});

test('o Cliente não pode encerrar nem confirmar NIS2 na submissão inicial', () => {
  assert.throws(
    () => normaliseClientIncidentSubmission({ estado: 'ENCERRADO' }),
    (error) => error?.status === 403,
  );
  assert.throws(
    () => normaliseClientIncidentSubmission({ notificado_nis2: true }),
    (error) => error?.status === 403,
  );
});
