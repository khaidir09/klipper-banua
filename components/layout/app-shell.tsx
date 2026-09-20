"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  AREA_CHROME,
  navItemsFor,
  ROLE_LABELS,
  type NavItem,
  type ShellArea,
} from "@/components/layout/nav-items";
import type { UserRole } from "@/lib/auth/guards";

/**
 * Shell for every signed-in area: the internal app, the creator portal (M13)
 * and the client portal (M14). `area` picks both the menu and the accent, so a
 * portal can never render an internal entry, and the operator can always tell
 * which area they are in. Menu items hold icon components, which cannot cross
 * the server / client boundary as props: the list is built here.
 */
type AppShellProps = {
  appName: string;
  fullName: string;
  email: string;
  role: UserRole;
  area: ShellArea;
  timezoneLabel: string;
  /** Persisted sidebar state, read from the `sidebar_state` cookie server-side. */
  defaultOpen?: boolean;
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

function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

        return (
          <SidebarMenuItem key={item.href}>
            {/* h-11 on phones clears the 44px touch target that the default h-8
                misses; desktop keeps the denser row. */}
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
              className="h-11 md:h-8"
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <Icon aria-hidden />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppShell({
  appName,
  fullName,
  email,
  role,
  area,
  timezoneLabel,
  defaultOpen = true,
  children,
}: AppShellProps) {
  const navItems = navItemsFor(area, role);
  const chrome = AREA_CHROME[area];
  const AreaIcon = chrome.icon;

  return (
    // The sidebar shows tooltips for its icons once collapsed, and Tooltip here
    // does not carry its own provider.
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar collapsible="icon" style={chrome.sidebarVars}>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-md ${chrome.markClass}`}
              >
                <AreaIcon className="size-4" />
              </span>
              <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold tracking-tight">{appName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {chrome.label ?? `Zona waktu ${timezoneLabel}`}
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <NavLinks items={navItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {chrome.label ? (
            <SidebarFooter>
              <p className="px-2 pb-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                Zona waktu {timezoneLabel}
              </p>
            </SidebarFooter>
          ) : null}

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="-ml-1" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Buka/tutup menu (Ctrl+B)</TooltipContent>
            </Tooltip>

            {chrome.label ? (
              <span className="truncate text-sm font-medium sm:hidden">{chrome.label}</span>
            ) : null}

            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" aria-label="Menu pengguna">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">
                        {initials(fullName, email)}
                      </AvatarFallback>
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
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
