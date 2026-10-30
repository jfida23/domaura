// @vitest-environment node
import { expect, it } from 'vitest';
import { reusableGeography, geographyTtlMs } from './geography-cache';
import { exampleOffer, observedAt } from './test-support';
it('reuses exact-address official evidence within seven days without renewing its date', () => {
  const offer = exampleOffer();
  expect(reusableGeography(offer.geography, offer.address, new Date(Date.parse(observedAt) + geographyTtlMs - 1).toISOString())).toEqual(offer.geography);
});
it('invalidates changed addresses and expired evidence even when Livit was checked today', () => {
  const offer = exampleOffer();
  expect(reusableGeography(offer.geography, { ...offer.address!, number: '20' }, observedAt)).toBeUndefined();
  expect(reusableGeography(offer.geography, offer.address, new Date(Date.parse(observedAt) + geographyTtlMs + 1).toISOString())).toBeUndefined();
});
