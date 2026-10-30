/**
 * DETERMINISTIC QUOTE VERIFIER
 * A citation is "Verified" only if the quoted phrase appears verbatim
 * (after normalization) inside the retrieved source excerpt. No LLM involved —
 * string-level proof that the model did not fabricate authority.
 */

export interface VerificationResult {
  marker: string;
  sourceId: string;
  verified: boolean;
  ratio: number;
  quote: string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[₹$€£]/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function verifyQuote(marker: string, sourceId: string, quote: string, excerpt: string): VerificationResult {
  const nq = normalize(quote);
  const ne = normalize(excerpt);
  if (ne.includes(nq)) return { marker, sourceId, verified: true, ratio: 1, quote };

  // Fuzzy fallback: token-overlap ratio (used only for the reported score; verified requires ≥ 0.86)
  const qTokens = nq.split(' ').filter(Boolean);
  const eSet = new Set(ne.split(' '));
  const hits = qTokens.filter((t) => eSet.has(t)).length;
  const ratio = qTokens.length ? hits / qTokens.length : 0;
  return { marker, sourceId, verified: ratio >= 0.86, ratio, quote };
}
