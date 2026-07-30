import { redirect } from "next/navigation";
import { auth } from "@/auth";
import supabase from "@/lib/supabaseServer";
import { getAllKeyboards } from "@/lib/data";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session: any = await auth();

  if (!session) redirect("/");

  const columns =
    "skin_view,twitch,youtube,github,twitter,discord,tabletSettingsFile,tabletFileUploadInfo,keyboard,keyboard_keys";

  // profile_layout and osu_settings ship with docs/profile-layout.sql and
  // docs/osu-settings.sql; keep settings usable before those migrations run.
  // The secret key is only ever stored hashed (docs/api-graphql.sql), so it is
  // queried separately and only for its presence and age - it can never be
  // shown again after generation.
  const [fullRes, keyboards, keyRes] = await Promise.all([
    supabase
      .from("users")
      .select(`${columns},profile_layout,osu_settings`)
      .eq("id", session.id),
    getAllKeyboards(),
    supabase
      .from("users")
      .select("secret_key_hash,secret_key_created_at")
      .eq("id", session.id)
      .maybeSingle(),
  ]);

  // `any` because each fallback selects a different column set, so the inferred
  // row types differ between branches.
  let res: any = fullRes;
  if (res.error) {
    res = await supabase
      .from("users")
      .select(`${columns},profile_layout`)
      .eq("id", session.id);
  }
  if (res.error) {
    res = await supabase.from("users").select(columns).eq("id", session.id);
  }

  const { data } = res;

  const userData = data && data.length ? data[0] : null;

  // keyRes errors until docs/api-graphql.sql has been run: treat that as "no
  // key" so the page still renders.
  const keyRow: any = keyRes.error ? null : keyRes.data;

  return (
    <SettingsClient
      session={session}
      userData={userData}
      keyboards={keyboards ?? []}
      hasApiKey={Boolean(keyRow?.secret_key_hash)}
      apiKeyCreatedAt={keyRow?.secret_key_created_at ?? null}
    />
  );
}
