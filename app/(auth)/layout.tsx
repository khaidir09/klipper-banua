import Link from "next/link";
import { MapPinned, Megaphone, ShieldCheck, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { publicEnv } from "@/lib/env";

/** The three things the platform promises, per PRD 1.2 (v4.0). */
const POINTS = [
  {
    icon: MapPinned,
    title: "Kampanye instansi Kalimantan",
    body: "Pilih kampanye dari katalog, kerjakan dari akunmu sendiri.",
  },
  {
    icon: ShieldCheck,
    title: "Setiap klip diverifikasi",
    body: "Kepemilikan akun, kepatuhan brief, dan keaslian views diperiksa tim.",
  },
  {
    icon: Wallet,
    title: "Honor dari views asli",
    body: "Saldo bertambah saat klip disetujui, lalu tarik ke rekeningmu.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel. Decorative context only, apart from the brand link back to
          the public site, and off small screens, where the form owns the viewport. */}
      <aside className="hidden flex-col bg-brand-panel p-10 text-brand-panel-foreground lg:flex xl:p-14">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-brand-panel-foreground/40"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-lg bg-brand-panel-foreground/10 ring-1 ring-brand-panel-foreground/15"
          >
            <Megaphone className="size-4.5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            {publicEnv.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>

        {/* Both auto margins centre the pitch in the space the brand leaves. */}
        <div className="my-auto max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            Klip lokal, dibayar dari views asli.
          </p>
          <ul className="mt-9 space-y-6">
            {POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5">
                <point.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium">{point.title}</p>
                  <p className="mt-0.5 text-sm text-brand-panel-muted">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="w-full max-w-sm">
            {/* Repeats the brand on small screens, where the panel is hidden. */}
            <Link
              href="/"
              className="mb-7 flex items-center justify-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <Megaphone className="size-4" />
              </span>
              <span className="font-semibold tracking-tight">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
            </Link>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
