/**
 * Accessibility and responsive sweep across every signed-in route, at four
 * widths and both themes. Needs a local Supabase with demo data and a running
 * dev server:
 *
 *   npm run db:start && npm run seed:demo && npm run dev
 *   node scripts/a11y-audit.mjs
 *
 * Checks: one main landmark, one h1 and no skipped heading levels, duplicate
 * ids, accessible names, form labels, text contrast (4.5:1 / 3:1 for large),
 * and horizontal scroll. Prints only failures.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const CAMPAIGN = "de300000-0000-4000-8000-0000000000c2";
const PERSONAS = [
  {
    key: "owner",
    email: env.SEED_OWNER_EMAIL,
    password: env.SEED_OWNER_PASSWORD,
    routes: [
      "/dashboard",
      "/clients",
      "/creators",
      "/campaigns",
      "/campaigns/new",
      `/campaigns/${CAMPAIGN}/overview`,
      `/campaigns/${CAMPAIGN}/brief`,
      `/campaigns/${CAMPAIGN}/creators`,
      `/campaigns/${CAMPAIGN}/contents`,
      `/campaigns/${CAMPAIGN}/metrics`,
      `/campaigns/${CAMPAIGN}/finance`,
      `/campaigns/${CAMPAIGN}/report`,
      "/activity",
      "/settings",
      "/settings/users",
      "/settings/profile",
    ],
  },
  {
    key: "kreator",
    email: env.SEED_CREATOR_EMAIL,
    password: env.SEED_CREATOR_PASSWORD,
    routes: ["/portal", "/portal/penugasan", "/portal/profil"],
  },
  {
    key: "klien",
    email: env.SEED_CLIENT_EMAIL,
    password: env.SEED_CLIENT_PASSWORD,
    routes: ["/klien", "/klien/profil"],
  },
];

const AUDIT = () => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = css;
    cx.fillRect(0, 0, 1, 1);
    return [...cx.getImageData(0, 0, 1, 1).data];
  };
  const solid = (css, under = "#ffffff") => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = under;
    cx.fillRect(0, 0, 1, 1);
    cx.fillStyle = css;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = (css, under) => {
    const [r, g, b] = solid(css, under);
    const f = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (fg, bg) => {
    const a = lum(fg, bg),
      b = lum(bg);
    const hi = Math.max(a, b),
      lo = Math.min(a, b);
    return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
  };
  const bgOf = (el) => {
    let n = el;
    while (n) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && rgba(c)[3] > 250) return c;
      n = n.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || "#ffffff";
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const labelFor = (el) =>
    el.id ? (document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent ?? "") : "";
  const name = (el) =>
    (
      el.getAttribute("aria-label") ||
      labelFor(el) ||
      el.getAttribute("title") ||
      (el.getAttribute("aria-labelledby") &&
        document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) ||
      el.textContent ||
      el.getAttribute("alt") ||
      ""
    ).trim();

  const problems = [];
  const add = (kind, detail) => problems.push({ kind, detail });

  // --- landmarks & document ---
  if (document.querySelectorAll("main").length !== 1)
    add("landmark", `jumlah <main> = ${document.querySelectorAll("main").length}`);
  if (!document.documentElement.lang) add("lang", "atribut lang kosong");
  if (!document.title || document.title.length < 3) add("title", `title="${document.title}"`);

  // --- headings ---
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);
  const h1s = hs.filter((h) => h.tagName === "H1");
  if (h1s.length !== 1) add("heading", `jumlah h1 = ${h1s.length}`);
  let prev = 0;
  for (const h of hs) {
    const lvl = +h.tagName[1];
    if (prev && lvl > prev + 1)
      add("heading", `lompat H${prev} → H${lvl}: "${h.textContent.trim().slice(0, 30)}"`);
    prev = lvl;
  }

  // --- duplicate ids ---
  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] ?? 0) + 1;
  for (const [id, n] of Object.entries(ids)) if (n > 1) add("id-ganda", `#${id} x${n}`);

  // --- accessible names ---
  for (const el of [...document.querySelectorAll("a,button,[role=button]")].filter(visible)) {
    if (!name(el)) add("nama-kosong", `<${el.tagName.toLowerCase()}> tanpa nama aksesibel`);
  }
  for (const img of [...document.querySelectorAll("img")].filter(visible)) {
    if (img.alt === null || (img.alt === "" && img.getAttribute("aria-hidden") !== "true"))
      add("img-alt", img.src.slice(-40));
  }
  for (const svg of [...document.querySelectorAll("svg")].filter(visible)) {
    const hidden = svg.getAttribute("aria-hidden") === "true";
    const labelled = svg.getAttribute("role") === "img" && name(svg);
    const insideNamed = svg.closest("a,button,[role=button],[aria-label]");
    if (!hidden && !labelled && !insideNamed)
      add("svg-tanpa-label", svg.getAttribute("class") || "svg");
  }

  // --- form controls ---
  for (const el of [...document.querySelectorAll("input,select,textarea")].filter(visible)) {
    if (el.type === "hidden") continue;
    const lbl =
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
      el.closest("label") ||
      el.getAttribute("aria-label") ||
      el.getAttribute("aria-labelledby");
    if (!lbl) add("input-tanpa-label", `${el.tagName.toLowerCase()}#${el.id || "(tanpa id)"}`);
  }

  // --- text contrast ---
  const leaves = [...document.querySelectorAll("body *")].filter((el) => {
    if (!visible(el)) return false;
    if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(el.tagName)) return false;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  });
  for (const el of leaves) {
    const s = getComputedStyle(el);
    const size = parseFloat(s.fontSize);
    const bold = +s.fontWeight >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const r = ratio(s.color, bgOf(el));
    if (r < need)
      add("kontras", `${r}:1 (butuh ${need}) — "${el.textContent.trim().slice(0, 34)}"`);
  }

  // --- horizontal scroll ---
  const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (over > 0) add("scroll-horizontal", `${over}px`);

  return problems;
};

const browser = await chromium.launch();
const findings = new Map();
const record = (route, w, theme, p) => {
  const key = `${p.kind}||${p.detail}`;
  if (!findings.has(key)) findings.set(key, { ...p, where: new Set() });
  findings.get(key).where.add(`${route}@${w}/${theme}`);
};

let pages = 0;
for (const theme of ["light", "dark"]) {
  for (const w of [375, 768, 1024, 1440]) {
    for (const persona of PERSONAS) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: 900 },
        colorScheme: theme,
        hasTouch: w < 500,
        isMobile: w < 500,
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.fill("#email", persona.email);
      await page.fill("#password", persona.password);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 }),
        page.click('button[type="submit"]'),
      ]);
      for (const route of persona.routes) {
        await page.goto(BASE + route, { waitUntil: "networkidle" });
        pages++;
        for (const p of await page.evaluate(AUDIT)) record(route, w, theme, p);
      }
      await ctx.close();
    }
  }
}
await browser.close();

const byKind = {};
for (const f of findings.values()) (byKind[f.kind] ??= []).push(f);
console.log(`\n${pages} pemuatan halaman diaudit. Temuan unik: ${findings.size}\n`);
for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`--- ${kind} (${list.length}) ---`);
  for (const f of list.slice(0, 12)) {
    const w = [...f.where];
    console.log(`  ${f.detail}`);
    console.log(
      `      di ${w.slice(0, 3).join(", ")}${w.length > 3 ? ` +${w.length - 3} lagi` : ""}`,
    );
  }
  if (list.length > 12) console.log(`  … dan ${list.length - 12} lagi`);
}
