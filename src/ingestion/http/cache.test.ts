// @vitest-environment node
import { expect, it } from 'vitest';
import { fetchPage } from './cache';
import { observedAt } from '../test-support';
import { url } from './test-support';
import type { HttpResult } from './client';
const oldTime = '2026-10-27T12:00:00Z';
const cached = { url, body: '<main>old</main>', etag: 'it-etag', checkedAt: oldTime, changedAt: oldTime, parserVersion: '1' };
it('advances successful check time on 304 while retaining body and content-change time', async () => {
  let headers: Record<string,string> | undefined;
  const page = await fetchPage(async (_url, value) => { headers = value; return { status: 304, body: '', url }; }, url, cached, observedAt, '2');
  expect(headers).toEqual({ 'If-None-Match': 'it-etag' });
  expect(page).toEqual({ ...cached, checkedAt: observedAt, parserVersion: '2' });
});
it('makes one unconditional request when 304 has no cached body and rejects another 304', async () => {
  const calls: unknown[] = []; const responses: HttpResult[] = [{ status: 304, body: '', url }, { status: 200, body: 'new', url }];
  const page = await fetchPage(async (_url, headers) => { calls.push(headers); return responses.shift()!; }, url, undefined, observedAt, '1');
  expect(calls).toEqual([{}, {}]); expect(page?.body).toBe('new');
  await expect(fetchPage(async () => ({ status: 304, body: '', url }), url, undefined, observedAt, '1')).rejects.toThrow(/304|cache/i);
});
it('never reuses validators or body from another locale', async () => {
  const de = url.replace('/it/locatario/obietto/', '/de/mieten/objekt/'); let sent: unknown;
  const page = await fetchPage(async (_url, headers) => { sent = headers; return { status: 200, body: 'German', url: de }; }, de, cached, observedAt, '1');
  expect(sent).toEqual({}); expect(page?.body).toBe('German'); expect(page?.url).toBe(de);
});
it.each([['<main>old</main>', oldTime], ['changed', observedAt]])('records actual content changes independently of successful 200 checks', async (body, changedAt) => {
  const page = await fetchPage(async () => ({ status: 200, body, url }), url, cached, observedAt, '1');
  expect(page?.checkedAt).toBe(observedAt); expect(page?.changedAt).toBe(changedAt);
});
it('returns unavailable for 404/410 and fails unexpected statuses', async () => {
  for (const status of [404, 410]) expect(await fetchPage(async () => ({ status, body: '', url }), url, cached, observedAt, '1')).toBeNull();
  await expect(fetchPage(async () => ({ status: 400, body: '', url }), url, cached, observedAt, '1')).rejects.toThrow(/400/i);
});
