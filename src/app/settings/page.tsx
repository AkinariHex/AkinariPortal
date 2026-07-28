import { redirect } from "next/navigation";
import { auth } from "@/auth";
import supabase from "@/lib/supabaseServer";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session: any = await auth();

  if (!session) redirect("/");

  const { data } = await supabase
    .from("users")
    .select(
      "skin_view,twitch,youtube,github,twitter,discord,tabletSettingsFile,tabletFileUploadInfo,secret_key"
    )
    .eq("id", session.id);

  const userData = data && data.length ? data[0] : null;

  return <SettingsClient session={session} userData={userData} />;
}
