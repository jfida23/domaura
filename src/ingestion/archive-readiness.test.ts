// @vitest-environment node
import { expect, it } from 'vitest';
import { assessArchiveReadiness } from './archive-readiness';
import { archiveFixtures } from './archive-test-support';
it.each([10, 17, 19, 20])('accepts %i qualifying listings without discarding entries above the minimum', count => {
  const { dataset, status, runs, at } = archiveFixtures(count);
  expect(assessArchiveReadiness(dataset, status, runs, at)).toEqual({ ready: true, accepted: count, target: 10, shortfall: 0, issues: [] });
});
it.each([{ count: 0, shortfall: 10 }, { count: 1, shortfall: 9 }, { count: 9, shortfall: 1 }])('keeps a valid $count-entry collection short of archive acceptance', ({ count, shortfall }) => {
  const { dataset, status, runs, at } = archiveFixtures(count);
  const result = assessArchiveReadiness(dataset, status, runs, at);
  expect(result.ready).toBe(false); expect(result.accepted).toBe(count); expect(result.shortfall).toBe(shortfall);
  expect(result.issues.join(' ')).toMatch(/at least 10/i);
});
it.each(['excessive', 'duplicate', 'synthetic', 'non-residential', 'outside', 'unavailable', 'malformed'])('rejects an invalid dataset: %s', kind => {
  const { dataset, status, runs, at } = archiveFixtures(kind === 'excessive' ? 21 : 20);
  if (kind === 'duplicate') dataset.offers[1] = dataset.offers[0];
  if (kind === 'synthetic') dataset.offers[0].synthetic = true;
  if (kind === 'non-residential') dataset.offers[0].property.status = 'non-residential';
  if (kind === 'outside') dataset.offers[0].geography.verification!.municipalityId = 5196;
  if (kind === 'unavailable') dataset.offers[0].source!.observation = 'unavailable';
  const result = assessArchiveReadiness(kind === 'malformed' ? { offers: [] } : dataset, status, runs, at);
  expect(result.ready).toBe(false); expect(result.issues.join(' ')).toMatch(/invalid/i);
});
it.each(['offline', 'missing-mode', 'missing-initial', 'failed-latest', 'previous-short', 'latest-short', 'previous-excessive', 'latest-excessive', 'mismatched-run', 'mismatched-status', 'failed-status', 'invalid-order', 'invalid-timestamp'])('requires consistent successful live collection and refresh evidence: %s', kind => {
  const { dataset, status, runs, at } = archiveFixtures();
  if (kind === 'offline') runs[0].mode = 'offline';
  if (kind === 'missing-mode') delete (runs[0] as Partial<typeof runs[0]>).mode;
  if (kind === 'missing-initial') runs.pop();
  if (kind === 'failed-latest') runs[0].state = 'failed';
  if (kind === 'previous-short') runs[1].summary.accepted = 9;
  if (kind === 'latest-short') runs[0].summary = { ...runs[0].summary, accepted: 9 };
  if (kind === 'previous-excessive') runs[1].summary.accepted = 21;
  if (kind === 'latest-excessive') runs[0].summary = { ...runs[0].summary, accepted: 21 };
  if (kind === 'mismatched-run') runs[0].id = 'older-export';
  if (kind === 'mismatched-status') status.datasetId = 'older-export';
  if (kind === 'failed-status') status.state = 'failed';
  if (kind === 'invalid-order') runs[1].attemptedAt = '2026-10-28T12:01:00.000Z';
  if (kind === 'invalid-timestamp') status.attemptedAt = 'yesterday';
  const result = assessArchiveReadiness(dataset, status, runs, at);
  expect(result.ready).toBe(false); expect(result.issues.join(' ')).toMatch(/live|run|status|refresh/i);
});
it.each(['source-age', 'geography-age', 'failed-observation', 'future-review'])('checks freshness at archive review time: %s', kind => {
  const { dataset, status, runs } = archiveFixtures();
  let at = '2026-10-28T13:00:00.000Z';
  if (kind === 'source-age') at = '2026-10-29T12:00:00.001Z';
  if (kind === 'geography-age') {
    at = '2026-11-04T13:00:00.000Z'; dataset.generatedAt = '2026-11-04T12:00:00.000Z';
    for (const offer of dataset.offers) offer.source!.lastCheckedAt = offer.source!.lastAttemptAt = dataset.generatedAt;
    status.attemptedAt = runs[0].attemptedAt = dataset.generatedAt; runs[1].attemptedAt = '2026-11-04T11:59:00.000Z';
  }
  if (kind === 'failed-observation') dataset.offers[0].source!.observation = 'check-failed';
  if (kind === 'future-review') at = '2026-10-28T11:00:00.000Z';
  const result = assessArchiveReadiness(dataset, status, runs, at);
  expect(result.ready).toBe(false); expect(result.issues.join(' ')).toMatch(/stale|fresh|expired|time|observation/i);
});
