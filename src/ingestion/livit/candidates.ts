import type { Locale } from '../../domain/model';
import type { Candidate } from '../types';

export const routes: Record<Locale, string> = { it: '/it/locatario/obietto/', de: '/de/mieten/objekt/', fr: '/fr/locataire/objet/', en: '/en/renting/object/' };
export function sourceUrl(url: string): { id: string; locale: Locale; url: string } {
  try {
    const parsed = new URL(url);
    const locale = (Object.keys(routes) as Locale[]).find(key => parsed.pathname.startsWith(routes[key]));
    const id = locale ? parsed.pathname.slice(routes[locale].length).replace(/\/$/, '') : '';
    if (!locale || parsed.origin !== 'https://www.livit.ch' || parsed.username || parsed.password || parsed.search || parsed.hash
      || !/^(?:[a-f0-9]{32}|\d+(?:\.\d+){2,3})$/.test(id)) throw new Error();
    return { id, locale, url: `https://www.livit.ch${routes[locale]}${id}` };
  } catch { throw new Error('Invalid Livit detail URL'); }
}
export function validateManifest(value: unknown): Candidate[] {
  if (!Array.isArray(value) || value.length > 160) throw new Error('Invalid manifest or input limit exceeded');
  const candidates = new Map<string, Candidate>();
  for (const row of value as { url: string; discoveryEvidence: string }[]) {
    if (!row || typeof row.url !== 'string' || typeof row.discoveryEvidence !== 'string' || !row.discoveryEvidence.trim()
      || row.discoveryEvidence.length > 2000) throw new Error('Invalid candidate discovery evidence');
    const source = sourceUrl(row.url);
    const italian = `https://www.livit.ch${routes.it}${source.id}`;
    const candidate = candidates.get(source.id) ?? { id: source.id, urls: [italian], discoveryEvidence: row.discoveryEvidence };
    if (!candidate.urls.includes(source.url)) candidate.urls.push(source.url);
    candidates.set(source.id, candidate);
    if (candidates.size > 40) throw new Error('Candidate limit exceeded (40 distinct identities)');
  }
  return [...candidates.values()];
}
