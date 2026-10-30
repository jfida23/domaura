// @vitest-environment node
import { expect, it } from 'vitest';
import { verifyAddress } from './geography';
import { exampleOffer, observedAt } from './test-support';
export const address = exampleOffer().address!;
export const resource = 'https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/11140513_0';
export const searchResult = { attrs: { origin: 'address', label: 'Piazza Cioccaro 2 <b>6900 Lugano</b>', featureId: '11140513_0', links: [{ href: resource }] } };
export const feature = { feature: { featureId: '11140513_0', attributes: { egid: '11140513', strname: ['Piazza Cioccaro'], deinr: '2', dplz4: 6900, dplzname: 'Lugano', ggdenr: 5192, ggdename: 'Lugano', gexpdat: '27.10.2026' } } };
it.each(['attributes', 'result'])('verifies only an exact unique address using the official link at %s level', async placement => {
  const result = placement === 'result' ? { attrs: { ...searchResult.attrs, links: undefined }, links: searchResult.attrs.links } : searchResult;
  const calls: string[] = [];
  const geo = await verifyAddress(address, async url => { calls.push(url); return { status: 200, body: JSON.stringify(calls.length === 1 ? { results: [result] } : feature), url }; }, observedAt);
  expect(geo.status).toBe('inside'); expect(geo.basis).toBe('municipality-id');
  expect(geo.verification).toEqual({ featureId: '11140513_0', egid: '11140513', url: resource + '?returnGeometry=false', municipalityId: 5192, municipalityName: 'Lugano', address, exportDate: '27.10.2026', verifiedAt: observedAt });
  const query = new URL(calls[0]); expect(query.searchParams.get('type')).toBe('locations'); expect(query.searchParams.get('origins')).toBe('address'); expect(query.searchParams.get('searchText')).toBe('Piazza Cioccaro 2 6900');
});
it('classifies a neighbouring municipality as outside despite advertised Lugano', async () => {
  let calls = 0;
  const geo = await verifyAddress(address, async url => ({ status: 200, body: JSON.stringify(++calls === 1 ? { results: [searchResult] } : { feature: { ...feature.feature, attributes: { ...feature.feature.attributes, ggdenr: 5196, ggdename: 'Massagno' } } }), url }), observedAt);
  expect(geo.status).toBe('outside'); expect(geo.verification?.municipalityId).toBe(5196);
});
it.each([
  { results: [] }, { results: [searchResult, { ...searchResult, attrs: { ...searchResult.attrs, featureId: 'other' } }] },
  { results: [{ attrs: { ...searchResult.attrs, label: 'Piazza Cioccaro 20 <b>6900 Lugano</b>' } }] },
  { results: [{ attrs: { ...searchResult.attrs, links: [{ href: 'https://evil.example/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/11140513_0' }] } }] },
])('leaves missing, ambiguous, fuzzy or unsafe search evidence unknown', async ({ results }) => {
  let calls = 0;
  const geo = await verifyAddress(address, async url => { calls++; return { status: 200, body: JSON.stringify({ results }), url }; }, observedAt);
  expect(geo.status).toBe('unknown'); expect(calls).toBe(1);
});
it.each([{ deinr: '20' }, { ggdenr: null }, { strname: ['Other street'] }, { egid: null }])('rejects conflicting or missing official feature fields', async changes => {
  let calls = 0;
  const geo = await verifyAddress(address, async url => ({ status: 200, body: JSON.stringify(++calls === 1 ? { results: [searchResult] } : { feature: { ...feature.feature, attributes: { ...feature.feature.attributes, ...changes } } }), url }), observedAt);
  expect(geo.status).toBe('unknown');
});
it('distinguishes missing address from service failure', async () => {
  expect((await verifyAddress(undefined, async () => { throw new Error('should not request'); }, observedAt)).status).toBe('unknown');
  await expect(verifyAddress(address, async () => { throw new Error('service outage'); }, observedAt)).rejects.toThrow(/service outage/);
  await expect(verifyAddress(address, async url => ({ status: 503, body: '', url }), observedAt)).rejects.toThrow(/service|503/i);
});
