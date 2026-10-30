import type { Offer } from './model';

export function eligibility(offer: Offer): 'eligible' | 'excluded' | 'unverified' {
  if (offer.property?.status === 'non-residential') return 'excluded';
  if (!offer.synthetic && offer.source?.observation === 'unavailable') return 'excluded';
  if (offer.transaction !== 'rental' || offer.geography.status === 'outside') return 'excluded';
  if (offer.property?.status !== 'residential' || !offer.property.evidence.trim()) return 'unverified';
  const { status, basis, evidence } = offer.geography;
  if (basis === 'synthetic-declaration' && !offer.synthetic) return 'unverified';
  if (status === 'unknown' || basis === 'area-label' || basis === 'none' || !evidence.trim()) return 'unverified';
  return 'eligible';
}
