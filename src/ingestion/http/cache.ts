import type { CachedPage } from '../types';
import type { HttpResult } from './client';
export type Getter = (url: string, headers?: Record<string, string>) => Promise<HttpResult>;
export async function fetchPage(get: Getter, url: string, cached: CachedPage | undefined, at: string, parserVersion: string): Promise<CachedPage | null> {
  const previous = cached?.url === url ? cached : undefined;
  const headers: Record<string, string> = {};
  if (previous?.etag) headers['If-None-Match'] = previous.etag;
  if (previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;
  let response = await get(url, headers);
  if (response.status === 304 && !previous?.body) response = await get(url, {});
  if ([404, 410].includes(response.status)) return null;
  if (response.status === 304) {
    if (!previous?.body) throw new Error('304 response without a cached body');
    return { ...previous, checkedAt: at, parserVersion };
  }
  if (response.status !== 200) throw new Error(`Unexpected detail HTTP ${response.status}`);
  return { url: response.url, body: response.body, etag: response.etag, lastModified: response.lastModified, checkedAt: at, changedAt: previous?.body === response.body ? previous.changedAt : at, parserVersion };
}
