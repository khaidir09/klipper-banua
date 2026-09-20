"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CLIENT_NAV_ITEMS,
  PORTAL_NAV_ITEMS,
  ROLE_LABELS,
  visibleNavItems,
  type NavItem,
} from "@/components/layout/nav-items";
import type { InternalRole, UserRole } from "@/lib/auth/guards";

/**
 * Shell for every signed-in area: the internal app, the creator portal (M13)
 * and the client portal (M14). `area` picks the menu, so a portal can never
 * render an internal entry. Menu items hold icon components, which cannot
 * cross the server / client boundary as props: the list is built here.
 */
type AppShellProps = {
  appName: string;
  fullName: string;
  email: string;
  role: UserRole;
  area: "app" | "portal" | "client";
  timezoneLabel: string;
  children: React.ReactNode;
};

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {items.map((item: NavItem) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  appName,
  fullName,
  email,
  role,
  area,
  timezoneLabel,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems =
    area === "portal"
      ? PORTAL_NAV_ITEMS
      : area === "client"
        ? CLIENT_NAV_ITEMS
        : visibleNavItems(role as InternalRole);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="border-b px-4 py-4">
          <p className="font-semibold tracking-tight">{appName}</p>
          <p className="text-xs text-muted-foreground">Zona waktu {timezoneLabel}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka navigasi">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b">
                <SheetTitle>{appName}</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavLinks items={navItems} onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <p className="font-semibold md:hidden">{appName}</p>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2" aria-label="Menu pengguna">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{initials(fullName, email)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">{fullName || email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate font-medium">{fullName || "Tanpa nama"}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {email}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    Peran: {ROLE_LABELS[role]}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  {/* POST so that a prefetch or link preview can never sign the user out. */}
                  <form action="/keluar" method="post" className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" aria-hidden />
                      Keluar
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
