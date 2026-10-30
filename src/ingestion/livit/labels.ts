import type { Locale } from '../../domain/model';

export const labels: Record<Locale, { property: string; net: string; charges: string; gross: string; address: string; description: string }> = {
  it: { property: 'Tipo di oggetto', net: 'Canone netto', charges: 'Spese accessorie', gross: 'Canone lordo', address: 'Indirizzo', description: 'Descrizione' },
  de: { property: 'Objektart', net: 'Nettomiete', charges: 'Nebenkosten', gross: 'Bruttomiete', address: 'Adresse', description: 'Beschreibung' },
  fr: { property: "Type d'objet", net: 'Loyer net', charges: 'Frais accessoires', gross: 'Loyer brut', address: 'Adresse', description: 'Description' },
  en: { property: 'Category / Type', net: 'Net rent', charges: 'Extra charges', gross: 'Gross rent', address: 'Address', description: 'Description' },
};
const residential = new Set(['Appartamento', 'Casa', 'Camera', 'Monolocale', 'Wohnung', 'Haus', 'Einfamilienhaus', 'Zimmer', 'Studio', 'Attikawohnung', 'Dachwohnung', 'Maisonette / Duplex', 'Möbl. Wohnobj.', 'Appartement', 'Maison', 'Chambre', 'Apartment', 'House', 'Room']);
const nonResidential = new Set(['Parcheggio', 'Posteggio', 'Ufficio', 'Magazzino', 'Tiefgarage', 'Moto Hallenplatz', 'Parkplatz', 'Büro', 'Gewerbe', 'Lager', 'Place de parc', 'Bureau', 'Dépôt', 'Parking', 'Office', 'Storage']);
export function propertyStatus(value: string): 'residential' | 'non-residential' | 'unknown' {
  if (residential.has(value)) return 'residential';
  if (nonResidential.has(value)) return 'non-residential';
  return 'unknown';
}
