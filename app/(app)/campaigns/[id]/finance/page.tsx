import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Keuangan kampanye" };

export default async function CampaignFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadCampaign(id);

  return (
    <PhasePlaceholder title="Keuangan" phase="Fase 5">
      Honor kreator, pembayaran klien, margin, CPM, dan biaya per pendaftar (PRD M8).
    </PhasePlaceholder>
  );
}
