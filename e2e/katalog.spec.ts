import { expect, test } from "@playwright/test";
import { DEMO_OPEN_CAMPAIGN_ID, alertDialog, expectToast } from "./helpers";

/**
 * Open campaigns and the catalog (PRD M17, Fase 16). The demo klipper agreed
 * to an older version of the Syarat Klipper, so they accept the current one
 * first (FR-M3-04), then join (FR-M17-04) and withdraw (FR-M17-05).
 * `npm run seed:demo:reset` brings the open campaign back to "not joined".
 */

const CAMPAIGN = /Klip Wisuda Universitas Demo Borneo/;

test("a klipper finds an open campaign, joins it and withdraws", async ({ page }) => {
  await test.step("the catalog lists the open campaign without internal numbers", async () => {
    await page.goto("/portal/kampanye");
    await expect(page.getByRole("heading", { name: "Katalog kampanye" })).toBeVisible();
    const card = page.getByRole("link", { name: CAMPAIGN });
    await expect(card).toBeVisible();

    // FR-M17-03: rate and remaining share, never the package price or budget.
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(body).toContain("Rp 10.000");
    expect(body).toContain("Sisa anggaran");
    expect(body).not.toContain("12.000.000");
    expect(body).not.toContain("5.000.000");
    // Legacy package campaigns stay out of the catalog.
    expect(body).not.toContain("Open House Universitas Demo Borneo");
  });

  await test.step("filters narrow the list", async () => {
    await page.goto("/portal/kampanye?platform=facebook");
    await expect(page.getByRole("link", { name: CAMPAIGN })).toHaveCount(0);
    await page.goto("/portal/kampanye?platform=tiktok&urut=tarif");
    await expect(page.getByRole("link", { name: CAMPAIGN })).toBeVisible();
  });

  await test.step("the brief and material are readable before joining", async () => {
    await page.getByRole("link", { name: CAMPAIGN }).click();
    await expect(page).toHaveURL(`/portal/kampanye/${DEMO_OPEN_CAMPAIGN_ID}`);
    await expect(page.getByText("Potong video wisuda", { exact: false })).toBeVisible();
    await expect(page.getByText("Mengubah makna ucapan narasumber")).toBeVisible();
    await expect(page.getByText("Video wisuda lengkap (tautan)")).toBeVisible();
  });

  await test.step("joining waits for the current terms", async () => {
    await expect(page.getByText(/Syarat Klipper sudah diperbarui/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Gabung" })).toBeDisabled();
    await page.getByLabel(/Saya sudah membaca dan menyetujui Syarat Klipper/).check();
    await page.getByRole("button", { name: "Setujui syarat" }).click();
    await expectToast(page, /Syarat Klipper versi .* disetujui/);
  });

  await test.step("joining confirms the brief and opens the assignment", async () => {
    await page.getByLabel(/Saya sudah membaca brief/).check();
    await page.getByRole("button", { name: "Gabung" }).click();
    await expect(page).toHaveURL(/\/portal\/penugasan\/[0-9a-f-]{36}/);
    await expect(page.getByRole("heading", { name: CAMPAIGN })).toBeVisible();
    await expect(page.getByText("Tarif per 1.000 views")).toBeVisible();
    // The server generated the tracking link from the stage name.
    await expect(page.getByText(/\/r\/rina-kuliner-/)).toBeVisible();
  });

  await test.step("the klipper withdraws", async () => {
    await page.getByRole("button", { name: "Mundur" }).click();
    await alertDialog(page).getByRole("button", { name: "Ya, mundur" }).click();
    await expectToast(page, /sudah mundur/);
    await expect(page.getByText(/Kamu mundur dari kampanye ini/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Mundur" })).toHaveCount(0);
  });

  await test.step("the catalog remembers the klipper was on this campaign", async () => {
    await page.goto(`/portal/kampanye/${DEMO_OPEN_CAMPAIGN_ID}`);
    await expect(page.getByText("Kamu sudah ikut kampanye ini.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gabung" })).toHaveCount(0);
  });
});
