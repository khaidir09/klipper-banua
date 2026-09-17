import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  /** Current query string values, kept when moving between pages. */
  params: Record<string, string | undefined>;
  basePath: string;
};

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  else search.delete("page");
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function ListPagination({
  page,
  totalPages,
  totalItems,
  params,
  basePath,
}: ListPaginationProps) {
  if (totalItems === 0) return null;

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const visible = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {totalItems} data · halaman {page} dari {totalPages}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="Sebelumnya"
              href={hrefFor(basePath, params, Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {visible.map((p, index) => (
            <PaginationItem key={p}>
              {index > 0 && visible[index - 1] !== p - 1 ? (
                <span className="px-1 text-muted-foreground">…</span>
              ) : null}
              <PaginationLink href={hrefFor(basePath, params, p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              text="Berikutnya"
              href={hrefFor(basePath, params, Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
