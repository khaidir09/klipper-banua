"use client";

import { DataTable } from "@/components/tables/data-table";
import { columnHelper, type TableColumnDef } from "@/components/tables/table-features";
import { Badge } from "@/components/ui/badge";
import { CreatorStatusBadge } from "@/components/creators/creator-status-badge";
import { CREATOR_TIER_LABELS, SOCIAL_PLATFORM_LABELS, nicheLabel } from "@/lib/constants/creators";
import type { CreatorListItem } from "@/lib/data/creators";
import { formatNumber } from "@/lib/format/number";

const helper = columnHelper<CreatorListItem>();

const columns: TableColumnDef<CreatorListItem>[] = helper.columns([
  helper.accessor("full_name", {
    header: "Kreator",
    cell: (info) => (
      <span>
        <span className="font-medium">{info.getValue()}</span>
        {info.row.original.stage_name ? (
          <span className="block text-xs text-muted-foreground">
            {info.row.original.stage_name}
          </span>
        ) : null}
      </span>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => <CreatorStatusBadge status={info.getValue()} />,
  }),
  helper.accessor("tier", {
    header: "Tier",
    cell: (info) => CREATOR_TIER_LABELS[info.getValue()],
    meta: { className: "hidden md:table-cell" },
  }),
  helper.accessor("city", {
    header: "Lokasi",
    cell: (info) => (
      <span>
        {info.getValue() || "–"}
        <span className="block text-xs text-muted-foreground">{info.row.original.province}</span>
      </span>
    ),
    meta: { className: "hidden md:table-cell" },
  }),
  helper.accessor("niches", {
    header: "Niche",
    cell: (info) => (
      <span className="flex flex-wrap gap-1">
        {info.getValue().map((niche) => (
          <Badge key={niche} variant="outline">
            {nicheLabel(niche)}
          </Badge>
        ))}
      </span>
    ),
    meta: { className: "hidden lg:table-cell" },
  }),
  helper.accessor("social_accounts", {
    header: "Akun & audiens Kalimantan",
    cell: (info) => {
      const accounts = info.getValue();
      if (!accounts.length) return <span className="text-muted-foreground">–</span>;
      return (
        <span className="flex flex-col gap-0.5 text-xs">
          {accounts.map((account) => (
            <span key={`${account.platform}-${account.handle}`}>
              {SOCIAL_PLATFORM_LABELS[account.platform]} @{account.handle} ·{" "}
              {formatNumber(account.followers_count)} pengikut
              {account.kalimantan_audience_pct !== null
                ? ` · ${account.kalimantan_audience_pct}% Kalimantan`
                : ""}
            </span>
          ))}
        </span>
      );
    },
    meta: { className: "hidden sm:table-cell" },
  }),
]);

export function CreatorsTable({ rows }: { rows: CreatorListItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Belum ada kreator yang cocok dengan filter."
      getRowHref={(row) => `/creators/${row.id}`}
    />
  );
}
