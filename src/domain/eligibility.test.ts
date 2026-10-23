import { describe, expect, it } from 'vitest';
import { eligibility } from './eligibility';
import type { Offer } from './model';

const rental: Offer = {
  id: 'test-rental', title: 'Synthetic test rental', synthetic: true,
  sourceReference: null, transaction: 'rental', areaLabel: 'Lugano',
  geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic inside declaration' },
  rent: { status: 'unknown', reason: 'Not supplied' },
  balcony: { status: 'unknown', reason: 'Not supplied' },
};

describe('rental-offer-scope', () => {
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
