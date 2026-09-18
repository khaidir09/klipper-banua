import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Metrik kampanye" };

export default async function CampaignMetricsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadCampaign(id);

  return (
    <PhasePlaceholder title="Metrik" phase="Fase 4">
      Snapshot views, klik tautan, dan laporan pendaftar (PRD M7).
    </PhasePlaceholder>
  );
}
