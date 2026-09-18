import {
  Building2,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/guards";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { label: "Klien", href: "/clients", icon: Building2 },
  { label: "Kreator", href: "/creators", icon: Users },
  { label: "Kampanye", href: "/campaigns", icon: Megaphone },
  { label: "Aktivitas", href: "/activity", icon: ScrollText, roles: ["owner"] },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
