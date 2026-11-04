"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/authz";
import supabase from "@/lib/supabaseServer";
import { resolvePlayers } from "@/lib/tournaments/osuLookup";

type Result = { status: "done" | "unauthorized" | "invalid" | "taken" | "error"; message?: string };
export type NewMember = { user: string; role: "host" | "viewer" };

// Admin only (Settings > New tournament). Members are resolved on osu! first,
// so a typo fails the whole creation instead of leaving a half-made tournament.
export async function createTournament(input: {
  name: string;
  slug: string;
  acronym: string;
  teamSize: number;
  stages: string;
  members: NewMember[];
}): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return { status: "unauthorized" };

  const name = String(input?.name ?? "").trim();
  const slug = String(input?.slug ?? "").trim().toLowerCase();
  const acronym = String(input?.acronym ?? "").trim();
  const teamSize = Math.max(1, Math.min(8, Number(input?.teamSize) || 1));
  const stages = String(input?.stages ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rows = (Array.isArray(input?.members) ? input.members : [])
    .map((m) => ({ user: String(m?.user ?? "").trim(), role: m?.role === "viewer" ? ("viewer" as const) : ("host" as const) }))
    .filter((m) => m.user);

  if (!name || !/^[a-z0-9-]{2,40}$/.test(slug) || !stages.length) {
    return { status: "invalid", message: "Name, slug (a-z, 0-9, -) and at least one stage are required." };
  }

  try {
    let members: { user_id: string; username: string; role: "host" | "viewer" }[] = [];
    if (rows.length) {
      const players = await resolvePlayers(rows.map((r) => r.user));
      // Same person twice: the last row's role wins.
      const byId = new Map(players.map((p, i) => [String(p.osuId), { user_id: String(p.osuId), username: p.name, role: rows[i].role }]));
      members = [...byId.values()];
    }

    const { data: created, error } = await supabase
      .from("tournaments")
      .insert({ name, slug, acronym, team_size: teamSize, stages, current_stage: stages[0], created_by: String(session.id) })
      .select("id")
      .single();
    if (error || !created) {
      if (error?.code === "23505") return { status: "taken", message: "Slug already in use." };
      console.error(error);
      return { status: "error" };
    }

    if (members.length) {
      const { error: memberError } = await supabase
        .from("tournament_members")
        .insert(members.map((m) => ({ ...m, tournament_id: created.id })));
      if (memberError) {
        console.error(memberError);
        return { status: "error", message: "Tournament created, but adding members failed: add them from its Access tab." };
      }
    }

    revalidatePath("/tournaments");
    return { status: "done", message: `Tournament created${members.length ? ` with ${members.length} members` : ""}.` };
  } catch (err) {
    console.error(err);
    return { status: "error", message: err instanceof Error ? err.message : undefined };
  }
}
