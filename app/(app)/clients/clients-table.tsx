"use client";

import { DataTable } from "@/components/tables/data-table";
import { columnHelper, type TableColumnDef } from "@/components/tables/table-features";
import { Badge } from "@/components/ui/badge";
import { CLIENT_TYPE_LABELS } from "@/lib/constants/clients";
import type { ClientListItem } from "@/lib/data/clients";
import { formatWhatsapp } from "@/lib/validation/phone";

const helper = columnHelper<ClientListItem>();

const columns: TableColumnDef<ClientListItem>[] = helper.columns([
  helper.accessor("name", {
    header: "Nama",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  helper.accessor("type", {
    header: "Jenis",
    cell: (info) => <Badge variant="secondary">{CLIENT_TYPE_LABELS[info.getValue()]}</Badge>,
  }),
  helper.accessor("city", {
    header: "Kota",
    cell: (info) => info.getValue() || "–",
    meta: { className: "hidden md:table-cell" },
  }),
  helper.accessor("province", {
    header: "Provinsi",
    meta: { className: "hidden lg:table-cell" },
  }),
  helper.display({
    id: "contact",
    header: "Kontak utama",
    cell: ({ row }) => {
      const contact = row.original.primary_contact[0];
      if (!contact) return <span className="text-muted-foreground">–</span>;
      return (
        <span>
          {contact.name}
          {contact.phone_wa ? (
            <span className="block text-xs text-muted-foreground">
              {formatWhatsapp(contact.phone_wa)}
            </span>
          ) : null}
        </span>
      );
    },
    meta: { className: "hidden sm:table-cell" },
  }),
]);

export function ClientsTable({ rows }: { rows: ClientListItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Belum ada klien yang cocok."
      getRowHref={(row) => `/clients/${row.id}`}
    />
  );
}
