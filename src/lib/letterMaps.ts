/**
 * Sealed token maps for the cached (pre-run) appeal letters.
 * The live pipeline derives this map organically from the PII Shield —
 * here we derive deterministically from the scenario corpus so the
 * demo letter re-hydrates byte-for-byte.
 */
import { SCENARIOS } from './scenarios';

export interface TokenPair {
  token: string;
  value: string;
}

export const LETTER_MAPS: Record<string, TokenPair[]> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s.pii.map((p) => ({ token: p.token, value: p.value }))]),
);

export function rehydrateLetter(letter: string, scenarioId: string): string {
  let out = letter;
  const map = LETTER_MAPS[scenarioId] ?? [];
  // Longest tokens first so [AADHAAR_1] wins over [AADHAAR_1]-like collisions
  for (const { token, value } of [...map].sort((a, b) => b.token.length - a.token.length)) {
    out = out.split(token).join(value);
  }
  return out;
}

/** Deterministic local re-hydration for any masked text against the scenario corpus. */
export function rehydrateForScenario(text: string, scenarioId: string): string {
  return rehydrateLetter(text, scenarioId);
}

/** Simple deterministic FNV-1a hash rendered as a short build tag. */
export function buildHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 8).toUpperCase();
}
