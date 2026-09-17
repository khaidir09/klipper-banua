import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ClientListQuery } from "@/lib/validation/clients";
import { escapeLike, pageRange, totalPages, type Paged } from "./pagination";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ClientContactRow = Database["public"]["Tables"]["client_contacts"]["Row"];

export type ClientListItem = ClientRow & {
  primary_contact: Pick<ClientContactRow, "name" | "phone_wa">[];
};

export async function listClients(
  supabase: SupabaseClient<Database>,
  query: ClientListQuery,
): Promise<Paged<ClientListItem>> {
  const { from, to } = pageRange(query.page);

  let request = supabase
    .from("clients")
    .select("*, primary_contact:client_contacts(name, phone_wa)", { count: "exact" })
    .eq("client_contacts.is_primary", true)
    .order("name", { ascending: true })
    .range(from, to);

  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    request = request.or(`name.ilike.${term},city.ilike.${term}`);
  }
  if (query.type) request = request.eq("type", query.type);
  if (query.province) request = request.eq("province", query.province);

  const { data, count, error } = await request;
  if (error) throw new Error(error.message);

  return {
    rows: data,
    count: count ?? 0,
    page: query.page,
    totalPages: totalPages(count ?? 0),
  };
}

export type ClientDetail = ClientRow & { contacts: ClientContactRow[] };

export async function getClient(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ClientDetail | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*, contacts:client_contacts(*)")
    .eq("id", id)
    .order("is_primary", { referencedTable: "client_contacts", ascending: false })
    .order("name", { referencedTable: "client_contacts", ascending: true })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
