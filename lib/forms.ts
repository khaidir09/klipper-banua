import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/actions";

/** Copies server-side Zod field errors onto the form so they show inline. */
export function applyFieldErrors<T extends FieldValues>(
  form: { setError: UseFormSetError<T> },
  result: ActionResult<unknown>,
) {
  if (result.status !== "error" || !result.fieldErrors) return;
  for (const [name, message] of Object.entries(result.fieldErrors)) {
    if (name === "_") continue;
    form.setError(name as Path<T>, { type: "server", message });
  }
}
