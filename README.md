# NIRVAXIS

A complete global evidence and administrative-review dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber, SVG, Lucide, PostgreSQL and Drizzle.

## Run

The existing template uses Next.js 16 / React 19; those compatible pinned framework versions are retained rather than downgraded.

1. Install dependencies with `npm install`.
2. Configure `DATABASE_URL` in the server environment.
3. Apply the anonymous telemetry table with `npx drizzle-kit push` after PostgreSQL is available.
4. Run `npm run dev`, or build with `npm run build`.

Optional server-only secrets:

- `NEBIUS_API_KEY`: Nebius Token Factory OpenAI-compatible chat endpoint.
- `TAVILY_API_KEY`: Tavily official-domain search with raw source text.

No keys are required to explore all six complete reference scenarios. Missing keys, rejected requests, invalid model JSON, unavailable models and 8-second per-request timeouts automatically return HTTP 200 with `mode: CACHED_REPLAY_SAFEGUARD`. Replay is labeled prominently and is **not** represented as an analysis of submitted documents. No fabricated live latency, cost or token usage is reported.

## Explore

- Select USA, Europe, Middle East, India, SE Asia or Australia on the radar map.
- Filter scenarios and jurisdictions, set a drafting preference, and select an output language.
- Open the workbench with the top action or Ctrl/Cmd+K.
- Inspect tokenized input before running. Custom protected names are comma-separated.
- Review source quotes, dependencies, user confirmations and the three officer objections.
- Switch citizen / system owner mode. Copy a locally restored letter, export a Markdown case packet, or download an accessible React patch.
- Download an RFC-5545 workflow reminder. **Reminder dates are not verified legal deadlines.**
- Open activity history to inspect persisted anonymous run metadata.

## Evidence, privacy and operational boundaries

The reversible PII map exists only in browser memory. It is not sent to the API, persisted in PostgreSQL, or written to localStorage. Regex redaction cannot detect every possible personal detail: users must inspect the preview, add custom names, and remove unusual identifying details manually.

The server re-redacts common patterns as defense in depth. PostgreSQL stores only region, output mode, language, evidence score, verification count, actual token/cost telemetry, runtime mode and timestamp. Submitted notices, vent text, letters and token mappings are never persisted.

Tavily searches a region-specific allowlist of official domains. A citation is verified only if a sufficiently long quote is a contiguous normalized match in returned **raw** source content. Token overlap alone is never sufficient. A matched quote is evidence of wording, **not** a decision about legal applicability. Cached reference excerpts carry explicit snapshot provenance and should be checked against the current linked page.

Nano extracts neutral facts. Drafting preferences select Nano, Super or Ultra; Hindi and system-owner output force Ultra. Ultra always performs the adversarial review. User-supplied notices are treated as untrusted data. Model output is safely parsed and shape-validated; code patches are downloadable proposals, never executed automatically. Route/model availability depends on the provider account, and an unavailable model safely activates replay.

Reference dashboard totals and route trend curves are illustrative. Replay's 184ms Nano value is a labeled benchmark, not measured live usage. The system does not provide legal representation or promise an outcome, uninterrupted service, universal PII coverage, or a fixed frame rate on every device.

The map remains interactive without WebGL. A deterministic SVG/Canvas hybrid and static night-Earth layer remain available; the small particle layer runs only after mounting and when browser graphics support is available. Reduced-motion users skip WebGL particles. Time is computed after mounting to avoid hydration differences.

## Endpoints

- `POST /api/resolve`: redacted notice, vent, region, language, model preference, output mode.
- `GET /api/runs`: twelve most recent anonymous runs.
- `GET /api/status`: configured integration booleans only; never exposes secrets.
- `GET /api/health`: managed database-aware health check.

## Validate

- `node scripts/verify-core.mjs`
- `node scripts/verify-route.mjs` — mocked providers, exact costs, malformed output, quote exclusions, and a real 8-second abort test; no external calls.
- `node scripts/verify-browser.mjs` — run against the managed preview (or set TEST_BASE_URL) to verify six regions, tokenized network requests, PostgreSQL history, both output modes, downloads and mobile layout.
- `npm run lint`
- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`

Night-Earth artwork is generated for this application. Geographic vector data uses Natural Earth via world-atlas. Fonts are hosted locally. All six reference cases include realistic input, six-language guides, exact-quote snapshot examples, conditional/unverified items, red-team critique, review letters and accessible portal integration proposals.
