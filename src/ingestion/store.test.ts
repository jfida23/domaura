// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { Store } from './store';
import { exampleDataset, exampleOffer, observedAt } from './test-support';
import { candidate } from './collection-test-support';
const dirs: string[] = []; const stores: Store[] = [];
afterEach(() => { stores.forEach(store => store.close()); dirs.forEach(dir => rmSync(dir, { recursive: true, force: true })); stores.length = dirs.length = 0; });
function open(path?: string) { const dir = path ?? mkdtempSync(join(tmpdir(), 'domaura-store-')); if (!path) dirs.push(dir); const store = new Store(join(dir, 'data.sqlite')); stores.push(store); return { store, dir }; }
it('persists present, unavailable and failed observations across restarts with original timestamps', () => {
  const { store, dir } = open(); const offer = exampleOffer(); const id = offer.source!.id;
  store.observe(id, offer, 'present', observedAt); store.close();
  const reopened = open(dir).store;
  expect(reopened.observation(id)).toEqual(offer);
  const later = '2026-10-29T12:00:00.000Z';
  reopened.observe(id, undefined, 'check-failed', later);
  expect(reopened.observation(id)?.source).toMatchObject({ observation: 'check-failed', firstObservedAt: observedAt, lastCheckedAt: observedAt, lastAttemptAt: later });
  reopened.observe(id, undefined, 'unavailable', later);
  expect(reopened.observation(id)?.source?.observation).toBe('unavailable');
  reopened.observe(id, { ...offer, source: { ...offer.source!, firstObservedAt: later, lastCheckedAt: later } }, 'present', later);
  expect(reopened.observation(id)?.source?.firstObservedAt).toBe(observedAt);
});
it('retains no more than two HTML versions per identity and removes seven-day-old HTML', () => {
  const { store } = open(); const offer = exampleOffer(); const id = offer.source!.id; const url = offer.source!.url;
  for (let i = 0; i < 3; i++) store.savePage(id, { url: url + (i === 0 ? '/' : ''), body: `version-${i}`, checkedAt: observedAt, changedAt: observedAt, parserVersion: '1' });
  expect(store.page(url + '/', observedAt)).toBeUndefined(); expect(store.page(url, observedAt)?.body).toBe('version-2');
  store.prune('2026-11-05T12:00:00Z'); expect(store.page(url, '2026-11-05T12:00:00Z')).toBeUndefined();
});
it('retains only two diagnostics and exact-address municipal evidence', () => {
  const { store } = open(); const dataset = exampleDataset();
  for (let i = 0; i < 3; i++) store.saveRun({ id: String(i), mode: 'offline', attemptedAt: observedAt, state: 'success', summary: dataset.summary, message: 'fixture run', outcomes: {} });
  expect(store.runs().map(run => run.id)).toEqual(['2', '1']);
  store.saveGeography('exact-address', exampleOffer().geography, observedAt);
  expect(store.geography('exact-address')).toEqual(exampleOffer().geography); expect(store.geography('other-address')).toBeUndefined();
});
it('keeps candidate-bound records and never extends raw HTML age with an unchanged check', () => {
  const { store } = open(); const offer = exampleOffer(); const id = offer.source!.id; const url = offer.source!.url;
  store.candidates([{ id, urls: [url], discoveryEvidence: 'Fictional Lugano lead' }]);
  store.observe(id, offer, 'present', observedAt);
  store.savePage(id, { url, body: 'unchanged', checkedAt: observedAt, changedAt: observedAt, parserVersion: '1' });
  store.savePage(id, { url, body: 'unchanged', checkedAt: '2026-11-03T12:00:00Z', changedAt: observedAt, parserVersion: '1' });
  store.prune('2026-11-05T12:00:00Z'); expect(store.page(url, '2026-11-05T12:00:00Z')).toBeUndefined();
  store.candidates([candidate(1)]); expect(store.observation(id)).toBeUndefined();
});
