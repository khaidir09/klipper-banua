"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssignmentStatusBadge } from "@/components/status/status-badge";
import { CopyButton } from "@/components/forms/copy-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AssignmentFeeOverrides, EffectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import { buildWhatsappBrief, type WhatsappBriefInput } from "@/lib/campaigns/whatsapp-brief";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "@/lib/constants/campaigns";
import { formatAmountDigits, formatRupiah } from "@/lib/format/currency";
import { applyFieldErrors } from "@/lib/forms";
import {
  assignmentCreateSchema,
  assignmentUpdateSchema,
  type AssignmentCreateFormInput,
  type AssignmentCreateInput,
  type AssignmentUpdateFormInput,
  type AssignmentUpdateInput,
} from "@/lib/validation/campaigns";
import { formatDate } from "@/lib/format/date";
import { whatsappLink } from "@/lib/validation/phone";
import { addAssignmentAction, removeAssignmentAction, updateAssignmentAction } from "../../actions";

export type AssignmentView = {
  id: string;
  status: AssignmentStatus;
  /** FR-M13-10: when the creator accepted the brief in the portal, if ever. */
  confirmedAt: string | null;
  contentsCommitted: number;
  referralCode: string;
  trackingSlug: string;
  trackingUrl: string;
  overrides: AssignmentFeeOverrides;
  fees: EffectiveFeeScheme;
  creator: { id: string; name: string; fullName: string; phoneWa: string } | null;
};

type BriefContext = Omit<
  WhatsappBriefInput,
  "creatorName" | "contentsCommitted" | "referralCode" | "trackingUrl"
>;

type AssignableCreator = { id: string; label: string; city: string };

export function AssignmentsPanel({
  campaignId,
  canEdit,
  assignments,
  assignable,
  brief,
  timezone,
}: {
  campaignId: string;
  canEdit: boolean;
  assignments: AssignmentView[];
  assignable: AssignableCreator[];
  brief: BriefContext;
  timezone: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AssignmentView | null>(null);
  const [briefFor, setBriefFor] = useState<AssignmentView | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(assignment: AssignmentView) {
    if (!window.confirm(`Hapus penugasan ${assignment.creator?.name ?? ""}?`)) return;
    startTransition(async () => {
      const result = await removeAssignmentAction({
        campaign_id: campaignId,
        assignment_id: assignment.id,
      });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kreator ditugaskan</CardTitle>
        <CardDescription>
          Setiap kreator mendapat kode referal dan tautan pelacakan unik. Kode dan tautan terkunci
          setelah ada klik.
        </CardDescription>
        {canEdit ? (
          <CardAction>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus aria-hidden />
              Tugaskan kreator
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kreator yang ditugaskan.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kreator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Konten</TableHead>
                  <TableHead>Kode & tautan</TableHead>
                  <TableHead className="hidden lg:table-cell">Skema honor</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.creator ? (
                        <Link
                          href={`/creators/${assignment.creator.id}`}
                          className="hover:underline"
                        >
                          {assignment.creator.name}
                        </Link>
                      ) : (
                        "–"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <AssignmentStatusBadge status={assignment.status} />
                        {/* FR-M13-10: proof the creator read the brief, which is
                            what settles a later dispute over it (PRD 8.2). */}
                        {assignment.confirmedAt ? (
                          <span className="text-xs text-muted-foreground">
                            Dikonfirmasi {formatDate(assignment.confirmedAt, timezone)}
                          </span>
                        ) : assignment.status === "diundang" ? (
                          <span className="text-xs text-muted-foreground">
                            Menunggu konfirmasi kreator
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {assignment.contentsCommitted}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <span className="font-mono text-sm font-semibold tracking-wider">
                            {assignment.referralCode}
                          </span>
                          <CopyButton
                            value={assignment.referralCode}
                            label="Salin kode referal"
                            successMessage="Kode referal disalin."
                            iconOnly
                            variant="ghost"
                          />
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="max-w-48 truncate text-xs text-muted-foreground">
                            /r/{assignment.trackingSlug}
                          </span>
                          <CopyButton
                            value={assignment.trackingUrl}
                            label="Salin tautan pelacakan"
                            successMessage="Tautan pelacakan disalin."
                            iconOnly
                            variant="ghost"
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">
                      <FeeSummary fees={assignment.fees} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Teks brief WhatsApp"
                          title="Teks brief WhatsApp"
                          onClick={() => setBriefFor(assignment)}
                        >
                          <MessageCircle aria-hidden />
                        </Button>
                        {canEdit ? (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Ubah penugasan"
                              onClick={() => setEditing(assignment)}
                            >
                              <Pencil aria-hidden />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Hapus penugasan"
                              disabled={isPending}
                              onClick={() => remove(assignment)}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {adding ? (
        <AddAssignmentDialog
          campaignId={campaignId}
          assignable={assignable}
          onClose={() => setAdding(false)}
        />
      ) : null}
      {editing ? (
        <EditAssignmentDialog
          campaignId={campaignId}
          assignment={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {briefFor ? (
        <WhatsappBriefDialog
          assignment={briefFor}
          brief={brief}
          onClose={() => setBriefFor(null)}
        />
      ) : null}
    </Card>
  );
}

function FeeSummary({ fees }: { fees: EffectiveFeeScheme }) {
  const mark = (overridden: boolean) =>
    overridden ? <span className="ml-1 text-[10px] text-primary">khusus</span> : null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
      <dt className="text-muted-foreground">Dasar</dt>
      <dd>
        {formatRupiah(fees.baseFee)}
        {mark(fees.overridden.baseFee)}
      </dd>
      <dt className="text-muted-foreground">/1.000 views</dt>
      <dd>
        {formatRupiah(fees.bonusPer1000Views)}
        {mark(fees.overridden.bonusPer1000Views)}
      </dd>
      <dt className="text-muted-foreground">/pendaftar</dt>
      <dd>
        {formatRupiah(fees.bonusPerRegistrant)}
        {mark(fees.overridden.bonusPerRegistrant)}
      </dd>
      <dt className="text-muted-foreground">Batas views</dt>
      <dd>
        {fees.viewsBonusCap === null ? "Tanpa batas" : formatRupiah(fees.viewsBonusCap)}
        {mark(fees.overridden.viewsBonusCap)}
      </dd>
    </dl>
  );
}

/** Override inputs shared by the add and edit dialogs. */
function OverrideFields({
  register,
  errors,
}: {
  register: (
    name: "base_fee" | "bonus_per_1000_views" | "bonus_per_registrant" | "views_bonus_cap",
  ) => object;
  errors: Partial<Record<string, { message?: string }>>;
}) {
  const fields = [
    ["base_fee", "Honor dasar per konten"],
    ["bonus_per_1000_views", "Bonus per 1.000 views"],
    ["bonus_per_registrant", "Bonus per pendaftar"],
    ["views_bonus_cap", "Batas bonus views"],
  ] as const;

  return (
    <FieldSet>
      <FieldLegend variant="label">Skema honor khusus (opsional)</FieldLegend>
      <FieldDescription>Kosongkan untuk memakai nilai default kampanye.</FieldDescription>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <Field key={name}>
            <FieldLabel htmlFor={`as-${name}`}>{label}</FieldLabel>
            <Input
              id={`as-${name}`}
              inputMode="numeric"
              placeholder="Default"
              aria-invalid={Boolean(errors[name])}
              {...register(name)}
            />
            <FieldError errors={[errors[name]]} />
          </Field>
        ))}
      </div>
    </FieldSet>
  );
}

function AddAssignmentDialog({
  campaignId,
  assignable,
  onClose,
}: {
  campaignId: string;
  assignable: AssignableCreator[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AssignmentCreateFormInput, unknown, AssignmentCreateInput>({
    resolver: zodResolver(assignmentCreateSchema),
    defaultValues: {
      creator_id: "",
      status: "diundang",
      contents_committed: "1",
      base_fee: "",
      bonus_per_1000_views: "",
      bonus_per_registrant: "",
      views_bonus_cap: "",
      referral_code: "",
      tracking_slug: "",
    },
  });

  function onSubmit(values: AssignmentCreateInput) {
    startTransition(async () => {
      const result = await addAssignmentAction(campaignId, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Tugaskan kreator</DialogTitle>
            <DialogDescription>
              Hanya kreator berstatus Terverifikasi atau Aktif yang dapat dipilih.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="as-creator">Kreator</FieldLabel>
              <NativeSelect
                id="as-creator"
                aria-invalid={Boolean(errors.creator_id)}
                {...form.register("creator_id")}
              >
                <NativeSelectOption value="">
                  {assignable.length ? "Pilih kreator…" : "Tidak ada kreator yang tersedia"}
                </NativeSelectOption>
                {assignable.map((creator) => (
                  <NativeSelectOption key={creator.id} value={creator.id}>
                    {creator.label}
                    {creator.city ? ` · ${creator.city}` : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.creator_id]} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="as-status">Status</FieldLabel>
                <NativeSelect id="as-status" {...form.register("status")}>
                  {ASSIGNMENT_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {ASSIGNMENT_STATUS_LABELS[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="as-contents">Jumlah konten disepakati</FieldLabel>
                <Input
                  id="as-contents"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.contents_committed)}
                  {...form.register("contents_committed")}
                />
                <FieldError errors={[errors.contents_committed]} />
              </Field>
            </div>

            <OverrideFields register={form.register} errors={errors} />

            <FieldSet>
              <FieldLegend variant="label">Kode & tautan (opsional)</FieldLegend>
              <FieldDescription>Kosongkan agar dibuat otomatis.</FieldDescription>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="as-code">Kode referal</FieldLabel>
                  <Input
                    id="as-code"
                    className="font-mono uppercase"
                    placeholder="Otomatis"
                    aria-invalid={Boolean(errors.referral_code)}
                    {...form.register("referral_code")}
                  />
                  <FieldError errors={[errors.referral_code]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="as-slug">Slug tautan</FieldLabel>
                  <Input
                    id="as-slug"
                    placeholder="Otomatis"
                    aria-invalid={Boolean(errors.tracking_slug)}
                    {...form.register("tracking_slug")}
                  />
                  <FieldError errors={[errors.tracking_slug]} />
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending || assignable.length === 0}>
              {isPending ? "Menyimpan…" : "Tugaskan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAssignmentDialog({
  campaignId,
  assignment,
  onClose,
}: {
  campaignId: string;
  assignment: AssignmentView;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const amount = (value: number | null) => (value === null ? "" : formatAmountDigits(value));

  const form = useForm<AssignmentUpdateFormInput, unknown, AssignmentUpdateInput>({
    resolver: zodResolver(assignmentUpdateSchema),
    defaultValues: {
      status: assignment.status,
      contents_committed: String(assignment.contentsCommitted),
      base_fee: amount(assignment.overrides.base_fee),
      bonus_per_1000_views: amount(assignment.overrides.bonus_per_1000_views),
      bonus_per_registrant: amount(assignment.overrides.bonus_per_registrant),
      views_bonus_cap: amount(assignment.overrides.views_bonus_cap),
      referral_code: assignment.referralCode,
      tracking_slug: assignment.trackingSlug,
    },
  });

  function onSubmit(values: AssignmentUpdateInput) {
    startTransition(async () => {
      const result = await updateAssignmentAction(campaignId, assignment.id, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Ubah penugasan {assignment.creator?.name}</DialogTitle>
            <DialogDescription>
              Kode dan slug tidak dapat diubah lagi setelah tautan diklik.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="es-status">Status</FieldLabel>
                <NativeSelect id="es-status" {...form.register("status")}>
                  {ASSIGNMENT_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {ASSIGNMENT_STATUS_LABELS[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="es-contents">Jumlah konten disepakati</FieldLabel>
                <Input
                  id="es-contents"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.contents_committed)}
                  {...form.register("contents_committed")}
                />
                <FieldError errors={[errors.contents_committed]} />
              </Field>
            </div>

            <OverrideFields register={form.register} errors={errors} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="es-code">Kode referal</FieldLabel>
                <Input
                  id="es-code"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(errors.referral_code)}
                  {...form.register("referral_code")}
                />
                <FieldError errors={[errors.referral_code]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="es-slug">Slug tautan</FieldLabel>
                <Input
                  id="es-slug"
                  aria-invalid={Boolean(errors.tracking_slug)}
                  {...form.register("tracking_slug")}
                />
                <FieldError errors={[errors.tracking_slug]} />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WhatsappBriefDialog({
  assignment,
  brief,
  onClose,
}: {
  assignment: AssignmentView;
  brief: BriefContext;
  onClose: () => void;
}) {
  const text = buildWhatsappBrief({
    ...brief,
    creatorName: assignment.creator?.name ?? "",
    contentsCommitted: assignment.contentsCommitted,
    referralCode: assignment.referralCode,
    trackingUrl: assignment.trackingUrl,
  });
  const phone = assignment.creator?.phoneWa;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Brief untuk {assignment.creator?.name}</DialogTitle>
          <DialogDescription>Salin lalu kirim lewat WhatsApp ke kreator.</DialogDescription>
        </DialogHeader>
        <Textarea
          readOnly
          value={text}
          rows={12}
          className="max-h-[50svh] font-mono text-xs"
          aria-label="Teks brief"
        />
        <DialogFooter>
          {phone ? (
            <Button variant="outline" asChild>
              <a
                href={`${whatsappLink(phone)}?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden />
                Buka di WhatsApp
              </a>
            </Button>
          ) : null}
          <CopyButton
            value={text}
            label="Salin teks"
            successMessage="Teks brief disalin."
            size="default"
            variant="default"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
