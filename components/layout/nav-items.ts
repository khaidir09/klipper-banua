import {
  Building2,
  ClipboardList,
  Home,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { InternalRole, UserRole } from "@/lib/auth/guards";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: InternalRole[];
  /** Highlight only on this exact path, for an entry that is also a parent. */
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { label: "Klien", href: "/clients", icon: Building2 },
  { label: "Kreator", href: "/creators", icon: Users },
  { label: "Kampanye", href: "/campaigns", icon: Megaphone },
  { label: "Aktivitas", href: "/activity", icon: ScrollText, roles: ["owner"] },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

/** Creator portal (M13). Creators never see an internal menu entry. */
export const PORTAL_NAV_ITEMS: NavItem[] = [
  { label: "Beranda", href: "/portal", icon: Home, exact: true },
  { label: "Penugasan", href: "/portal/penugasan", icon: ClipboardList },
  { label: "Profil", href: "/portal/profil", icon: User },
];

/**
 * Client portal (M14). Clients never see an internal menu entry either. The
 * campaign list is the portal's landing page, so one entry points at it;
 * `/klien/kampanye/<id>` is the detail page below it.
 */
export const CLIENT_NAV_ITEMS: NavItem[] = [
  { label: "Kampanye", href: "/klien", icon: Megaphone, exact: true },
  { label: "Profil", href: "/klien/profil", icon: User },
];

export function visibleNavItems(role: InternalRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

/** The three signed-in areas, each with its own shell chrome. */
export type ShellArea = "app" | "portal" | "client";

export type AreaChrome = {
  /** Shown under the app name. Null for the internal app, which needs no qualifier. */
  label: string | null;
  icon: LucideIcon;
  /** Colour of the brand tile in the sidebar header. */
  markClass: string;
  /**
   * Retints the sidebar's active and hover surface. Overriding the tokens keeps
   * every menu item styled by the same rules, so a portal can never drift from
   * the internal shell beyond its accent. Each pair is contrast-checked in
   * `design-system/klipper-banua/MASTER.md`.
   */
  sidebarVars: React.CSSProperties;
};

export const AREA_CHROME: Record<ShellArea, AreaChrome> = {
  app: {
    label: null,
    icon: Megaphone,
    markClass: "bg-primary text-primary-foreground",
    sidebarVars: {},
  },
  portal: {
    label: "Portal Klipper",
    icon: ClipboardList,
    markClass: "bg-info text-info-foreground",
    sidebarVars: {
      "--sidebar-accent": "var(--info-soft)",
      "--sidebar-accent-foreground": "var(--info-soft-foreground)",
      "--sidebar-ring": "var(--info)",
    } as React.CSSProperties,
  },
  client: {
    label: "Portal Klien",
    icon: Building2,
    markClass: "bg-success text-success-foreground",
    sidebarVars: {
      "--sidebar-accent": "var(--success-soft)",
      "--sidebar-accent-foreground": "var(--success-soft-foreground)",
      "--sidebar-ring": "var(--success)",
    } as React.CSSProperties,
  },
};

export function navItemsFor(area: ShellArea, role: UserRole): NavItem[] {
  if (area === "portal") return PORTAL_NAV_ITEMS;
  if (area === "client") return CLIENT_NAV_ITEMS;
  return visibleNavItems(role as InternalRole);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Manager",
  creator: "Klipper",
  client: "Klien",
};
