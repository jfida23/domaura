import { describe, expect, it } from 'vitest';
import { evaluate } from './comparison';
import { offers } from './fixtures';
import type { Criterion, Offer } from './model';

const balcony: Criterion = { id: 'b', tier: 'preference', attribute: 'balcony', condition: 'present' };
const rent: Criterion = { id: 'r', tier: 'requirement', attribute: 'rent', condition: 'maximum', value: 1800, currency: 'CHF', period: 'month', measure: 'base-rent' };

describe('rental-comparison criterion evaluation', () => {
  it.each([
    [true, 'satisfied'], [false, 'unmet'], [null, 'unknown'],
  ] as const)('evaluates balcony %s as %s with evidence', (value, expected) => {
    const offer: Offer = { ...offers[0], balcony: value === null ? { status: 'unknown', reason: 'Balcony not reported' } : { status: 'known', value, evidence: 'Explicit balcony declaration' } };
    const result = evaluate(offer, balcony);
    expect(result.outcome).toBe(expected);
    expect(result.explanation).toContain(value === null ? 'Balcony not reported' : 'Explicit balcony declaration');
  });
  it.each([[1700, 'satisfied'], [1800, 'satisfied'], [1801, 'unmet']] as const)('compares rent %s inclusively', (amount, expected) => {
    const result = evaluate({ ...offers[0], rent: { status: 'known', value: { amount, currency: 'CHF', period: 'month', measure: 'base-rent' }, evidence: 'Declared base rent' } }, rent);
    expect(result.outcome).toBe(expected);
    expect(result.explanation).toContain(String(amount));
    expect(result.explanation).toContain('Declared base rent');
  });
  it('keeps missing rent unknown with its reason', () => {
    const result = evaluate(offers[2], rent);
    expect(result.outcome).toBe('unknown');
    expect(result.explanation).toContain('not supplied');
  });
  it.each([
    { measure: 'total-cost' }, { currency: 'EUR' }, { period: 'year' },
  ] as const)('does not compare incompatible costs %j', patch => {
    const result = evaluate(offers[0], { ...rent, ...patch });
    expect(result.outcome).toBe('unknown');
    expect(result.explanation).toMatch(/incomparable/i);
  });
});
