import "server-only";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/authz";
import supabase from "@/lib/supabaseServer";
import { TOURNAMENT_COLUMNS, type TournamentRole, type TournamentRow } from "./types";

export type TournamentAccess = {
  session: any;
  role: TournamentRole;
  tournament: TournamentRow;
};

// The tournament plus the caller's role on it, or null when the caller is not
// logged in, the tournament does not exist, or they have no access. Site
// admins get "admin" on every tournament. Every page and action goes through
// this, so a missing check cannot leak another tournament.
export async function getTournamentAccess(slug: string): Promise<TournamentAccess | null> {
  const session: any = await auth();
  if (!session?.id) return null;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(TOURNAMENT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (!tournament) return null;

  if (await isAdmin()) return { session, role: "admin", tournament: tournament as TournamentRow };

  const { data: member } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournament.id)
    .eq("user_id", String(session.id))
    .maybeSingle();
  if (!member) return null;

  return { session, role: member.role as TournamentRole, tournament: tournament as TournamentRow };
}

export const canEdit = (role: TournamentRole) => role === "admin" || role === "host";
