import { expect, test, type Page } from "@playwright/test";
import { DEMO_PORTAL_CAMPAIGN_ID, PROOF_FILE, dialog, expectToast } from "./helpers";

/**
 * The phase 10 hand-off (PRD M13): the creator fills in, the team decides.
 * Runs as the creator, with a second context for the team, on the demo
 * campaign that stays running (DEMO-PORTAL-2026).
 */

const DRAFT_URL = "https://drive.example/portal-e2e-draft";
/** The caption identifies the card in the team's list (the draft link is a button). */
const CAPTION = "Draf dari portal kreator untuk open house.";
const LIVE_URL = "https://www.tiktok.com/@rina.kuliner/video/portal-e2e";

async function openAssignment(page: Page) {
  await page.goto("/portal/penugasan");
  await page
    .getByRole("link", { name: /Open House Universitas Demo Borneo/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: /Open House/ })).toBeVisible();
}

test("a creator sends a draft, reports it live and gets the metrics verified", async ({
  page,
  browser,
}) => {
  const team = await browser.newContext({ storageState: "e2e/.auth/owner.json" });
  const teamPage = await team.newPage();
  const contents = `/campaigns/${DEMO_PORTAL_CAMPAIGN_ID}/contents`;

  await test.step("the creator sends a draft", async () => {
    await openAssignment(page);
    await page.getByRole("button", { name: "Kirim draf" }).first().click();
    const form = dialog(page);
    await form.locator("#pd-platform").selectOption("tiktok");
    await form.locator("#pd-url").fill(DRAFT_URL);
    await form.locator("#pd-caption").fill(CAPTION);
    await form.getByRole("button", { name: "Kirim" }).click();
    await expectToast(page, /Draf terkirim/);
  });

  await test.step("it lands in the team's review queue", async () => {
    await teamPage.goto(contents);
    const card = teamPage.locator("li").filter({ hasText: CAPTION });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Review", exact: true }).click();
    const form = dialog(teamPage);
    const boxes = form.getByRole("checkbox");
    for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();
    await form.getByRole("button", { name: "Setujui" }).click();
    await expect(form).toBeHidden();
  });

  await test.step("the creator reports it live; the team confirms", async () => {
    await openAssignment(page);
    await page.getByRole("button", { name: "Laporkan tayang" }).first().click();
    const form = dialog(page);
    await form.locator("#pp-url").fill(LIVE_URL);
    await form.getByRole("button", { name: "Kirim laporan" }).click();
    await expectToast(page, /Laporan tayang terkirim/);
    await expect(page.getByText("menunggu konfirmasi tim", { exact: false })).toBeVisible();

    await teamPage.goto(contents);
    const card = teamPage.locator("li").filter({ hasText: CAPTION });
    await expect(card.getByText("Laporan kreator", { exact: false })).toBeVisible();
    await card.getByRole("button", { name: "Konfirmasi tayang" }).click();
    await expectToast(teamPage, /Laporan tayang kreator dikonfirmasi/);
  });

  await test.step("the creator sends metrics, which stay unofficial until accepted", async () => {
    await openAssignment(page);
    // Scoped to the content of this test; the demo campaign has another one.
    const own = page.locator("[id^='konten-']").filter({ hasText: CAPTION });
    await own.getByRole("button", { name: /Kirim bukti metrik/ }).click();
    const form = dialog(page);
    await form.locator("#ms-views").fill("5100");
    await form.locator("#ms-likes").fill("310");
    await form.locator("#ms-proof").setInputFiles(PROOF_FILE);
    await form.getByRole("button", { name: "Kirim bukti" }).click();
    await expectToast(page, /Bukti metrik terkirim/, 30_000);

    // The queue shows the numbers so the team can check them, but they are not
    // counted yet: the campaign total still holds only the seeded 8.200 views
    // (FR-M13-06).
    await teamPage.goto(`/campaigns/${DEMO_PORTAL_CAMPAIGN_ID}/metrics`);
    await expect(teamPage.getByText(/Kiriman metrik menunggu verifikasi/)).toBeVisible();
    await expect(teamPage.getByRole("main")).not.toContainText("13.300");
  });

  await test.step("the team accepts them and the numbers become official", async () => {
    await teamPage.getByRole("button", { name: "Terima" }).first().click();
    await expectToast(teamPage, /Kiriman diterima/);
    await expect(teamPage.getByRole("main")).toContainText("13.300");

    await openAssignment(page);
    await expect(page.getByText("Diterima", { exact: false }).first()).toBeVisible();
  });

  await team.close();
});
