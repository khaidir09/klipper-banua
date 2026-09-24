import { CLIP_REJECTION_REASON_LABELS, type ClipRejectionReason } from "@/lib/constants/clips";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";

/*
 * Klipper notification emails (FR-M18-09, FR-M19-09). Pure builders so the
 * wording is unit tested; sending lives in `lib/email/send.ts`. The emails
 * never carry bank account numbers or transfer proofs.
 */

export type EmailMessage = { subject: string; text: string; html: string };

type Common = {
  appName: string;
  recipientName: string;
  /** Absolute portal URL the call-to-action points to. */
  actionUrl: string;
};

export type ClipDecisionEmail = Common & {
  campaignName: string;
  decision: "disetujui" | "revisi" | "ditolak";
  verifiedViews?: number | null;
  credit?: number | null;
  creditLimited?: boolean;
  rejectionReason?: ClipRejectionReason | null;
  notes?: string | null;
};

export type ViewsUpdateEmail = Common & {
  campaignName: string;
  accepted: boolean;
  verifiedViews?: number | null;
  credit?: number | null;
  creditLimited?: boolean;
  notes?: string | null;
};

export type WithdrawalPaidEmail = Common & {
  amount: number;
  transferFee: number;
  /** `yyyy-MM-dd` transfer date (`withdrawals.paid_at`). */
  paidAt: string;
};

type Body = {
  subject: string;
  paragraphs: string[];
  /** Label/value rows shown as a small table. */
  facts: [string, string][];
  actionLabel: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render(common: Common, body: Body): EmailMessage {
  const greeting = `Halo ${common.recipientName},`;
  const footer = `Email ini dikirim otomatis oleh ${common.appName}, jadi nggak perlu dibalas. Ada pertanyaan? Hubungi tim lewat WhatsApp.`;

  const text = [
    greeting,
    "",
    ...body.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    ...body.facts.map(([label, value]) => `${label}: ${value}`),
    ...(body.facts.length ? [""] : []),
    `${body.actionLabel}: ${common.actionUrl}`,
    "",
    "--",
    footer,
  ].join("\n");

  const facts = body.facts.length
    ? `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:16px 0;font-size:14px">${body.facts
        .map(
          ([label, value]) =>
            `<tr><td style="color:#555;padding-right:16px">${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
        )
        .join("")}</table>`
    : "";

  const html = `<!doctype html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px">
<p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
${body.paragraphs.map((paragraph) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(paragraph)}</p>`).join("\n")}
${facts}
<p style="margin:24px 0"><a href="${escapeHtml(common.actionUrl)}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block">${escapeHtml(body.actionLabel)}</a></p>
<p style="margin:24px 0 0;font-size:12px;color:#777">${escapeHtml(footer)}</p>
</div>
</body>
</html>`;

  return { subject: `${body.subject} · ${common.appName}`, text, html };
}

function creditFacts(
  verifiedViews: number | null | undefined,
  credit: number | null | undefined,
  creditLimited: boolean | undefined,
): [string, string][] {
  const facts: [string, string][] = [];
  if (verifiedViews !== null && verifiedViews !== undefined) {
    facts.push(["Views terverifikasi", formatNumber(verifiedViews)]);
  }
  facts.push([
    "Honor masuk saldo",
    `${formatRupiah(credit ?? 0)}${creditLimited ? " (mentok batas honor kampanye)" : ""}`,
  ]);
  return facts;
}

function notesFact(notes: string | null | undefined): [string, string][] {
  const trimmed = notes?.trim();
  return trimmed ? [["Catatan tim", trimmed]] : [];
}

/** FR-M18-09: the team decided on a submitted clip. */
export function clipDecisionEmail(input: ClipDecisionEmail): EmailMessage {
  const campaign = `"${input.campaignName}"`;

  if (input.decision === "disetujui") {
    // The honor is the news, so it goes in the subject line when there is one.
    const credited = input.credit ? `: +${formatRupiah(input.credit)} masuk saldo` : "";
    return render(input, {
      subject: `Klipmu disetujui${credited}`,
      paragraphs: [
        `Mantap! Klipmu untuk kampanye ${campaign} sudah dicek dan disetujui tim.`,
        "Views-nya masih bisa naik. Kirim update views dari portal biar honormu ikut nambah.",
      ],
      facts: creditFacts(input.verifiedViews, input.credit, input.creditLimited),
      actionLabel: "Lihat klipku",
    });
  }

  if (input.decision === "revisi") {
    return render(input, {
      subject: "Klipmu perlu sedikit diperbaiki",
      paragraphs: [
        `Klipmu di kampanye ${campaign} hampir lolos, tinggal diperbaiki sedikit.`,
        "Perbaiki sesuai catatan tim di bawah, lalu kirim ulang dari portal. Tautannya nggak perlu diganti.",
      ],
      facts: notesFact(input.notes),
      actionLabel: "Perbaiki klipku",
    });
  }

  const reason = input.rejectionReason ? CLIP_REJECTION_REASON_LABELS[input.rejectionReason] : null;
  return render(input, {
    subject: "Klipmu belum bisa disetujui",
    paragraphs: [
      `Maaf, klipmu untuk kampanye ${campaign} nggak disetujui tim. Alasannya ada di bawah.`,
      "Jangan patah semangat. Masih banyak kampanye lain yang bisa kamu ikuti di portal.",
    ],
    facts: [
      ...(reason ? ([["Alasan", reason]] as [string, string][]) : []),
      ...notesFact(input.notes),
    ],
    actionLabel: "Lihat klipku",
  });
}

/** FR-M18-09: the team decided on a views update of an approved clip. */
export function viewsUpdateEmail(input: ViewsUpdateEmail): EmailMessage {
  const campaign = `"${input.campaignName}"`;

  if (input.accepted) {
    return render(input, {
      subject: input.credit
        ? `Update views diterima: +${formatRupiah(input.credit)} masuk saldo`
        : "Update views diterima",
      paragraphs: [`Update views klipmu di kampanye ${campaign} sudah dicek tim.`],
      facts: creditFacts(input.verifiedViews, input.credit, input.creditLimited),
      actionLabel: "Lihat klipku",
    });
  }

  return render(input, {
    subject: "Update views belum diterima",
    paragraphs: [
      `Update views klipmu di kampanye ${campaign} belum diterima tim. Tenang, views terverifikasi sebelumnya tetap berlaku.`,
      "Cek catatan di bawah. Kamu bisa kirim update lagi dengan screenshot yang lebih jelas.",
    ],
    facts: notesFact(input.notes),
    actionLabel: "Lihat klipku",
  });
}

/** FR-M19-09: the owner marked a withdrawal as paid. */
export function withdrawalPaidEmail(input: WithdrawalPaidEmail): EmailMessage {
  const facts: [string, string][] = [["Nominal penarikan", formatRupiah(input.amount)]];
  if (input.transferFee > 0) {
    facts.push(["Biaya transfer", formatRupiah(input.transferFee)]);
  }
  facts.push(
    ["Jumlah diterima", formatRupiah(input.amount - input.transferFee)],
    ["Tanggal transfer", formatCalendarDate(input.paidAt)],
  );

  return render(input, {
    subject: `Honor ${formatRupiah(input.amount - input.transferFee)} sudah ditransfer`,
    paragraphs: [
      "Cuan! Penarikan saldomu sudah kami transfer ke rekening yang kamu daftarkan waktu mengajukan.",
      "Kalau dananya belum masuk dalam 1×24 jam, hubungi tim, ya.",
    ],
    facts,
    actionLabel: "Lihat saldoku",
  });
}
