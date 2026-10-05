import { expect, test } from "@playwright/test";
import { MARKETING_PATHS } from "../lib/marketing/routes";

/**
 * The public site (PRD M15). No session, no demo data: these run against a
 * plain dev server, which is why this project has no `dependencies`.
 */
const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
];

test.describe("halaman publik terbuka tanpa sesi", () => {
  for (const path of MARKETING_PATHS) {
    test(`${path} dapat dibuka anonim`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      // Not bounced to the login screen (FR-M15-01).
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

test.describe("tidak ada scroll horizontal", () => {
  for (const viewport of VIEWPORTS) {
    for (const path of MARKETING_PATHS) {
      test(`${path} pada ${viewport.name}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path);

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });

        // One pixel of slack for sub-pixel rounding.
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }
  }
});

test("area ber-sesi tetap tertutup untuk anonim", async ({ page }) => {
  for (const path of ["/dashboard", "/portal", "/klien", "/settings/users"]) {
    await page.goto(path);

    await expect(page).toHaveURL(new RegExp("/login"));
  }
});

test("katalog publik mengajak daftar tanpa membuka portal", async ({ page }) => {
  // FR-M15-09: works with or without a database behind it (this project runs
  // without demo data), so it checks the page frame, not specific campaigns.
  await page.goto("/kampanye");

  await expect(
    page.getByRole("heading", { level: 1, name: "Kampanye yang lagi buka" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Daftar jadi Kliper" }).first()).toHaveAttribute(
    "href",
    "/daftar",
  );
});

test("tombol Masuk mengantar ke halaman login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Masuk", exact: true }).click();

  await expect(page).toHaveURL(/\/login/);
});

test("berkas crawler dapat diambil tanpa sesi", async ({ page }) => {
  // These are generated routes, not static files: left out of the public list
  // the session proxy redirects them to `/login` and the site stops being
  // indexable (regression found while building Fase 13).
  for (const path of ["/robots.txt", "/sitemap.xml", "/opengraph-image"]) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(200);
    expect(page.url(), path).not.toContain("/login");
  }
});

test("robots.txt hanya mengizinkan rute publik", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();

  expect(body).toContain("Allow: /kreator");
  // v4.0 (M16): the kliper registration is public and indexed too.
  expect(body).toContain("Allow: /daftar");
  // PRD 1.6 (FR-M15-09): the open campaigns are public and indexed.
  expect(body).toContain("Allow: /kampanye");
  for (const blocked of ["/dashboard", "/portal", "/klien", "/laporan", "/api/"]) {
    expect(body).toContain(`Disallow: ${blocked}`);
  }
});

test("sitemap.xml tidak memuat rute ber-sesi", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();

  for (const path of MARKETING_PATHS) {
    expect(body).toContain(path === "/" ? "<loc>" : path);
  }
  for (const blocked of ["/dashboard", "/portal", "/klien", "/laporan", "/login"]) {
    expect(body).not.toContain(blocked);
  }
});
