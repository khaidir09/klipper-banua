import { Badge } from "@/components/ui/badge";
import {
  ASSIGNMENT_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type AssignmentStatus,
  type CampaignStatus,
} from "@/lib/constants/campaigns";

const CAMPAIGN_VARIANTS: Record<CampaignStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "outline",
  aktif: "default",
  selesai: "secondary",
  dibatalkan: "destructive",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={CAMPAIGN_VARIANTS[status]}>{CAMPAIGN_STATUS_LABELS[status]}</Badge>;
}

const ASSIGNMENT_VARIANTS: Record<AssignmentStatus, React.ComponentProps<typeof Badge>["variant"]> =
  {
    diundang: "outline",
    bergabung: "default",
    mundur: "destructive",
    selesai: "secondary",
  };

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return <Badge variant={ASSIGNMENT_VARIANTS[status]}>{ASSIGNMENT_STATUS_LABELS[status]}</Badge>;
}
