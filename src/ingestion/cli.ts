import type { Clock, Transport } from './http/client';
import { HttpClient } from './http/client';
import type { Policy } from './http/client';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { sourceUrl, validateManifest } from './livit/candidates';
import { parserVersion } from './livit/parser';
import { collect } from './collection';
import { fetchPage } from './http/cache';
import { verifyAddress } from './geography';
import { addressKey } from './records';
import { reusableGeography } from './geography-cache';
import { Store } from './store';
import { publish } from './publication';
import { offlineFixtures } from './offline';
export type CliEnvironment = { transport?: Transport; clock?: Clock; write?: (message: string) => void };
export async function runCli(args: string[], environment: CliEnvironment = {}): Promise<number> {
  const write = environment.write ?? console.log; let store: Store | undefined;
  try {
    const options = new Map<string, string>(); let offline = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--offline') { offline = true; continue; }
      if (!['--manifest', '--policy', '--data-dir', '--output-dir'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options.has(args[i])) throw new Error('Invalid collector arguments');
      options.set(args[i], args[++i]);
    }
    if (!offline && !options.has('--manifest')) throw new Error('Usage: npm run collect:livit -- --manifest <path> [--policy <path>] [--data-dir <path>] [--output-dir <path>]; or --offline');
    if (offline && (options.has('--manifest') || options.has('--policy'))) throw new Error('Offline fixtures cannot be combined with live manifest/policy inputs');
    const fixtures = offline ? offlineFixtures() : undefined;
    const client = new HttpClient(environment.transport ?? fixtures?.transport, environment.clock ?? fixtures?.clock);
    const now = () => new Date(client.clock.now()).toISOString(); const at = now(); const runId = randomUUID(); const outcomes: Record<string, string> = {};
    const directory = resolve(options.get('--data-dir') ?? '.local-data'); const output = resolve(options.get('--output-dir') ?? 'public/data');
    store = new Store(join(directory, 'livit.sqlite')); const storage = store; storage.prune(at);
    const json = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const result = await publish({ dataset: join(output, 'livit-lugano.json'), status: join(output, 'collection-status.json') }, async previous => {
      const manifest = validateManifest(fixtures?.manifest ?? json(resolve(options.get('--manifest')!)));
      const policy = (fixtures?.policy ?? json(resolve(options.get('--policy') ?? '.local-data/livit-policy.json'))) as Policy;
      await client.authorize(policy);
      const retained = previous?.offers.map(offer => ({ url: offer.source!.url, discoveryEvidence: 'Retained accepted Lugano listing' })) ?? [];
      storage.candidates(validateManifest([...manifest.flatMap(item => item.urls.map(url => ({ url, discoveryEvidence: item.discoveryEvidence }))), ...retained]));
      return collect(manifest, {
        now, check: () => client.checkDeadline(), outcome: (id, value) => { outcomes[id] = value; },
        observation: id => storage.observation(id),
        observe: (id, offer, outcome, time) => storage.observe(id, offer, outcome, time),
        page: async (url, time) => { const page = await fetchPage((url, headers) => client.get(url, headers), url, storage.page(url, time), time, parserVersion); if (page) storage.savePage(sourceUrl(url).id, page); return page; },
        geography: async (offer, time) => {
          const key = offer.address ? addressKey(offer.address) : undefined;
          const cached = key ? reusableGeography(storage.geography(key), offer.address, time) : undefined;
          if (cached) return cached;
          const geography = await verifyAddress(offer.address, (url, headers) => client.get(url, headers), time);
          if (key && geography.verification) storage.saveGeography(key, geography, time); return geography;
        },
      }, previous, runId);
    }, at);
    const summary = result.dataset?.summary ?? { accepted: 0, excluded: 0, unverified: 0, unavailable: 0, stopReason: 'failed' };
    storage.saveRun({ id: runId, mode: offline ? 'offline' : 'live', attemptedAt: at, state: result.status.state, summary, message: result.status.message, outcomes }); storage.prune(now());
    write(`${offline ? 'OFFLINE FIXTURES — ' : ''}${result.status.state}: ${result.status.message}. Requests: ${JSON.stringify(client.counts)}. Output: ${join(output, 'livit-lugano.json')}`);
    return result.exitCode;
  } catch (error) { write(`Collection failed: ${String(error)}`); return 1; }
  finally { store?.close(); }
}
