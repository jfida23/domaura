import type { Clock, Transport } from './client';
export const policy = { use: 'private-noncommercial', reviewedAt: '2026-10-28', basisUrl: 'https://www.livit.ch/de/information/impressum' };
export const url = 'https://www.livit.ch/it/locatario/obietto/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export function fakeClock(): Clock & { starts: number[] } {
  let now = Date.parse('2026-10-28T12:00:00Z');
  return { starts: [], now: () => now, sleep: async ms => { now += ms; } };
}
export function queued(responses: (Response | Error)[], calls: { url: string; init: RequestInit }[] = []): Transport {
  return async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    if (!response) throw new Error('Unexpected fixture request');
    if (response instanceof Error) throw response;
    return response;
  };
}
export const robots = () => new Response('User-agent: *\nDisallow: /search\nDisallow: /*?*=*\nCrawl-delay: 10');
