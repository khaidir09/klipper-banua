import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Konten kampanye" };

export default async function CampaignContentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await loadCampaign(id);

  return (
    <PhasePlaceholder title="Konten" phase="Fase 3">
      Pencatatan draf konten, checklist review, dan status tayang (PRD M6).
    </PhasePlaceholder>
  );
}
