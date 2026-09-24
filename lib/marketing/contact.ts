/**
 * Contact links for the public site (FR-M15-07). The site has no form and
 * stores nothing: a visitor writes to the team on WhatsApp, and the team
 * records whatever is agreed inside the app.
 *
 * Pure builders only — the number itself comes from the environment and is
 * read by the component, so these stay testable.
 */
export type ContactIntent = "client" | "creator";

/** Prefilled openers, so the team knows which side wrote first. */
export const CONTACT_MESSAGES: Record<ContactIntent, string> = {
  client: "Halo, saya ingin bertanya soal memasang kampanye klipper lokal Kalimantan.",
  creator: "Halo, saya klipper dan butuh bantuan soal pendaftaran atau kampanye.",
};

/**
 * `wa.me` expects an international number without `+` or separators. Returns
 * null when the number is missing or too short to be real, so the button is
 * left out instead of pointing nowhere.
 */
function digitsOnly(phone: string | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsappUrl(phone: string | undefined, intent: ContactIntent): string | null {
  const number = digitsOnly(phone);
  if (!number) return null;

  return `https://wa.me/${number}?text=${encodeURIComponent(CONTACT_MESSAGES[intent])}`;
}

/** The number as a reader sees it, for prose that cannot hold a button. */
export function whatsappDisplay(phone: string | undefined): string | null {
  const number = digitsOnly(phone);
  return number ? `+${number}` : null;
}
