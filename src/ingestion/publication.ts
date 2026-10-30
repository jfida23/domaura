import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CollectionStatus, Dataset } from './types';
import { validateDataset } from './records';
export type PublicationPaths = { dataset: string; status: string };
export type Publication = { exitCode: number; status: CollectionStatus; dataset?: Dataset };
export function atomicJson(path: string, value: unknown, rename: typeof renameSync = renameSync) {
  mkdirSync(dirname(path), { recursive: true }); const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = openSync(temporary, 'wx');
    try { writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); fsyncSync(file); } finally { closeSync(file); }
    rename(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}
export async function publish(paths: PublicationPaths, run: (previous?: Dataset) => Promise<Dataset>, at: string, rename: typeof renameSync = renameSync): Promise<Publication> {
  let previous: Dataset | undefined;
  try {
    if (existsSync(paths.dataset)) previous = validateDataset(JSON.parse(readFileSync(paths.dataset, 'utf8')));
    const dataset = validateDataset(await run(previous));
    atomicJson(paths.dataset, dataset, rename);
    const status: CollectionStatus = { datasetId: dataset.id, attemptedAt: at, state: 'success', message: `${dataset.summary.accepted} accepted; ${dataset.summary.excluded} excluded; ${dataset.summary.unverified} unverified; ${dataset.summary.unavailable} unavailable; ${dataset.summary.stopReason}` };
    atomicJson(paths.status, status, rename); return { exitCode: 0, dataset, status };
  } catch (error) {
    const status: CollectionStatus = { datasetId: previous?.id ?? null, attemptedAt: at, state: 'failed', message: String(error) };
    atomicJson(paths.status, status, rename); return { exitCode: 1, status };
  }
}
