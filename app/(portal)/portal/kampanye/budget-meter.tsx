import { cn } from "@/lib/utils";

/**
 * FR-M17-03: the remaining budget as a share only; the amount itself never
 * reaches the portal.
 */
export function BudgetMeter({ pct, exhausted }: { pct: number; exhausted: boolean }) {
  const shown = exhausted ? 0 : pct;
  return (
    <div className="space-y-1">
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
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", shown < 10 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${shown}%` }}
        />
      </div>
    </div>
  );
}
