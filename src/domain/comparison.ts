import type { Comparison, Criterion, Evaluation, Offer } from './model';

export function compare(offer: Offer, criteria: Criterion[]): Comparison {
  const evaluations = criteria.map(criterion => evaluate(offer, criterion));
  const requirements = evaluations.filter(e => e.criterion.tier === 'requirement');
  let fit: Comparison['fit'] = 'none';
  if (requirements.length) {
    fit = 'meets';
    if (requirements.some(e => e.outcome === 'unknown')) fit = 'verification';
    if (requirements.some(e => e.outcome === 'unmet')) fit = 'fails';
  }
  const preferences = { satisfied: 0, unmet: 0, unknown: 0 };
  for (const evaluation of evaluations) {
    if (evaluation.criterion.tier === 'preference') preferences[evaluation.outcome]++;
  }
  return { evaluations, fit, preferences };
}

export function evaluate(offer: Offer, criterion: Criterion): Evaluation {
  if (criterion.attribute === 'balcony') {
    const feature = offer.balcony;
    if (feature.status === 'unknown') return { criterion, outcome: 'unknown', explanation: feature.reason };
    return { criterion, outcome: feature.value ? 'satisfied' : 'unmet', explanation: `Balcony ${feature.value ? 'present' : 'absent'}. ${feature.evidence}` };
  }
  const rent = offer.rent;
  if (rent.status === 'unknown') return { criterion, outcome: 'unknown', explanation: rent.reason };
  const { amount, currency, period, measure } = rent.value;
  const explanation = `${amount} ${currency} / ${period} (${measure}). ${rent.evidence}`;
  if (currency !== criterion.currency || period !== criterion.period || measure !== criterion.measure) {
    return { criterion, outcome: 'unknown', explanation: `Incomparable cost: measure, currency, and period must agree. ${explanation}` };
  }
  return { criterion, outcome: amount <= criterion.value ? 'satisfied' : 'unmet', explanation };
}
