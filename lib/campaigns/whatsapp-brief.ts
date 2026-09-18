/**
 * Ready-to-send WhatsApp message for a creator (FR-M5-06). WhatsApp renders
 * *bold* and _italic_, so the headings use asterisks.
 */
export type WhatsappBriefInput = {
  creatorName: string;
  campaignName: string;
  campaignCode: string;
  clientName: string;
  startDate: string;
  endDate: string;
  brief: string;
  mustDo: string[];
  mustNot: string[];
  hashtags: string[];
  paidLabelRequired: boolean;
  minLiveDays: number;
  contentsCommitted: number;
  referralCode: string;
  trackingUrl: string;
};

function bulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

export function buildWhatsappBrief(input: WhatsappBriefInput): string {
  const sections: string[] = [
    `Halo ${input.creatorName}, berikut brief kampanye *${input.campaignName}* (${input.campaignCode}) untuk ${input.clientName}.`,
    `*Periode:* ${input.startDate} – ${input.endDate}\n*Jumlah konten:* ${input.contentsCommitted}\n*Konten wajib tayang minimal:* ${input.minLiveDays} hari`,
  ];

  if (input.brief.trim()) sections.push(`*Brief*\n${input.brief.trim()}`);
  if (input.mustDo.length) sections.push(`*Wajib*\n${bulletList(input.mustDo)}`);
  if (input.mustNot.length) sections.push(`*Larangan*\n${bulletList(input.mustNot)}`);
  if (input.hashtags.length) sections.push(`*Hashtag*\n${input.hashtags.join(" ")}`);
  if (input.paidLabelRequired) {
    sections.push("*Label berbayar:* wajib mencantumkan label konten berbayar/iklan.");
  }

  sections.push(
    `*Kode referal kamu:* ${input.referralCode}\n*Tautan kamu:* ${input.trackingUrl}\nCantumkan tautan ini di bio/keterangan dan minta audiens memakai kode referal saat mendaftar.`,
  );
  sections.push("Kirim draf konten ke tim sebelum diposting untuk ditinjau. Terima kasih!");

  return sections.join("\n\n");
}
