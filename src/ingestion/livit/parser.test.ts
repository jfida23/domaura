// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseListing } from './parser';
import { observedAt } from '../test-support';

export const italianHtml = readFileSync(new URL('./fixtures/listing-it.html', import.meta.url), 'utf8');
export const listingUrl = 'https://www.livit.ch/it/locatario/obietto/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
it('extracts one residential advert from the detail region with original text', () => {
  const offer = parseListing(italianHtml, listingUrl, observedAt);
  expect(offer.property).toEqual({ status: 'residential', evidence: 'Tipo di oggetto: Appartamento' });
  expect(offer.transaction).toBe('rental');
  expect(offer.address).toEqual({ street: 'Piazza Cioccaro', number: '2', postcode: '6900', locality: 'Lugano' });
  expect(offer.title).toBe('Appartamento dimostrativo');
  expect(offer.source?.description).toEqual({ text: 'Appartamento dimostrativo con balcone.', language: 'it' });
  expect(offer.geography.status).toBe('unknown');
});
it.each(['', '<main><h1>Access denied</h1></main>', '<main><h1>One moment please</h1><form>Contact</form></main>'])('rejects absent detail structure rather than inventing an empty listing', html => {
  expect(() => parseListing(html, listingUrl, observedAt)).toThrow(/detail|structure/i);
});
it('keeps unknown text language instead of inheriting the wrapper', () => {
  const offer = parseListing(italianHtml.replace('Appartamento dimostrativo con balcone.', 'Residence Alpha.'), listingUrl, observedAt);
  expect(offer.source?.description).toEqual({ text: 'Residence Alpha.', language: null });
});
it('excludes contact and related-offer text from the original description', () => {
  const html = italianHtml.replace('</p></div></div>', '</p><form>contact@example.com</form><p>Per un appuntamento contattare example@example.com</p></div></div>');
  expect(parseListing(html, listingUrl, observedAt).source?.description.text).toBe('Appartamento dimostrativo con balcone.');
});
it('omits local phone numbers and email addresses inside nested description elements', () => {
  const html = italianHtml.replace('</p>', '</p><div><span>Contatto: 091 123 45 67; email: contatto@example.ch</span></div>');
  expect(parseListing(html, listingUrl, observedAt).source?.description.text).toBe('Appartamento dimostrativo con balcone.');
});
it('ignores labelled fields inside related listings within main', () => {
  const related = '<aside aria-label="Related listings"><div class="w-full"><div><div class="whitespace-nowrap">Tipo di oggetto</div></div><div>Ufficio</div></div></aside>';
  expect(parseListing(italianHtml.replace('</main>', related + '</main>'), listingUrl, observedAt).property.status).toBe('residential');
});
it('keeps a multi-unit advert as one identity with unknown starting rent', () => {
  const html = italianHtml.replace('Appartamento dimostrativo', 'Appartamenti dimostrativi').replace("CHF 1'530.–", "da CHF 1'530.–");
  const offer = parseListing(html, listingUrl, observedAt);
  expect(offer.id).toBe('livit:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  expect(offer.rent.status).toBe('unknown');
});
it.each([
  { field: 'Via Massagno 32 / Belinda 6900 Lugano', number: '32' },
  { field: 'Via Massagno 34 / Collina 6900 Lugano', number: '34' },
])('extracts a complete street address with a separate building label: $field', ({ field, number }) => {
  const offer = parseListing(italianHtml.replace('Piazza Cioccaro 2 6900 Lugano', field), listingUrl, observedAt);
  expect(offer.address).toEqual({ street: 'Via Massagno', number, postcode: '6900', locality: 'Lugano' });
});
it('does not mistake multiple street addresses for a named building suffix', () => {
  const offer = parseListing(italianHtml.replace('Piazza Cioccaro 2 6900 Lugano', 'Via Esempio 32 / Via Altra 34 6900 Lugano'), listingUrl, observedAt);
  expect(offer.address).toBeUndefined();
});
