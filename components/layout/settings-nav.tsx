"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/settings/profile", label: "Profil saya" },
    ...(isOwner ? [{ href: "/settings/users", label: "Pengguna" }] : []),
  ];

  return (
    <nav className="flex gap-1 border-b" aria-label="Menu pengaturan">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
