import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Daftar jadi Klipper",
  description:
    "Daftar gratis sebagai klipper: pilih kampanye, posting klip di akunmu, dan dapat honor dari views yang terverifikasi.",
  // The only indexed page outside the public site (FR-M15-05).
  robots: { index: true, follow: true },
};

/** FR-M16-01. Public: a signed-in visitor is sent home by the proxy. */
export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Daftar jadi Klipper</h1>
        </CardTitle>
        <CardDescription>
          Gratis, cuma 2 menit. Posting klip di akunmu sendiri, dapat honor dari setiap 1.000 views
          yang lolos cek tim, lalu tarik ke rekening atau e-wallet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
