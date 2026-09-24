import { fromZonedTime } from "date-fns-tz";
import type { WithdrawalListQuery } from "@/lib/validation/withdrawals";

/** `dari`/`sampai` are whole days in the owner's timezone → UTC bounds. */
export function periodBounds(query: WithdrawalListQuery, timezone: string) {
  const nextDay = (date: string) => {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + 1);
    return value.toISOString().slice(0, 10);
  };
  return {
    from: query.dari ? fromZonedTime(`${query.dari}T00:00:00`, timezone).toISOString() : undefined,
    to: query.sampai
      ? fromZonedTime(`${nextDay(query.sampai)}T00:00:00`, timezone).toISOString()
      : undefined,
  };
}
