import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a portal page's server data loads. */
export default function PortalLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
