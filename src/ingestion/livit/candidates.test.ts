// @vitest-environment node
import { expect, it } from 'vitest';
import { sourceUrl, validateManifest } from './candidates';

const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const de = `https://www.livit.ch/de/mieten/objekt/${id}`;
const itUrl = `https://www.livit.ch/it/locatario/obietto/${id}`;
it('deduplicates language variants and puts Italian first without fetching pages', () => {
  const candidates = validateManifest([{ url: de, discoveryEvidence: 'Advertised street in Lugano' }, { url: itUrl, discoveryEvidence: 'Same advertised unit' }]);
  expect(candidates).toEqual([{ id, urls: [itUrl, de], discoveryEvidence: 'Advertised street in Lugano' }]);
  expect(sourceUrl(de).id).toBe(id);
});
it.each([
  'http://www.livit.ch/de/mieten/objekt/7935.01.0203',
  'https://www.livit.ch.evil.example/de/mieten/objekt/7935.01.0203',
  'https://user:password@www.livit.ch/de/mieten/objekt/7935.01.0203',
  'https://www.livit.ch/de/search/residential',
  `${de}?page=1`, `${de}#form`, `${de}/extra`,
])('rejects unsupported source URL %s', url => {
  expect(() => validateManifest([{ url, discoveryEvidence: 'Lugano lead' }])).toThrow(/invalid/i);
});
it('rejects missing discovery evidence', () => {
  expect(() => validateManifest([{ url: de, discoveryEvidence: '' }])).toThrow(/invalid/i);
});
it('rejects more than 40 distinct leads without silently truncating', () => {
  expect(() => validateManifest(Array.from({ length: 41 }, (_, i) => ({ url: `https://www.livit.ch/de/mieten/objekt/${i}.01.0203`, discoveryEvidence: 'Lugano lead' })))).toThrow(/limit/i);
});
