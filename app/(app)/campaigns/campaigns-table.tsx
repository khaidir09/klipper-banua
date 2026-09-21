"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columnHelper, type TableColumnDef } from "@/components/tables/table-features";
import { CampaignStatusBadge } from "@/components/status/status-badge";
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

export function CampaignsTable({
  rows,
  filtered,
}: {
  rows: CampaignListItem[];
  /** True when a search or filter is active, so the empty state can say so. */
  filtered: boolean;
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage={filtered ? "Tidak ada kampanye yang cocok" : "Belum ada kampanye"}
      emptyHint={
        filtered
          ? "Coba ubah kata kunci, atau kosongkan filter status dan klien."
          : "Kampanye pertama dimulai dari paket, target, dan brief untuk satu klien."
      }
      emptyAction={
        filtered ? (
          <Button variant="outline" size="lg" asChild>
            <Link href="/campaigns">Kosongkan filter</Link>
          </Button>
        ) : (
          <Button size="lg" asChild>
            <Link href="/campaigns/new">
              <Plus aria-hidden />
              Buat kampanye
            </Link>
          </Button>
        )
      }
      getRowHref={(row) => `/campaigns/${row.id}/overview`}
    />
  );
}
