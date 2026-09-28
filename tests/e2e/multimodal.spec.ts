import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "../../lib/sampleData";

test.skip(
  !process.env.KOPIBRIDGE_TEST_USER_EMAIL,
  "Run via the disposable-account QA runner.",
);
const artifacts = path.resolve("reports/final-report-assets/multimodal");
const fixture = (file: string) =>
  path.resolve("tests/fixtures/multimodal", file);
async function login(page: Page, secondary = false) {
  const prefix = secondary ? "SECONDARY" : "USER";
  await page.goto("/login");
  await page
    .getByLabel("Email address")
    .fill(process.env[`KOPIBRIDGE_TEST_${prefix}_EMAIL`]!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env[`KOPIBRIDGE_TEST_${prefix}_PASSWORD`]!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });
}

test("integrated image to report to spoken interview with private persistence", async ({
  page,
  browser,
}) => {
  test.setTimeout(300000);
  mkdirSync(artifacts, { recursive: true });
  const errors: string[] = [];
  const checks: Record<string, unknown> = {};
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const shot = async (name: string, fullPage = false) =>
    page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage });
  await page.goto("/");
  await shot("01-landing");
  const anonymous = await page.request.post("/api/resume/extract", {
    data: {},
  });
  expect(anonymous.status()).toBe(401);
  checks.unauthenticated = 401;
  await login(page);
  await expect(page.getByText("3 of 3", { exact: true })).toBeVisible();
  await shot("02-dashboard");
  await page.goto("/analysis/new");
  await expect(page.getByLabel("Upload resume", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Upload resume", { exact: true })
    .setInputFiles(fixture("resume-text.pdf"));
  await expect(page.getByLabel("Resume text", { exact: true })).toHaveValue(
    /Flask/,
    { timeout: 20000 },
  );
  checks.textPdf = true;
  await page
    .getByLabel("Upload resume", { exact: true })
    .setInputFiles(fixture("resume-scanned.pdf"));
  await expect(
    page.getByRole("heading", { name: "Read scanned resume pages" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Read resume pages" }),
  ).toBeDisabled();
  await shot("03-scan-consent");
  await page
    .getByLabel("I agree to send these pages for AI extraction.")
    .check();
  const extraction = page.waitForResponse((r) =>
    r.url().endsWith("/api/resume/extract"),
  );
  await page.getByRole("button", { name: "Read resume pages" }).click();
  expect((await extraction).status()).toBe(200);
  await expect(page.getByLabel("Resume text", { exact: true })).toHaveValue(
    /Flask/,
  );
  checks.vision = true;
  await shot("04-reviewed-resume");
  await page.getByRole("button", { name: "Load Demo Job Description" }).click();
  const analysis = page.waitForResponse(
    (r) => r.url().endsWith("/api/analyse"),
    { timeout: 90000 },
  );
  await page.getByRole("button", { name: /analyse gap/i }).click();
  const response = await analysis;
  expect(response.status()).toBe(201);
  const body = await response.json();
  checks.remainingAfterAnalysis = body.remaining;
  expect(body.remaining).toBe(2);
  await expect(page).toHaveURL(/\/history\/[0-9a-f-]{36}$/);
  const reportUrl = page.url();
  const id = reportUrl.split("/").at(-1)!;
  await shot("05-report-summary");
  await shot("06-report-full", true);
  await page
    .getByRole("heading", { name: "Practise your evidence story" })
    .scrollIntoViewIfNeeded();
  await page
    .getByLabel("Upload interview audio")
    .setInputFiles(fixture("answer-specific.wav"));
  await expect(
    page.getByRole("button", { name: "Transcribe answer" }),
  ).toBeVisible();
  await page.getByLabel(/I agree to send this audio/).check();
  await shot("07-audio-ready");
  const transcription = page.waitForResponse(
    (r) => r.url().endsWith("/transcribe"),
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Transcribe answer" }).click();
  expect((await transcription).status()).toBe(200);
  await expect(
    page.getByLabel("Review your answer", { exact: true }),
  ).toHaveValue(/Flask/);
  await shot("08-transcript-review");
  await page
    .getByLabel("I have corrected the text and it represents my answer.")
    .check();
  const feedback = page.waitForResponse((r) => r.url().endsWith("/interview"), {
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Save interview feedback" }).click();
  const feedbackResponse = await feedback;
  expect(feedbackResponse.status()).toBe(200);
  const result = await feedbackResponse.json();
  expect(result.source).toBe("openai");
  checks.feedbackModel = result.model;
  await page
    .getByText("Saved interview feedback", { exact: true })
    .scrollIntoViewIfNeeded();
  await shot("09-saved-feedback");
  await page.reload();
  await expect(
    page.getByText("Saved interview feedback", { exact: true }),
  ).toBeVisible();
  checks.persistence = true;
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printCalled = "true";
    };
  });
  await page.getByRole("button", { name: /save report/i }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-print-called",
    "true",
  );
  await page.pdf({
    path: path.join(artifacts, "printed-career-report.pdf"),
    format: "A4",
    printBackground: false,
  });
  checks.printWiring = true;
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("heading", { name: "Practise your evidence story" })
      .scrollIntoViewIfNeeded();
    await shot(`10-practice-${width}`);
  }
  checks.noOverflowWidths = [390, 768, 1440];
  await page.goto("/dashboard");
  await expect(page.getByText("2 of 3", { exact: true })).toBeVisible();
  checks.mediaDoesNotSpendAnalysisCredit = true;
  await page.goto("/history");
  await shot("11-history");
  const other = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const foreign = await other.newPage();
  await login(foreign, true);
  await foreign.goto(reportUrl);
  await expect(
    foreign.getByRole("heading", { name: "Report not found" }),
  ).toBeVisible();
  expect(
    (
      await foreign.request.post(`/api/analyses/${id}/interview`, { data: {} })
    ).status(),
  ).toBe(404);
  expect((await foreign.request.delete(`/api/analyses/${id}`)).status()).toBe(
    404,
  );
  await other.close();
  checks.ownerIsolation = true;
  const key = crypto.randomUUID();
  const payload = {
    resumeText: SAMPLE_RESUME,
    jobDescription: SAMPLE_JOB_DESCRIPTION,
    targetRole: "Junior AI Engineer",
    idempotencyKey: key,
  };
  const concurrent = await Promise.all([
    page.request.post("/api/analyse", { data: payload, timeout: 90000 }),
    page.request.post("/api/analyse", { data: payload, timeout: 90000 }),
  ]);
  expect(concurrent.filter((r) => r.status() === 201)).toHaveLength(1);
  expect(concurrent.some((r) => [200, 409].includes(r.status()))).toBe(true);
  checks.concurrentDuplicateStatuses = concurrent.map((r) => r.status());
  expect(
    (
      await page.request.post("/api/analyse", {
        data: { ...payload, idempotencyKey: crypto.randomUUID() },
        timeout: 90000,
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await page.request.post("/api/analyse", {
        data: { ...payload, idempotencyKey: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(429);
  await page.goto("/analysis/new");
  await expect(
    page.getByRole("button", { name: /analyse gap/i }),
  ).toBeDisabled();
  await shot("12-zero-credits");
  checks.fourthAnalysisBlocked = true;
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot("13-delete-confirmation");
  await page
    .getByRole("button", { name: "Delete report", exact: true })
    .click();
  await expect(page).toHaveURL(/\/history$/);
  checks.deletion = true;
  // Intentional rejected API requests can emit browser network errors; UI errors are captured separately.
  checks.consoleErrors = errors;
  writeFileSync(
    "reports/evaluation/browser-results.json",
    JSON.stringify({ date: new Date().toISOString(), checks }, null, 2),
  );
  expect(errors).toEqual([]);
});
