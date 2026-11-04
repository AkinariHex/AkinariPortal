import "server-only";
import { isAdmin } from "@/lib/authz";
import supabase from "@/lib/supabaseServer";
import type { TournamentMember, TournamentRole } from "./types";

export type TournamentListItem = { slug: string; name: string; acronym: string; current_stage: string; role: TournamentRole };

// Tournaments the user can open: all of them for a site admin, otherwise the
// ones they are a member of.
export async function listMyTournaments(userId: string): Promise<TournamentListItem[]> {
  const columns = "id,slug,name,acronym,current_stage";
  if (await isAdmin()) {
    const { data } = await supabase.from("tournaments").select(columns).order("created_at", { ascending: false });
    return (data ?? []).map((t) => ({ ...t, role: "admin" as const }));
  }

  const { data: members } = await supabase.from("tournament_members").select("tournament_id,role").eq("user_id", userId);
  if (!members?.length) return [];

  const roleById = new Map(members.map((m) => [m.tournament_id, m.role as TournamentRole]));
  const { data } = await supabase
    .from("tournaments")
    .select(columns)
    .in("id", [...roleById.keys()])
    .order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({ slug: t.slug, name: t.name, acronym: t.acronym, current_stage: t.current_stage, role: roleById.get(t.id)! }));
}

export async function getTournamentMembers(tournamentId: number): Promise<TournamentMember[]> {
  const { data } = await supabase
    .from("tournament_members")
    .select("user_id,username,role,added_at")
    .eq("tournament_id", tournamentId)
    .order("added_at");
  return (data ?? []) as TournamentMember[];
}
