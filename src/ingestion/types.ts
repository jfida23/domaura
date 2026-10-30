import type { Offer } from '../domain/model';

export type Summary = { accepted: number; excluded: number; unverified: number; unavailable: number; stopReason: string };
export type Dataset = { schemaVersion: 1; id: string; source: 'livit'; generatedAt: string; offers: Offer[]; summary: Summary };
export type CollectionStatus = { datasetId: string | null; attemptedAt: string; state: 'success' | 'failed'; message: string };
export type Candidate = { id: string; urls: string[]; discoveryEvidence: string };
export type CachedPage = { url: string; body: string; etag?: string; lastModified?: string; checkedAt: string; changedAt: string; parserVersion: string };
export type RunRecord = { id: string; mode: 'live' | 'offline'; attemptedAt: string; state: 'success' | 'failed'; summary: Summary; message: string; outcomes: Record<string, string> };
