import type { Offer } from './model';

export function eligibility(offer: Offer): 'eligible' | 'excluded' | 'unverified' {
  if (offer.transaction !== 'rental' || offer.geography.status === 'outside') return 'excluded';
  const { status, basis, evidence } = offer.geography;
  if (basis === 'synthetic-declaration' && !offer.synthetic) return 'unverified';
  if (status === 'unknown' || basis === 'area-label' || basis === 'none' || !evidence.trim()) return 'unverified';
  return 'eligible';
}
