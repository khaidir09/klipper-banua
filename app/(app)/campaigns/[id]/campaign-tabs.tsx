"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAMPAIGN_TABS } from "@/lib/constants/campaigns";
import { cn } from "@/lib/utils";

export type TabAttention = Partial<Record<(typeof CAMPAIGN_TABS)[number]["segment"], number>>;

/**
 * FR-M4-04 tab bar. Tabs holding unfinished work carry a count, so the team can
 * see where the queue is without opening all seven tabs. The count is a number
 * beside the label, never colour alone.
 */
export function CampaignTabs({
  campaignId,
  attention = {},
}: {
  campaignId: string;
  attention?: TabAttention;
}) {
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
          const waiting = attention[tab.segment] ?? 0;

          return (
            <li key={tab.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tab.label}
                {waiting > 0 ? (
                  <span
                    className="rounded-full bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning-soft-foreground tabular-nums"
                    // Spoken as part of the link, so the count is never mute.
                    aria-label={`${waiting} menunggu tindakan`}
                  >
                    {waiting}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
