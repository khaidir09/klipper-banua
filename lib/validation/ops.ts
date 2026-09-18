import { z } from "zod";
import { OPS_ACTIVITIES, OPS_MAX_MINUTES } from "@/lib/constants/ops";

/** FR-M12-01: one block of operational work on a campaign. */
export const opsTimeLogSchema = z.object({
  activity: z.enum(OPS_ACTIVITIES, { message: "Pilih aktivitas." }),
  // Coerced so the form's string input and the re-validated number both pass.
  minutes: z.coerce
    .number({ message: "Durasi wajib diisi." })
    .int({ message: "Durasi harus bilangan bulat menit." })
    .min(1, { message: "Durasi minimal 1 menit." })
    .max(OPS_MAX_MINUTES, { message: "Durasi maksimal 1.440 menit (24 jam) per catatan." }),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal wajib diisi." }),
  notes: z.string().trim().max(1000, { message: "Catatan maksimal 1.000 karakter." }),
});

export type OpsTimeLogFormInput = z.input<typeof opsTimeLogSchema>;
export type OpsTimeLogInput = z.output<typeof opsTimeLogSchema>;
