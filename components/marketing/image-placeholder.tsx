import { ImageIcon } from "lucide-react";
import { cn } from "cn";

/**
 * On the brand panel a light card would read as a bright hole in the navy, so
 * the `brand` tone frames the area with the panel's own foreground instead.
 */
const TONES = {
  default: "border-border bg-card text-muted-foreground",
  brand: "border-brand-panel-foreground/25 bg-brand-panel-foreground/5 text-brand-panel-muted",
} as const;

/**
 * Stand-in for an image the public site still needs. Replace it with
 * `next/image` pointing at a file in `public/`, keeping the same aspect ratio
 * so the layout does not shift (design system §13, and no photo that implies
 * a real client per FR-M15-06).
 *
 * Decorative until then, so it stays out of the accessibility tree.
 */
export function ImagePlaceholder({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-16/10 flex-col items-center justify-center gap-2 rounded-xl border border-dashed",
        TONES[tone],
        className,
      )}
    >
      <ImageIcon className="size-6" />
      <p className="px-4 text-center text-xs">{label}</p>
    </div>
  );
}
