import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";
import { resolveTimezone } from "@/lib/format/timezone";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil saya" };

export default async function ProfilePage() {
  const { user, profile } = await requireSession();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Profil saya</CardTitle>
        <CardDescription>
          {user.email} · peran {profile.role === "owner" ? "Owner" : "Manager"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm
          defaultValues={{
            full_name: profile.full_name,
            timezone: resolveTimezone(profile.timezone),
          }}
        />
      </CardContent>
    </Card>
  );
}
