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

  // profile_layout ships with docs/profile-layout.sql; keep settings usable
  // before that migration is run.
  const [layoutRes, keyboards] = await Promise.all([
    supabase
      .from("users")
      .select(`${columns},profile_layout`)
      .eq("id", session.id),
    getAllKeyboards(),
  ]);

  const { data } = layoutRes.error
    ? await supabase.from("users").select(columns).eq("id", session.id)
    : layoutRes;

  const userData = data && data.length ? data[0] : null;

  return (
    <SettingsClient
      session={session}
      userData={userData}
      keyboards={keyboards ?? []}
    />
  );
}
