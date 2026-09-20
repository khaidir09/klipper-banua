import { FileBarChart2, Megaphone, MapPinned, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { publicEnv } from "@/lib/env";

/** The three things the platform promises, per PRD 1.2. */
const POINTS = [
  {
    icon: MapPinned,
    title: "Kreator lokal terverifikasi",
    body: "Audiens Kalimantan dibuktikan, bukan diklaim.",
  },
  {
    icon: ShieldCheck,
    title: "Konten disetujui sebelum tayang",
    body: "Setiap draf melewati review tim lebih dulu.",
  },
  {
    icon: FileBarChart2,
    title: "Laporan siap diserahkan",
    body: "Views, klik, dan pendaftar dalam satu dokumen.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel. Decorative context only, so it stays out of the tab order
          and off small screens, where the form should own the viewport. */}
      <aside className="hidden flex-col justify-between bg-brand-panel p-10 text-brand-panel-foreground lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-lg bg-brand-panel-foreground/10 ring-1 ring-brand-panel-foreground/15"
          >
            <Megaphone className="size-4.5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            {publicEnv.NEXT_PUBLIC_APP_NAME}
          </span>
        </div>

        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            Kampanye kreator lokal, dari brief sampai laporan.
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

        <p className="text-xs text-brand-panel-muted">
          Aplikasi internal. Pendaftaran publik dinonaktifkan.
        </p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="w-full max-w-sm">
            {/* Repeats the brand on small screens, where the panel is hidden. */}
            <div className="mb-7 flex items-center justify-center gap-2.5 lg:hidden">
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <Megaphone className="size-4" />
              </span>
              <span className="font-semibold tracking-tight">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
            </div>
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:hidden">
          Aplikasi internal. Pendaftaran publik dinonaktifkan.
        </p>
      </main>
    </div>
  );
}
