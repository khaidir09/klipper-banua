import { expect, test } from "@playwright/test";
import { DEMO_CAMPAIGN_ID, demoCreatorId } from "./helpers";

/**
 * Client portal (PRD M14, phase 11). Runs after the owner flow, so the demo
 * client has one finished campaign and one that is still running.
 */

test("a client sees its own campaigns and nothing internal", async ({ page }) => {
  await test.step("the portal greets the contact and hides the internal menu", async () => {
    await page.goto("/klien");
    await expect(page.getByRole("heading", { name: /Halo/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Klien" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Kreator" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Kampanye", exact: true })).toBeVisible();
  });

  await test.step("the campaign page shows verified numbers, not internal ones", async () => {
    await page
      .getByRole("link", { name: /Open House Universitas Demo Borneo/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/klien\/kampanye\/[0-9a-f-]{36}/);

    await expect(page.getByText("Total views")).toBeVisible();
    await expect(page.getByText("Per kreator")).toBeVisible();
    // Creators appear by stage name only (FR-M14-03).
    await expect(page.getByText("rina.kuliner").first()).toBeVisible();
    await expect(page.getByText("Rina Aulia")).toHaveCount(0);

    // FR-M14-03: the package price and the fee scheme stay internal.
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(body).not.toContain("9.000.000");
    expect(body).not.toContain("300.000");
  });

  await test.step("a campaign of another client is not found", async () => {
    await page.goto("/klien/kampanye/de300000-0000-4000-8000-00000000ffff");
    await expect(page.getByText("Data tidak ditemukan")).toBeVisible();
  });
});

test("internal and creator routes stay closed to a client", async ({ page, request }) => {
  for (const path of [
    "/dashboard",
    "/campaigns",
    `/creators/${demoCreatorId(1)}`,
    "/activity",
    "/portal",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/klien/);
  }

  await page.goto("/");
  await expect(page).toHaveURL(/\/klien/);

  // FR-M9-04 exports are for the team (checked without following redirects).
  const csv = await request.get(`/campaigns/${DEMO_CAMPAIGN_ID}/report/csv/kreator`);
  expect(csv.status()).toBe(401);
});
