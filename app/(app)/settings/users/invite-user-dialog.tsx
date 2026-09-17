"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { inviteUserSchema, type InviteUserInput } from "@/lib/validation/users";
import { inviteUserAction } from "../actions";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", full_name: "", role: "manager" },
  });

  function onSubmit(values: InviteUserInput) {
    startTransition(async () => {
      const result = await inviteUserAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden />
          Undang pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Undang pengguna</DialogTitle>
            <DialogDescription>
              Tautan undangan dikirim ke email berikut dan berlaku sekali pakai.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="invite-name">Nama lengkap</FieldLabel>
              <Input
                id="invite-name"
                aria-invalid={Boolean(form.formState.errors.full_name)}
                {...form.register("full_name")}
              />
              <FieldError errors={[form.formState.errors.full_name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Peran</FieldLabel>
              <NativeSelect id="invite-role" {...form.register("role")}>
                <NativeSelectOption value="manager">Manager</NativeSelectOption>
                <NativeSelectOption value="owner">Owner</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={[form.formState.errors.role]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mengirim…" : "Kirim undangan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
