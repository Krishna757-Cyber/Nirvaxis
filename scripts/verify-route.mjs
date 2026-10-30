import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const env = { NEBIUS_API_KEY: "unit-test-only", TAVILY_API_KEY: "unit-test-only" };
let behavior = "live";
const saved = [];
const calls = [];
const quote = "The itemized statement must list what was deducted and why.";
const quote2 = "If the deductions are for more than $125.00, the landlord must attach a copy of any invoices or receipts with the itemized statement.";
const officialURL = "https://selfhelp.courts.ca.gov/guide-security-deposits-california";
const rawSource = `California Courts: Guide to security deposits in California. Returning security deposits. ${quote} ${quote2} Check exceptions and the actual move-out chronology before asserting a right.`;
const bogusQuote = "Every tenant automatically receives a million dollars on appeal.";

async function mockFetch(url, options) {
  const payload = JSON.parse(options.body);
  calls.push({ url, payload });
  if (behavior === "timeout" && url.includes("nebius")) return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true }));
  if (url.includes("tavily")) {
    if (behavior === "tavily-failure") return new Response("Rate limited", { status: 429 });
    return Response.json({ results: [{ title: "California Courts deposit guidance", url: officialURL, content: quote, raw_content: rawSource }] });
  }
  if (behavior === "nebius-failure") return new Response("Unauthorized", { status: 401 });
  if (behavior === "malformed") return Response.json({ choices: [{ message: { content: "```json\nnot valid JSON\n```" } }] });
  const task = payload.messages[0].content;
  let result;
  if (task.includes("Extract neutral")) result = { facts: ["The notice identifies a disputed rental deposit deduction and missing receipts."], deadlineText: "unknown", classification: "California tenancy" };
  else if (task.includes("Draft a neutral")) result = { introduction: "I request review of the documented deduction and its supporting records.", request: "Please provide an itemized accounting and clarify any applicable exception.", guide: ["Confirm the move-out date and jurisdiction.", "Request supporting invoices.", "Check the actual filing deadline."] };
  else result = {
    citations: [
      { url: officialURL, quote: behavior === "fake-quote" ? bogusQuote : quote },
      { url: officialURL, quote: behavior === "partial-quote" || behavior === "fake-quote" ? bogusQuote : quote2 },
    ],
    critiques: [1, 2, 3].map((number) => ({ id: `objection-${number}`, title: `Evidence check ${number}`, objection: "A claim must be supported by the original record.", patch: "Ask for the actual document and distinguish an allegation from a fact.", severity: "MEDIUM" })),
    codePatch: { fileName: "review-form.tsx", language: "tsx", rootCause: "The input has no accessible label.", wcag: ["3.3.1 Error Identification"], before: '<input placeholder="Reference" />', after: '<label htmlFor="reference">Reference</label>\n<input id="reference" name="reference" required />' },
  };
  return Response.json({ choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(result)}\n\`\`\`` } }], usage: { prompt_tokens: 100, completion_tokens: 50 } });
}

const modules = {};
function load(file) {
  if (modules[file]) return modules[file];
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, require: resolveImport, URL, Request, Response, TextEncoder, structuredClone, setTimeout, clearTimeout, AbortController, performance, process: { env }, fetch: mockFetch, console };
  vm.runInNewContext(output, context, { filename: file });
  modules[file] = context.exports;
  return context.exports;
}
function resolveImport(name) {
  if (name === "server-only") return {};
  if (name === "next/server") return { NextResponse: { json: (value, options) => Response.json(value, options) } };
  if (name === "@/db") return { db: { insert: () => ({ values: (value) => ({ returning: async () => { saved.push(value); return [{ id: "12345678-1234-4123-8123-123456789abc" }]; } }) }) } };
  if (name === "@/db/schema") return { resolutionRuns: { id: "id" } };
  if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
  throw new Error(`Unexpected module ${name}`);
}
const route = load("src/app/api/resolve/route.ts");
async function run(overrides = {}) {
  const request = new Request("http://localhost/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ region: "USA", notice: "Name: Maya Mehta\nAccount: 4589201736\nEmail: maya.mehta@example.com\nDeposit deduction disputed; receipts were not enclosed.", vent: "I need the itemized basis.", language: "en", outputMode: "citizen", modelTier: "auto", ...overrides }) });
  const response = await route.POST(request);
  assert.equal(response.status, 200);
  return response.json();
}

const live = await run();
assert.equal(live.telemetry.mode, "LIVE");
assert.equal(live.telemetry.stages.length, 3);
assert.equal(live.telemetry.inputTokens, 300);
assert.equal(live.telemetry.outputTokens, 150);
assert.ok(Math.abs(live.telemetry.costUSD - 0.000343) < 1e-10);
assert.equal(live.scenario.actions.length, 4);
assert.ok(live.scenario.codePatch.after.includes('htmlFor="reference"'), "A citizen run must also prepare its live owner patch");
assert.ok(live.telemetry.databasePersisted);
assert.ok(live.scenario.evidence.every((item) => item.status === "VERIFIED" && item.provenance === "LIVE_TAVILY"));
assert.ok(!JSON.stringify(calls).includes("Maya Mehta") && !JSON.stringify(calls).includes("maya.mehta@example.com"));
console.log("✓ Live Nano → official Tavily search → exact quote verifier → Super/Ultra pipeline and exact token costs");

behavior = "partial-quote";
const partial = await run();
assert.equal(partial.telemetry.mode, "LIVE");
assert.equal(partial.scenario.actions.length, 4);
assert.equal(partial.scenario.evidence.filter((item) => item.status === "UNKNOWN").length, 1);
assert.ok(!partial.scenario.appealLetter.includes(bogusQuote));
console.log("✓ A failed quote is marked UNKNOWN and excluded from the live letter");

for (const test of ["tavily-failure", "nebius-failure", "malformed", "fake-quote"]) {
  behavior = test;
  const result = await run();
  assert.equal(result.telemetry.mode, "CACHED_REPLAY_SAFEGUARD");
  assert.equal(result.telemetry.inputTokens, 0);
  assert.equal(result.telemetry.costUSD, 0);
  assert.ok(result.inputAssessment.includes("not an analysis"));
  console.log(`✓ ${test} returns HTTP 200 with explicitly labeled replay, no invented live usage`);
}
behavior = "live";
for (const modelTier of ["nano", "super", "ultra"]) {
  const result = await run({ modelTier });
  assert.equal(result.telemetry.mode, "LIVE");
  assert.ok(result.telemetry.stages[1].model.toLowerCase().includes(modelTier));
}
const hindi = await run({ language: "hi", modelTier: "super" });
assert.ok(hindi.telemetry.stages[1].model.includes("Ultra"));
const owner = await run({ outputMode: "owner" });
assert.equal(owner.telemetry.mode, "LIVE");
assert.ok(owner.scenario.frictionReport.includes("ANONYMIZED"));
console.log("✓ Drafting preferences work; Hindi and system-owner output route through Ultra");

delete env.TAVILY_API_KEY;
assert.equal((await run()).telemetry.mode, "CACHED_REPLAY_SAFEGUARD");
env.TAVILY_API_KEY = "unit-test-only";
const malformedRequest = await route.POST(new Request("http://localhost/api/resolve", { method: "POST", body: "not JSON" }));
assert.equal(malformedRequest.status, 200);
console.log("✓ Missing credentials and malformed requests remain non-crashing and replay-safe");

behavior = "timeout";
const started = performance.now();
const timeout = await run();
assert.equal(timeout.telemetry.mode, "CACHED_REPLAY_SAFEGUARD");
assert.ok(performance.now() - started >= 7900 && performance.now() - started < 10000);
assert.ok(timeout.telemetry.fallbackReason.includes("8-second"));
console.log("✓ AbortController enforces the real 8,000ms external request timeout");
for (const row of saved) {
  for (const field of ["notice", "vent", "vault", "letter", "names", "appealLetter"]) assert.ok(!(field in row));
  assert.ok(!JSON.stringify(row).includes("Maya"));
}
console.log("✓ Only anonymous telemetry is passed to Drizzle inserts");
console.log("\nAll server orchestration and failure-path checks passed. No external API was contacted.");
