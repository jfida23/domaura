import type { Geography, Offer } from '../domain/model';
import type { CachedPage, Candidate, Dataset } from './types';
import { randomUUID } from 'node:crypto';
import { eligibility } from '../domain/eligibility';
import { validateManifest, sourceUrl } from './livit/candidates';
import { listingWithdrawn, parseListing } from './livit/parser';
import { validateDataset } from './records';
export type CollectionServices = {
  now(): string; check(): void;
  page(url: string, at: string): Promise<CachedPage | null>;
  geography(offer: Offer, at: string): Promise<Geography>;
  observe?(id: string, offer: Offer | undefined, outcome: 'present' | 'unavailable' | 'check-failed', at: string): void;
  observation?(id: string): Offer | undefined;
  outcome?(id: string, value: string): void;
};
export async function collect(candidates: Candidate[], services: CollectionServices, previous?: Dataset, id: string = randomUUID()): Promise<Dataset> {
  const retained = new Map(previous?.offers.map(offer => [offer.source!.id, offer]) ?? []);
  const inputs = [...candidates.flatMap(item => item.urls.map(url => ({ url, discoveryEvidence: item.discoveryEvidence }))), ...[...retained.values()].map(offer => ({ url: offer.source!.url, discoveryEvidence: 'Retained previously accepted Lugano listing' }))];
  const ordered = validateManifest(inputs).sort((a, b) => Number(retained.has(b.id)) - Number(retained.has(a.id)) || a.id.localeCompare(b.id, 'en'));
  const offers: Offer[] = []; const summary = { accepted: 0, excluded: 0, unverified: 0, unavailable: 0, stopReason: 'candidates-exhausted' };
  for (const candidate of ordered) {
    if (offers.length === 20) { summary.stopReason = 'accepted-cap'; break; }
    const at = services.now();
    try {
      services.check();
      const old = retained.get(candidate.id) ?? services.observation?.(candidate.id);
      const fallback = candidate.urls.find(url => url === old?.source?.url && sourceUrl(url).locale !== 'it') ?? candidate.urls.find(url => sourceUrl(url).locale !== 'it');
      let page = await services.page(candidate.urls[0], at);
      if (!page && fallback) page = await services.page(fallback, services.now());
      if (!page || listingWithdrawn(page.body)) {
        summary.unavailable++; services.observe?.(candidate.id, undefined, 'unavailable', at); services.outcome?.(candidate.id, 'unavailable: checked variants no longer advertise this listing'); continue;
      }
      const offer = parseListing(page.body, page.url, page.checkedAt);
      offer.source!.firstObservedAt = old?.source?.firstObservedAt ?? offer.source!.firstObservedAt;
      offer.source!.contentChangedAt = page.changedAt;
      if (offer.property.status === 'residential' && offer.transaction === 'rental') offer.geography = await services.geography(offer, services.now());
      services.check(); services.observe?.(candidate.id, offer, 'present', services.now());
      const outcome = eligibility(offer);
      if (outcome === 'eligible') offers.push(offer);
      else summary[outcome]++;
      services.outcome?.(candidate.id, `${outcome}: ${offer.property.evidence}; ${offer.geography.evidence}`);
    } catch (error) {
      services.observe?.(candidate.id, undefined, 'check-failed', services.now());
      services.outcome?.(candidate.id, `check-failed: ${String(error)}`); throw error;
    }
  }
  services.check(); summary.accepted = offers.length;
  if (offers.length === 20) summary.stopReason = 'accepted-cap';
  return validateDataset({ schemaVersion: 1, id, source: 'livit', generatedAt: services.now(), offers, summary });
}
