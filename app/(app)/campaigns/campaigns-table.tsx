"use client";

import { DataTable } from "@/components/tables/data-table";
import { columnHelper, type TableColumnDef } from "@/components/tables/table-features";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/constants/campaigns";
import type { CampaignListItem } from "@/lib/data/campaigns";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarRange } from "@/lib/format/date";

const helper = columnHelper<CampaignListItem>();

const columns: TableColumnDef<CampaignListItem>[] = helper.columns([
  helper.accessor("name", {
    header: "Kampanye",
    cell: (info) => (
      <span>
        <span className="font-medium">{info.getValue()}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {info.row.original.code}
        </span>
      </span>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => <CampaignStatusBadge status={info.getValue()} />,
  }),
  helper.display({
    id: "client",
    header: "Klien",
    cell: ({ row }) => row.original.client?.name ?? "–",
    meta: { className: "hidden md:table-cell" },
  }),
  helper.accessor("start_date", {
    header: "Periode",
    cell: (info) => formatCalendarRange(info.getValue(), info.row.original.end_date),
    meta: { className: "hidden lg:table-cell whitespace-nowrap" },
  }),
  helper.accessor("objective", {
    header: "Tujuan",
    cell: (info) => CAMPAIGN_OBJECTIVE_LABELS[info.getValue()],
    meta: { className: "hidden lg:table-cell" },
  }),
  helper.display({
    id: "creators",
    header: "Kreator",
    cell: ({ row }) => row.original.assignments[0]?.count ?? 0,
    meta: { className: "hidden sm:table-cell text-right" },
  }),
  helper.accessor("package_price", {
    header: "Harga paket",
    cell: (info) => formatRupiah(info.getValue()),
    meta: { className: "hidden md:table-cell text-right whitespace-nowrap" },
  }),
]);

export function CampaignsTable({ rows }: { rows: CampaignListItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Belum ada kampanye yang cocok."
      getRowHref={(row) => `/campaigns/${row.id}/overview`}
    />
  );
}
