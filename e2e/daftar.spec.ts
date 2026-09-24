import { expect, test, type Page } from "@playwright/test";
import { PROOF_FILE, expectToast } from "./helpers";

/**
 * Klipper self-registration (PRD M16, Fase 15): sign up at /daftar, confirm
 * the email through the local mail catcher, finish the account, ask for the
 * local badge, and have the owner grant it. Needs the local Supabase stack
 * (Mailpit on the port from supabase/config.toml).
 */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:55324";

const stamp = Date.now();
const email = `e2e.klipper.${stamp}@example.com`;
const handle = `e2eklip${stamp}`;
// Unique per run: the WhatsApp number is unique across klippers.
const phone = `0813${String(stamp).slice(-8)}`;

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

async function fillSignup(page: Page, overrides: Partial<Record<string, string>> = {}) {
  const values = {
    email,
    password: "Rahasia123",
    passwordConfirmation: "Rahasia123",
    full_name: "Klipper Uji E2E",
    stage_name: "klipuji",
    phone_wa: phone,
    city: "Banjarbaru",
    ...overrides,
  };
  for (const [id, value] of Object.entries(values)) {
    await page.locator(`#${id}`).fill(value);
  }
  for (const id of ["agree_terms", "agree_privacy"]) {
    await page.locator(`#${id}`).check();
  }
}

test.describe.serial("pendaftaran klipper mandiri", () => {
  test("formulir tidak meminta tanggal lahir atau pernyataan usia", async ({ page }) => {
    await page.goto("/daftar");
    await expect(page.locator("#birth_date")).toHaveCount(0);
    await expect(page.locator("#confirm_adult")).toHaveCount(0);
  });

  test("daftar, konfirmasi email, dan aktifkan akun", async ({ page }) => {
    await page.goto("/daftar");
    await fillSignup(page);
    await page.getByRole("button", { name: "Daftar jadi Klipper" }).click();
    await expect(page.getByText("Cek emailmu")).toBeVisible();

    // The email link lands on /portal/mulai with a session.
    await page.goto(await confirmationLink(email));
    await expect(page).toHaveURL(/\/portal\/mulai/);
    await expect(page.locator("code").first()).toHaveText(/^KB-[A-HJ-NP-Z2-9]{6}$/);

    // No social account yet: the dialog is already open.
    await page.locator("#ps-handle").fill(handle);
    await page.locator("#ps-followers").fill("2500");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expectToast(page, "Akun ditambahkan.");
    await expect(page.getByRole("link", { name: "Pilih kampanye" })).toBeVisible();

    // A signed-in klipper who opens /daftar goes home instead.
    await page.goto("/daftar");
    await expect(page).toHaveURL(/\/portal$/);
  });

  test("ajukan lencana Klipper Lokal, lalu owner memberikannya", async ({ page, browser }) => {
    // Sign in again: each test starts with a fresh context.
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("Rahasia123");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/portal/);

    await page.goto("/portal/profil");
    await page.getByRole("button", { name: "Ajukan lencana Klipper Lokal" }).click();
    await page.locator("#br-pct").fill("82");
    await page.locator("#br-cities").fill("Banjarbaru, Banjarmasin");
    await page.locator("#br-proof").setInputFiles(PROOF_FILE);
    await page.getByRole("button", { name: "Kirim pengajuan" }).click();
    await expectToast(page, "Pengajuan lencana terkirim");
    await expect(page.getByText("Pengajuan lencana sedang diperiksa tim")).toBeVisible();

    const owner = await browser.newContext({ storageState: "e2e/.auth/owner.json" });
    const ownerPage = await owner.newPage();
    await ownerPage.goto("/creators/lencana");
    const card = ownerPage.locator('[data-slot="card"]').filter({ hasText: `@${handle}` });
    await card.getByRole("button", { name: "Beri lencana" }).click();
    await expectToast(ownerPage, "Lencana Klipper Lokal diberikan.");
    await owner.close();

    await page.reload();
    await expect(page.getByText(/Klipper Lokal sejak/)).toBeVisible();
    await expect(page.getByText(/Audiens Kalimantan 82% terverifikasi/)).toBeVisible();
  });
});
