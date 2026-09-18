import { config } from "dotenv";
import { expect, type Page } from "@playwright/test";

config({ path: ".env.local", quiet: true });

export const DEMO_CAMPAIGN_ID = "de300000-0000-4000-8000-0000000000c1";
export const demoCreatorId = (n: number) => `de300000-0000-4000-8000-0000000000a${n}`;
export const PROOF_FILE = "scripts/assets/demo-audience-proof.png";

export function account(role: "owner" | "manager") {
  const prefix = role === "owner" ? "SEED_OWNER" : "SEED_MANAGER";
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`${prefix}_EMAIL/PASSWORD missing in .env.local`);
  return { email, password };
}

/** Waits for the toast a Server Action shows on success. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

/** The open dialog (Radix renders one at a time in these flows). */
export const dialog = (page: Page) => page.getByRole("dialog");
export const alertDialog = (page: Page) => page.getByRole("alertdialog");
