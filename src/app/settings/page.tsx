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
    "skin_view,twitch,youtube,github,twitter,discord,tabletSettingsFile,tabletFileUploadInfo,secret_key,keyboard,keyboard_keys";

  // profile_layout and osu_settings ship with docs/profile-layout.sql and
  // docs/osu-settings.sql; keep settings usable before those migrations run.
  const [fullRes, keyboards] = await Promise.all([
    supabase
      .from("users")
      .select(`${columns},profile_layout,osu_settings`)
      .eq("id", session.id),
    getAllKeyboards(),
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

  return (
    <SettingsClient
      session={session}
      userData={userData}
      keyboards={keyboards ?? []}
    />
  );
}
