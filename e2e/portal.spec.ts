import { expect, test } from "@playwright/test";
import { DEMO_CAMPAIGN_ID, demoCreatorId } from "./helpers";

/**
 * Creator portal (PRD M13, phase 9). Runs after the owner flow, so the demo
 * campaign is finished and creator #1 has an assignment with a brief.
 */

test("a creator sees their own brief and nothing internal", async ({ page }) => {
  await test.step("the portal greets the creator and hides the internal menu", async () => {
    await page.goto("/portal");
    await expect(page.getByRole("heading", { name: /Halo/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Klien" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Kampanye" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Penugasan", exact: true })).toBeVisible();
  });

  await test.step("the brief carries the referral code but no client price", async () => {
    // The demo campaign is finished by the owner flow, so it is listed here.
    await page.goto("/portal/penugasan");
    await expect(page.getByRole("link", { name: /PMB Universitas Demo Borneo/ })).toBeVisible();
    await page
      .getByRole("link", { name: /PMB Universitas Demo Borneo/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/portal\/penugasan\/[0-9a-f-]{36}/);

    await expect(page.getByText("Ajak lulusan SMA/SMK", { exact: false })).toBeVisible();
    await expect(page.getByText("#PMBDemoBorneo")).toBeVisible();
    await expect(page.getByText(/\/r\/rina-kuliner-/)).toBeVisible();
    // "Honor dasar" appears in the fee scheme and in the fee card (M13 phase 10).
    await expect(page.getByText("Honor dasar").first()).toBeVisible();

    // FR-M13-04: the package price and the campaign targets stay internal.
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(body).not.toContain("15.000.000");
    expect(body).not.toContain("150.000");
  });

  await test.step("another assignment is not found", async () => {
    await page.goto("/portal/penugasan/de300000-0000-4000-8000-00000000ffff");
    await expect(page.getByText("Data tidak ditemukan")).toBeVisible();
  });

  await test.step("the profile shows this creator only", async () => {
    await page.goto("/portal/profil");
    await expect(page.getByText("Rina Aulia").first()).toBeVisible();
    await expect(page.getByText("Ahmad Fauzi")).toHaveCount(0);
  });
});

test("internal routes stay closed to a creator", async ({ page, request }) => {
  for (const path of ["/dashboard", "/campaigns", `/creators/${demoCreatorId(1)}`, "/activity"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/portal/);
  }

  // FR-M15-01: the landing page is public and static, so a signed-in visitor
  // stays on it; "Masuk" is what leads into their own area.
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // FR-M9-04 exports are for the team (checked without following redirects).
  const csv = await request.get(`/campaigns/${DEMO_CAMPAIGN_ID}/report/csv/kreator`);
  expect(csv.status()).toBe(401);
});
