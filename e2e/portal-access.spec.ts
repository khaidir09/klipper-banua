import { expect, test } from "@playwright/test";
import { demoCreatorId, expectToast } from "./helpers";

/**
 * FR-M13-08: the owner withdraws and restores portal access. The demo creator
 * already has an account (created by `npm run seed:demo`), so no invitation
 * email is sent here; access is left active for the portal tests.
 */

test("owner withdraws and restores portal access", async ({ page }) => {
  await page.goto(`/creators/${demoCreatorId(1)}`);
  await page.getByRole("tab", { name: "Portal" }).click();

  const card = page.getByRole("tabpanel").filter({ hasText: "Akses portal kreator" });
  await expect(card.getByText("Akses aktif")).toBeVisible();

  await card.getByRole("button", { name: "Cabut akses" }).click();
  await expectToast(page, /Akses portal dicabut/);
  await expect(card.getByText("Akses dicabut")).toBeVisible();

  await card.getByRole("button", { name: "Aktifkan kembali" }).click();
  await expectToast(page, /Akses portal diaktifkan/);
  await expect(card.getByText("Akses aktif")).toBeVisible();
});
