// Fictional gate inputs; simulated live-mode records are unit-test evidence only.
import { exampleDataset, exampleOffer, observedAt } from './test-support';
import type { CollectionStatus, RunRecord } from './types';
export function archiveFixtures(count = 20) {
  const dataset = exampleDataset(Array.from({ length: count }, (_, i) => exampleOffer(i.toString(16).padStart(32, '0'))));
  dataset.id = 'latest-fixture';
  const status: CollectionStatus = { datasetId: dataset.id, attemptedAt: observedAt, state: 'success', message: 'Fictional acceptance data' };
  const runs: RunRecord[] = [
    { id: dataset.id, mode: 'live', attemptedAt: observedAt, state: 'success', summary: dataset.summary, message: 'Fictional latest run', outcomes: {} },
    { id: 'previous-fixture', mode: 'live', attemptedAt: '2026-10-28T11:59:00.000Z', state: 'success', summary: { ...dataset.summary, accepted: count }, message: 'Fictional initial run', outcomes: {} },
  ];
  return { dataset, status, runs, at: '2026-10-28T13:00:00.000Z' };
}
