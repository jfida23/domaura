import type { Knowledge, Locale } from '../../domain/model';
const rules: { language: Locale; positive: RegExp; negative: RegExp }[] = [
  { language: 'it', positive: /\b(?:con|un|due|accesso (?:al|all'))\s*(?:(?:ampio|arioso|grande)\s+)?balcone\b/i, negative: /\b(?:senza|nessun|non (?:ha|dispone di))\s+(?:(?:un|il)\s+)?balcone\b/i },
  { language: 'de', positive: /\bmit\s+(?:(?:einem|grossem|großem)\s+)?balkon\b/i, negative: /\b(?:ohne|kein(?:en)?)\s+(?:einen\s+)?balkon\b/i },
  { language: 'fr', positive: /\bavec\s+(?:un\s+)?balcon\b/i, negative: /\b(?:sans|pas de)\s+(?:un\s+)?balcon\b/i },
  { language: 'en', positive: /\bwith\s+(?:a\s+)?balcony\b/i, negative: /\b(?:without|no)\s+(?:a\s+)?balcony\b/i },
];
export function balconyEvidence(description: string): Knowledge<boolean> {
  const matches: { value: boolean; language: Locale; evidence: string }[] = [];
  for (const sentence of description.split(/(?<=[.!?])\s+/)) {
    for (const rule of rules) {
      const negative = rule.negative.test(sentence);
      if (negative) matches.push({ value: false, language: rule.language, evidence: sentence });
      const remaining = sentence.replace(new RegExp(rule.negative.source, 'gi'), ' ');
      if (rule.language === 'it' && /\bnon\b/i.test(remaining)) continue;
      if (rule.positive.test(remaining)) matches.push({ value: true, language: rule.language, evidence: sentence });
    }
  }
  if (!matches.length) return { status: 'unknown', reason: 'Balcony presence not established by explicit supported source evidence.' };
  if (matches.some(match => match.value !== matches[0].value)) return { status: 'unknown', reason: 'Conflicting balcony evidence in the source description.' };
  return { status: 'known', ...matches[0] };
}
