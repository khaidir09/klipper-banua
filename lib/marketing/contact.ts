/**
 * Contact links for the public site (FR-M15-07). The site has no form and
 * stores nothing: a visitor writes to the team on WhatsApp or by email, and
 * the team records whatever is agreed inside the app.
 *
 * Pure builders only — the numbers themselves come from the environment and
 * are read by the component, so these stay testable.
 */
export type ContactIntent = "client" | "creator";

type Intent = {
  /** Prefilled WhatsApp opener, so the team knows which side wrote first. */
  message: string;
  /** Email subject for the same purpose. */
  subject: string;
};

export const CONTACT_INTENTS: Record<ContactIntent, Intent> = {
  client: {
    message: "Halo, saya dari instansi dan ingin bertanya soal kampanye kreator lokal Kalimantan.",
    subject: "Tanya kampanye kreator lokal",
  },
  creator: {
    message: "Halo, saya kreator di Kalimantan dan ingin bergabung sebagai mitra.",
    subject: "Pendaftaran mitra kreator",
  },
};

/**
 * `wa.me` expects an international number without `+` or separators. Returns
 * null when the number is not configured, so the button is simply left out
 * instead of pointing nowhere.
 */
export function whatsappUrl(phone: string | undefined, intent: ContactIntent): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(CONTACT_INTENTS[intent].message)}`;
}

export function mailtoUrl(email: string | undefined, intent: ContactIntent): string | null {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(CONTACT_INTENTS[intent].subject)}`;
}
