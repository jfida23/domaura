import { sourceUrl } from '../livit/candidates';
import { officialResource } from '../official-url';
export type Clock = { now(): number; sleep(ms: number): Promise<void> };
export type Limits = { livit: number; detail: number; geo: number; durationMs: number; timeoutMs: number; bodyBytes: number };
export const defaultLimits: Limits = { livit: 60, detail: 40, geo: 80, durationMs: 20 * 60_000, timeoutMs: 15_000, bodyBytes: 2 * 1024 * 1024 };
export type HttpResult = { status: number; body: string; url: string; etag?: string; lastModified?: string };
export type Policy = { use: string; reviewedAt: string; basisUrl: string };
export type Transport = (url: string, init: RequestInit) => Promise<Response>;
type RobotRule = { allow: boolean; path: string };
async function readBoundedBody(response: Response, limit: number): Promise<string> {
  if (Number(response.headers.get('content-length')) > limit) throw new Error('Response size limit reached');
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('Response size limit reached');
      }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
function robotsPolicy(text: string): { rules: RobotRule[]; delayMs: number } {
  const groups: { agents: string[]; rules: RobotRule[]; delay: number }[] = [];
  let group = { agents: [] as string[], rules: [] as RobotRule[], delay: 0 };
  let directives = false;
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([\w-]+)\s*:\s*(.*?)\s*$/.exec(line.split('#')[0]);
    if (!match) continue;
    const [, rawKey, value] = match; const key = rawKey.toLowerCase();
    if (key === 'user-agent') {
      if (directives) { groups.push(group); group = { agents: [], rules: [], delay: 0 }; directives = false; }
      group.agents.push(value.toLowerCase());
    } else {
      directives = true;
      if ((key === 'allow' || key === 'disallow') && value) group.rules.push({ allow: key === 'allow', path: value });
      if (key === 'crawl-delay' && Number.isFinite(Number(value))) group.delay = Math.max(group.delay, Number(value) * 1000);
    }
  }
  groups.push(group);
  const specific = groups.filter(g => g.agents.some(a => a !== '*' && 'domaura'.includes(a)));
  const selected = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
  return { rules: selected.flatMap(g => g.rules), delayMs: Math.max(10_000, ...selected.map(g => g.delay)) };
}
export class HttpClient {
  readonly counts = { livit: 0, detail: 0, geo: 0 };
  private authorized = false;
  private stopped = false;
  private robots = { rules: [] as RobotRule[], delayMs: 10_000 };
  private readonly startedAt: number;
  private lastLivitStart = -Infinity;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly transport: Transport = fetch, readonly clock: Clock = { now: Date.now, sleep: ms => new Promise(resolve => setTimeout(resolve, ms)) }, readonly limits: Limits = defaultLimits) { this.startedAt = clock.now(); }
  checkDeadline(extraMs = 0) {
    if (this.clock.now() + extraMs - this.startedAt >= this.limits.durationMs) throw new Error('Collection deadline reached');
  }
  private async pause(ms: number) { this.checkDeadline(ms); if (ms > 0) await this.clock.sleep(ms); }
  private checkRoute(url: string, robots = false) {
    if (robots && url === 'https://www.livit.ch/robots.txt') return;
    const parsed = new URL(url);
    if (parsed.origin === 'https://api3.geo.admin.ch' && !parsed.username && !parsed.password && !parsed.hash) {
      if (officialResource(url)) return;
      if (parsed.pathname === '/rest/services/api/SearchServer' && parsed.searchParams.get('type') === 'locations' && parsed.searchParams.get('origins') === 'address' && parsed.searchParams.has('searchText') && [...parsed.searchParams.keys()].every(key => ['type', 'origins', 'searchText', 'lang'].includes(key))) return;
      throw new Error('Invalid official service route');
    }
    sourceUrl(url);
    const matching = this.robots.rules.filter(rule => {
      const pattern = rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
      return new RegExp('^' + pattern).test(new URL(url).pathname);
    }).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
    if (matching[0] && !matching[0].allow) throw new Error('Source robots disallows detail access');
  }
  private async attempt(url: string, headers: Record<string, string>, robots: boolean): Promise<{ response: Response; body: string }> {
    this.checkRoute(url, robots);
    const geo = new URL(url).hostname === 'api3.geo.admin.ch';
    await this.pause(geo ? 0 : Math.max(0, this.lastLivitStart + this.robots.delayMs - this.clock.now()));
    if (geo ? this.counts.geo >= this.limits.geo : this.counts.livit >= this.limits.livit || (!robots && this.counts.detail >= this.limits.detail)) throw new Error('HTTP request budget limit reached');
    if (geo) this.counts.geo++;
    else { this.counts.livit++; if (!robots) this.counts.detail++; this.lastLivitStart = this.clock.now(); }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('HTTP timeout')); }, Math.min(this.limits.timeoutMs, this.limits.durationMs - (this.clock.now() - this.startedAt))); });
    try {
      return await Promise.race([timeout, this.readResponse(url, headers, controller.signal)]);
    } finally { clearTimeout(timer); controller.abort(); }
  }
  private async readResponse(url: string, headers: Record<string, string>, signal: AbortSignal) {
    const response = await this.transport(url, {
      headers: { 'User-Agent': 'Domaura/0.1 (local private collection)', ...headers },
      redirect: 'manual', signal,
    });
    const body = await readBoundedBody(response, this.limits.bodyBytes);
    this.checkDeadline();
    return { response, body };
  }
  private async request(url: string, headers: Record<string, string>, robots = false): Promise<HttpResult> {
    let retries = 0; let redirects = 0;
    while (true) {
      let result: { response: Response; body: string };
      try { result = await this.attempt(url, headers, robots); }
      catch (error) {
        if (/size|budget|deadline|robots|invalid/i.test(String(error)) || retries++ >= 1) throw error;
        await this.pause(1000); continue;
      }
      const { response, body } = result;
      if ([401, 403].includes(response.status)) throw new Error('Source access denied');
      const headings = [...body.matchAll(/<(title|h1)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(match => match[2].replace(/<[^>]*>/g, ' ')).join(' ');
      const blockingText = headings || (body.includes('<') ? '' : body);
      if (/just a moment|captcha|access denied|verify (?:that )?you are human|attention required.*cloudflare/i.test(blockingText) || /cf-chl-/i.test(body)) throw new Error('Source challenge detected');
      if (response.status >= 300 && response.status < 400 && response.status !== 304) {
        if (robots || redirects++ >= 2 || !response.headers.get('location')) throw new Error('Unsafe redirect');
        const target = new URL(response.headers.get('location')!, url).href;
        this.checkRoute(target);
        if (sourceUrl(target).url !== sourceUrl(url).url) throw new Error('Unsafe redirect to another variant or identity');
        url = target; continue;
      }
      if (response.status === 429 || response.status >= 500) {
        if (retries++ >= 1) throw new Error(`HTTP ${response.status} retry limit reached`);
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - this.clock.now()) : 1000;
        await this.pause(Number.isFinite(delay) ? Math.max(1000, delay) : 1000); continue;
      }
      return { status: response.status, body, url, etag: response.headers.get('etag') ?? undefined, lastModified: response.headers.get('last-modified') ?? undefined };
    }
  }
  async authorize(policy: Policy): Promise<void> {
    if (policy.use !== 'private-noncommercial' || !/^\d{4}-\d{2}-\d{2}$/.test(policy.reviewedAt) || policy.basisUrl !== 'https://www.livit.ch/de/information/impressum') throw new Error('Unresolved source use policy');
    const response = await this.request('https://www.livit.ch/robots.txt', {}, true);
    if (response.status !== 200) throw new Error('Unresolved robots access');
    this.robots = robotsPolicy(response.body);
    this.authorized = true;
  }
  get(url: string, headers: Record<string, string> = {}): Promise<HttpResult> {
    const work = this.queue.then(async () => {
      if (this.stopped) throw new Error('Access stopped after previous failure');
      if (!this.authorized) throw new Error('Source access policy not checked');
      try { return await this.request(url, headers); }
      catch (error) { this.stopped = true; throw error; }
    });
    this.queue = work.catch(() => {});
    return work;
  }
}
