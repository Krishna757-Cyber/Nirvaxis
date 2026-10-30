import { pgTable, uuid, varchar, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";

/** Anonymous operational telemetry only. Never store submitted text, letters or a PII vault. */
export const resolutionRuns = pgTable("resolution_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  region: varchar("region", { length: 24 }).notNull(),
  mode: varchar("mode", { length: 32 }).notNull(),
  outputMode: varchar("output_mode", { length: 12 }).notNull(),
  language: varchar("language", { length: 4 }).notNull(),
  proofScore: integer("proof_score").notNull(),
  verifiedSources: integer("verified_sources").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUSD: doublePrecision("cost_usd").notNull().default(0),
  replay: boolean("replay").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
