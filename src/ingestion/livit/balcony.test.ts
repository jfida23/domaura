// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseListing } from './parser';
import { observedAt } from '../test-support';
const html = readFileSync(new URL('./fixtures/listing-it.html', import.meta.url), 'utf8');
const url = 'https://www.livit.ch/de/mieten/objekt/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const german = html.replaceAll('Tipo di oggetto', 'Objektart').replaceAll('Appartamento</div>', 'Wohnung</div>')
  .replaceAll('Descrizione', 'Beschreibung').replaceAll('Indirizzo', 'Adresse');
it.each([
  ['Appartamento con balcone.', true, 'it'], ['Appartamento senza balcone.', false, 'it'],
  ['Wohnung mit Balkon.', true, 'de'], ['Wohnung ohne Balkon.', false, 'de'],
  ['Appartement avec un balcon.', true, 'fr'], ['Appartement sans balcon.', false, 'fr'],
  ['Apartment with a balcony.', true, 'en'], ['Apartment without a balcony.', false, 'en'],
  ['Appartamento senza un balcone.', false, 'it'], ['Appartamento non dispone di un balcone.', false, 'it'],
  ['Wohnung ohne einen Balkon.', false, 'de'], ['Appartement sans un balcon.', false, 'fr'],
] as const)('uses the explicit original-language evidence %s independently of wrapper locale', (sentence, value, language) => {
  const offer = parseListing(german.replace('Appartamento dimostrativo con balcone.', sentence), url, observedAt);
  expect(offer.source?.pageLocale).toBe('de');
  expect(offer.balcony).toMatchObject({ status: 'known', value, language, evidence: sentence });
});
it.each(['Residence Alpha.', 'Balcone/terrazza/patio', 'Possibilità di balcone.', 'Appartamento con balcone. Appartamento senza balcone.', 'Alcuni appartamenti con balcone, altri senza balcone.', 'Non è garantito un balcone.'])('retains uncertainty for ambiguous or conflicting evidence %s', sentence => {
  expect(parseListing(german.replace('Appartamento dimostrativo con balcone.', sentence), url, observedAt).balcony.status).toBe('unknown');
});
