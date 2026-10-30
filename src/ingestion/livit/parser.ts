import { load } from 'cheerio';
import type { Locale, Offer } from '../../domain/model';
import { sourceUrl } from './candidates';
import { parseCost } from './prices';
import { labels, propertyStatus } from './labels';
import { balconyEvidence } from './features';
export const parserVersion = '2';
export const unknown = (reason: string) => ({ status: 'unknown' as const, reason });
export const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();
const redactContactText = (text: string) => text
  .replace(/[\w.+-]+@[\w.-]+/g, '')
  .replace(/(?:\+|00)\d[\d .()/-]{7,}/g, '')
  .replace(/\b0\d{2}(?:[\s()./-]?\d{3})(?:[\s()./-]?\d{2}){2}\b/g, '');
export function listingWithdrawn(html: string): boolean {
  const $ = load(html);
  const title = cleanText($('main h1').first().text()).toLowerCase();
  return ['questo oggetto non è più disponibile', 'dieses objekt ist nicht mehr verfügbar', 'cet objet n’est plus disponible', 'this property is no longer available'].includes(title);
}
export function textLanguage(text: string, declared?: string): Locale | null {
  if (declared && ['it', 'de', 'fr', 'en'].includes(declared)) return declared as Locale;
  if (/\b(appartamento|appartamenti|balcone)\b/i.test(text)) return 'it';
  if (/\b(wohnung|balkon)\b/i.test(text)) return 'de';
  if (/\b(appartement|balcon)\b/i.test(text)) return 'fr';
  if (/\b(apartment|balcony)\b/i.test(text)) return 'en';
  return null;
}
export function parseListing(html: string, url: string, at: string): Offer {
  const identity = sourceUrl(url);
  const vocabulary = labels[identity.locale];
  const $ = load(html);
  const main = $('main').first();
  const fields = new Map<string, string>();
  main.find('div.whitespace-nowrap').each((_i, element) => {
    if ($(element).closest('aside,form,nav,[aria-label="Related listings"]').length) return;
    const row = $(element).closest('div.w-full');
    if (!row.parent().children('h2').length) return;
    const key = cleanText($(element).text());
    const value = cleanText(row.children('div').last().text());
    fields.set(key, fields.has(key) && fields.get(key) !== value ? 'Conflicting source fields' : value);
  });
  const title = cleanText(main.find('h1').first().text());
  const descriptionHeading = main.find('h2').filter((_i, el) => cleanText($(el).text()) === vocabulary.description).first();
  const descriptionElement = descriptionHeading.parent().find('.rich-text').first();
  if (!title || !fields.size || !descriptionHeading.length || !descriptionElement.length) throw new Error('Missing Livit detail structure');
  const original = descriptionElement.clone();
  original.find('script,style,form,iframe').remove();
  original.find('p,li,br').prepend(' ');
  const description = cleanText(redactContactText(original.text()));
  const property = fields.get(vocabulary.property) ?? '';
  const addressText = fields.get(vocabulary.address) ?? '';
  const addressMatch = /^(.*?)\s+(\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?)(?:\s+\/\s+[\p{L}][\p{L}'’ .-]*)?\s+(\d{4})\s+(.+)$/u.exec(addressText);
  const address = addressMatch && !addressMatch[1].includes('/') ? { street: addressMatch[1], number: addressMatch[2], postcode: addressMatch[3], locality: addressMatch[4] } : undefined;
  const cost = (key: 'net' | 'charges' | 'gross') => {
    const result = parseCost(fields.get(vocabulary[key]), key === 'net' ? 'base-rent' : 'total-cost', identity.locale);
    if (result.status !== 'known') return result;
    for (const words of Object.values(labels)) {
      const escaped = words[key].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const match of description.matchAll(new RegExp(`${escaped}\\s*:?\\s*([A-Z]{3}\\s+[\\d'’., –-]+)`, 'gi'))) {
        const stated = parseCost(match[1].trim().replace(/\.$/, ''), result.value.measure, identity.locale);
        if (stated.status === 'known' && (stated.value.amount !== result.value.amount || stated.value.currency !== result.value.currency)) return unknown(`Conflicting ${key} rent evidence: ${result.evidence}; ${match[0]}`);
      }
    }
    return result;
  };
  const costs = { net: cost('net'), charges: cost('charges'), gross: cost('gross') };
  return {
    id: `livit:${identity.id}`, title, synthetic: false, sourceReference: identity.url,
    property: { status: propertyStatus(property), evidence: `${vocabulary.property}: ${property}` },
    transaction: 'rental', address, areaLabel: address ? `${address.postcode} ${address.locality}` : addressText,
    geography: { status: 'unknown', basis: 'none', evidence: 'Official municipal verification pending.' },
    rent: costs.net, costs, balcony: balconyEvidence(description),
    source: { key: 'livit', id: identity.id, url: identity.url, parserVersion, pageLocale: identity.locale,
      title: { text: title, language: textLanguage(title, main.find('h1').attr('lang')) },
      description: { text: description, language: textLanguage(description, descriptionElement.attr('lang')) },
      firstObservedAt: at, lastCheckedAt: at, lastAttemptAt: at, contentChangedAt: at, observation: 'present',
    },
  };
}
