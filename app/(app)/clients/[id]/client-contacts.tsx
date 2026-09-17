"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ClientContactRow } from "@/lib/data/clients";
import { applyFieldErrors } from "@/lib/forms";
import {
  clientContactSchema,
  type ClientContactFormInput,
  type ClientContactInput,
} from "@/lib/validation/clients";
import { formatWhatsapp, whatsappLink } from "@/lib/validation/phone";
import { deleteContactAction, saveContactAction } from "../actions";

const EMPTY: ClientContactFormInput = {
  name: "",
  position: "",
  phone_wa: "",
  email: "",
  is_primary: false,
};

export function ClientContacts({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: ClientContactRow[];
}) {
  const [editing, setEditing] = useState<ClientContactRow | null | "new">(null);
  const [isPending, startTransition] = useTransition();

  function remove(contact: ClientContactRow) {
    if (!window.confirm(`Hapus kontak ${contact.name}?`)) return;
    startTransition(async () => {
      const result = await deleteContactAction({ client_id: clientId, contact_id: contact.id });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontak</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            Tambah kontak
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kontak.</p>
        ) : (
          <ul className="divide-y">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {contact.name}
                    {contact.is_primary ? (
                      <Badge className="ml-2 align-middle">
                        <Star aria-hidden />
                        Utama
                      </Badge>
                    ) : null}
                  </p>
                  {contact.position ? (
                    <p className="text-muted-foreground">{contact.position}</p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {contact.phone_wa ? (
                      <a
                        href={whatsappLink(contact.phone_wa)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <MessageCircle className="size-3.5" aria-hidden />
                        {formatWhatsapp(contact.phone_wa)}
                      </a>
                    ) : null}
                    {contact.phone_wa && contact.email ? " · " : null}
                    {contact.email}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Ubah kontak"
                    onClick={() => setEditing(contact)}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Hapus kontak"
                    disabled={isPending}
                    onClick={() => remove(contact)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {editing ? (
        <ContactDialog
          clientId={clientId}
          contact={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Card>
  );
}

function ContactDialog({
  clientId,
  contact,
  onClose,
}: {
  clientId: string;
  contact: ClientContactRow | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientContactFormInput, unknown, ClientContactInput>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          position: contact.position,
          phone_wa: formatWhatsapp(contact.phone_wa),
          email: contact.email,
          is_primary: contact.is_primary,
        }
      : EMPTY,
  });

  function onSubmit(values: ClientContactInput) {
    startTransition(async () => {
      const result = await saveContactAction(clientId, contact?.id ?? null, values);
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
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{contact ? "Ubah kontak" : "Tambah kontak"}</DialogTitle>
            <DialogDescription>Orang yang dihubungi tim untuk urusan kampanye.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="contact-name">Nama</FieldLabel>
              <Input
                id="contact-name"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-position">Jabatan</FieldLabel>
              <Input id="contact-position" {...form.register("position")} />
              <FieldError errors={[errors.position]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contact-phone">Nomor WhatsApp</FieldLabel>
                <Input
                  id="contact-phone"
                  inputMode="tel"
                  placeholder="0812-3456-7890"
                  aria-invalid={Boolean(errors.phone_wa)}
                  {...form.register("phone_wa")}
                />
                <FieldError errors={[errors.phone_wa]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <Input
                  id="contact-email"
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  {...form.register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
            </div>
            <Controller
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="contact-primary"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="contact-primary" className="font-normal">
                    Jadikan kontak utama
                  </FieldLabel>
                </Field>
              )}
            />
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
