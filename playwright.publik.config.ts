import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * The public site (PRD M15) reads nothing from the database, so it can be
 * exercised without Docker or demo data:
 *
 *   npm run test:e2e:publik
 *
 * `npm run test:e2e` still covers the same spec through the `publik` project
 * in the main config; this config only drops the demo-data global setup.
 */
export default defineConfig({
  ...base,
  globalSetup: undefined,
  projects: [{ name: "publik", testMatch: /publik\.spec\.ts/ }],
});
