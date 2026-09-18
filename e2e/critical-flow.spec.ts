import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_CAMPAIGN_ID,
  PROOF_FILE,
  alertDialog,
  demoCreatorId,
  dialog,
  expectToast,
} from "./helpers";

/**
 * PRD section 5.2, start to finish, on the demo campaign as the owner:
 * assign creators → activate → draft, revision, approval → posted → metric
 * snapshot, registrant report and a tracking click → close → payouts → client
 * invoice → report (print + CSV) → audit trail.
 */

const campaign = (tab: string) => `/campaigns/${DEMO_CAMPAIGN_ID}/${tab}`;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());

async function assign(page: Page, creatorNumber: number, contents: string) {
  await page.getByRole("button", { name: "Tugaskan kreator" }).click();
  const form = dialog(page);
  await form.locator("#as-creator").selectOption(demoCreatorId(creatorNumber));
  await form.locator("#as-status").selectOption("bergabung");
  await form.locator("#as-contents").fill(contents);
  await form.getByRole("button", { name: "Tugaskan" }).click();
  await expect(form).toBeHidden();
}

async function tickChecklist(page: Page) {
  const boxes = dialog(page).getByRole("checkbox");
  for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();
}

test.describe.configure({ mode: "serial" });

test("owner runs the demo campaign from assignment to final report", async ({ page }) => {
  await test.step("assign two verified creators", async () => {
    await page.goto(campaign("creators"));
    await assign(page, 1, "2");
    await assign(page, 2, "1");
    await expect(page.getByText(/\/r\/rina-kuliner-/)).toBeVisible();
    await expect(page.getByText(/\/r\/fauzi-kampus-/)).toBeVisible();
  });

  await test.step("activate the campaign", async () => {
    await page.getByRole("button", { name: "Aktifkan" }).click();
    await alertDialog(page).getByRole("button", { name: "Aktifkan" }).click();
    await expectToast(page, /aktif/i);
    await expect(page.getByRole("button", { name: "Tandai selesai" })).toBeVisible();
  });

  await test.step("record a draft, request a revision, approve the new draft", async () => {
    await page.goto(campaign("contents"));
    await page.getByRole("button", { name: "Catat konten" }).click();
    let form = dialog(page);
    await form.locator("#ct-assignment").selectOption({ index: 0 });
    await form.locator("#ct-platform").selectOption("tiktok");
    await form.locator("#ct-url").fill("https://www.tiktok.com/@rina.kuliner/video/1001");
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toBeHidden();

    await page.getByRole("button", { name: "Review", exact: true }).click();
    form = dialog(page);
    await form.locator("#rv-notes").fill("Tambahkan label konten berbayar di awal video.");
    await form.getByRole("button", { name: "Minta revisi" }).click();
    await expect(form).toBeHidden();

    await page.getByRole("button", { name: "Catat draf baru" }).click();
    form = dialog(page);
    await form.locator("#ct-url").fill("https://www.tiktok.com/@rina.kuliner/video/1002");
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toBeHidden();

    await page.getByRole("button", { name: "Review", exact: true }).click();
    await tickChecklist(page);
    await dialog(page).getByRole("button", { name: "Setujui" }).click();
    await expect(dialog(page)).toBeHidden();
  });

  await test.step("mark the content as posted", async () => {
    await page.getByRole("button", { name: "Tandai tayang" }).click();
    const form = dialog(page);
    await form.locator("#ps-url").fill("https://www.tiktok.com/@rina.kuliner/video/2001");
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toBeHidden();
    await expect(page.getByRole("button", { name: "Ubah data tayang" })).toBeVisible();
  });

  await test.step("enter a metric snapshot with proof and a registrant report", async () => {
    await page.goto(campaign("metrics"));
    await page.getByRole("button", { name: "Tambah snapshot" }).click();
    let form = dialog(page);
    await form.locator("#sn-views").fill("12000");
    await form.locator("#sn-likes").fill("640");
    await form.locator("#sn-proof").setInputFiles(PROOF_FILE);
    await form.getByRole("button", { name: "Simpan snapshot" }).click();
    await expect(form).toBeHidden({ timeout: 30_000 });

    await page.getByRole("button", { name: "Catat laporan" }).click();
    form = dialog(page);
    await form.locator("#rr-start").fill(today);
    await form.locator("#rr-end").fill(today);
    await form.locator("#rr-count").fill("5");
    await form.getByRole("button", { name: "Simpan laporan" }).click();
    await expect(form).toBeHidden();
    await expect(page.getByText("12.000").first()).toBeVisible();
  });

  await test.step("a tracking link redirects only to the campaign landing URL", async () => {
    await page.goto(campaign("creators"));
    const text = await page.locator("main").innerText();
    const slug = text.match(/\/r\/(rina-kuliner-[a-z0-9]+)/)?.[1];
    expect(slug).toBeTruthy();
    const response = await page.request.get(`/r/${slug}?next=https://evil.example`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toMatch(/^https:\/\/pmb\.kampus-demo\.example\/daftar/);
  });

  await test.step("close the campaign", async () => {
    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await alertDialog(page).getByRole("button", { name: "Tandai selesai" }).click();
    await expect(page.getByText("Kampanye sudah ditutup.", { exact: false })).toBeVisible();
  });

  await test.step("calculate, approve and pay a creator fee", async () => {
    await page.goto(campaign("finance"));
    await page.getByRole("button", { name: "Hitung semua honor" }).click();
    await expect(page.getByRole("button", { name: "Setujui" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Setujui" }).first().click();
    await expect(page.getByRole("button", { name: "Tandai dibayar" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Tandai dibayar" }).first().click();
    const form = dialog(page);
    await form.locator("#paid-proof").setInputFiles(PROOF_FILE);
    await form.getByRole("button", { name: "Tandai dibayar" }).click();
    await expect(form).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText("Dibayar", { exact: true }).first()).toBeVisible();
  });

  await test.step("invoice the client and record full payment", async () => {
    await page.getByRole("button", { name: "Catat invoice" }).click();
    let form = dialog(page);
    await form.locator("#inv-number").fill("inv-demo-2026-001");
    await form.locator("#inv-amount").fill("15000000");
    await form.locator("#inv-due").fill(today);
    await form.getByRole("button", { name: "Simpan invoice" }).click();
    await expect(form).toBeHidden();
    await expect(page.getByText("INV-DEMO-2026-001")).toBeVisible();

    await page.getByRole("button", { name: "Catat pembayaran" }).click();
    form = dialog(page);
    await form.locator("#rc-amount").fill("15000000");
    await form.locator("#rc-date").fill(today);
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toBeHidden();
    await expect(page.getByText("Lunas", { exact: true })).toBeVisible();
  });

  await test.step("final report prints on A4 without internal finance data", async () => {
    await page.goto(campaign("report"));
    await page.locator("#closing-notes").fill("Uji E2E: kampanye demo selesai sesuai alur.");
    await page.getByRole("button", { name: "Simpan catatan" }).click();
    await expectToast(page, "Catatan penutup disimpan.");

    await page.goto(`/print/campaigns/${DEMO_CAMPAIGN_ID}`);
    const report = page.locator(".report-document");
    await expect(
      report.getByRole("heading", { name: "PMB Universitas Demo Borneo" }),
    ).toBeVisible();
    await expect(report).toContainText("Uji E2E: kampanye demo selesai sesuai alur.");
    await expect(report).toContainText("12.000");
    await expect(report).not.toContainText("Rp");

    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    // A4 is 595 × 842 points (Chrome writes e.g. 594.96 × 841.92).
    expect(pdf.toString("latin1")).toMatch(/MediaBox\s*\[0 0 59[45](\.\d+)? 84[12](\.\d+)?\]/);
  });

  await test.step("CSV exports open in spreadsheets (UTF-8 BOM, semicolons)", async () => {
    const response = await page.request.get(campaign("report/csv/kreator"));
    expect(response.headers()["content-type"]).toContain("text/csv");
    const body = await response.text();
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body).toContain(
      "Kreator;Kode referal;Platform;Konten tayang;Views;Klik valid;Pendaftar",
    );
    // The click count depends on whether the test browser's user agent is
    // flagged as a bot, so only its presence is checked.
    expect(body).toMatch(/rina\.kuliner;[A-Z0-9]+;TikTok;1;12000;\d+;5/);
    expect(body).not.toMatch(/Rp|honor/i);
  });

  await test.step("every step left an audit entry", async () => {
    await page.goto("/activity?entity_type=payout");
    // Scoped to the log list: the filter dropdown has options with the same words.
    const entries = page.getByRole("listitem");
    await expect(entries.filter({ hasText: "menandai dibayar" }).first()).toBeVisible();
    await page.goto("/activity?entity_type=campaign");
    await expect(entries.filter({ hasText: "mengubah status" }).first()).toBeVisible();
  });
});
