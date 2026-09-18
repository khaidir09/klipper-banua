import { expect, test } from "@playwright/test";
import { DEMO_CAMPAIGN_ID, demoCreatorId } from "./helpers";

/** Role limits seen by a manager after the owner flow (CLAUDE.md, FR-M8, FR-M11-02). */

test("manager cannot reach owner-only screens or finance proofs", async ({ page }) => {
  await test.step("the audit trail is owner-only", async () => {
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/dashboard\?akses=ditolak/);
    await expect(page.getByRole("link", { name: "Aktivitas" })).toHaveCount(0);
  });

  await test.step("finance: no approval, payment or proofs", async () => {
    await page.goto(`/campaigns/${DEMO_CAMPAIGN_ID}/finance`);
    await expect(page.getByText("Honor kreator", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Setujui" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tandai dibayar" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Bukti transfer|Lihat bukti/ })).toHaveCount(0);
  });

  await test.step("closing notes are locked on a closed campaign", async () => {
    await page.goto(`/campaigns/${DEMO_CAMPAIGN_ID}/report`);
    await expect(page.locator("#closing-notes")).toBeDisabled();
  });

  await test.step("no delete or anonymize for creators", async () => {
    await page.goto(`/creators/${demoCreatorId(1)}`);
    await expect(page.getByRole("button", { name: "Anonimkan data" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(0);
  });
});
