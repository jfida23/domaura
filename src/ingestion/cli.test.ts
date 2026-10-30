// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { runCli } from './cli';
import { validateDataset } from './records';
import { Store } from './store';
import { fakeClock, policy, queued, robots } from './http/test-support';
const dirs: string[] = [];
afterEach(() => { dirs.forEach(dir => rmSync(dir, { recursive: true, force: true })); dirs.length = 0; });
function setup() { const dir = mkdtempSync(join(tmpdir(), 'domaura-cli-')); dirs.push(dir); return { dir, args: ['--offline', '--data-dir', dir, '--output-dir', join(dir, 'public')] }; }
it('runs the complete offline command, persists SQLite and refreshes the same source identity', async () => {
  const { dir, args } = setup(); const messages: string[] = [];
  expect(await runCli(args, { write: message => messages.push(message) })).toBe(0);
  const dataPath = join(dir, 'public', 'livit-lugano.json'); const first = validateDataset(JSON.parse(readFileSync(dataPath, 'utf8')));
  expect(first.offers).toHaveLength(1); expect(messages.join(' ')).toMatch(/1 accepted/); expect(messages.join(' ')).toMatch(/detail.*1/);
  expect(await runCli(args, { write: () => {} })).toBe(0);
  const second = validateDataset(JSON.parse(readFileSync(dataPath, 'utf8')));
  expect(second.offers[0].source?.id).toBe(first.offers[0].source?.id);
  expect(second.offers[0].source?.firstObservedAt).toBe(first.offers[0].source?.firstObservedAt);
  expect(JSON.parse(readFileSync(join(dir, 'public', 'collection-status.json'), 'utf8'))).toMatchObject({ datasetId: second.id, state: 'success' });
  expect(readFileSync(dataPath, 'utf8')).not.toMatch(/@|<img|<form|contact/i);
  const stored = new Store(join(dir, 'livit.sqlite'));
  try { expect(stored.runs().map(run => run.mode)).toEqual(['offline', 'offline']); }
  finally { stored.close(); }
});
it('executes the documented npm entry point with offline fixtures', () => {
  const { args } = setup(); const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/collect-livit.ts', ...args], { encoding: 'utf8', timeout: 15_000 });
  expect(result.status, result.stderr).toBe(0); expect(result.stdout).toMatch(/1 accepted/);
}, 20_000);
it('reports actionable input and live access failures without fabricating a dataset', async () => {
  const { dir } = setup(); const messages: string[] = [];
  expect(await runCli([], { write: value => messages.push(value) })).toBe(1);
  expect(messages.join(' ')).toMatch(/manifest|usage/i);
  const manifest = join(dir, 'manifest.json'); const policyPath = join(dir, 'policy.json');
  writeFileSync(manifest, JSON.stringify([{ url: 'https://www.livit.ch/it/locatario/obietto/1.01.0203', discoveryEvidence: 'Fictional Lugano lead' }])); writeFileSync(policyPath, JSON.stringify(policy));
  const code = await runCli(['--manifest', manifest, '--policy', policyPath, '--data-dir', dir, '--output-dir', join(dir, 'public')], { transport: queued([robots(), new Response('denied', { status: 403 })]), clock: fakeClock(), write: value => messages.push(value) });
  expect(code).toBe(1); expect(messages.join(' ')).toMatch(/denied/);
  expect(JSON.parse(readFileSync(join(dir, 'public', 'collection-status.json'), 'utf8')).state).toBe('failed');
  const stored = new Store(join(dir, 'livit.sqlite'));
  try { expect(stored.runs()[0].mode).toBe('live'); }
  finally { stored.close(); }
});
