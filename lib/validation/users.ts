import { z } from "zod";
import { TIMEZONES } from "@/lib/format/timezone";
import { uuidField } from "./common";

export const USER_ROLES = ["owner", "manager"] as const;

export const inviteUserSchema = z.object({
  email: z.email({ message: "Format email tidak valid." }).transform((v) => v.toLowerCase()),
  full_name: z.string().trim().min(1, { message: "Nama wajib diisi." }).max(200),
  role: z.enum(USER_ROLES, { message: "Pilih peran." }),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserRoleSchema = z.object({
  user_id: uuidField,
  role: z.enum(USER_ROLES),
});

export const setUserActiveSchema = z.object({
  user_id: uuidField,
  is_active: z.boolean(),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, { message: "Nama wajib diisi." }).max(200),
  timezone: z.enum(
    Object.keys(TIMEZONES) as [keyof typeof TIMEZONES, ...(keyof typeof TIMEZONES)[]],
    {
      message: "Pilih zona waktu.",
    },
  ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
