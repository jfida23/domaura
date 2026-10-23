import type { Criterion, RequirementFit } from '../domain/model';

export function criterionLabel(criterion: Criterion): string {
  if (criterion.attribute === 'balcony') return 'Balcony present';
  const measure = criterion.measure === 'base-rent' ? 'base rent' : 'total housing cost';
  const period = criterion.period === 'month' ? 'monthly' : 'yearly';
  return `Maximum ${period} ${measure} ≤ ${criterion.value} ${criterion.currency} / ${criterion.period}`;
}

export const fitLabels: Record<RequirementFit, string> = {
  meets: 'Meets all requirements',
  fails: 'Does not meet all requirements',
  verification: 'Needs verification',
  none: 'No requirements specified',
};
