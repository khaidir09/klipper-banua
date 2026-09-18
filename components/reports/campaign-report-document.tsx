import { StaticViewsChart } from "@/components/charts/static-views-chart";
import type { CampaignReport, ReportTarget } from "@/lib/calculations/campaign-report";
import { CAMPAIGN_OBJECTIVE_LABELS, type CampaignObjective } from "@/lib/constants/campaigns";
import { LIVE_STATUS_LABELS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { formatCalendarRange, formatDate, formatDateTime } from "@/lib/format/date";
import { formatNumber, formatPercent } from "@/lib/format/number";
import { cn } from "@/lib/utils";

export type ReportCampaign = {
  code: string;
  name: string;
  objective: CampaignObjective;
  start_date: string;
  end_date: string;
  closing_notes: string;
  clientName: string | null;
};

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="border-b pb-1 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, value, target }: { label: string; value: number; target?: ReportTarget }) {
  return (
    <div className="report-keep rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{formatNumber(value)}</p>
      {target ? (
        <p className="text-xs text-muted-foreground">
          {target.pct === null
            ? "Tanpa target"
            : `${formatPercent(target.pct)} dari target ${formatNumber(target.target)}`}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Tanpa klik bot</p>
      )}
    </div>
  );
}

const th = "px-2 py-1.5 text-left text-xs font-medium text-muted-foreground";
const td = "px-2 py-1.5 align-top";
const num = "text-right tabular-nums";

/**
 * FR-M9-01/02: the client report, laid out for A4. It receives only the
 * report model (no finance data, FR-M9-03), so it is safe to hand to clients.
 */
export function CampaignReportDocument({
  campaign,
  report,
  timezone,
  generatedAt,
}: {
  campaign: ReportCampaign;
  report: CampaignReport;
  timezone: string;
  generatedAt: Date;
}) {
  const { summary } = report;

  return (
    <article className="report-document mx-auto max-w-[190mm] space-y-6 bg-background text-sm text-foreground">
      <header className="space-y-1 border-b-2 border-foreground pb-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Laporan kampanye</p>
        <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 pt-1 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Klien</dt>
            <dd className="font-medium">{campaign.clientName ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kode</dt>
            <dd className="font-mono font-medium">{campaign.code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Periode</dt>
            <dd className="font-medium">
              {formatCalendarRange(campaign.start_date, campaign.end_date)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tujuan</dt>
            <dd className="font-medium">{CAMPAIGN_OBJECTIVE_LABELS[campaign.objective]}</dd>
          </div>
        </dl>
      </header>

      <Section title="Ringkasan capaian">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Konten tayang" value={summary.contents.actual} target={summary.contents} />
          <Tile label="Total views" value={summary.views.actual} target={summary.views} />
          <Tile label="Klik tautan valid" value={summary.validClicks} />
          <Tile label="Pendaftar" value={summary.registrants.actual} target={summary.registrants} />
        </div>
        <p className="text-xs text-muted-foreground">
          Views diambil dari snapshot terbaru setiap konten yang tayang. Pendaftar adalah jumlah
          agregat yang dilaporkan klien, termasuk pendaftar tanpa kode referal.
        </p>
      </Section>

      <Section title="Views kumulatif" className="report-keep">
        <StaticViewsChart points={report.chart} target={summary.views.target} />
      </Section>

      <Section title="Capaian per kreator">
        {report.creators.length === 0 ? (
          <p className="text-muted-foreground">Belum ada kreator.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className={th}>Kreator</th>
                <th className={th}>Platform</th>
                <th className={cn(th, "text-right")}>Konten</th>
                <th className={cn(th, "text-right")}>Views</th>
                <th className={cn(th, "text-right")}>Klik</th>
                <th className={cn(th, "text-right")}>Pendaftar</th>
              </tr>
            </thead>
            <tbody>
              {report.creators.map((creator) => (
                <tr key={creator.assignmentId} className="border-b">
                  <td className={td}>
                    <span className="font-medium">{creator.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {creator.referralCode}
                    </span>
                  </td>
                  <td className={td}>
                    {creator.platforms.map((p) => SOCIAL_PLATFORM_LABELS[p]).join(", ") || "–"}
                  </td>
                  <td className={cn(td, num)}>{formatNumber(creator.contents)}</td>
                  <td className={cn(td, num)}>{formatNumber(creator.views)}</td>
                  <td className={cn(td, num)}>{formatNumber(creator.clicks)}</td>
                  <td className={cn(td, num)}>{formatNumber(creator.registrants)}</td>
                </tr>
              ))}
              {report.registrantsWithoutCode > 0 ? (
                <tr className="border-b">
                  <td className={cn(td, "text-muted-foreground")} colSpan={5}>
                    Pendaftar tanpa kode referal
                  </td>
                  <td className={cn(td, num)}>{formatNumber(report.registrantsWithoutCode)}</td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className={td} colSpan={2}>
                  Total
                </td>
                <td className={cn(td, num)}>{formatNumber(summary.contents.actual)}</td>
                <td className={cn(td, num)}>{formatNumber(summary.views.actual)}</td>
                <td className={cn(td, num)}>{formatNumber(summary.validClicks)}</td>
                <td className={cn(td, num)}>{formatNumber(summary.registrants.actual)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Section>

      <Section title="Konten tayang">
        {report.contents.length === 0 ? (
          <p className="text-muted-foreground">Belum ada konten tayang.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className={th}>Kreator</th>
                <th className={th}>Tayang</th>
                <th className={th}>Tautan</th>
                <th className={cn(th, "text-right")}>Views</th>
              </tr>
            </thead>
            <tbody>
              {report.contents.map((content) => (
                <tr key={content.id} className="border-b">
                  <td className={td}>
                    <span className="font-medium">{content.creatorName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {SOCIAL_PLATFORM_LABELS[content.platform]}
                    </span>
                  </td>
                  <td className={cn(td, "whitespace-nowrap")}>
                    {formatDate(content.postedAt, timezone)}
                    {content.liveStatus !== "tayang" ? (
                      <span className="block text-xs text-muted-foreground">
                        {LIVE_STATUS_LABELS[content.liveStatus]}
                      </span>
                    ) : null}
                  </td>
                  <td className={cn(td, "text-xs break-all")}>
                    {content.postedUrl ? (
                      <a href={content.postedUrl} className="underline-offset-2 hover:underline">
                        {content.postedUrl}
                      </a>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className={cn(td, num)}>{formatNumber(content.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Catatan penutup" className="report-keep">
        {campaign.closing_notes ? (
          <p className="leading-relaxed whitespace-pre-line">{campaign.closing_notes}</p>
        ) : (
          <p className="text-muted-foreground">–</p>
        )}
      </Section>

      <footer className="border-t pt-2 text-xs text-muted-foreground">
        Dibuat {formatDateTime(generatedAt, timezone)}
      </footer>
    </article>
  );
}
