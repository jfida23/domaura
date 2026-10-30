// @vitest-environment node
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { publish } from './publication';
import { exampleDataset, observedAt } from './test-support';
import { collect } from './collection';
import { candidate, services } from './collection-test-support';
const dirs: string[] = [];
afterEach(() => { dirs.forEach(dir => rmSync(dir, { recursive: true, force: true })); dirs.length = 0; });
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'domaura-publish-')); dirs.push(dir);
  const paths = { dataset: join(dir, 'dataset.json'), status: join(dir, 'status.json') };
  const oldBytes = JSON.stringify(exampleDataset(), null, 4) + '\n'; writeFileSync(paths.dataset, oldBytes);
  return { dir, paths, oldBytes };
}
it.each(['access denied', 'transport outage', 'parse structure missing', 'verification service failed', 'request budget reached', 'deadline reached'])('preserves previous bytes on mandatory failure: %s', async message => {
  const { paths, oldBytes } = setup(); const boundary = services();
  if (message.startsWith('verification')) boundary.geography = async () => { throw new Error(message); };
  else if (message.startsWith('parse')) boundary.page = async url => ({ url, body: '<main></main>', checkedAt: observedAt, changedAt: observedAt, parserVersion: '1' });
  else if (message.startsWith('access') || message.startsWith('transport')) boundary.page = async () => { throw new Error(message); };
  else boundary.check = () => { throw new Error(message); };
  const result = await publish(paths, previous => collect([candidate(1)], boundary, previous), observedAt);
  expect(result.exitCode).toBe(1); expect(readFileSync(paths.dataset, 'utf8')).toBe(oldBytes);
  expect(JSON.parse(readFileSync(paths.status, 'utf8'))).toMatchObject({ datasetId: 'fixture-run', state: 'failed', attemptedAt: observedAt });
});
it('publishes a validated explicit empty dataset after ordinary unavailable outcomes', async () => {
  const { paths } = setup(); const boundary = services(); boundary.page = async () => null;
  const result = await publish(paths, previous => collect([candidate(1)], boundary, previous, 'empty-run'), observedAt);
  expect(result.exitCode).toBe(0); expect(JSON.parse(readFileSync(paths.dataset, 'utf8')).offers).toEqual([]);
  expect(result.status).toMatchObject({ datasetId: 'empty-run', state: 'success' });
});
it('keeps the previous file intact when replacement is interrupted and removes temporary files', async () => {
  const { dir, paths, oldBytes } = setup();
  const result = await publish(paths, async () => exampleDataset([]), observedAt, (from, to) => { if (to === paths.dataset) throw new Error('interrupted rename'); renameSync(from, to); });
  expect(result.exitCode).toBe(1); expect(readFileSync(paths.dataset, 'utf8')).toBe(oldBytes);
  expect(readdirSync(dir).sort()).toEqual(['dataset.json', 'status.json']);
});
it('validates the global cap before writing', async () => {
  const { paths, oldBytes } = setup(); const invalid = exampleDataset(); invalid.offers = Array.from({ length: 21 }, () => invalid.offers[0]); invalid.summary.accepted = 21;
  const result = await publish(paths, async () => invalid, observedAt);
  expect(result.exitCode).toBe(1); expect(readFileSync(paths.dataset, 'utf8')).toBe(oldBytes);
});
