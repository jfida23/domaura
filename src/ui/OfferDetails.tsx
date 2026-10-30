import type { Locale, Offer } from '../domain/model';
const languages: Record<Locale, string> = { it: 'Italian', de: 'German', fr: 'French', en: 'English' };
const languageName = (language: Locale | null | undefined) => language ? languages[language] : 'undetermined';
export function OfferDetails({ offer, refreshFailed = false }: { offer: Offer; refreshFailed?: boolean }) {
  const source = offer.source;
  const stale = source && (refreshFailed || source.observation === 'check-failed' || Date.now() - Date.parse(source.lastCheckedAt) > 24 * 60 * 60_000);
  return <>
    <span className="eyebrow">{offer.synthetic ? 'Synthetic example' : 'Livit · Residential rental advert'}</span>
    <h3 lang={source?.title.language ?? undefined}>{offer.title}</h3>
    <p>{offer.areaLabel}</p>
    <p className="evidence">{offer.geography.evidence}</p>
    {source && <div className="source-details">
      <p><a href={source.url} target="_blank" rel="noopener noreferrer">View on Livit</a></p>
      <p className="evidence">Last successful source check: <time dateTime={source.lastCheckedAt}>{new Date(source.lastCheckedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time></p>
      {stale && <p className="notice stale">Stale observation — {refreshFailed || source.observation === 'check-failed' ? 'the latest refresh failed.' : 'last checked more than 24 hours ago.'}</p>}
      <p className="evidence">Page locale: {languageName(source.pageLocale)}</p>
      <p className="evidence">Title language: {languageName(source.title.language)}</p>
      <p>Base rent: {offer.rent.status === 'known' ? `${offer.rent.value.amount} ${offer.rent.value.currency} / ${offer.rent.value.period}` : `Unknown — ${offer.rent.reason}`}</p>
      {offer.rent.status === 'known' && <p className="evidence">Rent evidence · {languageName(offer.rent.language)}: <span lang={offer.rent.language ?? undefined}>{offer.rent.evidence}</span></p>}
      <p className="evidence">{offer.balcony.status === 'known' ? <>Balcony evidence · {languageName(offer.balcony.language)}: <span lang={offer.balcony.language ?? undefined}>{offer.balcony.evidence}</span></> : `Balcony unknown — ${offer.balcony.reason}`}</p>
      <details><summary>Original description</summary>
        <p className="evidence">Description language: {languageName(source.description.language)}</p>
        <p lang={source.description.language ?? undefined}>{source.description.text}</p>
      </details>
      {offer.geography.verification && <p className="evidence"><a href={offer.geography.verification.url} target="_blank" rel="noopener noreferrer">Official GWR location evidence</a> · BFS {offer.geography.verification.municipalityId}. Availability and advertised features are not independently verified.</p>}
    </div>}
  </>;
}
