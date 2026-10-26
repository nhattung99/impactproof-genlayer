import { test, expect, chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
// Opt-in only. Uses a dedicated browser profile containing the owner's wallet.
// The human confirms EVERY wallet request. No key handling or auto-deployment.
test("real studionet workflow @integration", async ({}, testInfo) => {
  test.skip(
    process.env.IMPACTPROOF_INTEGRATION !== "1" ||
      testInfo.project.name !== "desktop",
    "Requires owner-deployed contract, real evidence, and interactive wallet confirmations",
  );
  test.setTimeout(30 * 60 * 1000);
  const profile = process.env.IMPACTPROOF_WALLET_PROFILE;
  const fixture = process.env.IMPACTPROOF_REAL_PROJECT_FILE;
  if (!profile || !fixture)
    throw new Error(
      "Set IMPACTPROOF_WALLET_PROFILE and IMPACTPROOF_REAL_PROJECT_FILE",
    );
  const input = JSON.parse(await readFile(fixture, "utf8")) as {
    project: Record<string, string | number>;
    milestone: Record<string, string | number>;
    evidence: { urls: string[]; explanation: string };
  };
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chrome",
    headless: false,
  });
  const page = await context.newPage();
  const base = process.env.IMPACTPROOF_BASE_URL || "http://127.0.0.1:3001";
  async function finalized() {
    await expect(
      page
        .getByRole("status")
        .filter({
          hasText: "Transaction finalized with successful execution.",
        }),
    ).toBeVisible({ timeout: 15 * 60 * 1000 });
  }
  try {
    await page.goto(`${base}/projects/new`);
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    // Complete wallet connection/network prompts in the visible browser.
    await expect(
      page.getByRole("button", { name: "Register project", exact: true }),
    ).toBeEnabled({ timeout: 120000 });
    for (const [key, value] of Object.entries(input.project)) {
      const field = page.locator(`[name="${key}"]`);
      if (key === "category") await field.selectOption(String(value));
      else await field.fill(String(value));
    }
    await page
      .getByRole("button", { name: "Register project", exact: true })
      .click();
    await finalized();
    await page.goto(`${base}/dashboard`);
    await page
      .getByRole("link")
      .filter({
        has: page.getByRole("heading", {
          name: String(input.project.name),
          exact: true,
        }),
      })
      .click();
    const projectUrl = page.url();
    await page.getByRole("button", { name: "Add milestone" }).click();
    for (const [key, value] of Object.entries(input.milestone))
      await page.locator(`[name="${key}"]`).fill(String(value));
    await page
      .getByRole("button", { name: "Create milestone", exact: true })
      .click();
    await finalized();
    await page
      .getByRole("link")
      .filter({
        has: page.getByRole("heading", {
          name: String(input.milestone.outcome),
          exact: true,
        }),
      })
      .click();
    await page.locator('[name="urls"]').fill(input.evidence.urls.join("\n"));
    await page.locator('[name="explanation"]').fill(input.evidence.explanation);
    await page
      .getByRole("button", { name: "Submit evidence", exact: true })
      .click();
    await finalized();
    await page
      .getByRole("button", { name: "Request verification", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Finalized verdict" }),
    ).toBeVisible({ timeout: 15 * 60 * 1000 });
    const reasoning = await page
      .getByText("Reasoning", { exact: true })
      .locator("..")
      .innerText();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Finalized verdict" }),
    ).toBeVisible();
    await expect(
      page.getByText("Reasoning", { exact: true }).locator(".."),
    ).toContainText(reasoning);
    expect(projectUrl).toMatch(/\/projects\/\d+$/);
  } finally {
    await context.close();
  }
});
