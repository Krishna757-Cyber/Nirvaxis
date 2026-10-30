import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1536, height: 1024 }, reducedMotion: "reduce", acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let submitted;
page.on("request", (request) => { if (request.url().endsWith("/api/resolve") && request.method() === "POST") submitted = request.postDataJSON(); });
await fs.mkdir("artifacts", { recursive: true });

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /GLOBAL RESOLUTION MAP/ })).toBeVisible();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1536);
  await page.getByRole("button", { name: /^Select USA:/ }).hover();
  await expect(page.locator(".case-dock-main h2")).toContainText("Rental deposit deduction");
  await expect(page.locator(".kpi-card").first().locator("strong")).toHaveText("3");
  console.log("✓ Hovering a radar node updates the resolution dock and KPIs");
  for (const [region, title, count] of [
    ["USA", "Rental deposit deduction", 3], ["EUROPE", "EU-261 flight compensation", 4],
    ["MIDDLE EAST", "UAE visa status review", 2], ["INDIA", "EPF withdrawal review", 4],
    ["SE ASIA", "Employment Pass appeal", 1], ["AUSTRALIA", "NSW rental bond dispute", 1],
  ]) {
    await page.getByRole("button", { name: new RegExp(`^Select ${region}:`) }).click();
    await expect(page.locator(".case-dock-main h2")).toContainText(title);
    await expect(page.locator(".kpi-card").first().locator("strong")).toHaveText(String(count));
    await expect(page.getByLabel("Filter scenarios")).toHaveValue(region);
    console.log(`✓ ${region} updates case, KPI and synchronized filters`);
  }
  await page.getByLabel("Filter scenarios").selectOption("all");
  await page.getByLabel("Filter regions").selectOption("INDIA");
  await page.getByLabel("Model router preference").selectOption("super");
  await page.getByLabel("Output language").selectOption("hi");
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });

  await page.getByRole("button", { name: /LAUNCH CASE WORKBENCH/ }).click();
  const modal = page.getByRole("dialog", { name: /EPF withdrawal review/ });
  await expect(modal).toBeVisible();
  const notice = "Name: Maya Mehta\nUAN: 112233445566\nEmail: maya.mehta@example.com\nPhone: +91 98765 43210\nThe claim was returned on 22 October 2026 due to a bank KYC mismatch. The corrected upload shows an invalid request error.";
  await page.getByLabel("Rejection notice / broken portal details").fill(notice);
  await page.getByLabel("Names to protect").fill("Maya Mehta");
  await page.getByLabel("Vent mode").fill("I corrected this twice. Please explain the exact mismatch and how to upload proof.");
  const preview = await page.locator(".shield-preview").textContent();
  assert.ok(preview.includes("[PERSON_1]") && preview.includes("[EMAIL_1]") && preview.includes("[PHONE_1]"));
  for (const privateValue of ["Maya Mehta", "112233445566", "maya.mehta@example.com", "98765"]) assert.ok(!preview.includes(privateValue));
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  await page.screenshot({ path: "artifacts/workbench.png", fullPage: true });
  console.log("✓ Browser PII preview masks names, IDs, email and international phone; no localStorage");

  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/resolve") && response.request().method() === "POST", { timeout: 40000 });
  await modal.getByRole("button", { name: /RUN NEBIUS/ }).click();
  const apiResponse = await responsePromise;
  assert.equal(apiResponse.status(), 200);
  const result = await apiResponse.json();
  assert.ok(["LIVE", "CACHED_REPLAY_SAFEGUARD"].includes(result.telemetry.mode));
  assert.ok(result.telemetry.databasePersisted, "Anonymous run should persist to PostgreSQL");
  await expect(modal.getByRole("tab", { name: /ACTION GRAPH/ })).toHaveAttribute("aria-selected", "true", { timeout: 40000 });
  for (const privateValue of ["Maya Mehta", "112233445566", "maya.mehta@example.com", "98765"]) assert.ok(!JSON.stringify(submitted).includes(privateValue));
  assert.ok(!("vault" in submitted) && !("names" in submitted));
  await expect(modal.locator(".action-card")).toHaveCount(4);
  console.log(`✓ API returns ${result.telemetry.mode}; only tokenized input transmitted; anonymous run saved`);
  const confirmation = modal.locator(".confirmation-check input").first();
  await confirmation.check();
  await expect(modal.getByText("USER CONFIRMED", { exact: true })).toBeVisible();
  const [ics] = await Promise.all([
    page.waitForEvent("download"),
    modal.getByRole("button", { name: "EXPORT REMINDER", exact: true }).click(),
  ]);
  await ics.saveAs("artifacts/reminder.ics");
  assert.ok((await fs.readFile("artifacts/reminder.ics", "utf8")).includes("BEGIN:VCALENDAR"));
  console.log("✓ Action confirmation and one-click RFC-5545 export work");

  await modal.getByRole("tab", { name: /RED-TEAM ARENA/ }).click();
  await expect(modal.locator(".critique-row")).toHaveCount(3);
  await modal.getByRole("tab", { name: /BILATERAL OUTPUT KIT/ }).click();
  const letter = await modal.getByLabel("Locally restored formal appeal letter").inputValue();
  assert.ok(letter.includes("Maya Mehta") && letter.includes("112233445566"));
  assert.ok(!letter.includes("[PERSON_1]"));
  await expect(modal.locator('.guide-step p[lang="hi"]').first()).toBeVisible();
  console.log("✓ Three critiques, Hindi guidance, and locally rehydrated appeal letter render");
  await modal.locator(".output-mode-toggle").getByRole("button", { name: "SYSTEM OWNER", exact: true }).click();
  await expect(modal.locator(".code-diff")).toBeVisible();
  assert.ok(await modal.locator(".diff-line.added").count() > 20);
  const diagnosis = await modal.locator(".friction-report").textContent();
  assert.ok(!diagnosis.includes("Maya") && !diagnosis.includes("@example.com"));
  const [patch] = await Promise.all([
    page.waitForEvent("download"),
    modal.getByRole("button", { name: "DOWNLOAD .TSX", exact: true }).click(),
  ]);
  assert.ok(patch.suggestedFilename().endsWith(".tsx"));
  const [packet] = await Promise.all([
    page.waitForEvent("download"),
    modal.getByRole("button", { name: "DOWNLOAD CASE PACKET .MD", exact: true }).click(),
  ]);
  assert.ok(packet.suggestedFilename().endsWith(".md"));
  await page.screenshot({ path: "artifacts/developer-output.png", fullPage: true });
  console.log("✓ System owner switch, anonymized report, highlighted diff and both developer exports work");
  await modal.getByRole("button", { name: "Close case workbench" }).click();
  await page.getByRole("button", { name: "View anonymous resolution activity" }).click();
  await expect(page.locator(".run-list article").first()).toBeVisible();
  assert.ok(!(await page.locator(".run-list").textContent()).includes("Maya"));
  await page.getByRole("button", { name: "Close operations dialog" }).click();
  console.log("✓ PostgreSQL-backed history displays anonymous run data only");

  await page.getByRole("button", { name: "Expand map" }).click();
  await expect(page.locator(".map-expanded")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".map-expanded")).toHaveCount(0);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Reset map zoom" }).click();
  await page.getByRole("button", { name: /NETWORK ANIMATION/ }).click();
  console.log("✓ Map expansion, Escape, zoom, reset and pause controls work");

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(baseURL, { waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390);
  await mobile.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  await mobile.getByRole("button", { name: /LAUNCH CASE WORKBENCH/ }).click();
  await expect(mobile.getByRole("dialog")).toBeVisible();
  await mobile.getByRole("tab", { name: /OUTPUT KIT/ }).click();
  await expect(mobile.getByLabel("Locally restored formal appeal letter")).toBeVisible();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390);
  await mobile.close();
  console.log("✓ 390px mobile dashboard and full-screen workbench have no horizontal overflow");
  assert.deepEqual(errors, []);
  console.log("\nAll browser checks passed; no hydration or uncaught browser errors.");
} finally { await browser.close(); }
