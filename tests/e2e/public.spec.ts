import { expect, test } from "@playwright/test";

test("public landing and auth entry points are clear and responsive", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /see what stands between your resume/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create free account/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("invalid login feedback is local and helpful", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /valid email|at least 8/i }),
  ).toBeVisible();
});

test("protected routes redirect visitors to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});
