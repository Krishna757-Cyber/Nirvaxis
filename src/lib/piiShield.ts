import type { PIIVault } from "@/types/resolve";

export type TokenType =
  | "PERSON"
  | "ID"
  | "ACCOUNT"
  | "PHONE"
  | "EMAIL"
  | "ADDRESS"
  | "REF"
  | "AMOUNT";

export const emptyVault = (): PIIVault => ({ entries: {}, counters: {} });
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function tokenColor(type: string): string {
  switch (type.toUpperCase()) {
    case "PERSON":
    case "NAME":
      return "border-lime-400/35 bg-lime-400/10 text-lime-300";
    case "ID":
    case "AADHAAR":
    case "PAN":
      return "border-cyan-400/35 bg-cyan-400/10 text-cyan-300";
    case "EMAIL":
      return "border-violet-400/35 bg-violet-400/10 text-violet-300";
    case "PHONE":
      return "border-amber-400/35 bg-amber-400/10 text-amber-300";
    case "ACCOUNT":
    case "ACCT":
      return "border-sky-400/35 bg-sky-400/10 text-sky-300";
    case "ADDRESS":
    case "ADDR":
      return "border-emerald-400/35 bg-emerald-400/10 text-emerald-300";
    case "AMOUNT":
      return "border-rose-400/35 bg-rose-400/10 text-rose-300";
    case "REF":
    case "PNR":
    default:
      return "border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-300";
  }
}

/** Pure, deterministic, lossless redaction. The reverse map must stay in browser memory. */
export function redactPII(input: string, names: string[] = [], prior?: PIIVault) {
  const vault: PIIVault = { entries: { ...(prior?.entries ?? {}) }, counters: { ...(prior?.counters ?? {}) } };
  const tokenFor = (type: string, value: string) => {
    const found = Object.entries(vault.entries).find(([key, stored]) => key.startsWith(`[${type}_`) && stored === value);
    if (found) return found[0];
    const count = (vault.counters[type] ?? 0) + 1;
    vault.counters[type] = count;
    const token = `[${type}_${count}]`;
    vault.entries[token] = value;
    return token;
  };
  let text = input;
  const replace = (regex: RegExp, type: string) => { text = text.replace(regex, (value: string) => tokenFor(type, value)); };
  const protectedNames = [...new Set(names.map((value) => value.trim()).filter(Boolean))];
  const namePattern = (name: string) => new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])${escapeRegExp(name)}(?![\\p{L}\\p{N}\\p{M}])`, "giu");

  for (const name of protectedNames) {
    for (const value of input.match(namePattern(name)) ?? []) tokenFor("PERSON", value);
  }
  for (const name of [...protectedNames].sort((a, b) => b.length - a.length)) {
    text = text.replace(namePattern(name), (value: string) => tokenFor("PERSON", value));
  }

  text = text.replace(/(\b(?:Name|Applicant|Tenant|Passenger|Member|Candidate)[ \t]*:[ \t]*)([^\n,;\[\]<>]{2,70})/gi, (_match, prefix: string, value: string) => prefix + tokenFor("PERSON", value));
  replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "EMAIL");
  text = text.replace(/(\b(?:Phone|Mobile|Telephone|Tel)[ \t]*[:#=][ \t]*)(\+?[\d(][\d() .-]{7,24}\d)/gi, (_match, prefix: string, value: string) => prefix + tokenFor("PHONE", value));
  text = text.replace(/(?<!\w)\+\d[\d .()-]{6,23}\d(?!\d)/g, (value: string) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 8 && digits <= 15 ? tokenFor("PHONE", value) : value;
  });
  text = text.replace(/(\b(?:Account(?:[ \t]*(?:no\.?|number))?|IBAN|A\/C)[ \t]*[:#=][ \t]*)([A-Z]{2}\d{2}[A-Z0-9 ]{10,30}|\d[\d -]{6,23}\d)/gi, (_match, prefix: string, value: string) => prefix + tokenFor("ACCOUNT", value));
  text = text.replace(/(\b(?:UAN|Aadhaar|EPF(?:[ \t]*ID)?|Passport(?:[ \t]*(?:no\.?|number))?|SSN|PAN|Emirates[ \t]*ID|Application[ \t]*(?:ID|reference|number)|Claim[ \t]*(?:ID|number)|Booking[ \t]*(?:reference|ID)|Bond[ \t]*(?:ID|number))[ \t]*[:#=][ \t]*)([A-Z0-9][A-Z0-9/ -]{3,30})/gi, (_match, prefix: string, value: string) => prefix + tokenFor("ID", value));
  replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "ID");
  replace(/\b\d{3}-\d{2}-\d{4}\b/g, "ID");
  replace(/\b\d{4}[ -]\d{4}[ -]\d{4}\b/g, "ID");
  replace(/\b[A-Z]\d{7}\b/g, "ID");
  replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, "ACCOUNT");
  replace(/\b\d{12,18}\b/g, "ID");
  replace(/(?<![\w\d])(?:\+\d{1,3}[ .-]?)?(?:\(\d{2,4}\)[ .-]?)?\d{3,5}[ .-]\d{3,4}[ .-]\d{3,4}(?!\d)|(?<!\w)\+\d{10,15}(?!\d)|(?<!\d)\b[6-9]\d{9}\b(?!\d)/g, "PHONE");
  replace(/\b\d{10,11}\b/g, "PHONE");
  return { text, vault, count: Object.keys(vault.entries).length };
}

export function rehydratePII(text: string, vault: PIIVault): string {
  return text.replace(/\[(?:PERSON|ID|ACCOUNT|PHONE|EMAIL|ADDRESS|REF|AMOUNT)_\d+\]/g, (token) => vault.entries[token] ?? token);
}

/** Curation-driven redaction that accepts predefined seeds and returns both masked string and token objects */
export function redact(
  text: string,
  seeds: string[] = [],
  seedTypes: TokenType[] = []
): {
  masked: string;
  tokens: { token: string; value: string; type: TokenType }[];
  vault: PIIVault;
  count: number;
} {
  const vault: PIIVault = emptyVault();
  const tokenFor = (type: TokenType, value: string): string => {
    const found = Object.entries(vault.entries).find(
      ([key, stored]) => key.startsWith(`[${type}_`) && stored === value
    );
    if (found) return found[0];
    const count = (vault.counters[type] ?? 0) + 1;
    vault.counters[type] = count;
    const token = `[${type}_${count}]`;
    vault.entries[token] = value;
    return token;
  };

  let masked = text;

  // First replace known explicit seeds in descending length order
  const indexedSeeds = seeds
    .map((val, idx) => ({ val: val.trim(), type: seedTypes[idx] ?? "REF" }))
    .filter((s) => s.val.length > 0)
    .sort((a, b) => b.val.length - a.val.length);

  for (const { val, type } of indexedSeeds) {
    if (!val) continue;
    const pattern = new RegExp(escapeRegExp(val), "g");
    if (pattern.test(masked)) {
      const token = tokenFor(type, val);
      masked = masked.replace(pattern, token);
    }
  }

  // Then run general regex patterns
  const result = redactPII(masked, [], vault);
  masked = result.text;

  const tokens = Object.entries(vault.entries).map(([token, value]) => {
    const match = token.match(/^\[([A-Z]+)_\d+\]$/);
    const type = (match ? match[1] : "REF") as TokenType;
    return { token, value, type };
  });

  return {
    masked,
    tokens,
    vault,
    count: tokens.length,
  };
}
