export type Locale = 'it' | 'de' | 'fr' | 'en';
export type SourceText = { text: string; language: Locale | null };
export type Address = { street: string; number: string; postcode: string; locality: string };
export type MunicipalityEvidence = {
  featureId: string; egid: string; url: string; municipalityId: number;
  municipalityName: string; address: Address; exportDate: string | null; verifiedAt: string;
};
export type ListingSource = {
  key: 'livit'; id: string; url: string; parserVersion: string; pageLocale: Locale;
  title: SourceText; description: SourceText; firstObservedAt: string;
  lastCheckedAt: string; lastAttemptAt: string; contentChangedAt: string;
  observation: 'present' | 'unavailable' | 'check-failed';
};

export type Knowledge<T> =
  | { status: 'known'; value: T; evidence: string; language?: Locale | null }
  | { status: 'unknown'; reason: string };

export type Geography = {
  status: 'inside' | 'outside' | 'unknown';
  evidence: string;
  basis: 'synthetic-declaration' | 'municipality-id' | 'boundary-check' | 'area-label' | 'none';
  verification?: MunicipalityEvidence;
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
  property: { status: 'residential' | 'non-residential' | 'unknown'; evidence: string };
  synthetic: boolean;
  sourceReference: string | null;
  transaction: 'rental' | 'sale' | 'unknown';
  areaLabel: string;
  geography: Geography;
  rent: Knowledge<Cost>;
  balcony: Knowledge<boolean>;
  address?: Address;
  source?: ListingSource;
  costs?: { net: Knowledge<Cost>; charges: Knowledge<Cost>; gross: Knowledge<Cost> };
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
