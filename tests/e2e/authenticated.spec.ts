import { expect, test, type Page } from "@playwright/test";

const primaryEmail = process.env.KOPIBRIDGE_TEST_USER_EMAIL;
const primaryPassword = process.env.KOPIBRIDGE_TEST_USER_PASSWORD;
const secondaryEmail = process.env.KOPIBRIDGE_TEST_SECONDARY_EMAIL;
const secondaryPassword = process.env.KOPIBRIDGE_TEST_SECONDARY_PASSWORD;
const hasCredentials = Boolean(
  primaryEmail && primaryPassword && secondaryEmail && secondaryPassword,
);

test.skip(
  !hasCredentials,
  "Authenticated smoke test requires temporary QA credentials.",
);

async function gotoWithNetworkRetry(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path);
      return;
    } catch (error) {
      if (
        attempt === 2 ||
        !(error instanceof Error) ||
        !error.message.includes("ERR_NETWORK_CHANGED")
      ) {
        throw error;
      }
      await page.waitForTimeout(500);
    }
  }
}

async function signIn(page: Page, email: string, password: string) {
  await gotoWithNetworkRetry(page, "/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createAnalysis(page: Page) {
  await gotoWithNetworkRetry(page, "/analysis/new");
  await page.getByRole("button", { name: "Use Sample Resume Text" }).click();
  await page.getByRole("button", { name: "Load Demo Job Description" }).click();

  const analyseButton = page.getByRole("button", { name: /analyse gap/i });
  await expect(analyseButton).toBeEnabled();
  const analysisResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/analyse") &&
      response.request().method() === "POST",
  );
  await analyseButton.click();
  const analysisResponse = await analysisResponsePromise;
  const analysisBody = await analysisResponse.text();
  expect(
    analysisResponse.status(),
    `Analysis API returned ${analysisResponse.status()}: ${analysisBody}`,
  ).toBe(201);
  await expect(page).toHaveURL(/\/history\/[0-9a-f-]{36}$/i);
  await expect(page.getByText("Overall match estimate")).toBeVisible();

  return page.url().split("/").at(-1) ?? "";
}

test("authenticated analysis, credits, ownership, print, and deletion", async ({
  browser,
  page,
}) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await signIn(page, primaryEmail!, primaryPassword!);
  await expect(page.getByText("3 of 3", { exact: true })).toBeVisible();

  const firstAnalysisId = await createAnalysis(page);
  await page.evaluate(() => {
    Object.defineProperty(window, "print", {
      configurable: true,
      value: () => document.body.setAttribute("data-print-called", "true"),
    });
  });
  await page.getByRole("button", { name: /save report/i }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-print-called",
    "true",
  );

  await gotoWithNetworkRetry(page, "/dashboard");
  await expect(page.getByText("2 of 3", { exact: true })).toBeVisible();
  await createAnalysis(page);
  const thirdAnalysisId = await createAnalysis(page);

  await gotoWithNetworkRetry(page, "/analysis/new");
  await expect(page.getByText("0 of 3 remaining today")).toBeVisible();
  await expect(page.getByText(/daily limit reached/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /analyse gap/i }),
  ).toBeDisabled();

  const secondaryContext = await browser.newContext();
  const secondaryPage = await secondaryContext.newPage();
  await signIn(secondaryPage, secondaryEmail!, secondaryPassword!);
  await gotoWithNetworkRetry(secondaryPage, `/history/${firstAnalysisId}`);
  await expect(
    secondaryPage.getByRole("heading", { name: "Report not found" }),
  ).toBeVisible();
  const deleteResponse = await secondaryPage.request.delete(
    `/api/analyses/${firstAnalysisId}`,
  );
  expect(deleteResponse.status()).toBe(404);
  await secondaryContext.close();

  await gotoWithNetworkRetry(page, `/history/${thirdAnalysisId}`);
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Delete report" }).click();
  await expect(page).toHaveURL(/\/history$/);

  expect(consoleErrors).toEqual([]);
});
