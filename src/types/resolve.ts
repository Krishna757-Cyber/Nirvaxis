export const REGIONS = ["USA", "EUROPE", "MIDDLE EAST", "INDIA", "SE ASIA", "AUSTRALIA"] as const;
export type RegionId = (typeof REGIONS)[number];
export type EvidenceStatus = "VERIFIED" | "NEEDS_CONFIRMATION" | "UNKNOWN";
export type OutputMode = "citizen" | "owner";
export type Language = "en" | "hi" | "de" | "es" | "fr" | "it" | "pt" | "ar" | "ja" | "zh";
export type ModelTier = "auto" | "nano" | "super" | "ultra";

export interface EvidenceItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  quote: string;
  rawSource: string;
  status: EvidenceStatus;
  condition?: string;
  provenance: "REPLAY_SNAPSHOT" | "LIVE_TAVILY";
  capturedAt: string;
  matchScore: number;
}

export interface ActionNode {
  id: string;
  title: string;
  instruction: string;
  explanation: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: EvidenceStatus;
  deadline: string;
  deadlineType: "WORKFLOW_REMINDER" | "CONFIRM_STATUTORY_DATE";
  evidenceIds: string[];
  dependsOn: string[];
}

export interface RedTeamCritique {
  id: string;
  title: string;
  objection: string;
  patch: string;
  severity: "HIGH" | "MEDIUM";
}

export interface CodePatch {
  fileName: string;
  language: "tsx" | "html";
  rootCause: string;
  wcag: string[];
  before: string;
  after: string;
}

export interface Scenario {
  id: string;
  region: RegionId;
  regionName: string;
  country: string;
  flag: string;
  title: string;
  shortTitle: string;
  category: string;
  accent: string;
  activeCases: number;
  proofScore: number;
  claims: number;
  verifiedCount: number;
  urgentCount: number;
  demoName: string;
  rawNotice: string;
  ventText: string;
  sourceQuery: string;
  officialDomains: string[];
  evidence: EvidenceItem[];
  actions: ActionNode[];
  critiques: RedTeamCritique[];
  guide: Partial<Record<Language, string[]>> & { en: string[] };
  appealLetter: string;
  frictionReport: string;
  codePatch: CodePatch;
  nextDeadline: string;
  insight: string;
}

export interface PipelineStage {
  name: string;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

export interface TelemetryMetrics {
  mode: "LIVE" | "CACHED_REPLAY_SAFEGUARD";
  latencyMs: number;
  nanoLatencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  costSavingsPercent: number;
  stages: PipelineStage[];
  routedModels: string[];
  fallbackReason?: string;
  databasePersisted: boolean;
  runId?: string;
}

export interface PIIVault {
  entries: Record<string, string>;
  counters: Record<string, number>;
}

export interface ResolveRequest {
  region: RegionId;
  notice: string;
  vent: string;
  language: Language;
  modelTier: ModelTier;
  outputMode: OutputMode;
}

export interface ResolveResponse {
  scenario: Scenario;
  telemetry: TelemetryMetrics;
  facts: string;
  inputAssessment: string;
}
