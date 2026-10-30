// Sanitized fictional acceptance data, never a claim about live inventory.
import type { Offer } from '../domain/model';
import type { Dataset } from './types';

export const observedAt = '2026-10-28T12:00:00.000Z';
export function exampleOffer(id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'): Offer {
  const address = { street: 'Piazza Cioccaro', number: '2', postcode: '6900', locality: 'Lugano' };
  return {
    id: `livit:${id}`, title: 'Appartamento di prova', synthetic: false,
    property: { status: 'residential', evidence: 'Appartamento' }, transaction: 'rental',
    sourceReference: `https://www.livit.ch/it/locatario/obietto/${id}`, areaLabel: '6900 Lugano', address,
    geography: { status: 'inside', basis: 'municipality-id', evidence: 'Sanitized official-address example: Lugano 5192', verification: {
      featureId: '11140513_0', egid: '11140513', url: 'https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/11140513_0',
      municipalityId: 5192, municipalityName: 'Lugano', address, exportDate: '2026-10-27', verifiedAt: observedAt,
    } },
    rent: { status: 'known', value: { amount: 1530, currency: 'CHF', period: 'month', measure: 'base-rent' }, evidence: "Canone netto CHF 1'530.–", language: 'it' },
    balcony: { status: 'known', value: true, evidence: 'Camera con balcone.', language: 'it' },
    source: { key: 'livit', id, url: `https://www.livit.ch/it/locatario/obietto/${id}`, parserVersion: '1', pageLocale: 'it',
      title: { text: 'Appartamento di prova', language: 'it' }, description: { text: 'Appartamento di prova con balcone.', language: 'it' },
      firstObservedAt: observedAt, lastCheckedAt: observedAt, lastAttemptAt: observedAt, contentChangedAt: observedAt, observation: 'present',
    },
  };
}
export function exampleDataset(offers = [exampleOffer()]): Dataset {
  return { schemaVersion: 1, id: 'fixture-run', source: 'livit', generatedAt: observedAt, offers,
    summary: { accepted: offers.length, excluded: 0, unverified: 0, unavailable: 0, stopReason: 'manifest-exhausted' } };
}
