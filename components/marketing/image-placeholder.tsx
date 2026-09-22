import { ImageIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Stand-in for an image the public site still needs. Replace it with
 * `next/image` pointing at a file in `public/`, keeping the same aspect ratio
 * so the layout does not shift (design system §13, and no photo that implies
 * a real client per FR-M15-06).
 *
 * Decorative until then, so it stays out of the accessibility tree.
 */
export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-16/10 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card text-muted-foreground",
        className,
      )}
    >
      <ImageIcon className="size-6" />
      <p className="px-4 text-center text-xs">{label}</p>
    </div>
  );
}
