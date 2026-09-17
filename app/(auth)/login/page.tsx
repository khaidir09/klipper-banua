import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authMessage } from "@/lib/auth/messages";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const reason = typeof params.alasan === "string" ? params.alasan : null;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk</CardTitle>
        <CardDescription>Gunakan akun yang diberikan owner.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={next} notice={authMessage(reason)} />
      </CardContent>
    </Card>
  );
}
