import { expect, test as setup } from "@playwright/test";
import { account } from "./helpers";

for (const role of ["owner", "manager"] as const) {
  setup(`sign in as ${role}`, async ({ page }) => {
    const { email, password } = account(role);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
