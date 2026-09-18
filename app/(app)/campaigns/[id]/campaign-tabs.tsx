"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAMPAIGN_TABS } from "@/lib/constants/campaigns";
import { cn } from "@/lib/utils";

/** FR-M4-04 tab bar; tabs of later phases are shown but muted. */
export function CampaignTabs({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-4 overflow-x-auto border-b px-4 md:mx-0 md:px-0"
      aria-label="Bagian kampanye"
    >
      <ul className="flex min-w-max gap-1">
        {CAMPAIGN_TABS.map((tab) => {
          const href = `/campaigns/${campaignId}/${tab.segment}`;
          const active = pathname.startsWith(href);
          const later = "phase" in tab;
          return (
            <li key={tab.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                  later && !active && "text-muted-foreground/60",
                )}
              >
                {tab.label}
                {later ? <span className="text-[10px]">{tab.phase}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
