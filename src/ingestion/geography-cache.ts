import type { Address, Geography } from '../domain/model';
import { addressKey } from './records';
export const geographyTtlMs = 7 * 24 * 60 * 60_000;
export function reusableGeography(cached: Geography | undefined, address: Address | undefined, at: string): Geography | undefined {
  const evidence = cached?.verification;
  if (!address || !evidence || cached?.basis !== 'municipality-id' || addressKey(evidence.address) !== addressKey(address)) return undefined;
  const age = Date.parse(at) - Date.parse(evidence.verifiedAt);
  return age >= 0 && age <= geographyTtlMs ? cached : undefined;
}
