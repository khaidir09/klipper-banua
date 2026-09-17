import { Badge } from "@/components/ui/badge";
import { CREATOR_STATUS_LABELS, type CreatorStatus } from "@/lib/constants/creators";

const VARIANTS: Record<CreatorStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  prospek: "outline",
  terverifikasi: "secondary",
  aktif: "default",
  nonaktif: "outline",
  diblokir: "destructive",
};

export function CreatorStatusBadge({ status }: { status: CreatorStatus }) {
  return <Badge variant={VARIANTS[status]}>{CREATOR_STATUS_LABELS[status]}</Badge>;
}
