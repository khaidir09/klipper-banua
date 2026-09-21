import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shell for the create / edit forms. Up to `lg` the aside simply follows the
 * form, which keeps the primary task first on a phone. From `xl` it moves into
 * the column that otherwise sat empty on the right and sticks below the app
 * header while the form scrolls. The grid is capped at `2xl` so the two columns
 * keep filling the page instead of drifting apart on a very wide monitor.
 */
export function FormLayout({
  aside,
  className,
  children,
}: {
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-6",
        "xl:grid-cols-[minmax(0,1fr)_18rem]",
        "2xl:max-w-[82rem] 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:gap-8",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {aside ? (
        // `top-20` clears the sticky 3.5rem header plus the 1.5rem page padding.
        <aside className="min-w-0 xl:sticky xl:top-20">{aside}</aside>
      ) : null}
    </div>
  );
}

/** Card used inside `FormLayout`'s aside: a title plus free-form content. */
export function FormAsideCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

/** Bulleted hints for `FormAsideCard`. */
export function FormHints({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="min-w-0 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
