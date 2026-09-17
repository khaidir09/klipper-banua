import { cn } from "@/lib/utils";

export type DetailItem = {
  label: string;
  value: React.ReactNode;
  /** Span both columns on wide screens, e.g. for long notes. */
  wide?: boolean;
};

/** Two-column label/value grid used on detail pages. */
export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className={cn(item.wide && "sm:col-span-2")}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 whitespace-pre-line">
            {item.value === null || item.value === undefined || item.value === "" ? (
              <span className="text-muted-foreground">–</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
