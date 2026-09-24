import { expect, test } from "@playwright/test";
import { PROOF_FILE, dialog, expectToast } from "./helpers";

/**
 * Clip submission and verification (PRD M18, Fase 17). The demo klipper has
 * already joined "Klip Dies Natalis" (DEMO-KLIP2-2026, rate Rp 10.000 per
 * 1.000 views). They send a clip, the manager approves it at 23.450 verified
 * views and the klipper sees Rp 234.500 credited (PRD 8.6).
 * `npm run seed:demo:reset` removes the clip again.
 */

const CAMPAIGN = "Klip Dies Natalis Universitas Demo Borneo";
const ASSIGNMENT_URL = "/portal/penugasan/de300000-0000-4000-8000-0000000000b4";

test("a klipper sends a clip, the team verifies it and the honor is credited", async ({
  page,
  browser,
}) => {
  const clipUrl = `https://www.tiktok.com/@rina.kuliner/video/${Date.now()}`;

  await test.step("the klipper accepts the current terms if needed", async () => {
    await page.goto("/portal/kampanye");
    const accept = page.getByRole("button", { name: "Setujui syarat" });
    if (await accept.isVisible()) {
      await page.getByLabel(/Saya sudah membaca dan menyetujui Syarat Klipper/).check();
      await accept.click();
      await expectToast(page, /Syarat Klipper versi .* disetujui/);
    }
  });

  await test.step("the klipper sends a clip with its views screenshot", async () => {
    await page.goto(ASSIGNMENT_URL);
    await expect(page.getByRole("heading", { name: CAMPAIGN })).toBeVisible();
    await page.getByRole("button", { name: "Kirim klip" }).click();

    const form = dialog(page);
    await form.getByLabel("Tautan klip").fill(clipUrl);
    await form.getByLabel("Views saat ini").fill("23450");
    await form.getByLabel("Suka").fill("1200");
    await form.getByLabel("Tangkapan layar views").setInputFiles(PROOF_FILE);
    // FR-M18-03: the statement is required.
    await form.getByRole("button", { name: "Kirim klip" }).click();
    await expect(form.getByText(/kode verifikasi Anda ada di caption/)).toBeVisible();
    await form.getByLabel(/Kode verifikasi .* sudah ada di caption/).check();
    await form.getByRole("button", { name: "Kirim klip" }).click();
    await expectToast(page, "Klip terkirim dan menunggu verifikasi tim.");
    await expect(page.getByText("Menunggu review").first()).toBeVisible();
  });

  await test.step("the same video cannot be sent twice", async () => {
    await page.getByRole("button", { name: "Kirim klip" }).click();
    const form = dialog(page);
    // Tracker parameters and a trailing slash do not make it a new video.
    await form.getByLabel("Tautan klip").fill(`${clipUrl}/?is_from_webapp=1`);
    await form.getByLabel("Views saat ini").fill("100");
    await form.getByLabel("Tangkapan layar views").setInputFiles(PROOF_FILE);
    await form.getByLabel(/Kode verifikasi .* sudah ada di caption/).check();
    await form.getByRole("button", { name: "Kirim klip" }).click();
    await expect(form.getByText(/sudah pernah dikirim/).first()).toBeVisible();
    await form.getByRole("button", { name: "Batal" }).click();
  });

  await test.step("the manager approves it with verified views", async () => {
    const context = await browser.newContext({ storageState: "e2e/.auth/manager.json" });
    const team = await context.newPage();
    await team.goto("/verifikasi");
    await team
      .getByRole("link", { name: /rina\.kuliner/ })
      .first()
      .click();
    await expect(team.getByRole("heading", { name: /Klip rina\.kuliner/ })).toBeVisible();
    await expect(team.getByText(clipUrl)).toBeVisible();

    // Wait for hydration: a tick before it is lost when React takes over.
    await team.waitForLoadState("networkidle");
    for (const box of await team.getByRole("checkbox").all()) {
      await box.check();
      await expect(box).toBeChecked();
    }
    await team.getByLabel("Views terverifikasi").fill("23450");
    await expect(team.getByText("Kredit sekarang: Rp 234.500")).toBeVisible();
    await team.getByRole("button", { name: "Setujui" }).click();
    await expectToast(team, /Klip disetujui\. Honor Rp 234\.500 masuk ke saldo klipper/);
    await context.close();
  });

  await test.step("the klipper sees the approval and the honor", async () => {
    await page.goto("/portal/klip");
    const clip = page.getByRole("listitem").filter({ hasText: clipUrl });
    await expect(clip.getByText("Disetujui")).toBeVisible();
    await expect(clip.getByText("Rp 234.500").first()).toBeVisible();
    // FR-M18-05: the next views update opens 24 hours after the last one.
    await expect(clip.getByText(/Pembaruan views berikutnya bisa dikirim mulai/)).toBeVisible();
  });
});
