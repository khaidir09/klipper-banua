import { cn } from "cn";

/**
 * Page width for the public site. 16px side gutter on a phone so nothing
 * touches the screen edge (design system §4i).
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  /** `muted` separates neighbouring sections without adding a new colour. */
  tone?: "default" | "muted";
  /**
   * `split` puts the heading beside its content from `lg` up, instead of
   * above it. Short content — an accordion, a single image — otherwise leaves
   * a wide empty gutter on a desktop screen.
   */
  layout?: "stacked" | "split";
  /** Call to action that belongs with the heading, not with the content. */
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/**
 * One message per section, with the vertical rhythm the design system fixes
 * for `(marketing)`: 64px on a phone, 96px from `lg` up (§13).
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  tone = "default",
  layout = "stacked",
  action,
  className,
  children,
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || title || description);

  const header = hasHeader && (
    <div className="max-w-[65ch]">
      {eyebrow && <p className="text-sm font-medium text-info-soft-foreground">{eyebrow}</p>}
      {title && (
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-3 text-base text-pretty text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );

  return (
    <section
      id={id}
      // `scroll-mt` keeps the heading clear of the sticky header when an
      // in-page link jumps here.
      className={cn(
        "scroll-mt-24 py-16 lg:py-24",
        tone === "muted" && "border-y bg-muted/40",
        className,
      )}
    >
      <Container>
        {layout === "split" ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
            {header}
            <div>{children}</div>
          </div>
        ) : (
          <>
            {header}
            {children && <div className={cn(hasHeader && "mt-10")}>{children}</div>}
          </>
        )}
      </Container>
    </section>
  );
}
