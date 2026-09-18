import { slugify } from "@/lib/referral/generate";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function fileExtension(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1]!.toLowerCase() : "bin";
}

/** `<folder>/<uuid>-<safe-name>.<ext>`; the random part avoids collisions. */
export function storagePathFor(folder: string, fileName: string): string {
  const base = slugify(fileName.replace(/\.[^.]+$/, ""), 40) || "berkas";
  return `${folder}/${crypto.randomUUID()}-${base}.${fileExtension(fileName)}`;
}

/**
 * Uploads a file from the browser straight to a private bucket with the
 * user's session. RLS and the bucket's size/type limits apply; the Server
 * Action afterwards only records the returned path, so large files never
 * pass through the Next.js server (whose action body limit is 6 MB).
 */
export async function uploadToBucket(
  bucket: string,
  folder: string,
  file: File,
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const path = storagePathFor(folder, file.name);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  return error ? { path: null, error: error.message } : { path, error: null };
}
