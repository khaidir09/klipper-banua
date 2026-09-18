"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHECKPOINT_LABELS, type MetricCheckpoint } from "@/lib/constants/metrics";
import { formatNumber } from "@/lib/format/number";

type Point = { checkpoint: MetricCheckpoint; views: number };

/** Compact axis ticks, e.g. 12.000 → "12 rb", 1.500.000 → "1,5 jt". */
function compact(value: number): string {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground">{CHECKPOINT_LABELS[point.checkpoint]}</p>
      <p className="font-medium text-foreground">{formatNumber(point.views)} views</p>
    </div>
  );
}

/**
 * FR-M7-05: cumulative views per checkpoint. One series, so no legend: the
 * card title names it, the last point carries a direct label, and the target
 * is a labelled reference line. Values are also listed below for a table view.
 */
export function CumulativeViewsChart({ points, target }: { points: Point[]; target: number }) {
  const last = points.length - 1;
  const max = Math.max(target, ...points.map((p) => p.views), 1);

  return (
    <figure className="space-y-3">
      <div className="h-64 w-full" role="img" aria-label="Grafik views kumulatif per checkpoint">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 24, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis
              dataKey="checkpoint"
              tickFormatter={(value: MetricCheckpoint) => CHECKPOINT_LABELS[value]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, Math.ceil(max * 1.1)]}
              tickFormatter={compact}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            {target > 0 ? (
              <ReferenceLine
                y={target}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                label={{
                  value: `Target ${compact(target)}`,
                  position: "insideTopRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
            ) : null}
            <Area
              type="linear"
              dataKey="views"
              stroke="var(--series-1)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="var(--series-1)"
              fillOpacity={0.1}
              dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--card)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--series-1)", stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="views"
                position="top"
                content={({ x, y, value, index }) =>
                  index === last ? (
                    <text
                      x={Number(x)}
                      y={Number(y) - 10}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="var(--foreground)"
                    >
                      {formatNumber(Number(value))}
                    </text>
                  ) : null
                }
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          {points.map((point) => (
            <div key={point.checkpoint} className="flex justify-between gap-2 sm:block">
              <dt className="text-muted-foreground">{CHECKPOINT_LABELS[point.checkpoint]}</dt>
              <dd className="font-medium tabular-nums">{formatNumber(point.views)}</dd>
            </div>
          ))}
        </dl>
      </figcaption>
    </figure>
  );
}
