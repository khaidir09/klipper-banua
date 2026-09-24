import { formatRupiah } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type BudgetMeterProps = {
  pct: number;
  exhausted: boolean;
  /** Whole Rupiah: the klipper budget, honor already spent, and what is left. */
  total: number;
  used: number;
  remaining: number;
};

/** FR-M17-03: the klipper budget left, as a share and in Rupiah. */
export function BudgetMeter({ pct, exhausted, total, used, remaining }: BudgetMeterProps) {
  const shown = exhausted ? 0 : pct;
  const low = shown < 10;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Sisa anggaran</span>
        <span className="font-medium tabular-nums">
          {exhausted ? "Anggaran habis" : `${shown}%`}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Sisa anggaran"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        aria-valuetext={`${shown}% tersisa, ${formatRupiah(remaining)} dari ${formatRupiah(total)}`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")}
          style={{ width: `${shown}%` }}
        />
      </div>
      <dl className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs tabular-nums">
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Dipakai</dt>
          <dd>{formatRupiah(used)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Tersisa</dt>
          <dd className={cn("font-medium", low && "text-destructive")}>
            {formatRupiah(remaining)}
          </dd>
        </div>
        <div className="flex basis-full gap-1">
          <dt className="text-muted-foreground">Total anggaran</dt>
          <dd>{formatRupiah(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
