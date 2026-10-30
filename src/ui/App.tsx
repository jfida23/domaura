import { useState } from 'react';
import type { Criterion, Offer } from '../domain/model';
import { offers as fixtures } from '../domain/fixtures';
import { eligibility } from '../domain/eligibility';
import { CriteriaEditor } from './CriteriaEditor';
import { OfferComparison } from './OfferComparison';
import { useCollectedDataset } from './dataset';
import type { Fetcher } from './dataset';
import { OfferDetails } from './OfferDetails';

export function App({ offers: injectedOffers, initialMode = 'collected', fetcher }: { offers?: Offer[]; initialMode?: 'demo' | 'collected'; fetcher?: Fetcher }) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [mode, setMode] = useState(initialMode);
  const demo = mode === 'demo';
  const collectedOffers = initialMode === 'collected' ? injectedOffers : undefined;
  const demoOffers = initialMode === 'demo' ? injectedOffers : undefined;
  const collection = useCollectedDataset(fetcher, !demo && collectedOffers === undefined);
  const offers = demo ? demoOffers ?? fixtures : collectedOffers ?? collection.dataset?.offers ?? [];
  const refreshFailed = !demo && collection.status?.state === 'failed';
  const eligible = offers.filter(offer => eligibility(offer) === 'eligible');
  const unverified = offers.filter(offer => eligibility(offer) === 'unverified');
  const excluded = offers.filter(offer => eligibility(offer) === 'excluded');
  return <main>
    <header className="masthead"><a href="#">domaura<span> / Lugano</span></a><span className="demo-label">{demo ? 'Synthetic data · Local demo' : 'Livit · Local collection'}</span></header>
    <nav className="dataset-modes" aria-label="Data selection">
      <button type="button" className={!demo ? '' : 'secondary'} aria-pressed={!demo} onClick={() => setMode('collected')}>Collected listings</button>
      <button type="button" className={demo ? '' : 'secondary'} aria-pressed={demo} onClick={() => setMode('demo')}>Demo examples</button>
    </nav>
    <div className="intro"><p className="eyebrow">A home that fits your life</p><h1>Your needs.<br />A clearer comparison.</h1><p>Compare rentals within Lugano municipality against what matters to you.</p><p className="muted">{demo ? 'Demonstration shell. Every offer is invented; no live listings or real addresses are verified.' : 'A small, manually refreshed collection of residential rental adverts.'}</p></div>
    <CriteriaEditor criteria={criteria} onChange={setCriteria} />
    {!demo && collectedOffers === undefined && <div aria-live="polite">
      {collection.state === 'loading' && <p className="notice">Loading collected listings…</p>}
      {(collection.state === 'missing' || collection.state === 'error') && <p className="notice" role="status">Collected data is unavailable. {collection.message}</p>}
      {collection.state === 'ready' && !offers.length && <p className="notice">No eligible collected offers are available.</p>}
      {refreshFailed && <p className="notice" role="status">Last refresh failed. Showing the previous successful collection. {collection.status?.message}</p>}
    </div>}
    <section aria-label="Eligible comparison" aria-live="polite">
      <div className="section-heading"><h2>Eligible comparison</h2><span>{eligible.length} {demo ? 'synthetic' : 'collected'} rentals</span></div>
      {!criteria.length && <p className="notice">Define requirements or preferences before viewing fit results.</p>}
      {demo && !eligible.length && <p className="notice">No eligible offers are available for comparison. Only verified in-scope rentals can be compared.</p>}
      <div className="offer-grid">{eligible.map(offer => <article key={offer.id}><OfferDetails offer={offer} refreshFailed={refreshFailed} />{criteria.length > 0 && <OfferComparison offer={offer} criteria={criteria} />}</article>)}</div>
    </section>
    {demo && <div className="scope-grid">
      <section aria-label="Location unverified"><h2>Location unverified</h2><p>Municipal eligibility unknown. These offers cannot enter the comparison.</p>{unverified.map(offer => <article key={offer.id}><OfferDetails offer={offer} /></article>)}</section>
      <section aria-label="Excluded offers"><h2>Excluded offers</h2><p>Sale, unknown transaction type, or outside Lugano municipality.</p>{excluded.map(offer => <article key={offer.id}><OfferDetails offer={offer} /><p>{offer.transaction === 'rental' ? 'Outside municipality' : `Transaction: ${offer.transaction}`}</p></article>)}</section>
    </div>}
    <footer>Domaura / A local comparison experiment. {demo ? 'Synthetic declarations are not verification of real locations.' : 'Private local source observations; this collection is not the complete market.'}</footer>
  </main>;
}
