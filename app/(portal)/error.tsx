"use client";

import { ErrorState } from "@/components/errors/error-state";

/** Keeps the portal navigation around a failed page. */
export default function PortalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={error} retry={retry} className="min-h-[60svh]" />;
}
