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
    {
      name: "owner",
      testMatch: /critical-flow\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/owner.json" },
    },
    {
      name: "manager",
      testMatch: /manager\.spec\.ts/,
      // Runs after the owner flow so it sees a closed campaign with payouts.
      dependencies: ["owner"],
      use: { storageState: "e2e/.auth/manager.json" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
