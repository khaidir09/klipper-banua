const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Large numbers with a dot separator, e.g. `1.250.000`. */
export function formatNumber(value: bigint | number): string {
  return numberFormatter.format(value);
}

/** Percentages shown with one decimal, e.g. `62,5%`. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "–";
  return `${decimalFormatter.format(value)}%`;
}

/** Placeholder for metrics that cannot be computed yet (division by zero). */
export const EMPTY_METRIC = "–";
