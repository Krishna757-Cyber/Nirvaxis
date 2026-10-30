import { NextResponse } from "next/server";
import { db } from "@/db";
import { resolutionRuns } from "@/db/schema";
import { getScenario, replayTelemetry } from "@/lib/mockScenarios";
import { redactPII } from "@/lib/piiShield";
import { callNebius } from "@/lib/nebiusRouter";
import { isOfficialSource, searchOfficialSources, verifyQuoteInSource } from "@/lib/tavilyVerifier";
import { REGIONS, type CodePatch, type EvidenceItem, type Language, type RedTeamCritique, type ResolveRequest, type ResolveResponse, type Scenario } from "@/types/resolve";

export const runtime = "nodejs";
export const maxDuration = 40;

const languages: Language[] = ["en", "hi", "de", "es", "fr", "it", "pt", "ar", "ja", "zh"];
function bounded(value: unknown, max: number): string { return typeof value === "string" ? value.slice(0, max) : ""; }
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length < 12000;

async function recordRun(result: ResolveResponse, input: ResolveRequest) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const query = db.insert(resolutionRuns).values({ region: result.scenario.region, mode: result.telemetry.mode, outputMode: input.outputMode, language: input.language, proofScore: result.scenario.proofScore, verifiedSources: result.scenario.evidence.filter((item) => item.status === "VERIFIED").length, latencyMs: result.telemetry.latencyMs, inputTokens: result.telemetry.inputTokens, outputTokens: result.telemetry.outputTokens, costUSD: result.telemetry.costUSD, replay: result.telemetry.mode !== "LIVE" }).returning({ id: resolutionRuns.id });
    const saved = await Promise.race([query, new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 1600); })]);
    if (saved?.[0]) { result.telemetry.databasePersisted = true; result.telemetry.runId = saved[0].id; }
  } catch { /* Database issues must not block a citizen's workflow. No submitted content is logged. */ }
  finally { if (timer) clearTimeout(timer); }
}

function replay(scenario: Scenario, reason: string): ResolveResponse {
  return { scenario, telemetry: replayTelemetry(reason), facts: "Precomputed reference case. No live model inference was performed.", inputAssessment: "REFERENCE REPLAY — this is a precomputed scenario, not an analysis of your submitted notice. Review all facts, user conditions, and actual deadlines before using the template." };
}

export async function POST(request: Request) {
  const started = performance.now();
  let input: ResolveRequest = { region: "INDIA", notice: "", vent: "", language: "hi", modelTier: "auto", outputMode: "citizen" };
  let scenario = getScenario("INDIA");
  let result: ResolveResponse;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 64000) throw new Error("Input exceeds the safe document size");
    const raw = await request.text();
    if (raw.length > 64000) throw new Error("Input exceeds the safe document size");
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw) as Record<string, unknown>; } catch { throw new Error("The request could not be read"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request");
    const region = REGIONS.find((value) => value === body.region) ?? "INDIA";
    input = { region, notice: bounded(body.notice, 16000), vent: bounded(body.vent, 6000), language: languages.includes(body.language as Language) ? body.language as Language : "en", modelTier: ["auto", "nano", "super", "ultra"].includes(String(body.modelTier)) ? body.modelTier as ResolveRequest["modelTier"] : "auto", outputMode: body.outputMode === "owner" ? "owner" : "citizen" };
    scenario = getScenario(region);
    // Defense in depth. The reverse map from this secondary pass is immediately discarded.
    input.notice = redactPII(input.notice).text;
    input.vent = redactPII(input.vent).text;
    if (!input.notice.trim()) throw new Error("Add a notice before running the live pipeline");
    if (!process.env.NEBIUS_API_KEY || !process.env.TAVILY_API_KEY) {
      result = replay(scenario, "Live API keys are not configured. The reference replay is available without sending data to external services.");
    } else {
      const nano = await callNebius<{ facts: string[]; deadlineText: string; classification: string }>("nano", 'Extract neutral, verifiable facts, remove emotional language, and quote any stated deadline without calculating a date. Schema: {"facts":["..."],"deadlineText":"... or unknown","classification":"..."}.', { notice: input.notice, vent: input.vent, expectedRegion: region }, { facts: [], deadlineText: "unknown", classification: "unknown" });
      if (!Array.isArray(nano.data.facts) || !nano.data.facts.every(isString) || nano.data.facts.length === 0) throw new Error("Fact extraction could not be validated");
      const sources = await searchOfficialSources(scenario.sourceQuery, scenario.officialDomains);
      if (sources.length === 0) throw new Error("No usable official raw source text was returned");
      const draftTier = input.modelTier === "ultra" || input.language === "hi" || input.outputMode === "owner" ? "ultra" : input.modelTier === "nano" ? "nano" : "super";
      const [draft, review] = await Promise.all([
        callNebius<{ introduction: string; request: string; guide: string[] }>(draftTier, 'Draft a neutral request for review and plain-language next steps. No compensation amount, calculated deadline, guaranteed outcome, or invented rule. Schema: {"introduction":"factual summary only","request":"conditional review request","guide":["3 short actionable items in the requested language"]}.', { facts: nano.data.facts, language: input.language, mode: input.outputMode, sourceText: sources.map((source) => ({ url: source.url, text: source.raw_content.slice(0, 9000) })) }, { introduction: "", request: "", guide: [] }),
        callNebius<{ citations: { url: string; quote: string }[]; critiques: RedTeamCritique[]; codePatch?: CodePatch }>("ultra", 'Act as a strict reviewing officer. Give exactly 3 specific objections and patches, and choose up to 3 verbatim relevant quotes FROM the supplied raw source text. Never label evidence verified yourself. Always provide a complete accessible TSX code patch and anonymized root-cause description without personal values, so both citizen and system-owner outputs are ready. Schema: {"citations":[{"url":"source URL","quote":"verbatim contiguous source quote, 6+ words"}],"critiques":[{"id":"objection-1","title":"...","objection":"...","patch":"...","severity":"HIGH or MEDIUM"}],"codePatch":{"fileName":"...tsx","language":"tsx","rootCause":"...","wcag":["..."],"before":"...","after":"..."}}. Do not repeat private user input in the code patch.', { notice: input.notice, facts: nano.data.facts, mode: input.outputMode, sources: sources.map((source) => ({ url: source.url, rawSource: source.raw_content.slice(0, 10000) })) }, { citations: [], critiques: [] }),
      ]);
      if (!isString(draft.data.introduction) || !isString(draft.data.request) || !Array.isArray(draft.data.guide) || draft.data.guide.length < 2 || !draft.data.guide.every(isString) || !Array.isArray(review.data.citations) || !Array.isArray(review.data.critiques) || review.data.critiques.length !== 3 || !review.data.critiques.every((item) => item && isString(item.title) && isString(item.objection) && isString(item.patch))) throw new Error("Model output did not pass structural validation");
      const evidence: EvidenceItem[] = review.data.citations.slice(0, 4).flatMap((citation, index) => {
        if (!citation || typeof citation.url !== "string" || typeof citation.quote !== "string") return [];
        const source = sources.find((item) => item.url === citation.url);
        if (!source || !isOfficialSource(source.url, scenario.officialDomains)) return [];
        const verified = verifyQuoteInSource(citation.quote, source.raw_content);
        return [{ id: `source-${index + 1}`, title: source.title, url: source.url, domain: new URL(source.url).hostname, quote: citation.quote, rawSource: source.raw_content, status: verified.verified ? "VERIFIED" : "UNKNOWN", provenance: "LIVE_TAVILY", capturedAt: new Date().toISOString(), matchScore: verified.score }];
      });
      const verified = evidence.filter((item) => item.status === "VERIFIED");
      if (verified.length === 0) throw new Error("No cited quote passed the deterministic source check");
      scenario.rawNotice = input.notice;
      scenario.ventText = input.vent;
      scenario.title = "Your evidence-led review is ready to inspect.";
      scenario.evidence = evidence;
      scenario.critiques = review.data.critiques.map((item, index) => ({ ...item, id: `objection-${index + 1}`, severity: item.severity === "HIGH" ? "HIGH" : "MEDIUM" }));
      scenario.guide[input.language] = draft.data.guide;
      scenario.guide.en = input.language === "en" ? draft.data.guide : ["Read the exact rejection reason and confirm the applicable authority.", "Inspect the verified source quotes and confirm they apply to your facts.", "Use the drafted request only after checking all facts and the actual deadline."];
      scenario.appealLetter = `To the Reviewing Authority,\n\nSubject: Request for reasoned review\nApplicant: [PERSON_1]\nReference supplied: [ID_1]\n\n${draft.data.introduction}\n\n${verified.map((item) => `Official source: ${item.url}\n“${item.quote}”`).join("\n\n")}\n\n${draft.data.request}\n\nPlease confirm the precise reason, any missing evidence, and the available review process. This request does not assert a guaranteed outcome or waive an applicable deadline.\n\nYours faithfully,\n[PERSON_1]`;
      scenario.actions = [
        { id: "step-1", title: "Confirm the extracted facts", instruction: nano.data.facts.join("\n"), explanation: "The model's extracted facts must be checked against your original notice. A quoted rule is not proof that your circumstances satisfy it.", priority: "HIGH", status: "NEEDS_CONFIRMATION", deadline: scenario.nextDeadline, deadlineType: "CONFIRM_STATUTORY_DATE", evidenceIds: [], dependsOn: [] },
        ...[verified[0], verified[1] ?? verified[0]].map((item, index) => ({ id: `step-${index + 2}`, title: index === 0 ? "Inspect the official rule" : "Connect the rule to the request", instruction: `Read the source and confirm its applicability: ${item.quote}`, explanation: "The exact quote passed the deterministic check against live Tavily raw content. Applicability remains for you to confirm.", priority: "MEDIUM" as const, status: "VERIFIED" as const, deadline: scenario.nextDeadline, deadlineType: "WORKFLOW_REMINDER" as const, evidenceIds: [item.id], dependsOn: [index === 0 ? "step-1" : "step-2"] })),
        { id: "step-4", title: "Exclude unsupported assertions", instruction: "Do not include any unverified quote, guessed filing date, penalty or guaranteed payment in the appeal.", explanation: "Any citation that failed the deterministic raw-source check is excluded from the letter.", priority: "MEDIUM", status: "UNKNOWN", deadline: scenario.nextDeadline, deadlineType: "WORKFLOW_REMINDER", evidenceIds: evidence.filter((item) => item.status === "UNKNOWN").map((item) => item.id), dependsOn: ["step-2"] },
      ];
      {
        const patch = review.data.codePatch;
        if (!patch || !isString(patch.after) || !isString(patch.before) || !isString(patch.rootCause) || !Array.isArray(patch.wcag) || !patch.wcag.every(isString)) throw new Error("Developer patch failed validation");
        const anonymize = (value: string) => redactPII(value).text.replace(/\[(?:PERSON|ID|ACCOUNT|PHONE|EMAIL)_\d+\]/g, "[REDACTED]");
        scenario.codePatch = { ...patch, fileName: "components/accessible-review-form.tsx", language: "tsx", rootCause: anonymize(patch.rootCause), before: anonymize(patch.before), after: anonymize(patch.after), wcag: patch.wcag.map(anonymize) };
        scenario.frictionReport = `ANONYMIZED FRICTION REPORT\n\n${scenario.codePatch.rootCause}\n\nAccessibility targets: ${scenario.codePatch.wcag.join(", ")}\n\nValidate this proposed patch against your real portal and API before deployment. No submitted text or personal identifiers are included.`;
      }
      scenario.proofScore = Math.round((verified.length / Math.max(1, evidence.length)) * 100);
      scenario.insight = `${verified.length} live official citations passed exact quote verification. 3 officer objections addressed. Unverified quotes excluded; applicability still requires your confirmation.`;
      const stages = [nano.telemetry, draft.telemetry, review.telemetry];
      const costUSD = stages.reduce((sum, stage) => sum + stage.costUSD, 0);
      const allUltraCost = stages.reduce((sum, stage) => sum + (stage.inputTokens + stage.outputTokens * 3) / 1000000, 0);
      result = { scenario, facts: nano.data.facts.join("\n"), inputAssessment: "LIVE — quotes matched official raw source text. Model reasoning, personal circumstances and deadlines still require human review. Quotation verification is not a legal merits decision.", telemetry: { mode: "LIVE", latencyMs: Math.round(performance.now() - started), nanoLatencyMs: nano.telemetry.latencyMs, inputTokens: stages.reduce((sum, stage) => sum + stage.inputTokens, 0), outputTokens: stages.reduce((sum, stage) => sum + stage.outputTokens, 0), costUSD, costSavingsPercent: allUltraCost ? Math.max(0, Math.round((1 - costUSD / allUltraCost) * 100)) : 0, stages, routedModels: stages.map((stage) => stage.model), databasePersisted: false } };
    }
  } catch (error) {
    const errorName = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    const timeout = errorName === "AbortError" || errorName === "TimeoutError";
    result = replay(getScenario(input.region), timeout ? "An external service exceeded its 8-second request limit. A reference replay is ready instead." : "Live analysis could not be safely completed. A validated reference replay is ready; no live result is being claimed.");
  }
  result.telemetry.latencyMs = Math.round(performance.now() - started);
  await recordRun(result, input);
  return NextResponse.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
}
