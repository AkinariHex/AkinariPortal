import "server-only";
import { createHash } from "node:crypto";
import supabase from "@/lib/supabaseServer";

// Keys are minted by generate-api-key in src/app/settings/actions.ts and shown
// to the user exactly once. Only the digest is stored, so a database dump does
// not hand out usable keys. Postgres `encode(sha256(key::bytea), 'hex')`
// produces the same string, which is what docs/api-graphql.sql uses to backfill
// the keys that existed before hashing.
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw.trim(), "utf8").digest("hex");
}

// Everything the GraphQL schema is allowed to read. secret_key, secret_key_hash,
// UUID and twitch_id are deliberately absent: this is the public profile and
// nothing more. `tabletSettingsFile` is read for the mapped area only - the
// schema exposes its numbers, never the file or a link to it - and
// `tabletFileUploadInfo` only for its timestamp, never the uploaded file name.
const VIEWER_COLUMNS =
  "id,username,banner,country,playmode,twitch,twitter,youtube,github,discord," +
  "tablet(name,width,height),tabletSettingsFile,tabletFileUploadInfo," +
  "keyboard,keyboard_keys," +
  "badges:users_badges(created_at,badge:badges(*))";

export type ViewerRow = {
  id: string;
  username: string;
  [key: string]: any;
};

// A stray character or an empty header must never reach the database, where it
// could match a row whose hash column is empty rather than null.
const MIN_KEY_LENGTH = 16;

export async function resolveApiKeyUser(
  raw: string | null | undefined
): Promise<ViewerRow | null> {
  const key = (raw ?? "").trim();
  if (key.length < MIN_KEY_LENGTH) return null;

  const hash = hashApiKey(key);

  // osu_settings ships with docs/osu-settings.sql and the keyboard view/settings
  // with docs/keyboard-settings.sql; fall back to the older column sets if those
  // migrations have not been run, same as src/app/users/[id]/data.ts.
  let res: any = await supabase
    .from("users")
    .select(`${VIEWER_COLUMNS},osu_settings,keyboard_view,keyboard_settings`)
    .eq("secret_key_hash", hash)
    .maybeSingle();

  if (res.error) {
    res = await supabase
      .from("users")
      .select(`${VIEWER_COLUMNS},osu_settings`)
      .eq("secret_key_hash", hash)
      .maybeSingle();
  }

  if (res.error) {
    res = await supabase
      .from("users")
      .select(VIEWER_COLUMNS)
      .eq("secret_key_hash", hash)
      .maybeSingle();
  }

  if (res.error || !res.data) return null;

  return res.data as ViewerRow;
}
