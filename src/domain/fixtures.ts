import type { Offer } from './model';

// Entirely invented examples. These declarations do not verify real addresses.
export const offers: Offer[] = [
  {
    id: 'garden', title: 'Garden apartment', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'rental', areaLabel: 'Lugano · synthetic example',
    geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: inside Lugano municipality; no real address verified.' },
    rent: { status: 'known', value: { amount: 1800, currency: 'CHF', period: 'month', measure: 'base-rent' }, evidence: 'Synthetic monthly base rent; additional charges unknown.' },
    balcony: { status: 'known', value: true, evidence: 'Synthetic offer explicitly includes a balcony.' },
  },
  {
    id: 'courtyard', title: 'Courtyard studio', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'rental', areaLabel: 'Lugano · synthetic example',
    geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: inside Lugano municipality; no real address verified.' },
    rent: { status: 'known', value: { amount: 1400, currency: 'CHF', period: 'month', measure: 'base-rent' }, evidence: 'Synthetic monthly base rent; additional charges unknown.' },
    balcony: { status: 'known', value: false, evidence: 'Synthetic offer explicitly has no balcony.' },
  },
  {
    id: 'hillside', title: 'Hillside flat', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'rental', areaLabel: 'Lugano · synthetic example',
    geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: inside Lugano municipality; no real address verified.' },
    rent: { status: 'unknown', reason: 'Monthly base rent not supplied in this synthetic offer.' },
    balcony: { status: 'unknown', reason: 'Balcony presence not supplied in this synthetic offer.' },
  },
  {
    id: 'imprecise', title: 'Lugano area apartment', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'rental', areaLabel: 'Lugano area · synthetic example',
    geography: { status: 'unknown', basis: 'area-label', evidence: 'Only a Lugano area label; municipal membership is unknown.' },
    rent: { status: 'unknown', reason: 'Not supplied' }, balcony: { status: 'unknown', reason: 'Not supplied' },
  },
  {
    id: 'outside', title: 'Surrounding municipality apartment', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'rental', areaLabel: 'Lugano area · synthetic example',
    geography: { status: 'outside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: outside Lugano municipality.' },
    rent: { status: 'unknown', reason: 'Not supplied' }, balcony: { status: 'unknown', reason: 'Not supplied' },
  },
  {
    id: 'sale', title: 'Apartment for sale', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'sale', areaLabel: 'Lugano · synthetic example',
    geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: inside Lugano municipality.' },
    rent: { status: 'unknown', reason: 'Sale offer, not a rental' }, balcony: { status: 'unknown', reason: 'Not supplied' },
  },
  {
    id: 'unclassified', title: 'Unclassified offer', synthetic: true, sourceReference: null,
    property: { status: 'residential', evidence: 'Synthetic housing declaration' },
    transaction: 'unknown', areaLabel: 'Lugano · synthetic example',
    geography: { status: 'inside', basis: 'synthetic-declaration', evidence: 'Synthetic declaration: inside Lugano municipality.' },
    rent: { status: 'unknown', reason: 'Not supplied' }, balcony: { status: 'unknown', reason: 'Not supplied' },
  },
];
