import { Mail, MessageCircle } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { mailtoUrl, whatsappUrl, type ContactIntent } from "@/lib/marketing/contact";

/**
 * On the brand panel the normal button styles fall apart: `--primary` is almost
 * the same navy as the panel, so the primary button loses its surface, and the
 * `outline` variant paints `--background` white under white text. The `brand`
 * tone inverts instead — white surface on navy (11.5:1, design system §11) for
 * the primary action, and a translucent outline for the secondary one.
 */
const TONES = {
  default: {
    whatsapp: "",
    email: "",
  },
  brand: {
    whatsapp:
      "bg-brand-panel-foreground text-brand-panel hover:bg-brand-panel-foreground/90 focus-visible:ring-brand-panel-foreground/40",
    email:
      "border-brand-panel-foreground/35 bg-transparent text-brand-panel-foreground hover:bg-brand-panel-foreground/10 hover:text-brand-panel-foreground focus-visible:ring-brand-panel-foreground/40 dark:border-brand-panel-foreground/35 dark:bg-transparent dark:hover:bg-brand-panel-foreground/10",
  },
} as const;

/**
 * The only way the public site hands a visitor to the team (FR-M15-07): a
 * prefilled WhatsApp chat or an email. No form, so nothing is stored and no
 * personal data of a prospect ever reaches the database.
 */
export function ContactCta({
  intent,
  tone = "default",
  whatsappLabel = "Hubungi tim di WhatsApp",
  emailLabel = "Kirim email",
  className,
}: {
  intent: ContactIntent;
  tone?: keyof typeof TONES;
  whatsappLabel?: string;
  emailLabel?: string;
  className?: string;
}) {
  const whatsapp = whatsappUrl(publicEnv.NEXT_PUBLIC_CONTACT_WA, intent);
  const email = mailtoUrl(publicEnv.NEXT_PUBLIC_CONTACT_EMAIL, intent);
  const styles = TONES[tone];

  if (!whatsapp && !email) {
    return (
      <p
        className={cn(
          "text-sm",
          tone === "brand" ? "text-brand-panel-muted" : "text-muted-foreground",
          className,
        )}
      >
        Kontak tim belum dikonfigurasi pada pemasangan ini.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      {whatsapp && (
        <Button asChild size="lg" className={cn("h-11 px-5 text-sm", styles.whatsapp)}>
          <a href={whatsapp} data-cta target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {whatsappLabel}
          </a>
        </Button>
      )}
      {email && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className={cn("h-11 px-5 text-sm", styles.email)}
        >
          <a href={email} data-cta>
            <Mail aria-hidden />
            {emailLabel}
          </a>
        </Button>
      )}
    </div>
  );
}
