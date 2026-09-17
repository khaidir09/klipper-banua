import { publicEnv } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold tracking-tight">{publicEnv.NEXT_PUBLIC_APP_NAME}</p>
          <p className="text-sm text-muted-foreground">Aplikasi internal tim kampanye</p>
        </div>
        {children}
      </div>
    </div>
  );
}
