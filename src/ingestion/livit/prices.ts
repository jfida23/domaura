import type { Cost, Knowledge, Locale } from '../../domain/model';
export function parseCost(raw: string | undefined, measure: Cost['measure'], language: Locale): Knowledge<Cost> {
  if (!raw) return { status: 'unknown', reason: 'Exact cost not supplied.' };
  const match = /^([A-Z]{3})\s+((?:\d{1,3}(?:['’ ]\d{3})+|\d+)(?:[.,]\d{1,2}|\.[–-]|[–-])?)$/.exec(raw.trim());
  if (!match) return { status: 'unknown', reason: `Ambiguous or unsupported exact cost: ${raw}` };
  const amount = Number(match[2].replace(/['’ ]/g, '').replace(/\.?[–-]$/, '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return { status: 'unknown', reason: `Ambiguous or unsupported exact cost: ${raw}` };
  return { status: 'known', value: { amount, currency: match[1], period: 'month', measure }, evidence: raw, language };
}
