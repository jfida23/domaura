// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { runArchiveCli } from './archive-cli';
import { archiveFixtures } from './archive-test-support';
import { Store } from './store';
const directories: string[] = [];
afterEach(() => { directories.forEach(path => rmSync(path, { recursive: true, force: true })); directories.length = 0; });
function setup(count = 17) {
  const dir = mkdtempSync(join(tmpdir(), 'domaura-archive-')); directories.push(dir);
  const output = join(dir, 'public'); mkdirSync(output);
  const { dataset, status, runs } = archiveFixtures(count);
  const now = new Date().toISOString(); dataset.generatedAt = status.attemptedAt = runs[0].attemptedAt = now;
  runs[1].attemptedAt = new Date(Date.parse(now) - 60_000).toISOString();
  for (const offer of dataset.offers) {
    offer.source!.firstObservedAt = offer.source!.lastCheckedAt = offer.source!.lastAttemptAt = offer.source!.contentChangedAt = now;
    offer.geography.verification!.verifiedAt = now;
  }
  writeFileSync(join(output, 'livit-lugano.json'), JSON.stringify(dataset)); writeFileSync(join(output, 'collection-status.json'), JSON.stringify(status));
  const store = new Store(join(dir, 'livit.sqlite'));
  try { store.saveRun(runs[1]); store.saveRun(runs[0]); } finally { store.close(); }
  return { dir, output, args: ['--data-dir', dir, '--output-dir', output] };
}
it('verifies a qualifying snapshot and live run records without changing local files', () => {
  const { dir, output, args } = setup(); const messages: string[] = [];
  const files = [join(dir, 'livit.sqlite'), join(output, 'livit-lugano.json'), join(output, 'collection-status.json')];
  const before = files.map(path => readFileSync(path));
  expect(runArchiveCli(args, { write: message => messages.push(message) })).toBe(0);
  expect(messages.join(' ')).toMatch(/READY.*17\/10/);
  files.forEach((path, i) => expect(readFileSync(path).equals(before[i])).toBe(true));
});
it('returns nonzero with the actual shortfall for a valid nine-listing snapshot', () => {
  const { args } = setup(9); const messages: string[] = [];
  expect(runArchiveCli(args, { write: message => messages.push(message) })).toBe(1);
  expect(messages.join(' ')).toMatch(/9\/10/); expect(messages.join(' ')).toMatch(/shortfall: 1/i);
});
it('rejects missing data and unsupported arguments without creating collection files', () => {
  const { dir } = setup(); const output = join(dir, 'absent'); const messages: string[] = [];
  expect(runArchiveCli(['--output-dir', output], { write: value => messages.push(value) })).toBe(1);
  expect(existsSync(output)).toBe(false);
  expect(runArchiveCli(['--offline'], { write: value => messages.push(value) })).toBe(1);
  expect(messages.join(' ')).toMatch(/unavailable|cannot read|missing/i); expect(messages.join(' ')).toMatch(/arguments|usage/i);
});
it('runs the archive verification entry point against controlled local inputs', () => {
  const { args } = setup();
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/verify-livit-archive.ts', ...args], { encoding: 'utf8', timeout: 15_000 });
  expect(result.status, result.stderr).toBe(0); expect(result.stdout).toMatch(/READY.*17\/10/);
}, 20_000);
