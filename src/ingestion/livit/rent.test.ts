// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseListing } from './parser';
import { observedAt } from '../test-support';
const html = readFileSync(new URL('./fixtures/listing-it.html', import.meta.url), 'utf8');
const url = 'https://www.livit.ch/it/locatario/obietto/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
it('keeps net, charges and gross rent separate instead of comparing the total as base rent', () => {
  const offer = parseListing(html, url, observedAt);
  expect(offer.rent).toMatchObject({ status: 'known', value: { amount: 1530, currency: 'CHF', period: 'month', measure: 'base-rent' } });
  expect(offer.costs?.charges).toMatchObject({ status: 'known', value: { amount: 150 } });
  expect(offer.costs?.gross).toMatchObject({ status: 'known', value: { amount: 1680, measure: 'total-cost' } });
});
it.each([
  ['de', 'Objektart', 'Wohnung', 'Nettomiete', 'Nebenkosten', 'Bruttomiete', 'Adresse', 'Beschreibung'],
  ['fr', "Type d'objet", 'Appartement', 'Loyer net', 'Frais accessoires', 'Loyer brut', 'Adresse', 'Description'],
  ['en', 'Category / Type', 'Apartment', 'Net rent', 'Extra charges', 'Gross rent', 'Address', 'Description'],
] as const)('normalizes supported %s labels into the same cost meaning', (locale, propertyLabel, category, net, charges, gross, address, description) => {
  const localized = html.replaceAll('Tipo di oggetto', propertyLabel).replaceAll('Appartamento</div>', `${category}</div>`)
    .replaceAll('Canone netto', net).replaceAll('Spese accessorie', charges).replaceAll('Canone lordo', gross)
    .replaceAll('Indirizzo', address).replaceAll('Descrizione', description);
  const paths = { de: 'de/mieten/objekt', fr: 'fr/locataire/objet', en: 'en/renting/object' };
  const offer = parseListing(localized, `https://www.livit.ch/${paths[locale]}/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, observedAt);
  expect(offer.rent).toMatchObject({ status: 'known', value: { amount: 1530, measure: 'base-rent' } });
  expect(offer.property.status).toBe('residential');
});
it('keeps conflicting net-rent evidence unknown', () => {
  const conflicting = html.replace('Appartamento dimostrativo con balcone.', "Canone netto CHF 1'600.– al mese.");
  expect(parseListing(conflicting, url, observedAt).rent).toMatchObject({ status: 'unknown', reason: expect.stringMatching(/conflict/i) });
});
it('rejects ambiguous decimal formats rather than changing their magnitude', () => {
  expect(parseListing(html.replace("1'530.–", '1.530'), url, observedAt).rent.status).toBe('unknown');
});
it.each(['CHF -50', "da CHF 1'530.–", 'CHF 1,530', 'CHF 1.530,50', 'CHF 1500 per year'])('keeps non-exact or unsupported price %s unknown', price => {
  expect(parseListing(html.replace("CHF 1'530.–", price), url, observedAt).rent.status).toBe('unknown');
});
it('does not infer base rent from gross rent and charges', () => {
  expect(parseListing(html.replaceAll('Canone netto', 'Unrecognized field'), url, observedAt).rent.status).toBe('unknown');
});
