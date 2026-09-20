import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, UserX } from "lucide-react";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { CreatorStatusBadge } from "@/components/creators/creator-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatorCampaignHistory } from "@/components/campaigns/campaign-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireInternal } from "@/lib/auth/guards";
import { CREATOR_TIER_LABELS, nicheLabel } from "@/lib/constants/creators";
import { listCreatorAssignments } from "@/lib/data/campaigns";
import {
  getCreator,
  getMaskedBankAccount,
  getPortalAccount,
  signProofUrl,
} from "@/lib/data/creators";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verificationBlockers } from "@/lib/validation/creators";
import { formatWhatsapp, whatsappLink } from "@/lib/validation/phone";
import { AnonymizeCreatorButton } from "./anonymize-creator-button";
import { BankAccountPanel } from "./bank-account-panel";
import { DeleteCreatorButton } from "./delete-creator-button";
import { PortalAccess } from "./portal-access";
import { SocialAccounts } from "./social-accounts";
import { TermsVerification } from "./terms-verification";

export const metadata: Metadata = { title: "Detail kreator" };

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireInternal();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const creator = await getCreator(supabase, id);
  if (!creator) notFound();

  const isOwner = profile.role === "owner";
  const anonymized = creator.anonymized_at !== null;
  const tz = profile.timezone;

  const [proofUrls, maskedBank, history, portalAccount] = await Promise.all([
    Promise.all(creator.social_accounts.map((a) => signProofUrl(supabase, a.audience_proof_path))),
    getMaskedBankAccount(supabase, id),
    listCreatorAssignments(supabase, id),
    getPortalAccount(supabase, creator.profile_id),
  ]);

  const blockers = verificationBlockers({
    hasProofAccount: creator.social_accounts.some((a) => Boolean(a.audience_proof_path)),
    termsAgreedAt: creator.terms_agreed_at,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={creator.full_name}
        description={creator.stage_name ? `@${creator.stage_name}` : undefined}
        backHref="/creators"
        backLabel="Daftar kreator"
        actions={
          anonymized ? null : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/creators/${id}/edit`}>
                  <Pencil aria-hidden />
                  Ubah
                </Link>
              </Button>
              {isOwner ? (
                <>
                  {/* Only creators never assigned can be deleted outright. */}
                  {history.length === 0 ? (
                    <DeleteCreatorButton creatorId={id} name={creator.full_name} />
                  ) : (
                    <AnonymizeCreatorButton creatorId={id} name={creator.full_name} />
                  )}
                </>
              ) : null}
            </>
          )
        }
      />

      {anonymized ? (
        <Alert>
          <UserX />
          <AlertDescription>
            Data pribadi kreator ini dianonimkan pada {formatDateTime(creator.anonymized_at!, tz)}.
            Riwayat kampanye dan honor tetap tersimpan; data tidak dapat diubah lagi.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <CreatorStatusBadge status={creator.status} />
        <Badge variant="outline">Tier {CREATOR_TIER_LABELS[creator.tier]}</Badge>
        {creator.niches.map((niche) => (
          <Badge key={niche} variant="outline">
            {nicheLabel(niche)}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          {anonymized ? null : (
            <>
              <TabsTrigger value="sosial">
                Akun sosial ({creator.social_accounts.length})
              </TabsTrigger>
              <TabsTrigger value="verifikasi">Persetujuan & verifikasi</TabsTrigger>
              <TabsTrigger value="rekening">Rekening</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
            </>
          )}
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: "WhatsApp",
                    value: creator.phone_wa ? (
                      <a
                        href={whatsappLink(creator.phone_wa)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {formatWhatsapp(creator.phone_wa)}
                      </a>
                    ) : null,
                  },
                  { label: "Email", value: creator.email },
                  { label: "Provinsi", value: creator.province },
                  { label: "Kota / kabupaten", value: creator.city },
                  {
                    label: "Tanggal lahir",
                    value: creator.birth_date
                      ? formatCalendarDate(creator.birth_date, "d MMMM yyyy")
                      : null,
                  },
                  { label: "Terdaftar", value: formatDateTime(creator.created_at, tz) },
                  { label: "Catatan", value: creator.notes, wide: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sosial">
          <SocialAccounts
            creatorId={id}
            accounts={creator.social_accounts.map((account, index) => ({
              ...account,
              proof_url: proofUrls[index] ?? null,
            }))}
            timezone={tz}
          />
        </TabsContent>

        <TabsContent value="verifikasi">
          <TermsVerification
            creatorId={id}
            status={creator.status}
            termsVersion={creator.terms_version}
            termsAgreedAt={creator.terms_agreed_at}
            verifiedAt={creator.verified_at}
            blockers={blockers}
            timezone={tz}
          />
        </TabsContent>

        <TabsContent value="rekening">
          <BankAccountPanel creatorId={id} isOwner={isOwner} masked={maskedBank} />
        </TabsContent>

        <TabsContent value="portal">
          <PortalAccess
            creatorId={id}
            creatorEmail={creator.email}
            status={creator.status}
            account={portalAccount}
            portalInvitedAt={creator.portal_invited_at}
            isOwner={isOwner}
            timezone={tz}
          />
        </TabsContent>

        <TabsContent value="riwayat">
          <CreatorCampaignHistory assignments={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
