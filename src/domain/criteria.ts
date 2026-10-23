import type { Criterion } from './model';

export type CriterionDraft = { attribute: string; tier: string; amount: string };
export type Validation = { ok: true; criterion: Criterion } | { ok: false; error: string };

export const catalogue = [
  { attribute: 'rent', label: 'Maximum monthly base rent', condition: 'maximum', unit: 'CHF / month' },
  { attribute: 'balcony', label: 'Balcony present', condition: 'present', unit: null },
] as const;

export const tierLabels = { requirement: 'Must have', preference: 'Nice to have' } as const;

export function validateCriterion(draft: CriterionDraft, id: string): Validation {
  if (draft.tier !== 'requirement' && draft.tier !== 'preference') {
    return { ok: false, error: 'Choose Must have or Nice to have.' };
  }
  const tier = draft.tier;
  if (draft.attribute === 'balcony') {
    return { ok: true, criterion: { id, tier, attribute: 'balcony', condition: 'present' } };
  }
  if (draft.attribute !== 'rent') return { ok: false, error: 'Choose a criterion.' };
  const value = Number(draft.amount);
  if (!draft.amount.trim() || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Enter a valid non-negative amount in CHF per month.' };
  }
  return { ok: true, criterion: { id, tier, attribute: 'rent', condition: 'maximum', value, currency: 'CHF', period: 'month', measure: 'base-rent' } };
}
