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
  /** Disabled until the phase that builds it (PRD section 11). */
  phase?: string;
  roles?: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { label: "Klien", href: "/clients", icon: Building2, phase: "Fase 1" },
  { label: "Kreator", href: "/creators", icon: Users, phase: "Fase 1" },
  { label: "Kampanye", href: "/campaigns", icon: Megaphone, phase: "Fase 2" },
  { label: "Aktivitas", href: "/activity", icon: ScrollText, phase: "Fase 7", roles: ["owner"] },
  { label: "Pengaturan", href: "/settings", icon: Settings, phase: "Fase 1" },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
