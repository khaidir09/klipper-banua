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

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Manager",
  creator: "Kreator",
  client: "Klien",
};
