import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";
import { homePathForRole } from "@/lib/validation/auth";

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? homePathForRole(session.profile.role) : "/login");
}
