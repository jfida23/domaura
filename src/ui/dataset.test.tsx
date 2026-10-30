import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useCollectedDataset } from './dataset';
import type { Fetcher } from './dataset';
import { exampleDataset } from '../ingestion/test-support';
afterEach(cleanup);
function Probe({ fetcher }: { fetcher: Fetcher }) { const result = useCollectedDataset(fetcher); return <p>{result.state}:{result.dataset?.offers.length ?? 'none'}</p>; }
it('keeps a pending dataset visibly loading without injecting synthetic offers', () => {
  render(<Probe fetcher={async () => new Promise(() => {})} />); expect(screen.getByText('loading:none')).toBeTruthy();
});
it('applies failure status only to its matching dataset and a later attempt', async () => {
  const data = exampleDataset();
  const fetchFor = (id: string): Fetcher => async url => Response.json(String(url).endsWith('collection-status.json') ? { datasetId: id, attemptedAt: '2026-10-28T13:00:00Z', state: 'failed', message: 'Service outage' } : data);
  const matching = fetchFor(data.id); const old = fetchFor('old-dataset');
  function StatusProbe({ id }: { id: string }) {
    const result = useCollectedDataset(id === data.id ? matching : old);
    return <p>{result.status?.state ?? result.state}</p>;
  }
  const first = render(<StatusProbe id={data.id} />); await waitFor(() => expect(screen.getByText('failed')).toBeTruthy()); first.unmount();
  render(<StatusProbe id="old-dataset" />); await waitFor(() => expect(screen.getByText('ready')).toBeTruthy()); expect(screen.queryByText('failed')).toBeNull();
});
it.each([
  { response: () => Response.json(exampleDataset([])), state: 'ready:0' },
  { response: () => Response.json(exampleDataset()), state: 'ready:1' },
  { response: () => new Response('', { status: 404 }), state: 'missing:none' },
  { response: () => Response.json({ offers: [] }), state: 'error:none' },
  { response: () => Response.json({ ...exampleDataset(), offers: [{ ...exampleDataset().offers[0], property: { status: 'non-residential', evidence: 'Parking' } }] }), state: 'error:none' },
])('validates and distinguishes a dataset: $state', async ({ response, state }) => {
  render(<Probe fetcher={async url => String(url).endsWith('collection-status.json') ? new Response('', { status: 404 }) : response()} />);
  await waitFor(() => expect(screen.getByText(state)).toBeTruthy());
});
