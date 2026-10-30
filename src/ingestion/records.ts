import type { Dataset } from './types';
import type { Address, Knowledge, Cost } from '../domain/model';
import { eligibility } from '../domain/eligibility';
import { sourceUrl } from './livit/candidates';
import { officialResource } from './official-url';

export function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 100_000;
const language = (value: unknown) => value === null || ['it', 'de', 'fr', 'en'].includes(value as string);
export const addressKey = (address: Address) => [address.street, address.number, address.postcode].map(value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()).join('|');
function validKnowledge<T>(value: Knowledge<T>, valid: (item: T) => boolean): boolean {
  if (!value) return false;
  if (value.status === 'unknown') return text(value.reason);
  return value.status === 'known' && text(value.evidence) && valid(value.value) && (value.language === undefined || language(value.language));
}
const validCost = (cost: Cost) => Boolean(cost) && Number.isFinite(cost.amount) && cost.amount >= 0 && /^[A-Z]{3}$/.test(cost.currency)
  && ['month', 'year'].includes(cost.period) && ['base-rent', 'total-cost'].includes(cost.measure);

export function validateDataset(value: unknown): Dataset {
  try {
    const data = value as Dataset;
    if (data.schemaVersion !== 1 || data.source !== 'livit' || !text(data.id) || !isTimestamp(data.generatedAt)
      || !Array.isArray(data.offers) || data.offers.length > 20 || data.summary.accepted !== data.offers.length) throw new Error();
    for (const count of ['accepted', 'excluded', 'unverified', 'unavailable'] as const) {
      if (!Number.isInteger(data.summary[count]) || data.summary[count] < 0) throw new Error();
    }
    if (!text(data.summary.stopReason)) throw new Error();
    const ids = new Set<string>();
    for (const offer of data.offers) {
      const source = offer.source;
      const verification = offer.geography.verification;
      if (!source || source.key !== 'livit' || !/^[a-zA-Z0-9.-]+$/.test(source.id) || offer.id !== `livit:${source.id}`
        || ids.has(offer.id) || offer.synthetic !== false || eligibility(offer) !== 'eligible' || !text(offer.title) || !text(source.parserVersion)
        || !['it', 'de', 'fr', 'en'].includes(source.pageLocale)) throw new Error();
      const identity = sourceUrl(source.url);
      if (identity.id !== source.id || identity.locale !== source.pageLocale || offer.sourceReference !== source.url) throw new Error();
      if (!['present', 'check-failed'].includes(source.observation)) throw new Error();
      for (const key of ['firstObservedAt', 'lastCheckedAt', 'lastAttemptAt', 'contentChangedAt'] as const) {
        if (!isTimestamp(source[key])) throw new Error();
      }
      if (Date.parse(source.lastCheckedAt) > Date.parse(source.lastAttemptAt) || Date.parse(source.firstObservedAt) > Date.parse(source.lastCheckedAt)
        || Date.parse(source.lastCheckedAt) > Date.parse(data.generatedAt) || Date.parse(source.contentChangedAt) > Date.parse(source.lastCheckedAt)) throw new Error();
      for (const original of [source.title, source.description]) {
        if (!original || typeof original.text !== 'string' || original.text.length > 100_000 || !language(original.language)) throw new Error();
      }
      if (source.title.text !== offer.title || !validKnowledge(offer.rent, validCost) || !validKnowledge(offer.balcony, item => typeof item === 'boolean')) throw new Error();
      if (offer.costs && !Object.values(offer.costs).every(cost => validKnowledge(cost, validCost))) throw new Error();
      if (!verification || verification.municipalityId !== 5192 || offer.geography.basis !== 'municipality-id'
        || !offer.address || addressKey(offer.address) !== addressKey(verification.address) || !text(verification.featureId) || !text(verification.egid)
        || !isTimestamp(verification.verifiedAt) || Date.parse(verification.verifiedAt) > Date.parse(data.generatedAt)
        || Date.parse(data.generatedAt) - Date.parse(verification.verifiedAt) > 7 * 86400_000) throw new Error();
      const official = new URL(verification.url);
      if (!officialResource(verification.url) || official.pathname.split('/').at(-1) !== verification.featureId) throw new Error();
      ids.add(offer.id);
    }
    return data;
  } catch {
    throw new Error('Invalid collected dataset: schema, evidence, identity or eligibility constraints failed');
  }
}
