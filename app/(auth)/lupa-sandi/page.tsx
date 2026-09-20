import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Lupa kata sandi</h1>
        </CardTitle>
        <CardDescription>
          Masukkan email akun Anda. Kami kirimkan tautan untuk mengatur ulang kata sandi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ForgotPasswordForm />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke halaman masuk
        </Link>
      </CardContent>
    </Card>
  );
}
