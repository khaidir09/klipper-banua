"use client";

import { useRouter } from "next/navigation";
import { useTable, type RowData } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { tableFeatureSet, type TableColumnDef } from "./table-features";

type DataTableProps<TData extends RowData> = {
  columns: TableColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  /** When given, the whole row links to the detail page. */
  getRowHref?: (row: TData) => string;
};

/**
 * Thin TanStack Table wrapper. Pagination and filtering happen on the server
 * (PRD section 9), so the table only renders the current page.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = "Belum ada data.",
  getRowHref,
}: DataTableProps<TData>) {
  const router = useRouter();
  const table = useTable({ features: tableFeatureSet, columns, data });

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const href = getRowHref?.(row.original);
              return (
                <TableRow
                  key={row.id}
                  className={cn(href && "cursor-pointer")}
                  onClick={href ? () => router.push(href) : undefined}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
