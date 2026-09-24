import { describe, expect, it } from "vitest";
import { clipDecisionEmail, viewsUpdateEmail, withdrawalPaidEmail } from "@/lib/email/templates";

const common = {
  appName: "Klipper Banua",
  recipientName: "Budi",
  actionUrl: "https://app.contoh.id/portal/klip",
};

describe("clipDecisionEmail", () => {
  it("reports verified views and the credited honor on approval", () => {
    const email = clipDecisionEmail({
      ...common,
      campaignName: "PMB 2026",
      decision: "disetujui",
      verifiedViews: 12500,
      credit: 125000,
    });
    expect(email.subject).toBe("Klip Anda disetujui · Klipper Banua");
    expect(email.text).toContain("Halo Budi,");
    expect(email.text).toContain('kampanye "PMB 2026"');
    expect(email.text).toContain("Views terverifikasi: 12.500");
    expect(email.text).toContain("Honor masuk saldo: Rp 125.000");
    expect(email.text).toContain("https://app.contoh.id/portal/klip");
    expect(email.html).toContain('href="https://app.contoh.id/portal/klip"');
  });

  it("marks a credit limited by the campaign caps", () => {
    const email = clipDecisionEmail({
      ...common,
      campaignName: "PMB",
      decision: "disetujui",
      verifiedViews: 100000,
      credit: 500000,
      creditLimited: true,
    });
    expect(email.text).toContain("Rp 500.000 (dibatasi batas kampanye)");
  });

  it("carries the team notes on a revision request", () => {
    const email = clipDecisionEmail({
      ...common,
      campaignName: "PMB",
      decision: "revisi",
      notes: "Tambahkan kode KB-ABC234 di caption.",
    });
    expect(email.subject).toBe("Klip Anda perlu diperbaiki · Klipper Banua");
    expect(email.text).toContain("Catatan tim: Tambahkan kode KB-ABC234 di caption.");
    expect(email.text).not.toContain("Honor");
  });

  it("names the rejection reason", () => {
    const email = clipDecisionEmail({
      ...common,
      campaignName: "PMB",
      decision: "ditolak",
      rejectionReason: "bukan_pemilik",
      notes: "Akun tidak terdaftar.",
    });
    expect(email.subject).toBe("Klip Anda ditolak · Klipper Banua");
    expect(email.text).toContain("Alasan: Bukan pemilik akun");
    expect(email.text).toContain("Catatan tim: Akun tidak terdaftar.");
  });

  it("escapes user-provided text in the HTML part", () => {
    const email = clipDecisionEmail({
      ...common,
      recipientName: "<b>Budi</b>",
      campaignName: "A & B",
      decision: "revisi",
      notes: '<script>alert("x")</script>',
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>Budi</b>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("A &amp; B");
  });
});

describe("viewsUpdateEmail", () => {
  it("reports the credited difference when accepted", () => {
    const email = viewsUpdateEmail({
      ...common,
      campaignName: "PMB",
      accepted: true,
      verifiedViews: 30000,
      credit: 0,
    });
    expect(email.subject).toBe("Pembaruan views diterima · Klipper Banua");
    expect(email.text).toContain("Views terverifikasi: 30.000");
    expect(email.text).toContain("Honor masuk saldo: Rp 0");
  });

  it("keeps earlier verified views when rejected", () => {
    const email = viewsUpdateEmail({
      ...common,
      campaignName: "PMB",
      accepted: false,
      notes: "Tangkapan layar buram.",
    });
    expect(email.subject).toBe("Pembaruan views ditolak · Klipper Banua");
    expect(email.text).toContain("Views terverifikasi sebelumnya tetap berlaku.");
    expect(email.text).toContain("Catatan tim: Tangkapan layar buram.");
  });
});

describe("withdrawalPaidEmail", () => {
  const paid = {
    ...common,
    actionUrl: "https://app.contoh.id/portal/saldo",
    amount: 150000,
    paidAt: "2026-09-24",
  };

  it("shows the fee and the amount received", () => {
    const email = withdrawalPaidEmail({ ...paid, transferFee: 2500 });
    expect(email.subject).toBe("Penarikan Anda sudah dibayar · Klipper Banua");
    expect(email.text).toContain("Nominal penarikan: Rp 150.000");
    expect(email.text).toContain("Biaya transfer: Rp 2.500");
    expect(email.text).toContain("Jumlah diterima: Rp 147.500");
    expect(email.text).toContain("Tanggal transfer: 24 Sep 2026");
  });

  it("leaves out a zero transfer fee", () => {
    const email = withdrawalPaidEmail({ ...paid, transferFee: 0 });
    expect(email.text).not.toContain("Biaya transfer");
    expect(email.text).toContain("Jumlah diterima: Rp 150.000");
  });
});
