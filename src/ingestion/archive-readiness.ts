import type { CollectionStatus, RunRecord } from './types';
import { isTimestamp, validateDataset } from './records';
import { geographyTtlMs } from './geography-cache';
export type ArchiveReadiness = { ready: boolean; accepted: number; target: 10; shortfall: number; issues: string[] };
export function assessArchiveReadiness(value: unknown, statusValue: unknown, runs: RunRecord[], at: string): ArchiveReadiness {
  try {
    const dataset = validateDataset(value);
    const accepted = dataset.offers.length;
    const issues = accepted >= 10 ? [] : [`Archive acceptance requires at least 10 qualifying listings; found ${accepted}.`];
    const latest = runs[0];
    const initial = runs[1];
    const successfulLiveRun = (run: RunRecord | undefined) => run?.mode === 'live' && run.state === 'success'
      && Number.isInteger(run.summary?.accepted) && run.summary.accepted >= 10 && run.summary.accepted <= 20 && isTimestamp(run.attemptedAt);
    if (!successfulLiveRun(latest) || !successfulLiveRun(initial)) issues.push('Two successive successful live runs with at least 10 accepted listings, within the cap of 20, are required.');
    if (latest?.id !== dataset.id || !initial?.id || latest.id === initial.id) issues.push('Dataset identity does not match distinct live collection and refresh run evidence.');
    if (!isTimestamp(latest?.attemptedAt) || !isTimestamp(initial?.attemptedAt)
      || Date.parse(initial.attemptedAt) >= Date.parse(latest.attemptedAt)
      || Date.parse(latest.attemptedAt) > Date.parse(dataset.generatedAt)) issues.push('Live run timestamps do not establish a valid collection and refresh sequence.');
    const status = statusValue as CollectionStatus | null;
    if (!status || status.datasetId !== dataset.id || status.state !== 'success' || !isTimestamp(status.attemptedAt)
      || status.attemptedAt !== latest?.attemptedAt) issues.push('Latest collection status must identify the matching successful live refresh.');
    const reviewedAt = Date.parse(at);
    if (!isTimestamp(at) || reviewedAt < Date.parse(dataset.generatedAt)) issues.push('Archive review time is invalid or precedes the dataset.');
    for (const offer of dataset.offers) {
      const source = offer.source!;
      const checkAge = reviewedAt - Date.parse(source.lastCheckedAt);
      if (source.observation !== 'present' || checkAge < 0 || checkAge > 24 * 60 * 60_000) issues.push(`${offer.id}: source observation is failed, stale, or has an invalid time.`);
      const geographyAge = reviewedAt - Date.parse(offer.geography.verification!.verifiedAt);
      if (geographyAge < 0 || geographyAge > geographyTtlMs) issues.push(`${offer.id}: municipal evidence is expired or has an invalid verification time.`);
    }
    return { ready: issues.length === 0, accepted, target: 10, shortfall: Math.max(0, 10 - accepted), issues };
  } catch (error) {
    return { ready: false, accepted: 0, target: 10, shortfall: 10, issues: [String(error)] };
  }
}
