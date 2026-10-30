import type { Dataset, CollectionStatus } from '../ingestion/types';
import { useEffect, useState } from 'react';
import { isTimestamp, validateDataset } from '../ingestion/records';
export type DatasetState = { state: 'loading' | 'missing' | 'error' | 'ready'; dataset?: Dataset; status?: CollectionStatus; message?: string };
export type Fetcher = typeof fetch;
export function useCollectedDataset(fetcher: Fetcher = fetch, enabled = true): DatasetState {
  const [result, setResult] = useState<DatasetState>({ state: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController(); let cancelled = false;
    setResult({ state: 'loading' });
    void (async () => {
      try {
        const response = await fetcher('/data/livit-lugano.json', { cache: 'no-store', signal: controller.signal });
        if (cancelled) return;
        if (response.status === 404) { setResult({ state: 'missing', message: 'No local collection is available yet.' }); return; }
        if (!response.ok) throw new Error(`Local dataset HTTP ${response.status}`);
        const dataset = validateDataset(await response.json());
        if (!cancelled) setResult({ state: 'ready', dataset });
        try {
          const statusResponse = await fetcher('/data/collection-status.json', { cache: 'no-store', signal: controller.signal });
          if (!statusResponse.ok) return;
          const status = await statusResponse.json() as CollectionStatus;
          if (status && status.datasetId === dataset.id && isTimestamp(status.attemptedAt) && Date.parse(status.attemptedAt) >= Date.parse(dataset.generatedAt) && ['success', 'failed'].includes(status.state) && typeof status.message === 'string' && status.message.length <= 2000 && !cancelled) setResult({ state: 'ready', dataset, status });
        } catch { /* The valid dataset remains usable when optional status is absent. */ }
      } catch { if (!cancelled) setResult({ state: 'error', message: 'The local dataset could not be loaded or did not pass validation.' }); }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [fetcher, enabled]);
  return result;
}
