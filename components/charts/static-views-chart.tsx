import { CHECKPOINT_LABELS, type MetricCheckpoint } from "@/lib/constants/metrics";
import { formatNumber } from "@/lib/format/number";

type Point = { checkpoint: MetricCheckpoint; views: number };

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 24, right: 24, bottom: 28, left: 56 };
/** Aim for about four gridlines. */
const TICKS = 4;

/** A round tick step (1, 2, 2.5 or 5 × 10ⁿ) so the axis reads 0, 25 rb, 50 rb… */
function niceStep(max: number, ticks: number): number {
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((f) => f * magnitude >= raw) ?? 10;
  return step * magnitude;
}

function compact(value: number): string {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/**
 * FR-M9-02: cumulative views for the printed report. A fixed-size SVG
 * rendered on the server, because responsive client charts often print blank
 * or clipped. Same encoding as the Metrics tab: one series (no legend), a
 * direct label on the last point, the target as a labelled reference line,
 * and the values repeated in a table below.
 */
export function StaticViewsChart({ points, target }: { points: Point[]; target: number }) {
  const peak = Math.max(target, ...points.map((p) => p.views), 1) * 1.05;
  const step = niceStep(peak, TICKS);
  const tickCount = Math.ceil(peak / step);
  const max = step * tickCount;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (points.length > 1 ? (index / (points.length - 1)) * plotW : plotW / 2);
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.views)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => step * i);
  const last = points.at(-1);

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Grafik views kumulatif per checkpoint"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {compact(tick)}
            </text>
          </g>
        ))}

        {target > 0 ? (
          <g>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(target)}
              y2={y(target)}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={WIDTH - PAD.right}
              y={y(target) - 6}
              textAnchor="end"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              Target {compact(target)}
            </text>
          </g>
        ) : null}

        <path d={area} fill="var(--series-1)" fillOpacity={0.12} />
        <path d={line} fill="none" stroke="var(--series-1)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle
            key={p.checkpoint}
            cx={x(i)}
            cy={y(p.views)}
            r={4}
            fill="var(--series-1)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}
        {last ? (
          <text
            x={x(points.length - 1) - 8}
            y={y(last.views) - 10}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill="var(--foreground)"
          >
            {formatNumber(last.views)}
          </text>
        ) : null}

        {points.map((p, i) => (
          <text
            key={p.checkpoint}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            fontSize={11}
            fill="var(--muted-foreground)"
          >
            {CHECKPOINT_LABELS[p.checkpoint]}
          </text>
        ))}
      </svg>

      <table className="w-full text-xs">
        <caption className="sr-only">Views kumulatif per checkpoint</caption>
        <thead>
          <tr className="text-muted-foreground">
            {points.map((p) => (
              <th key={p.checkpoint} scope="col" className="px-1 text-right font-normal">
                {CHECKPOINT_LABELS[p.checkpoint]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {points.map((p) => (
              <td key={p.checkpoint} className="px-1 text-right font-medium tabular-nums">
                {formatNumber(p.views)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
