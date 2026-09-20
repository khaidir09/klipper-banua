import { expect, test as setup } from "@playwright/test";
import { account } from "./helpers";

// A creator lands in the portal, the team in the app (FR-M13-02).
const LANDING = {
  owner: /\/dashboard/,
  manager: /\/dashboard/,
  creator: /\/portal/,
} as const;

for (const role of ["owner", "manager", "creator"] as const) {
  setup(`sign in as ${role}`, async ({ page }) => {
    const { email, password } = account(role);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(LANDING[role]);
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
