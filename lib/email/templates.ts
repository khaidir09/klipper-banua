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
  const footer = `Email ini dikirim otomatis oleh ${common.appName}. Jangan membalas email ini.`;

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
    `${formatRupiah(credit ?? 0)}${creditLimited ? " (dibatasi batas kampanye)" : ""}`,
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
    return render(input, {
      subject: "Klip Anda disetujui",
      paragraphs: [`Klip Anda untuk kampanye ${campaign} sudah diverifikasi dan disetujui tim.`],
      facts: creditFacts(input.verifiedViews, input.credit, input.creditLimited),
      actionLabel: "Lihat klip saya",
    });
  }

  if (input.decision === "revisi") {
    return render(input, {
      subject: "Klip Anda perlu diperbaiki",
      paragraphs: [
        `Tim meminta perbaikan untuk klip Anda di kampanye ${campaign}.`,
        "Perbaiki sesuai catatan di bawah, lalu kirim ulang klip dari portal tanpa mengubah tautannya.",
      ],
      facts: notesFact(input.notes),
      actionLabel: "Perbaiki klip",
    });
  }

  const reason = input.rejectionReason ? CLIP_REJECTION_REASON_LABELS[input.rejectionReason] : null;
  return render(input, {
    subject: "Klip Anda ditolak",
    paragraphs: [`Klip Anda untuk kampanye ${campaign} tidak disetujui tim.`],
    facts: [...(reason ? ([["Alasan", reason]] as [string, string][]) : []), ...notesFact(input.notes)],
    actionLabel: "Lihat klip saya",
  });
}

/** FR-M18-09: the team decided on a views update of an approved clip. */
export function viewsUpdateEmail(input: ViewsUpdateEmail): EmailMessage {
  const campaign = `"${input.campaignName}"`;

  if (input.accepted) {
    return render(input, {
      subject: "Pembaruan views diterima",
      paragraphs: [`Pembaruan views klip Anda di kampanye ${campaign} sudah diverifikasi tim.`],
      facts: creditFacts(input.verifiedViews, input.credit, input.creditLimited),
      actionLabel: "Lihat klip saya",
    });
  }

  return render(input, {
    subject: "Pembaruan views ditolak",
    paragraphs: [
      `Pembaruan views klip Anda di kampanye ${campaign} tidak diterima tim. Views terverifikasi sebelumnya tetap berlaku.`,
    ],
    facts: notesFact(input.notes),
    actionLabel: "Lihat klip saya",
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
    subject: "Penarikan Anda sudah dibayar",
    paragraphs: [
      "Penarikan saldo Anda sudah ditransfer ke rekening yang Anda daftarkan saat mengajukan.",
      "Bila dana belum masuk dalam 1×24 jam, hubungi tim kami.",
    ],
    facts,
    actionLabel: "Lihat saldo",
  });
}
