import { readFileSync } from 'node:fs';
import type { Clock, Transport } from './http/client';
import { sourceUrl } from './livit/candidates';
export function offlineFixtures(): { manifest: unknown; policy: unknown; transport: Transport; clock: Clock } {
  const body = readFileSync(new URL('./livit/fixtures/listing-it.html', import.meta.url), 'utf8');
  const url = 'https://www.livit.ch/it/locatario/obietto/1.01.0203';
  const resource = 'https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/11140513_0';
  const search = { results: [{ attrs: { origin: 'address', label: 'Piazza Cioccaro 2 <b>6900 Lugano</b>', featureId: '11140513_0', links: [{ href: resource }] } }] };
  const feature = { feature: { featureId: '11140513_0', attributes: { egid: '11140513', strname: ['Piazza Cioccaro'], deinr: '2', dplz4: 6900, dplzname: 'Lugano', ggdenr: 5192, ggdename: 'Lugano', gexpdat: '2026-10-27' } } };
  let now = Date.now();
  return {
    manifest: [{ url, discoveryEvidence: 'Fictional offline Lugano advert, not a real offer' }],
    policy: { use: 'private-noncommercial', reviewedAt: '2026-10-28', basisUrl: 'https://www.livit.ch/de/information/impressum' },
    clock: { now: () => now, sleep: async ms => { now += ms; } },
    transport: async (requested, init) => {
      if (requested === 'https://www.livit.ch/robots.txt') return new Response('User-agent: *\nDisallow: /search\nCrawl-delay: 10');
      if (requested.startsWith('https://api3.geo.admin.ch/rest/services/api/SearchServer?')) return Response.json(search);
      if (requested === resource + '?returnGeometry=false') return Response.json(feature);
      if (new URL(requested).hostname === 'www.livit.ch' && sourceUrl(requested).url === url) return (init.headers as Record<string, string>)['If-None-Match'] === 'offline-1' ? new Response(null, { status: 304 }) : new Response(body, { headers: { etag: 'offline-1' } });
      throw new Error(`Unexpected offline fixture request: ${requested}`);
    },
  };
}
