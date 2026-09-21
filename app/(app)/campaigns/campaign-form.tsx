"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FormAsideCard, FormHints, FormLayout } from "@/components/layout/form-layout";
import { CAMPAIGN_OBJECTIVES, CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/constants/campaigns";
import { formatCalendarRange } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/currency";
import { applyFieldErrors } from "@/lib/forms";
import {
  campaignSchema,
  type CampaignFormInput,
  type CampaignInput,
} from "@/lib/validation/campaigns";
import { createCampaignAction, updateCampaignAction } from "./actions";

type ClientOption = { id: string; name: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DASH = "—";

/** Summary inputs are half-typed form values, so only usable ones are formatted. */
function summaryRupiah(value: string | number | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? formatRupiah(digits) : DASH;
}

function summaryPeriod(start: string | undefined, end: string | undefined) {
  if (ISO_DATE.test(start ?? "") && ISO_DATE.test(end ?? "")) {
    return formatCalendarRange(start as string, end as string);
  }
  return DASH;
}

type CampaignFormProps = {
  campaignId?: string;
  clients: ClientOption[];
  defaultValues?: Partial<CampaignFormInput>;
};

const EMPTY: CampaignFormInput = {
  client_id: "",
  code: "",
  name: "",
  objective: "pendaftar",
  brief: "",
  must_do: "",
  must_not: "",
  hashtags: "",
  paid_label_required: true,
  landing_url: "",
  start_date: "",
  end_date: "",
  min_live_days: "30",
  package_price: "",
  target_contents: "",
  target_views: "",
  target_registrants: "",
  default_base_fee: "",
  default_bonus_per_1000_views: "",
  default_bonus_per_registrant: "",
  default_views_bonus_cap: "",
};

export function CampaignForm({ campaignId, clients, defaultValues }: CampaignFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Held separately so `text()` can render each initial value in the markup,
  // not only through React Hook Form's ref (see ProvinceSelect).
  const initial: CampaignFormInput = { ...EMPTY, ...defaultValues };

  const form = useForm<CampaignFormInput, unknown, CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initial,
  });

  function onSubmit(values: CampaignInput) {
    setServerError(null);
    startTransition(async () => {
      // A successful save redirects to the campaign and never returns.
      const result = campaignId
        ? await updateCampaignAction(campaignId, values)
        : await createCampaignAction(values);
      if (result?.status === "error") {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;
  const text = (name: keyof CampaignFormInput) => {
    // `paid_label_required` is a boolean driven by Controller, so it never
    // reaches this helper; every other field renders as text.
    const value = initial[name];
    return {
      id: name,
      "aria-invalid": Boolean(errors[name]),
      ...(typeof value === "string" ? { defaultValue: value } : {}),
      ...form.register(name),
    };
  };
  const money = (name: keyof CampaignFormInput) => ({
    ...text(name),
    inputMode: "numeric" as const,
    placeholder: "0",
  });

  // The summary is what the long form adds up to; it lives in the column that
  // used to sit empty and stays in view while the operator scrolls. `useWatch`
  // rather than `form.watch()`: it re-renders only on these fields and does not
  // opt the component out of the React Compiler.
  const [clientId, code, objective, startDate, endDate, packagePrice, baseFee] = useWatch({
    control: form.control,
    name: [
      "client_id",
      "code",
      "objective",
      "start_date",
      "end_date",
      "package_price",
      "default_base_fee",
    ],
  });
  const selectedClient = clients.find((client) => client.id === clientId);
  const summary: { label: string; value: string; mono?: boolean }[] = [
    { label: "Klien", value: selectedClient?.name ?? "Belum dipilih" },
    { label: "Kode", value: code?.trim() || DASH, mono: true },
    { label: "Tujuan", value: CAMPAIGN_OBJECTIVE_LABELS[objective] },
    { label: "Periode", value: summaryPeriod(startDate, endDate) },
    { label: "Harga paket", value: summaryRupiah(packagePrice) },
    { label: "Honor dasar / konten", value: summaryRupiah(baseFee) },
  ];

  const aside = (
    <div className="space-y-4">
      {/* Below xl the aside sits after the submit buttons, where a running
          summary of fields the operator just scrolled past adds nothing. */}
      <FormAsideCard title="Ringkasan" className="hidden xl:flex">
        <dl className="space-y-2.5">
          {summary.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0">{row.label}</dt>
              <dd
                className={`min-w-0 truncate text-right font-medium text-foreground ${
                  row.mono ? "font-mono text-xs" : "tabular-nums"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </FormAsideCard>

      <FormAsideCard title={campaignId ? "Yang perlu diingat" : "Sebelum menyimpan"}>
        <FormHints
          items={[
            campaignId
              ? "Perubahan pada kampanye yang sudah berjalan tercatat di log aktivitas."
              : "Kampanye baru selalu tersimpan sebagai Draft; aktifkan dari halaman kampanye setelah kreator bergabung.",
            "Kampanye bertujuan Pendaftar butuh URL tujuan terisi sebelum dapat diaktifkan.",
            "Skema honor di sini hanya nilai bawaan; tiap penugasan masih bisa memakai angka sendiri.",
            "Tulis nominal dalam Rupiah utuh tanpa titik, koma, atau singkatan.",
          ]}
        />
      </FormAsideCard>
    </div>
  );

  return (
    <FormLayout aside={aside}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldSet>
            <FieldLegend>Identitas</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client_id">Klien</FieldLabel>
                <NativeSelect {...text("client_id")}>
                  <NativeSelectOption value="">Pilih klien…</NativeSelectOption>
                  {clients.map((client) => (
                    <NativeSelectOption key={client.id} value={client.id}>
                      {client.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {clients.length === 0 ? (
                  <FieldDescription>
                    Belum ada klien.{" "}
                    <Link href="/clients/new" className="underline">
                      Tambah klien
                    </Link>{" "}
                    dulu.
                  </FieldDescription>
                ) : null}
                <FieldError errors={[errors.client_id]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="objective">Tujuan</FieldLabel>
                <NativeSelect {...text("objective")}>
                  {CAMPAIGN_OBJECTIVES.map((objective) => (
                    <NativeSelectOption key={objective} value={objective}>
                      {CAMPAIGN_OBJECTIVE_LABELS[objective]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.objective]} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="code">Kode kampanye</FieldLabel>
                <Input
                  {...text("code")}
                  placeholder="PMB-KAMPUSX-2026-01"
                  className="font-mono uppercase"
                />
                <FieldDescription>Unik; huruf, angka, dan tanda hubung.</FieldDescription>
                <FieldError errors={[errors.code]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Nama kampanye</FieldLabel>
                <Input {...text("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Brief</FieldLegend>
            <Field>
              <FieldLabel htmlFor="brief">Deskripsi brief</FieldLabel>
              <Textarea {...text("brief")} rows={4} />
              <FieldError errors={[errors.brief]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="must_do">Yang wajib</FieldLabel>
                <Textarea {...text("must_do")} rows={4} placeholder={"Satu poin per baris"} />
                <FieldError errors={[errors.must_do]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="must_not">Larangan</FieldLabel>
                <Textarea {...text("must_not")} rows={4} placeholder={"Satu poin per baris"} />
                <FieldError errors={[errors.must_not]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="hashtags">Hashtag</FieldLabel>
              <Input {...text("hashtags")} placeholder="#PMBKampusX #KuliahDiBanua" />
              <FieldDescription>Pisahkan dengan spasi atau koma.</FieldDescription>
              <FieldError errors={[errors.hashtags]} />
            </Field>
            <Controller
              control={form.control}
              name="paid_label_required"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="paid_label_required"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="paid_label_required" className="font-normal">
                    Wajib mencantumkan label konten berbayar
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldSet>

          <FieldSet>
            <FieldLegend>Tujuan & periode</FieldLegend>
            <Field>
              <FieldLabel htmlFor="landing_url">URL tujuan (landing_url)</FieldLabel>
              <Input
                {...text("landing_url")}
                type="url"
                placeholder="https://pmb.kampus.ac.id/daftar"
              />
              <FieldDescription>
                Tujuan tautan pelacakan. Wajib sebelum kampanye bertujuan pendaftar diaktifkan.
              </FieldDescription>
              <FieldError errors={[errors.landing_url]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="start_date">Tanggal mulai</FieldLabel>
                <Input {...text("start_date")} type="date" />
                <FieldError errors={[errors.start_date]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="end_date">Tanggal selesai</FieldLabel>
                <Input {...text("end_date")} type="date" />
                <FieldError errors={[errors.end_date]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="min_live_days">Minimal hari tayang</FieldLabel>
                <Input {...text("min_live_days")} inputMode="numeric" />
                <FieldError errors={[errors.min_live_days]} />
              </Field>
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Komersial & target</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="package_price">Harga paket (Rp)</FieldLabel>
                <Input {...money("package_price")} />
                <FieldError errors={[errors.package_price]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="target_contents">Target jumlah konten</FieldLabel>
                <Input {...money("target_contents")} />
                <FieldError errors={[errors.target_contents]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="target_views">Target views</FieldLabel>
                <Input {...money("target_views")} />
                <FieldError errors={[errors.target_views]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="target_registrants">Target pendaftar</FieldLabel>
                <Input {...money("target_registrants")} />
                <FieldError errors={[errors.target_registrants]} />
              </Field>
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Skema honor default</FieldLegend>
            <FieldDescription>
              Berlaku untuk semua kreator kecuali diubah per penugasan. Nominal dalam Rupiah utuh.
            </FieldDescription>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="default_base_fee">Honor dasar per konten</FieldLabel>
                <Input {...money("default_base_fee")} />
                <FieldError errors={[errors.default_base_fee]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="default_bonus_per_1000_views">
                  Bonus per 1.000 views
                </FieldLabel>
                <Input {...money("default_bonus_per_1000_views")} />
                <FieldError errors={[errors.default_bonus_per_1000_views]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="default_bonus_per_registrant">Bonus per pendaftar</FieldLabel>
                <Input {...money("default_bonus_per_registrant")} />
                <FieldError errors={[errors.default_bonus_per_registrant]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="default_views_bonus_cap">
                  Batas bonus views per kreator
                </FieldLabel>
                <Input
                  {...money("default_views_bonus_cap")}
                  placeholder="Kosongkan jika tanpa batas"
                />
                <FieldError errors={[errors.default_views_bonus_cap]} />
              </Field>
            </div>
          </FieldSet>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : campaignId ? "Simpan perubahan" : "Simpan sebagai draft"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={campaignId ? `/campaigns/${campaignId}/overview` : "/campaigns"}>
                Batal
              </Link>
            </Button>
          </div>
        </FieldGroup>
      </form>
    </FormLayout>
  );
}
