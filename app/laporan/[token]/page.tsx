import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CampaignReportDocument } from "@/components/reports/campaign-report-document";
import { PrintButton } from "@/components/reports/print-button";
import { openSharedReport } from "@/lib/data/share-links";
import { serverEnv } from "@/lib/env.server";
import { FixedWindowRateLimiter, TRACKING_RATE_LIMIT } from "@/lib/tracking/rate-limit";
import { clientIpFromHeaders, hashIp } from "@/lib/tracking/redirect";

export const metadata: Metadata = {
  title: { absolute: "Laporan kampanye" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// One limiter per server process, like /r/[slug]: slows down token guessing.
const limiter = new FixedWindowRateLimiter(TRACKING_RATE_LIMIT.limit, TRACKING_RATE_LIMIT.windowMs);

/** FR-M9-05: the client report behind a secret link, without login. */
export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const env = serverEnv();

  const ipHash = await hashIp(clientIpFromHeaders(await headers()), env.CLICK_IP_HASH_SALT);
  if (ipHash && !limiter.check(ipHash).allowed) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Terlalu banyak permintaan</h1>
        <p className="text-muted-foreground">Coba buka tautan ini lagi sebentar lagi.</p>
      </main>
    );
  }

  const shared = await openSharedReport(token);
  if (!shared) notFound();

  return (
    <main className="min-h-full bg-muted/40 px-4 py-6 print:bg-white print:p-0">
      <div className="print-hidden mx-auto mb-4 flex max-w-[210mm] justify-end">
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[210mm] overflow-x-auto rounded-md border bg-background p-4 shadow-sm sm:p-[12mm] print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <CampaignReportDocument
          campaign={shared.campaign}
          report={shared.report}
          timezone={env.DEFAULT_TIMEZONE}
          generatedAt={new Date()}
        />
      </div>
    </main>
  );
}
