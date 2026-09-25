import Link from "next/link";
import { Megaphone } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { Container } from "./section";

const GROUPS = [
  {
    title: "Platform",
    links: [
      { href: "/#masalah", label: "Masalah yang dibereskan" },
      { href: "/#cara-kerja", label: "Cara kerja" },
      { href: "/#kenapa-lokal", label: "Kenapa klipper lokal" },
      { href: "/#faq", label: "Tanya jawab" },
    ],
  },
  {
    title: "Klipper",
    links: [
      { href: "/daftar", label: "Daftar jadi Klipper" },
      { href: "/kampanye", label: "Kampanye yang lagi buka" },
      { href: "/kreator#cara-kerja", label: "Cara kerja" },
      { href: "/kreator#honor", label: "Cara honor dihitung" },
    ],
  },
  {
    title: "Ketentuan",
    links: [
      { href: "/privasi", label: "Kebijakan Privasi" },
      { href: "/syarat", label: "Syarat Layanan" },
      { href: "/login", label: "Masuk ke aplikasi" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <Megaphone className="size-4" />
              </span>
              <span className="font-semibold tracking-tight">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Marketplace klipper lokal Kalimantan: brand, UMKM, instansi, dan personal memasang
              kampanye, klipper mengerjakannya, dan setiap klip diverifikasi sebelum dibayar.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-medium">{group.title}</p>
              <ul className="mt-3 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {publicEnv.NEXT_PUBLIC_APP_NAME}
          </p>
        </div>
      </Container>
    </footer>
  );
}
