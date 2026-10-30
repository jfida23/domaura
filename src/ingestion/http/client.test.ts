// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { defaultLimits, HttpClient } from './client';
import { fakeClock, policy, queued, robots, url } from './test-support';
it('spaces all Livit starts, counts robots and details, and uses manual timed requests', async () => {
  const clock = fakeClock(); const starts: number[] = [];
  const calls: { url: string; init: RequestInit }[] = [];
  const transport = queued([robots(), new Response('a'), new Response('b')], calls);
  const client = new HttpClient(async (url, init) => { starts.push(clock.now()); return transport(url, init); }, clock);
  await client.authorize(policy); await client.get(url); await client.get(url);
  expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(10_000);
  expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(10_000);
  expect(client.counts).toEqual({ livit: 3, detail: 2, geo: 0 });
  expect(calls.every(call => call.init.redirect === 'manual' && call.init.signal && (call.init.headers as Record<string,string>)['User-Agent'].includes('Domaura'))).toBe(true);
});
it.each([
  [new Error('network unavailable'), new Response('recovered')],
  [new Response('temporary', { status: 503 }), new Response('recovered')],
  [new Response('', { status: 429, headers: { 'retry-after': '12' } }), new Response('recovered')],
])('retries one transient response within the same budgets', async (first, second) => {
  const client = new HttpClient(queued([robots(), first, second]), fakeClock());
  await client.authorize(policy);
  expect((await client.get(url)).body).toBe('recovered');
  expect(client.counts.detail).toBe(2);
});
it.each([
  { ...defaultLimits, detail: 0 }, { ...defaultLimits, livit: 1 },
  { ...defaultLimits, durationMs: 9999 }, { ...defaultLimits, bodyBytes: 80 },
])('stops at a finite request, deadline or body limit', async limits => {
  const client = new HttpClient(queued([robots(), new Response('x'.repeat(100))]), fakeClock(), limits);
  await client.authorize(policy);
  await expect(client.get(url)).rejects.toThrow(/limit|budget|deadline|size/i);
});
it('aborts a timed-out transport and retries at most once', async () => {
  vi.useFakeTimers();
  try {
    const client = new HttpClient(async (_url, init) => new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('timeout')))), fakeClock(), { ...defaultLimits, timeoutMs: 10 });
    const result = client.authorize(policy).catch(error => error);
    await vi.runAllTimersAsync();
    expect(String(await result)).toMatch(/timeout/i);
    expect(client.counts.livit).toBe(2);
  } finally { vi.useRealTimers(); }
});
it('follows only validated same-variant redirects and accounts for the extra attempt', async () => {
  const client = new HttpClient(queued([robots(), new Response('', { status: 301, headers: { location: url + '/' } }), new Response('redirected')]), fakeClock());
  await client.authorize(policy);
  expect((await client.get(url)).body).toBe('redirected');
  expect(client.counts.detail).toBe(2);
});
it('does not retry missing listings and stops on a second rate limit', async () => {
  const missing = new HttpClient(queued([robots(), new Response('', { status: 404 })]), fakeClock());
  await missing.authorize(policy); expect((await missing.get(url)).status).toBe(404); expect(missing.counts.detail).toBe(1);
  const limited = new HttpClient(queued([robots(), new Response('', { status: 429 }), new Response('', { status: 429 })]), fakeClock());
  await limited.authorize(policy); await expect(limited.get(url)).rejects.toThrow(/429|rate/i); expect(limited.counts.detail).toBe(2);
});
it('serializes concurrent Livit calls and honors stricter robots and Retry-After', async () => {
  const clock = fakeClock(); const starts: number[] = []; let active = 0; let maximum = 0;
  const transport = queued([new Response('User-agent: *\nCrawl-delay: 17'), new Response('a'), new Response('b')]);
  const client = new HttpClient(async (url, init) => { active++; maximum = Math.max(maximum, active); starts.push(clock.now()); await Promise.resolve(); const response = await transport(url, init); active--; return response; }, clock);
  await client.authorize(policy); await Promise.all([client.get(url), client.get(url)]);
  expect(maximum).toBe(1); expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(17_000);
  const hugeDelay = new HttpClient(queued([robots(), new Response('', { status: 429, headers: { 'retry-after': '99999' } })]), fakeClock());
  await hugeDelay.authorize(policy); await expect(hugeDelay.get(url)).rejects.toThrow(/deadline/i);
});
it('counts official GeoAdmin attempts separately and rejects other service routes', async () => {
  const calls: {url:string;init:RequestInit}[] = [];
  const client = new HttpClient(queued([robots(), new Response('{}')], calls), fakeClock(), { ...defaultLimits, geo: 1 });
  await client.authorize(policy);
  const geo = 'https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&origins=address&searchText=Example%202%206900&lang=it';
  expect((await client.get(geo)).body).toBe('{}'); expect(client.counts).toEqual({ livit: 1, detail: 0, geo: 1 });
  await expect(client.get(geo)).rejects.toThrow(/budget/i);
  const unsafe = new HttpClient(queued([robots()], []), fakeClock()); await unsafe.authorize(policy);
  await expect(unsafe.get('https://api3.geo.admin.ch/other')).rejects.toThrow(/invalid/i);
});
