import {
  createColumnHelper,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

/** Extra per-column options carried in `columnDef.meta`. */
export type ColumnMeta = {
  /** Tailwind classes applied to the header and every cell, e.g. to hide on mobile. */
  className?: string;
};

/**
 * Feature set shared by every list table. Pagination, filtering and sorting
 * happen on the server (PRD section 9), so only the core model is registered.
 */
export const tableFeatureSet = tableFeatures({ columnMeta: {} as ColumnMeta });

export type TableFeatureSet = typeof tableFeatureSet;

export type TableColumnDef<TData extends RowData> = ColumnDef<TableFeatureSet, TData>;

export function columnHelper<TData extends RowData>() {
  return createColumnHelper<TableFeatureSet, TData>();
}
