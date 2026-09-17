/**
 * Creates (or repairs) the seed `owner` account for local development, plus
 * an optional `manager` account when SEED_MANAGER_* is set (used to test RLS).
 *
 *   npm run seed:owner
 *
 * Reads SEED_* and SUPABASE_SERVICE_ROLE_KEY from .env.local. The service role
 * key is only ever used here and in server code, never in the browser.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

type Role = "owner" | "manager";

type SeedAccount = { role: Role; email: string; password: string; fullName: string };

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await seedAccount(admin, {
    role: "owner",
    email: required("SEED_OWNER_EMAIL"),
    password: required("SEED_OWNER_PASSWORD"),
    fullName: process.env.SEED_OWNER_NAME ?? "Owner",
  });

  if (process.env.SEED_MANAGER_EMAIL && process.env.SEED_MANAGER_PASSWORD) {
    await seedAccount(admin, {
      role: "manager",
      email: process.env.SEED_MANAGER_EMAIL,
      password: process.env.SEED_MANAGER_PASSWORD,
      fullName: process.env.SEED_MANAGER_NAME ?? "Manager",
    });
  }
}

async function seedAccount(admin: SupabaseClient, account: SeedAccount) {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error(`Could not list users: ${listError.message}`);
    process.exit(1);
  }

  const existing = list.users.find(
    (user) => user.email?.toLowerCase() === account.email.toLowerCase(),
  );

  const userId = existing
    ? await updateAccount(admin, existing.id, account)
    : await createAccount(admin, account);

  // The auth trigger creates the profile with the metadata role; make sure an
  // account that already existed carries the intended role and is active.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: account.fullName, role: account.role, is_active: true })
    .eq("id", userId);

  if (profileError) {
    console.error(`Could not update the profile: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`${existing ? "Updated" : "Created"} ${account.role} account: ${account.email}`);
}

async function createAccount(admin: SupabaseClient, account: SeedAccount): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName, role: account.role },
  });

  if (error || !data.user) {
    console.error(`Could not create the account: ${error?.message ?? "unknown error"}`);
    process.exit(1);
  }

  return data.user.id;
}

async function updateAccount(
  admin: SupabaseClient,
  userId: string,
  account: SeedAccount,
): Promise<string> {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: account.password,
    user_metadata: { full_name: account.fullName, role: account.role },
  });

  if (error) {
    console.error(`Could not update the account: ${error.message}`);
    process.exit(1);
  }

  return userId;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
