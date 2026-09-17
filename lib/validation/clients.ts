import { z } from "zod";
import { CLIENT_TYPES } from "@/lib/constants/clients";
import { PROVINCES } from "@/lib/constants/regions";
import { listQuerySchema, optionalEmailField, optionalTextField, shortTextField } from "./common";
import { whatsappField } from "./phone";

export const clientSchema = z.object({
  name: z.string().trim().min(1, { message: "Nama klien wajib diisi." }).max(200),
  type: z.enum(CLIENT_TYPES, { message: "Pilih jenis klien." }),
  city: shortTextField,
  province: z.enum(PROVINCES, { message: "Pilih provinsi." }),
  address: optionalTextField,
  notes: optionalTextField,
});

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientInput = z.output<typeof clientSchema>;

export const clientContactSchema = z.object({
  name: z.string().trim().min(1, { message: "Nama kontak wajib diisi." }).max(200),
  position: shortTextField,
  phone_wa: whatsappField,
  email: optionalEmailField,
  is_primary: z.boolean().default(false),
});

export type ClientContactFormInput = z.input<typeof clientContactSchema>;
export type ClientContactInput = z.output<typeof clientContactSchema>;

export const clientListQuerySchema = listQuerySchema.extend({
  type: z.enum(CLIENT_TYPES).optional().catch(undefined),
  province: z.enum(PROVINCES).optional().catch(undefined),
});

export type ClientListQuery = z.infer<typeof clientListQuerySchema>;
