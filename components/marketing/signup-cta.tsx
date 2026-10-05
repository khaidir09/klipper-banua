import Link from "next/link";
import { UserPlus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { SIGNUP_PATH } from "@/lib/marketing/routes";

/**
 * The kliper's way in (PRD M16, FR-M15-02): a plain link to /daftar. The
 * form itself lives outside `(marketing)`, so this group stays static and
 * database-free. `brand` inverts the button on the navy panel, as ContactCta
 * does.
 */
export function SignupCta({
  tone = "default",
  label = "Daftar jadi Kliper",
  className,
}: {
  tone?: "default" | "brand";
  label?: string;
  className?: string;
}) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "h-11 px-5 text-sm",
        tone === "brand" &&
          "bg-brand-panel-foreground text-brand-panel hover:bg-brand-panel-foreground/90 focus-visible:ring-brand-panel-foreground/40",
        className,
      )}
    >
      <Link href={SIGNUP_PATH} data-cta>
        <UserPlus aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
