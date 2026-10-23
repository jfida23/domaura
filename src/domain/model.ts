export type Knowledge<T> =
  | { status: 'known'; value: T; evidence: string }
  | { status: 'unknown'; reason: string };

export type Geography = {
  status: 'inside' | 'outside' | 'unknown';
  evidence: string;
  basis: 'synthetic-declaration' | 'municipality-id' | 'boundary-check' | 'area-label' | 'none';
};

export type Cost = {
  amount: number;
  currency: string;
  period: 'month' | 'year';
  measure: 'base-rent' | 'total-cost';
};

export interface Offer {
  id: string;
  title: string;
  synthetic: boolean;
  sourceReference: string | null;
  transaction: 'rental' | 'sale' | 'unknown';
  areaLabel: string;
  geography: Geography;
  rent: Knowledge<Cost>;
  balcony: Knowledge<boolean>;
}

export type Tier = 'requirement' | 'preference';
export type Criterion = { id: string; tier: Tier } & (
  | { attribute: 'rent'; condition: 'maximum'; value: number; currency: string; period: 'month' | 'year'; measure: 'base-rent' | 'total-cost' }
  | { attribute: 'balcony'; condition: 'present' }
);

export type Outcome = 'satisfied' | 'unmet' | 'unknown';
export type Evaluation = { criterion: Criterion; outcome: Outcome; explanation: string };
export type RequirementFit = 'meets' | 'fails' | 'verification' | 'none';
export interface Comparison {
  evaluations: Evaluation[];
  fit: RequirementFit;
  preferences: Record<Outcome, number>;
}
