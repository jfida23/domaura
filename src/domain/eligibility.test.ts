import { describe, expect, it } from 'vitest';
import { eligibility } from './eligibility';
import type { Offer } from './model';

const rental: Offer = {
  id: 'test-rental', title: 'Synthetic test rental', synthetic: true,
  property: { status: 'residential', evidence: 'Synthetic housing declaration' },
  sourceReference: null, transaction: 'rental', areaLabel: 'Lugano',
  geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic inside declaration' },
  rent: { status: 'unknown', reason: 'Not supplied' },
  balcony: { status: 'unknown', reason: 'Not supplied' },
};

describe('rental-offer-scope', () => {
  it('excludes a non-residential rental inside Lugano', () => {
    expect(eligibility({ ...rental, property: { status: 'non-residential', evidence: 'Parking space' } } as Offer)).toBe('excluded');
  });
  it.each([
    ['unknown', { status: 'unknown', evidence: 'Use not established' }],
    ['missing', undefined],
    ['unsupported declaration', { status: 'residential', evidence: '' }],
  ])('keeps %s housing classification unverified', (_name, property) => {
    expect(eligibility({ ...rental, property } as Offer)).toBe('unverified');
  });
  it('excludes a real listing recorded as source-unavailable', () => {
    expect(eligibility({ ...rental, synthetic: false,
      geography: { status: 'inside', basis: 'municipality-id', evidence: 'Official record: Lugano 5192' },
      source: { observation: 'unavailable' },
    } as Offer)).toBe('excluded');
  });
  it.each([
    ['verified inside rental', {}, 'eligible'],
    ['purchase offer', { transaction: 'sale' }, 'excluded'],
    ['unknown transaction', { transaction: 'unknown' }, 'excluded'],
    ['outside despite Lugano label', { geography: { status: 'outside', basis: 'synthetic-declaration', evidence: 'Declared outside' } }, 'excluded'],
    ['imprecise location', { geography: { status: 'unknown', basis: 'none', evidence: 'No precise location' } }, 'unverified'],
    ['Lugano label alone', { geography: { status: 'inside', basis: 'area-label', evidence: 'Advertised Lugano' } }, 'unverified'],
    ['inside without evidence', { geography: { status: 'inside', basis: 'municipality-id', evidence: '' } }, 'unverified'],
    ['real offer cannot use a synthetic declaration', { synthetic: false }, 'unverified'],
    ['real offer with municipality identifier evidence', { synthetic: false, geography: { status: 'inside', basis: 'municipality-id', evidence: 'Provider municipality identifier mapped to Lugano' } }, 'eligible'],
  ] as const)('%s', (_name, patch, expected) => {
    expect(eligibility({ ...rental, ...patch })).toBe(expected);
  });
});
