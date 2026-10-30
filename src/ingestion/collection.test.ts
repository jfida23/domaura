// @vitest-environment node
import { expect, it } from 'vitest';
import { collect } from './collection';
import { candidate, services } from './collection-test-support';
import { exampleOffer } from './test-support';
it.each([0, 7, 20, 21])('publishes at most 20 distinct verified residential rentals for %i qualifying leads', async count => {
  const boundary = services(); const items = Array.from({ length: count }, (_, i) => candidate(i + 1));
  const data = await collect(items.reverse(), boundary);
  expect(data.offers).toHaveLength(Math.min(count, 20)); expect(boundary.calls).toHaveLength(Math.min(count, 20));
  expect(new Set(data.offers.map(offer => offer.id)).size).toBe(data.offers.length);
  expect(data.offers.map(offer => offer.source?.id)).toEqual(items.map(item => item.id).sort().slice(0, 20));
});
it('refreshes retained listings at capacity and fills slots released by withdrawal or exclusion', async () => {
  const items = Array.from({ length: 21 }, (_, i) => candidate(i + 1));
  const first = await collect(items, services()); const boundary = services(); const originalPage = boundary.page;
  const withdrawn = first.offers[0].source!.id;
  boundary.page = async (url, at) => url.endsWith('/' + withdrawn) ? (boundary.calls.push(url), null) : originalPage(url, at);
  const second = await collect(items, boundary, first);
  expect(second.offers).toHaveLength(20); expect(second.summary.unavailable).toBe(1);
  expect(second.offers.some(offer => offer.source?.id === withdrawn)).toBe(false); expect(boundary.calls).toHaveLength(21);
});
it('deduplicates language variants while preserving distinct units at one address and optional unknowns', async () => {
  const boundary = services(); const original = boundary.page;
  boundary.page = async (url, at) => { const page = await original(url, at); return { ...page!, body: page!.body.replace("CHF 1'530.–", 'Su richiesta').replace('con balcone.', 'con terrazza.') }; };
  const first = candidate(1);
  const data = await collect([first, { ...first, urls: [first.urls[0].replace('/it/locatario/obietto/', '/de/mieten/objekt/')] }, candidate(2)], boundary);
  expect(data.offers).toHaveLength(2); expect(boundary.calls).toHaveLength(2);
  expect(data.offers.every(offer => offer.rent.status === 'unknown' && offer.balcony.status === 'unknown')).toBe(true);
});
it('uses only one known fallback after preferred 404 and does not fetch locales for enrichment', async () => {
  const item = candidate(1); const de = item.urls[0].replace('/it/locatario/obietto/', '/de/mieten/objekt/'); item.urls.push(de);
  const boundary = services(); const original = boundary.page;
  boundary.page = async (url, at) => url === item.urls[0] ? (boundary.calls.push(url), null) : original(url, at);
  // The fallback fixture uses German labels with original Italian description.
  const fallback = boundary.page;
  boundary.page = async (url, at) => {
    const page = await fallback(url, at); if (!page) return page;
    return { ...page, body: page.body.replace('Tipo di oggetto', 'Objektart').replace('Appartamento</div>', 'Wohnung</div>').replace('Canone netto', 'Nettomiete').replace('Spese accessorie', 'Nebenkosten').replace('Canone lordo', 'Bruttomiete').replace('Indirizzo', 'Adresse').replace('Descrizione', 'Beschreibung') };
  };
  const data = await collect([item], boundary);
  expect(data.offers).toHaveLength(1); expect(data.summary.unavailable).toBe(0); expect(data.offers[0].source?.url).toBe(de); expect(boundary.calls).toEqual(item.urls);
  const italian = services(); await collect([item], italian); expect(italian.calls).toEqual([item.urls[0]]);
});
it('stops mandatory failures without trying another locale and reports ordinary exclusions separately', async () => {
  const boundary = services(); boundary.page = async url => { boundary.calls.push(url); throw new Error('Shared request budget reached'); };
  const item = candidate(1); item.urls.push(item.urls[0].replace('/it/locatario/obietto/', '/de/mieten/objekt/'));
  await expect(collect([item], boundary)).rejects.toThrow(/budget/); expect(boundary.calls).toHaveLength(1);
  const outside = services(); outside.geography = async () => ({ ...exampleOffer().geography, status: 'outside' });
  const excluded = await collect([candidate(1)], outside); expect(excluded.summary.excluded).toBe(1); expect(excluded.offers).toHaveLength(0);
});
it('publishes fewer accepted entries for unknown or non-residential leads and replaces an excluded retained unit', async () => {
  const first = await collect(Array.from({ length: 20 }, (_, i) => candidate(i + 1)), services());
  const boundary = services(); const original = boundary.page; const excludedId = first.offers[0].source!.id;
  boundary.page = async (url, at) => { const page = (await original(url, at))!; return url.endsWith('/' + excludedId) ? { ...page, body: page.body.replace('Appartamento</div>', 'Ufficio</div>') } : page; };
  const second = await collect([candidate(21)], boundary, first);
  expect(second.offers).toHaveLength(20); expect(second.summary.excluded).toBe(1); expect(boundary.calls).toHaveLength(21);
  const unknown = services(); unknown.geography = async () => ({ status: 'unknown', basis: 'none', evidence: 'Ambiguous address' });
  const result = await collect(Array.from({ length: 7 }, (_, i) => candidate(i)), unknown);
  expect(result.offers).toHaveLength(0); expect(result.summary.unverified).toBe(7); expect(result.summary.stopReason).toBe('candidates-exhausted');
});
it.each(['Questo oggetto non è più disponibile', 'Dieses Objekt ist nicht mehr verfügbar', "Cet objet n’est plus disponible", 'This property is no longer available'])('recognizes explicit listing-wide withdrawal: %s', async heading => {
  const boundary = services(); boundary.page = async url => ({ url, body: `<main><h1>${heading}</h1></main>`, checkedAt: boundary.now(), changedAt: boundary.now(), parserVersion: '1' });
  const data = await collect([candidate(1)], boundary);
  expect(data.summary.unavailable).toBe(1); expect(data.offers).toHaveLength(0);
});
it('keeps the first observation date when a previously withdrawn identity reappears', async () => {
  const first = await collect([candidate(1)], services()); const boundary = services(); const later = '2026-10-29T12:00:00.000Z';
  boundary.now = () => later; boundary.observation = () => first.offers[0]; const page = boundary.page;
  boundary.page = async (url, at) => ({ ...(await page(url, at))!, checkedAt: later, changedAt: later });
  const reappeared = await collect([candidate(1)], boundary);
  expect(reappeared.offers[0].source?.firstObservedAt).toBe(first.offers[0].source?.firstObservedAt);
  expect(reappeared.offers[0].source?.lastCheckedAt).toBe(later);
});
