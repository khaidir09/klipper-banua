import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a page's server data loads (slow connections in the field). */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
