import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lupa kata sandi</CardTitle>
        <CardDescription>
          Masukkan email akun Anda. Kami kirimkan tautan untuk mengatur ulang kata sandi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </CardContent>
    </Card>
  );
}
