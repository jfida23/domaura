import { useState } from 'react';
import type { Criterion, Offer } from '../domain/model';
import { offers as fixtures } from '../domain/fixtures';
import { eligibility } from '../domain/eligibility';
import { CriteriaEditor } from './CriteriaEditor';
import { OfferComparison } from './OfferComparison';

function OfferDetails({ offer }: { offer: Offer }) {
  return <>
    <span className="eyebrow">{offer.synthetic ? 'Synthetic example' : 'Source offer'}</span>
    <h3>{offer.title}</h3>
    <p>{offer.areaLabel}</p>
    <p className="evidence">{offer.geography.evidence}</p>
  </>;
}

export function App({ offers = fixtures }: { offers?: Offer[] }) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const eligible = offers.filter(offer => eligibility(offer) === 'eligible');
  const unverified = offers.filter(offer => eligibility(offer) === 'unverified');
  const excluded = offers.filter(offer => eligibility(offer) === 'excluded');
  return <main>
    <header className="masthead"><a href="#">domaura<span> / Lugano</span></a><span className="demo-label">Synthetic data · Local demo</span></header>
    <div className="intro"><p className="eyebrow">A home that fits your life</p><h1>Your needs.<br />A clearer comparison.</h1><p>Compare rentals within Lugano municipality against what matters to you.</p><p className="muted">Demonstration shell. Every offer is invented; no live listings or real addresses are verified.</p></div>
    <CriteriaEditor criteria={criteria} onChange={setCriteria} />
    <section aria-label="Eligible comparison" aria-live="polite">
      <div className="section-heading"><h2>Eligible comparison</h2><span>{eligible.length} synthetic rentals</span></div>
      {!criteria.length && <p className="notice">Define requirements or preferences before viewing fit results.</p>}
      {!eligible.length && <p className="notice">No eligible offers are available for comparison. Only verified in-scope rentals can be compared.</p>}
      <div className="offer-grid">{eligible.map(offer => <article key={offer.id}><OfferDetails offer={offer} />{criteria.length > 0 && <OfferComparison offer={offer} criteria={criteria} />}</article>)}</div>
    </section>
    <div className="scope-grid">
      <section aria-label="Location unverified"><h2>Location unverified</h2><p>Municipal eligibility unknown. These offers cannot enter the comparison.</p>{unverified.map(offer => <article key={offer.id}><OfferDetails offer={offer} /></article>)}</section>
      <section aria-label="Excluded offers"><h2>Excluded offers</h2><p>Sale, unknown transaction type, or outside Lugano municipality.</p>{excluded.map(offer => <article key={offer.id}><OfferDetails offer={offer} /><p>{offer.transaction === 'rental' ? 'Outside municipality' : `Transaction: ${offer.transaction}`}</p></article>)}</section>
    </div>
    <footer>Domaura / A local comparison experiment. Synthetic declarations are not verification of real locations.</footer>
  </main>;
}
