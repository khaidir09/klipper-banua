import { expect, test } from "@playwright/test";
import { DEMO_OPEN_CAMPAIGN_ID, PROOF_FILE, dialog, expectToast } from "./helpers";

/**
 * The whole v4.0 money flow (PRD Fase 18 acceptance): sign up → confirm →
 * add a social account → join → send a clip → approved → balance grows →
 * fill in the bank account → withdraw → the owner marks it paid.
 * Needs Mailpit from the local stack and the owner/manager sessions.
 */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:55324";

const stamp = Date.now();
const email = `e2e.saldo.${stamp}@example.com`;
const handle = `e2esaldo${stamp}`;
const phone = `0815${String(stamp).slice(-8)}`;
const fullName = "Klipper Saldo E2E";
const clipUrl = `https://www.tiktok.com/@${handle}/video/${stamp}`;

async function confirmationLink(to: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    );
    const { messages } = (await search.json()) as { messages?: { ID: string }[] };
    const id = messages?.[0]?.ID;
    if (id) {
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${id}`)).json()) as {
        HTML: string;
      };
      const href = message.HTML.match(/href="([^"]*type=signup[^"]*)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation email for ${to}`);
}

test("a new klipper earns honor and withdraws it", async ({ page, browser }) => {
  await test.step("sign up, confirm the email and add a social account", async () => {
    await page.goto("/daftar");
    const values = {
      email,
      password: "Rahasia123",
      passwordConfirmation: "Rahasia123",
      full_name: fullName,
      stage_name: handle,
      birth_date: "1999-05-06",
      phone_wa: phone,
      city: "Banjarmasin",
    };
    for (const [id, value] of Object.entries(values)) await page.locator(`#${id}`).fill(value);
    for (const id of ["agree_terms", "agree_privacy", "confirm_adult"]) {
      await page.locator(`#${id}`).check();
    }
    await page.getByRole("button", { name: "Daftar jadi Klipper" }).click();
    await expect(page.getByText("Cek email Anda")).toBeVisible();

    await page.goto(await confirmationLink(email));
    await expect(page).toHaveURL(/\/portal\/mulai/);
    await page.locator("#ps-handle").fill(handle);
    await page.locator("#ps-followers").fill("4200");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expectToast(page, "Akun ditambahkan.");
  });

  await test.step("join the open demo campaign", async () => {
    await page.goto(`/portal/kampanye/${DEMO_OPEN_CAMPAIGN_ID}`);
    await page.getByLabel(/Saya sudah membaca brief/).check();
    await page.getByRole("button", { name: "Gabung" }).click();
    await expect(page).toHaveURL(/\/portal\/penugasan\/[0-9a-f-]{36}/);
  });

  await test.step("send a clip right after joining", async () => {
    await page.getByRole("button", { name: "Kirim klip" }).click();
    const form = dialog(page);
    await form.getByLabel("Tautan klip").fill(clipUrl);
    await form.getByLabel("Views saat ini").fill("23450");
    await form.getByLabel("Tangkapan layar views").setInputFiles(PROOF_FILE);
    await form.getByLabel(/Kode verifikasi .* sudah ada di caption/).check();
    await form.getByRole("button", { name: "Kirim klip" }).click();
    await expectToast(page, "Klip terkirim dan menunggu verifikasi tim.");
  });

  await test.step("the manager approves it", async () => {
    const context = await browser.newContext({ storageState: "e2e/.auth/manager.json" });
    const team = await context.newPage();
    await team.goto("/verifikasi");
    await team
      .getByRole("link", { name: new RegExp(handle) })
      .first()
      .click();
    // Wait for hydration: a tick before it is lost when React takes over.
    await team.waitForLoadState("networkidle");
    for (const box of await team.getByRole("checkbox").all()) {
      await box.check();
      await expect(box).toBeChecked();
    }
    await team.getByLabel("Views terverifikasi").fill("23450");
    await team.getByRole("button", { name: "Setujui" }).click();
    await expectToast(team, /Honor Rp 234\.500 masuk ke saldo klipper/);
    await context.close();
  });

  await test.step("the balance grows; the klipper adds a bank account and withdraws", async () => {
    await page.goto("/portal/saldo");
    await expect(page.getByText("Rp 234.500").first()).toBeVisible();
    await expect(page.getByText(/Isi rekening atau e-wallet/)).toBeVisible();

    await page.getByLabel("Bank / e-wallet").selectOption("Bank Kalsel");
    await page.getByLabel("Nomor rekening / nomor HP e-wallet").fill("0012 3456 789");
    await page.getByLabel("Nama pemilik").fill(fullName);
    await page.getByRole("button", { name: "Simpan rekening" }).click();
    await expectToast(page, "Rekening tersimpan.");
    await expect(page.getByText("*******6789").first()).toBeVisible();

    // Below the minimum first (Rp 100.000 by default, Pengaturan → Penarikan).
    await page.getByLabel("Nominal (Rp)").fill("50.000");
    await page.getByRole("button", { name: "Ajukan penarikan" }).click();
    await expect(page.getByText(/Minimum penarikan Rp 100\.000/).first()).toBeVisible();

    await page.getByLabel("Nominal (Rp)").fill("200.000");
    await page.getByRole("button", { name: "Ajukan penarikan" }).click();
    await expectToast(page, /Penarikan Rp 200\.000 diajukan/);
    await expect(page.getByText("Diajukan").first()).toBeVisible();
    await expect(page.getByText("Rp 34.500").first()).toBeVisible();
  });

  await test.step("the owner processes and pays it with a transfer proof", async () => {
    const context = await browser.newContext({ storageState: "e2e/.auth/owner.json" });
    const owner = await context.newPage();
    await owner.goto("/penarikan?status=diajukan");
    const row = owner.getByRole("row").filter({ hasText: fullName });
    await expect(row.getByText("00123456789")).toBeVisible();
    await row.getByRole("button", { name: "Proses" }).click();
    await expectToast(owner, "Penarikan ditandai diproses.");

    await owner.goto("/penarikan?status=diproses");
    await owner
      .getByRole("row")
      .filter({ hasText: fullName })
      .getByRole("button", { name: "Tandai dibayar" })
      .click();
    const pay = dialog(owner);
    // The klipper bears the transfer fee (owner decision).
    await pay.getByLabel("Biaya transfer (Rp)").fill("2.500");
    await pay.getByLabel("Bukti transfer").setInputFiles(PROOF_FILE);
    await pay.getByRole("button", { name: "Simpan pembayaran" }).click();
    await expectToast(owner, /Penarikan ditandai dibayar; biaya transfer Rp 2\.500/);
    await context.close();
  });

  await test.step("the klipper sees it paid, without the proof", async () => {
    await page.reload();
    await expect(page.getByText("Dibayar").first()).toBeVisible();
    await expect(page.getByText(/dibayar \d/)).toBeVisible();
    await expect(page.getByText(/Biaya transfer Rp 2\.500 · diterima Rp 197\.500/)).toBeVisible();
    await expect(page.getByRole("link", { name: "bukti" })).toHaveCount(0);
  });
});
