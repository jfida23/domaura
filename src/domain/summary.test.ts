import { describe, expect, it } from 'vitest';
import { compare } from './comparison';
import { offers } from './fixtures';
import type { Criterion } from './model';

const rent: Criterion = { id: 'r', tier: 'requirement', attribute: 'rent', condition: 'maximum', value: 1800, currency: 'CHF', period: 'month', measure: 'base-rent' };
const balcony: Criterion = { id: 'b', tier: 'requirement', attribute: 'balcony', condition: 'present' };
const preference: Criterion = { ...balcony, tier: 'preference' };

describe('rental-comparison requirement fit and equal preferences', () => {
  it('identifies confirmed requirements and returns every evaluation', () => {
    const result = compare(offers[0], [rent, balcony]);
    expect(result.fit).toBe('meets');
    expect(result.evaluations.map(e => e.outcome)).toEqual(['satisfied', 'satisfied']);
  });
  it('does not allow satisfied preferences to offset a failed requirement', () => {
    expect(compare(offers[0], [{ ...rent, value: 1000 }, preference, { ...preference, id: 'b2' }]).fit).toBe('fails');
  });
  it('does not allow satisfied preferences to offset an unknown requirement', () => {
    const offer = { ...offers[0], rent: offers[2].rent };
    expect(compare(offer, [rent, preference]).fit).toBe('verification');
  });
  it('gives unmet requirements precedence over unknown requirements', () => {
    const offer = { ...offers[1], rent: offers[2].rent };
    expect(compare(offer, [rent, balcony]).fit).toBe('fails');
  });
  it('states no requirements and still counts preferences', () => {
    const result = compare(offers[0], [preference]);
    expect(result.fit).toBe('none');
    expect(result.preferences).toEqual({ satisfied: 1, unmet: 0, unknown: 0 });
  });
  it('counts two satisfied preferences and one unknown independently of order', () => {
    const criteria: Criterion[] = [preference, { ...rent, tier: 'preference' }, { ...rent, tier: 'preference', measure: 'total-cost', id: 'total' }];
    expect(compare(offers[0], criteria).preferences).toEqual({ satisfied: 2, unmet: 0, unknown: 1 });
    expect(compare(offers[0], [...criteria].reverse()).preferences).toEqual({ satisfied: 2, unmet: 0, unknown: 1 });
  });
  it('counts unmet preferences', () => {
    expect(compare(offers[1], [preference]).preferences).toEqual({ satisfied: 0, unmet: 1, unknown: 0 });
  });
});
