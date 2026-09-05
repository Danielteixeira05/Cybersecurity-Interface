import { describe, expect, it } from 'vitest';
import {
  CLIENT_RISK_SCORE_DOMAIN,
  CLIENT_RISK_SCORE_TICKS,
  formatClientRiskScoreTooltip,
} from './ClientPages';

describe('escala de risco do Cliente', () => {
  it('usa domínio e ticks coerentes com a pontuação NIS2 de 0 a 10', () => {
    expect(CLIENT_RISK_SCORE_DOMAIN).toEqual([0, 10]);
    expect(CLIENT_RISK_SCORE_TICKS).toEqual([0, 2, 4, 6, 8, 10]);
    expect(formatClientRiskScoreTooltip(8.2)).toBe('8.2 / 10');
    expect(formatClientRiskScoreTooltip(Number.NaN)).toBe('— / 10');
  });
});
