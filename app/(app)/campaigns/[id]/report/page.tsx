import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Laporan kampanye" };

export default async function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadCampaign(id);

  return (
    <PhasePlaceholder title="Laporan" phase="Fase 6">
      Laporan siap cetak dan ekspor CSV untuk klien (PRD M9).
    </PhasePlaceholder>
  );
}
