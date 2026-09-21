import { Ban, CircleSlash, Trash2, XCircle, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ASSIGNMENT_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type AssignmentStatus,
  type CampaignStatus,
} from "@/lib/constants/campaigns";
import {
  LIVE_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  type LiveStatus,
  type ReviewStatus,
} from "@/lib/constants/contents";
import { CREATOR_STATUS_LABELS, type CreatorStatus } from "@/lib/constants/creators";
import {
  CLIENT_PAYMENT_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  type ClientPaymentStatus,
  type PayoutStatus,
} from "@/lib/constants/finance";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/lib/constants/metrics";
import {
  ASSIGNMENT_TONES,
  CAMPAIGN_TONES,
  CLIENT_PAYMENT_TONES,
  CREATOR_TONES,
  LIVE_TONES,
  PAYOUT_TONES,
  REVIEW_TONES,
  SUBMISSION_TONES,
  type StatusTone,
} from "./status-tone";

/**
 * Statuses that stop work rather than move it along. They carry an icon as well
 * as a tone, so "this one went wrong" never rests on colour alone (WCAG 1.4.1).
 */
const HALTING_ICONS: Record<string, LucideIcon> = {
  dibatalkan: CircleSlash,
  mundur: CircleSlash,
  diblokir: Ban,
  ditolak: XCircle,
  dihapus: Trash2,
};

function Status({ status, tone, label }: { status: string; tone: StatusTone; label: string }) {
  const Icon = HALTING_ICONS[status];
  return (
    <Badge variant={tone}>
      {Icon ? <Icon aria-hidden /> : null}
      {label}
    </Badge>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Status status={status} tone={CAMPAIGN_TONES[status]} label={CAMPAIGN_STATUS_LABELS[status]} />
  );
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Status
      status={status}
      tone={ASSIGNMENT_TONES[status]}
      label={ASSIGNMENT_STATUS_LABELS[status]}
    />
  );
}

export function CreatorStatusBadge({ status }: { status: CreatorStatus }) {
  return (
    <Status status={status} tone={CREATOR_TONES[status]} label={CREATOR_STATUS_LABELS[status]} />
  );
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Status status={status} tone={REVIEW_TONES[status]} label={REVIEW_STATUS_LABELS[status]} />
  );
}

export function LiveStatusBadge({ status }: { status: LiveStatus }) {
  return <Status status={status} tone={LIVE_TONES[status]} label={LIVE_STATUS_LABELS[status]} />;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <Status status={status} tone={PAYOUT_TONES[status]} label={PAYOUT_STATUS_LABELS[status]} />
  );
}

export function ClientPaymentStatusBadge({ status }: { status: ClientPaymentStatus }) {
  return (
    <Status
      status={status}
      tone={CLIENT_PAYMENT_TONES[status]}
      label={CLIENT_PAYMENT_STATUS_LABELS[status]}
    />
  );
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Status
      status={status}
      tone={SUBMISSION_TONES[status]}
      label={SUBMISSION_STATUS_LABELS[status]}
    />
  );
}
