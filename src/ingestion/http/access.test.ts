// @vitest-environment node
import { expect, it } from 'vitest';
import { HttpClient } from './client';
import { fakeClock, policy, queued, robots, url } from './test-support';
it('checks recorded private use and current robots before any detail request', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const client = new HttpClient(queued([robots(), new Response('detail')], calls), fakeClock());
  await expect(client.get(url)).rejects.toThrow(/access|policy/i);
  expect(calls).toHaveLength(0);
  await expect(client.authorize({ ...policy, use: 'unresolved' })).rejects.toThrow(/policy|use/i);
  expect(calls).toHaveLength(0);
  await client.authorize(policy);
  expect((await client.get(url)).body).toBe('detail');
  expect(calls.map(call => call.url)).toEqual(['https://www.livit.ch/robots.txt', url]);
});
it('obeys matching robots disallows and keeps denial terminal across locales', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const client = new HttpClient(queued([new Response('User-agent: *\nDisallow: /it/\n'), new Response('not allowed')], calls), fakeClock());
  await client.authorize(policy);
  await expect(client.get(url)).rejects.toThrow(/robots/i);
  await expect(client.get(url.replace('/it/locatario/obietto/', '/de/mieten/objekt/'))).rejects.toThrow(/stop|access|robots/i);
  expect(calls).toHaveLength(1);
});
it.each([
  new Response('Denied', { status: 403 }),
  new Response('<title>Just a moment</title> captcha'),
  new Response('', { status: 302, headers: { location: 'https://evil.example/collect' } }),
  new Response('', { status: 302, headers: { location: '/de/search?query=lugano' } }),
])('stops on denial, challenge or unsafe redirect before another request', async response => {
  const calls: { url: string; init: RequestInit }[] = [];
  const client = new HttpClient(queued([robots(), response], calls), fakeClock());
  await client.authorize(policy);
  await expect(client.get(url)).rejects.toThrow(/denied|challenge|redirect|invalid/i);
  await expect(client.get(url)).rejects.toThrow();
  expect(calls).toHaveLength(2);
});
it('allows a public detail page whose contact form loads reCAPTCHA', async () => {
  const detail = '<html><title>Appartamento Lugano | Livit</title><main><h1>Appartamento</h1><h2>Dettaglio</h2></main><form><script src="https://www.google.com/recaptcha/api.js"></script><div class="g-recaptcha"></div></form></html>';
  const client = new HttpClient(queued([robots(), new Response(detail)]), fakeClock());
  await client.authorize(policy);
  expect((await client.get(url)).body).toBe(detail);
});
it.each(['<title>Verify you are human</title><form>Challenge</form>', '<h1>CAPTCHA verification required</h1>', 'Access denied'])('stops actual blocking challenge content: %s', async detail => {
  const client = new HttpClient(queued([robots(), new Response(detail)]), fakeClock());
  await client.authorize(policy); await expect(client.get(url)).rejects.toThrow(/challenge/i);
});
