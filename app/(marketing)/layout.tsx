import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  // The app-wide default is `noindex` because the rest of this deployment is an
  // internal console. Only the public site is meant to be found (FR-M15-05).
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // `touch-targets` lifts controls to 44x44px below `md` (globals.css): a
    // visitor arrives on a phone far more often than on a desktop.
    <div className="touch-targets flex min-h-svh flex-col">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-3 focus:ring-ring/50"
      >
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main id="konten-utama" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
