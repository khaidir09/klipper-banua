import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests of the critical flow (PRD section 5.2) against the local
 * Supabase stack with demo data. Uses the installed Chrome, so no browser
 * download is needed:
 *
 *   npm run db:start && npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  // The flow is one story on shared demo data: run serially.
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    locale: "id-ID",
    timezoneId: "Asia/Makassar",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Public site (PRD M15): no session and no demo data, so it depends on
    // nothing and can run on its own.
    { name: "publik", testMatch: /publik\.spec\.ts/ },
    {
      name: "owner",
      testMatch: /(critical-flow|portal-access)\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/owner.json" },
    },
    {
      // Klipper self-registration (PRD M16, Fase 15). Needs Mailpit from the
      // local stack and the owner session to grant the local badge.
      name: "klipper",
      testMatch: /daftar\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "manager",
      testMatch: /manager\.spec\.ts/,
      // Runs after the owner flow so it sees a closed campaign with payouts.
      dependencies: ["owner"],
      use: { storageState: "e2e/.auth/manager.json" },
    },
    {
      name: "client",
      testMatch: /klien\.spec\.ts/,
      // Runs after the owner flow so the demo campaigns carry real numbers.
      dependencies: ["owner"],
      use: { storageState: "e2e/.auth/client.json" },
    },
    {
      name: "creator",
      testMatch: /(portal(-flow)?|katalog|klip)\.spec\.ts/,
      // Runs after the owner flow so the demo campaign is live with a brief.
      dependencies: ["owner"],
      use: { storageState: "e2e/.auth/creator.json" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
