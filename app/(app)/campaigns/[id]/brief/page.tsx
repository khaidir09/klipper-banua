import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAssets } from "@/lib/data/campaigns";
import { loadCampaign } from "../data";
import { AssetsManager } from "./assets-manager";

export const metadata: Metadata = { title: "Brief & materi" };

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function CampaignBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, campaign, canEdit } = await loadCampaign(id);
  const assets = await listAssets(supabase, id);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-line">
            {campaign.brief || (
              <span className="text-muted-foreground">Belum ada deskripsi brief.</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {campaign.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            <Badge variant={campaign.paid_label_required ? "default" : "outline"}>
              {campaign.paid_label_required ? "Label berbayar wajib" : "Label berbayar tidak wajib"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yang wajib</CardTitle>
        </CardHeader>
        <CardContent>
          <List items={campaign.must_do} empty="Belum ada poin wajib." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Larangan</CardTitle>
        </CardHeader>
        <CardContent>
          <List items={campaign.must_not} empty="Belum ada larangan." />
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <AssetsManager campaignId={id} assets={assets} canEdit={canEdit} />
      </div>
    </div>
  );
}
