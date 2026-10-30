import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { webcrypto } from "node:crypto";

function load(file) {
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, require: (name) => { if (name === "server-only") return {}; throw new Error(`Unexpected import: ${name}`); }, URL, TextEncoder, crypto: webcrypto, structuredClone, console, setTimeout, clearTimeout, AbortController, performance, process, fetch };
  vm.runInNewContext(output, context, { filename: file });
  return context.exports;
}
const pii = load("src/lib/piiShield.ts");
const verifier = load("src/lib/tavilyVerifier.ts");
const router = load("src/lib/nebiusRouter.ts");
const calendar = load("src/lib/icsGenerator.ts");
const scenarios = load("src/lib/mockScenarios.ts");

let checks = 0;
function check(name, test) { test(); checks++; console.log(`✓ ${name}`); }

check("Every reference scenario has four actions, three critiques and six languages", () => {
  assert.equal(scenarios.scenarioList.length, 6);
  for (const scenario of scenarios.scenarioList) {
    assert.equal(scenario.actions.length, 4);
    assert.equal(scenario.critiques.length, 3);
    assert.equal(Object.keys(scenario.guide).length, 6);
    for (const evidence of scenario.evidence.filter((item) => item.status === "VERIFIED")) {
      assert.ok(verifier.verifyQuoteInSource(evidence.quote, evidence.rawSource).verified);
      assert.ok(verifier.isOfficialSource(evidence.url, scenario.officialDomains));
    }
    assert.ok(!scenario.appealLetter.includes(scenario.demoName));
  }
});
check("Reference notices redact names, emails and IDs and rehydrate losslessly", () => {
  for (const scenario of scenarios.scenarioList) {
    const redacted = pii.redactPII(scenario.rawNotice, [scenario.demoName]);
    assert.ok(!redacted.text.includes(scenario.demoName));
    assert.ok(!redacted.text.includes("@example.com"));
    assert.ok(redacted.text.includes("[PERSON_1]"));
    assert.equal(pii.rehydratePII(redacted.text, redacted.vault), scenario.rawNotice);
  }
});
check("Spaced international phones never reach the request", () => {
  const original = "Phone: +91 98765 43210\nPlease call +49 151 12345678 or +1 (415) 555-0198.";
  const result = pii.redactPII(original);
  assert.ok(!result.text.includes("98765"));
  assert.ok(!result.text.includes("12345678"));
  assert.ok(!result.text.includes("555-0198"));
  assert.equal(pii.rehydratePII(result.text, result.vault), original);
});
check("PAN, SSN, Aadhaar, passport and account identifiers are masked", () => {
  const original = "PAN: ABCDE1234F\nSSN: 123-45-6789\nAadhaar: 2345 6789 0123\nPassport: N1234567\nAccount: 4589201736";
  const result = pii.redactPII(original);
  for (const value of ["ABCDE1234F", "123-45-6789", "2345 6789 0123", "N1234567", "4589201736"]) assert.ok(!result.text.includes(value));
  assert.equal(pii.rehydratePII(result.text, result.vault), original);
  assert.ok(result.text.includes("[ACCOUNT_1]"));
});
check("Custom Unicode names and duplicate values are tokenized consistently", () => {
  const original = "आशा शर्मा wrote to आशा शर्मा. Sofia Martín replied.";
  const result = pii.redactPII(original, ["आशा शर्मा", "Sofia Martín"]);
  assert.equal((result.text.match(/\[PERSON_1\]/g) ?? []).length, 2);
  assert.equal(Object.keys(result.vault.entries).length, 2);
  assert.equal(pii.rehydratePII(result.text, result.vault), original);
});
check("Dates, EU regulations and model sizes are preserved", () => {
  const original = "Date: 2026-11-05\nRegulation 261/2004. Model: 550B. Amount: €600.";
  assert.equal(pii.redactPII(original).text, original);
});
check("Quote verifier normalizes typography but rejects reordered or changed claims", () => {
  assert.ok(verifier.verifyQuoteInSource("The airline has to prove this by providing evidence.", "The airline has to prove this—by providing evidence!").verified);
  assert.ok(!verifier.verifyQuoteInSource("The airline has to pay this by providing evidence.", "The airline has to prove this by providing evidence.").verified);
  assert.ok(!verifier.verifyQuoteInSource("You must file within 30 calendar days of rejection.", "You must file within 14 calendar days of rejection.").verified);
  assert.ok(!verifier.verifyQuoteInSource("appeal now", "appeal now").verified);
});
check("Official domain checks reject look-alike domains and insecure URLs", () => {
  assert.ok(verifier.isOfficialSource("https://selfhelp.courts.ca.gov/guide", ["courts.ca.gov"]));
  assert.ok(!verifier.isOfficialSource("https://courts.ca.gov.example.com/guide", ["courts.ca.gov"]));
  assert.ok(!verifier.isOfficialSource("http://courts.ca.gov/guide", ["courts.ca.gov"]));
  assert.ok(!verifier.isOfficialSource("https://unknown.org/guide", ["courts.ca.gov"]));
});
check("Safe JSON extraction handles fences, preamble and malformed output", () => {
  assert.equal(router.safeParseLLMJson('```json\n{"ok":true}\n```', {}).ok, true);
  assert.equal(router.safeParseLLMJson('Here is JSON: {"ok":true} Done.', {}).ok, true);
  const fallback = { safe: true };
  assert.equal(router.safeParseLLMJson("{ malformed }", fallback), fallback);
  assert.equal(router.safeParseLLMJson("[]", fallback), fallback);
});
check("ICS exports are RFC-5545 folded, escaped and include deadline caveats", () => {
  const text = calendar.buildICS("Review, confirm; appeal", "2026-11-05", "जाँचें। ".repeat(35));
  assert.ok(text.includes("DTSTART;VALUE=DATE:20261105\r\n"));
  assert.ok(text.includes("DTEND;VALUE=DATE:20261106\r\n"));
  assert.ok(text.includes("SUMMARY:Review\\, confirm\\; appeal"));
  assert.ok(text.includes("BEGIN:VALARM"));
  assert.ok(calendar.buildICS("Invalid day", "2026-99-99", "Safe fallback").includes("DTSTART;VALUE=DATE:20261105"));
  assert.ok(calendar.buildICS("Overflow day", "2026-02-30", "Safe fallback").includes("DTSTART;VALUE=DATE:20261105"));
  assert.ok(text.replace(/\r\n /g, "").includes("Verify the actual legal deadline"));
  for (const line of text.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `Line exceeds 75 octets: ${Buffer.byteLength(line)}`);
});
console.log(`\n${checks} core checks passed. No external services or personal data were used.`);
