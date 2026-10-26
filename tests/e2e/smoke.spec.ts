import { test, expect } from "@playwright/test";
test("public app works before deployment", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Provable impact",
  );
  await page.goto("/explore");
  await expect(page.getByText("Awaiting contract deployment")).toBeVisible();
  await page.goto("/projects/new");
  await expect(
    page.getByRole("button", { name: "Register project", exact: true }),
  ).toBeDisabled();
  await page.goto("/dashboard");
  await expect(
    page.getByText("Your workspace starts with a wallet."),
  ).toBeVisible();
});
test("responsive navigation exposes all destinations", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Verification", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The verification record." }),
  ).toBeVisible();
});
