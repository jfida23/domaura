// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateDataset } from './records';
import { exampleDataset } from './test-support';

describe('collected dataset contract', () => {
  it('accepts evidence with independent source-text languages', () => {
    const data = exampleDataset();
    data.offers[0].source!.pageLocale = 'de';
    data.offers[0].source!.url = data.offers[0].source!.url.replace('/it/locatario/obietto/', '/de/mieten/objekt/');
    data.offers[0].sourceReference = data.offers[0].source!.url;
    expect(validateDataset(data).offers[0].source?.description).toEqual({ text: 'Appartamento di prova con balcone.', language: 'it' });
  });
  it.each(['cap', 'duplicate', 'residential', 'source', 'municipality', 'language', 'timestamp', 'rent', 'evidence', 'address'])(
    'rejects invalid %s data before it enters the application', kind => {
      const data = exampleDataset();
      const offer = data.offers[0];
      if (kind === 'cap') data.offers = Array.from({ length: 21 }, () => offer);
      if (kind === 'duplicate') data.offers.push(offer);
      if (kind === 'residential') offer.property.status = 'unknown';
      if (kind === 'source') offer.source!.url = 'https://attacker.example/listing';
      if (kind === 'municipality') offer.geography.verification!.municipalityId = 5210;
      if (kind === 'language') (offer.source!.description as { language: string | null }).language = 'invented';
      if (kind === 'timestamp') offer.source!.lastCheckedAt = 'yesterday';
      if (kind === 'rent') if (offer.rent.status === 'known') offer.rent.value.amount = -1;
      if (kind === 'evidence') offer.property.evidence = '';
      if (kind === 'address') offer.geography.verification!.address = { ...offer.address!, number: '99' };
      expect(() => validateDataset(data)).toThrow(/invalid/i);
    });
  it.each(['page-locale', 'official-credentials', 'official-feature', 'future-geography', 'future-check', 'future-content', 'cost-breakdown', 'synthetic-type'])(
    'rejects inconsistent provenance: %s', kind => {
      const data = exampleDataset(); const offer = data.offers[0]; const source = offer.source!; const verification = offer.geography.verification!;
      const future = new Date(Date.parse(data.generatedAt) + 86400_000).toISOString();
      if (kind === 'page-locale') source.pageLocale = 'de';
      if (kind === 'official-credentials') verification.url = verification.url.replace('https://', 'https://user:password@');
      if (kind === 'official-feature') verification.url = verification.url.replace('11140513_0', '999_0');
      if (kind === 'future-geography') verification.verifiedAt = future;
      if (kind === 'future-check') source.lastCheckedAt = source.lastAttemptAt = future;
      if (kind === 'future-content') source.contentChangedAt = future;
      if (kind === 'cost-breakdown') offer.costs = { net: offer.rent, charges: { status: 'known', value: { amount: -100, currency: 'CHF', period: 'month', measure: 'total-cost' }, evidence: 'Invalid charges' }, gross: offer.rent };
      if (kind === 'synthetic-type') (offer as unknown as { synthetic?: boolean }).synthetic = undefined;
      expect(() => validateDataset(data)).toThrow(/invalid/i);
    });
});
