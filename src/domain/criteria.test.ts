import { describe, expect, it } from 'vitest';
import { validateCriterion } from './criteria';

describe('housing-criteria validation', () => {
  it.each(['', '-1', 'abc', 'Infinity', '1e309'])('rejects invalid rent %j', amount => {
    const result = validateCriterion({ attribute: 'rent', tier: 'requirement', amount }, 'r');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/non-negative.*CHF/);
  });
  it.each(['', 'other'])('rejects incomplete or unsupported attribute %j', attribute => {
    expect(validateCriterion({ attribute, tier: 'requirement', amount: '100' }, 'r').ok).toBe(false);
  });
  it.each(['', 'weighted', 'urgent'])('rejects tier %j', tier => {
    expect(validateCriterion({ attribute: 'balcony', tier, amount: '' }, 'b').ok).toBe(false);
  });
  it.each([0, 1800.50])('accepts non-negative monthly base rent %s', amount => {
    expect(validateCriterion({ attribute: 'rent', tier: 'requirement', amount: String(amount) }, 'r')).toEqual({
      ok: true, criterion: { id: 'r', tier: 'requirement', attribute: 'rent', condition: 'maximum', value: amount, currency: 'CHF', period: 'month', measure: 'base-rent' },
    });
  });
  it('accepts balcony presence without a numeric value', () => {
    expect(validateCriterion({ attribute: 'balcony', tier: 'preference', amount: '' }, 'b')).toEqual({
      ok: true, criterion: { id: 'b', tier: 'preference', attribute: 'balcony', condition: 'present' },
    });
  });
});
