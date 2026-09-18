import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/tables/list-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { requireRole } from "@/lib/auth/guards";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_ENTITY_TYPES,
  activityEntityHref,
} from "@/lib/constants/activity";
import { listActivity, listActivityActors } from "@/lib/data/activity";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { activityListQuerySchema } from "@/lib/validation/activity";

export const metadata: Metadata = { title: "Log aktivitas" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const label = <T extends string>(labels: Record<string, string>, value: T) =>
  labels[value] ?? value;

function detailValue(value: Json): string {
  if (value === null) return "–";
  if (typeof value === "boolean") return value ? "ya" : "tidak";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** FR-M11-02: owner-only audit trail with filters. */
export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireRole("owner");
  const query = activityListQuerySchema.parse(await searchParams);
  const tz = profile.timezone;

  const supabase = await createSupabaseServerClient();
  const [result, actors] = await Promise.all([
    listActivity(supabase, query, tz),
    listActivityActors(supabase),
  ]);

  const params = {
    entity_type: query.entity_type,
    action: query.action,
    actor: query.actor,
    from: query.from,
    to: query.to,
  };
  const filtered = Object.values(params).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log aktivitas"
        description="Jejak audit aksi penting tim. Hanya owner yang dapat melihatnya."
      />

      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
        role="search"
      >
        <NativeSelect
          className="w-full"
          name="entity_type"
          defaultValue={query.entity_type ?? ""}
          aria-label="Data"
        >
          <NativeSelectOption value="">Semua data</NativeSelectOption>
          {ACTIVITY_ENTITY_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {ACTIVITY_ENTITY_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-full"
          name="action"
          defaultValue={query.action ?? ""}
          aria-label="Aksi"
        >
          <NativeSelectOption value="">Semua aksi</NativeSelectOption>
          {ACTIVITY_ACTIONS.map((action) => (
            <NativeSelectOption key={action} value={action}>
              {ACTIVITY_ACTION_LABELS[action]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-full"
          name="actor"
          defaultValue={query.actor ?? ""}
          aria-label="Pelaku"
        >
          <NativeSelectOption value="">Semua pelaku</NativeSelectOption>
          {actors.map((actor) => (
            <NativeSelectOption key={actor.id} value={actor.id}>
              {actor.full_name || "Tanpa nama"}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input type="date" name="from" defaultValue={query.from} aria-label="Dari tanggal" />
        <Input type="date" name="to" defaultValue={query.to} aria-label="Sampai tanggal" />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="flex-1">
            Terapkan
          </Button>
          {filtered ? (
            <Button variant="ghost" asChild>
              <Link href="/activity">Reset</Link>
            </Button>
          ) : null}
        </div>
      </form>

      <Card>
        <CardContent>
          {result.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {filtered ? "Tidak ada aktivitas yang cocok dengan filter." : "Belum ada aktivitas."}
            </p>
          ) : (
            <ol className="divide-y">
              {result.rows.map((entry) => {
                const href = activityEntityHref(entry.entity_type, entry.entity_id);
                const details = Object.entries(
                  (entry.details ?? {}) as Record<string, Json>,
                ).filter(([, value]) => value !== undefined);
                return (
                  <li key={entry.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[11rem_1fr]">
                    <time
                      dateTime={entry.created_at}
                      className="text-xs text-muted-foreground tabular-nums sm:pt-0.5"
                    >
                      {formatDateTime(entry.created_at, tz)}
                    </time>
                    <div className="min-w-0 space-y-1">
                      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="font-medium">
                          {entry.actor?.full_name || "Pengguna terhapus"}
                        </span>
                        <span>{label(ACTIVITY_ACTION_LABELS, entry.action).toLowerCase()}</span>
                        <Badge variant="outline">
                          {label(ACTIVITY_ENTITY_LABELS, entry.entity_type)}
                        </Badge>
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Buka
                            <ArrowUpRight className="size-3" aria-hidden />
                          </Link>
                        ) : null}
                      </p>
                      {details.length ? (
                        <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {details.map(([key, value]) => (
                            <div key={key} className="flex min-w-0 gap-1">
                              <dt className="font-mono">{key}:</dt>
                              <dd className="break-all text-foreground">{detailValue(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        totalItems={result.count}
        params={params}
        basePath="/activity"
      />
      <p className="text-xs text-muted-foreground">
        {formatNumber(result.count)} entri. Log tidak dapat diubah atau dihapus.
      </p>
    </div>
  );
}
