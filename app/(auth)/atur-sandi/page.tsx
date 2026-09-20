import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Atur kata sandi",
};

export default async function SetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Atur kata sandi baru</h1>
        </CardTitle>
        <CardDescription>
          Minimal 8 karakter, memuat huruf kecil, huruf kapital, dan angka.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {user ? (
          <NewPasswordForm />
        ) : (
          <>
            <Alert variant="destructive">
              <AlertDescription>
                Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.
              </AlertDescription>
            </Alert>
            <Link
              href="/lupa-sandi"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Minta tautan baru
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
