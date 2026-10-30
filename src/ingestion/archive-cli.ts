import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { RunRecord } from './types';
import { assessArchiveReadiness } from './archive-readiness';
export type ArchiveEnvironment = { write?: (message: string) => void; now?: () => string };
export function runArchiveCli(args: string[], environment: ArchiveEnvironment = {}): number {
  const write = environment.write ?? console.log;
  try {
    const options = new Map<string, string>();
    for (let i = 0; i < args.length; i++) {
      if (!['--data-dir', '--output-dir'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options.has(args[i])) throw new Error('Invalid archive verification arguments; use --data-dir <path> and --output-dir <path>.');
      options.set(args[i], args[++i]);
    }
    const directory = resolve(options.get('--data-dir') ?? '.local-data');
    const output = resolve(options.get('--output-dir') ?? 'public/data');
    const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
    const dataset = readJson(join(output, 'livit-lugano.json'));
    const status = readJson(join(output, 'collection-status.json'));
    const database = new DatabaseSync(join(directory, 'livit.sqlite'), { readOnly: true });
    let runs: RunRecord[];
    try { runs = database.prepare('SELECT value FROM runs ORDER BY seq DESC LIMIT 2').all().map(row => JSON.parse(String(row.value)) as RunRecord); }
    finally { database.close(); }
    const result = assessArchiveReadiness(dataset, status, runs, (environment.now ?? (() => new Date().toISOString()))());
    write(`${result.ready ? 'READY' : 'NOT READY'}: ${result.accepted}/${result.target} qualifying listings; shortfall: ${result.shortfall}.`);
    for (const issue of result.issues) write(`- ${issue}`);
    return result.ready ? 0 : 1;
  } catch (error) {
    write(`NOT READY: cannot read or verify archive evidence: ${String(error)}`);
    return 1;
  }
}
