"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { Container } from "./section";

/**
 * Absolute hrefs, so the same header works on `/kreator` and the legal pages
 * as well as on the landing page itself.
 */
const NAV = [
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/#kenapa-lokal", label: "Kenapa lokal" },
  { href: "/kreator", label: "Untuk kreator" },
  { href: "/#faq", label: "FAQ" },
];

/** The landing page addresses the client side (PRD M15: klien lebih dulu). */
const CLIENT_ENTRY = { href: "/", label: "Untuk klien" };

export function SiteHeader() {
  const pathname = usePathname();

  // One slot, two audiences: on the creator page that entry leads back to the
  // client-facing landing instead of pointing at the page already open.
  const nav = NAV.map((item) =>
    item.href === "/kreator" && pathname === "/kreator" ? CLIENT_ENTRY : item,
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Megaphone className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
        </Link>

        {/* Below `md` the page itself is the navigation: the landing sections
            follow in reading order and the footer repeats every link. */}
        <nav aria-label="Navigasi situs" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <ThemeToggle />
          <Button asChild variant="outline" size="lg" className="h-11 px-4 md:h-9">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
