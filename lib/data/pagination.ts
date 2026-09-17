import { PAGE_SIZE } from "@/lib/validation/common";

/** Inclusive `range()` bounds for PostgREST. */
export function pageRange(page: number, pageSize: number = PAGE_SIZE) {
  const from = (Math.max(1, page) - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function totalPages(count: number, pageSize: number = PAGE_SIZE) {
  return Math.max(1, Math.ceil(count / pageSize));
}

/** Escapes `%`, `_` and `,` so a search term is safe inside `ilike`/`or`. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_,()]/g, (char) => `\\${char}`);
}

export type Paged<T> = {
  rows: T[];
  count: number;
  page: number;
  totalPages: number;
};
