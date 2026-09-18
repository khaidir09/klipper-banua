"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAMPAIGN_TABS } from "@/lib/constants/campaigns";
import { cn } from "@/lib/utils";

/** FR-M4-04 tab bar. */
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
          return (
            <li key={tab.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
