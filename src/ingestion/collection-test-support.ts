import { readFileSync } from 'node:fs';
import type { Candidate } from './types';
import type { CollectionServices } from './collection';
import { exampleOffer, observedAt } from './test-support';
export const html = readFileSync(new URL('./livit/fixtures/listing-it.html', import.meta.url), 'utf8');
export const candidate = (n: number): Candidate => ({ id: `${n}.01.0203`, urls: [`https://www.livit.ch/it/locatario/obietto/${n}.01.0203`], discoveryEvidence: 'Fictional Lugano manifest lead' });
export function services(): CollectionServices & { calls: string[] } {
  const calls: string[] = [];
  return { calls, now: () => observedAt, check: () => {}, page: async url => { calls.push(url); return { url, body: html, checkedAt: observedAt, changedAt: observedAt, parserVersion: '1' }; }, geography: async () => exampleOffer().geography };
}
