import { formatNumber, formatPercent } from "@/lib/format/number";
import { cn } from "@/lib/utils";

/**
 * Progress against one campaign target, used by the internal overview and the
 * client portal so both read the same way.
 *
 * The figure and the "dari N" text carry the meaning on their own; the bar only
 * reinforces it, so nothing is lost when the bar cannot be seen. `size="sm"`
 * fits a card that lists several targets side by side.
 */
export function TargetProgress({
  label,
  actual,
  target,
  percent,
  size = "lg",
}: {
  label: string;
  actual: number;
  target: number;
  percent: number | null;
  size?: "sm" | "lg";
}) {
  const reached = percent !== null && percent >= 100;
  const width = percent === null ? 0 : Math.min(100, percent);

  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
        <span
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            size === "lg" ? "text-2xl" : "text-lg",
          )}
        >
          {formatNumber(actual)}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {target > 0 ? `dari ${formatNumber(target)}` : "tanpa target"}
          {percent === null ? "" : ` · ${formatPercent(percent)}`}
        </span>
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent === null ? undefined : Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={
          target > 0
            ? `${formatNumber(actual)} dari ${formatNumber(target)}`
            : `${formatNumber(actual)}, tanpa target`
        }
      >
        <div
          className={cn("h-full rounded-full", reached ? "bg-success" : "bg-primary")}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
