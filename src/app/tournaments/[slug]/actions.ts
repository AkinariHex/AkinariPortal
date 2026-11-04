"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hashApiKey } from "@/lib/apiKey";
import supabase from "@/lib/supabaseServer";
import { casterSchema, teamSchema, type Caster, type Team } from "@/lib/tournaments/bundle";
import { beatmapIdFromInput } from "@/lib/tournaments/beatmapIdFromInput";
import { canEdit, getTournamentAccess } from "@/lib/tournaments/authz";
import { computeQualifiers } from "@/lib/tournaments/computeQualifiers";
import { mergePool } from "@/lib/tournaments/mergePool";
import { resolvePlayers, resolvePoolMap } from "@/lib/tournaments/osuLookup";
import { parseSheet } from "@/lib/tournaments/parseSheet";
import { saveTournament } from "@/lib/tournaments/saveTournament";
import { slotMods } from "@/lib/tournaments/slotMods";

export type ActionResult = { status: "done" | "unauthorized" | "invalid" | "error"; message?: string; key?: string };

const unauthorized: ActionResult = { status: "unauthorized", message: "You can't edit this tournament." };
const fail = (err: unknown): ActionResult => {
  console.error(err);
  return { status: "error", message: err instanceof Error ? err.message : "Something went wrong." };
};

async function editor(slug: string) {
  const access = await getTournamentAccess(slug);
  return access && canEdit(access.role) ? access : null;
}

async function saved(slug: string, ok: boolean, extra: Partial<ActionResult> = {}): Promise<ActionResult> {
  if (!ok) return { status: "error", message: "Could not save." };
  revalidatePath(`/tournaments/${slug}`);
  return { status: "done", ...extra };
}

export async function updateTournamentInfo(
  slug: string,
  input: { name: string; acronym: string; teamSize: number; stages: string; currentStage: string; teamA: string; teamB: string }
): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const stages = String(input.stages ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const name = String(input.name ?? "").trim();
  if (!name || !stages.length) return { status: "invalid", message: "Name and at least one stage are required." };
  const currentStage = stages.includes(input.currentStage) ? input.currentStage : stages[0];
  const hex = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : undefined);
  const theme = hex(input.teamA) || hex(input.teamB) ? { teamA: hex(input.teamA), teamB: hex(input.teamB) } : null;

  return saved(
    slug,
    await saveTournament(access.tournament.id, {
      name,
      acronym: String(input.acronym ?? "").trim(),
      team_size: Math.max(1, Math.min(8, Number(input.teamSize) || 1)),
      stages,
      current_stage: currentStage,
      theme,
    })
  );
}

// Rows: team name, then player osu! ids or usernames; a cell starting with
// http is the team image.
export async function importTeams(slug: string, text: string, mode: "replace" | "append"): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  try {
    const rows = parseSheet(text, /^team/i);
    if (!rows.length) return { status: "invalid", message: "Nothing to import." };
    const teams: Team[] = [];
    for (const [name, ...cells] of rows) {
      const image = cells.find((c) => /^https?:\/\//.test(c));
      const players = await resolvePlayers(cells.filter((c) => c && c !== image));
      teams.push(teamSchema.parse({ name, players, ...(image ? { image } : {}) }));
    }
    const next = mode === "append" ? [...access.tournament.teams, ...teams] : teams;
    return saved(slug, await saveTournament(access.tournament.id, { teams: next }), { message: `${teams.length} teams imported.` });
  } catch (err) {
    return fail(err);
  }
}

export async function updateTeam(slug: string, index: number, patch: { name: string; acronym: string; image: string; seed: string }): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const teams = [...access.tournament.teams];
  if (!teams[index]) return { status: "invalid" };
  const seed = Number(patch.seed);
  const parsed = teamSchema.safeParse({
    ...teams[index],
    name: String(patch.name ?? "").trim(),
    acronym: String(patch.acronym ?? "").trim() || undefined,
    image: String(patch.image ?? "").trim() || undefined,
    seed: Number.isInteger(seed) && seed > 0 ? seed : undefined,
  });
  if (!parsed.success) return { status: "invalid", message: "Team name is required." };
  teams[index] = parsed.data;
  return saved(slug, await saveTournament(access.tournament.id, { teams }));
}

export async function removeTeam(slug: string, index: number): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const teams = access.tournament.teams.filter((_, i) => i !== index);
  return saved(slug, await saveTournament(access.tournament.id, { teams }));
}

// Rows: slot, beatmap id or link. "merge" (default): a slot that already
// exists is replaced, new slots are added, the others stay. "replace": the
// stage becomes exactly the pasted maps.
export async function importPool(slug: string, stage: string, text: string, mode: "merge" | "replace" = "merge"): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  if (!access.tournament.stages.includes(stage)) return { status: "invalid", message: "Unknown stage." };
  try {
    const rows = parseSheet(text, /^slot/i);
    if (!rows.length) return { status: "invalid", message: "Nothing to import." };
    const maps = [];
    for (const [slot, link] of rows) {
      const id = beatmapIdFromInput(link ?? "");
      if (!slot || !id) return { status: "invalid", message: `Row "${slot} ${link ?? ""}" needs a slot and a beatmap id.` };
      maps.push(await resolvePoolMap(slot.toUpperCase(), slotMods(slot), id));
    }
    const current = access.tournament.pool[stage] ?? [];
    const next = mode === "replace" ? mergePool([], maps) : mergePool(current, maps);
    const replaced = mode === "replace" ? 0 : maps.filter((m) => current.some((c) => c.slot === m.slot)).length;
    const pool = { ...access.tournament.pool, [stage]: next };
    const message = mode === "replace" ? `${stage}: ${next.length} maps.` : `${maps.length - replaced} added, ${replaced} replaced (${next.length} maps in ${stage}).`;
    return saved(slug, await saveTournament(access.tournament.id, { pool }), { message });
  } catch (err) {
    return fail(err);
  }
}

export async function removePoolMap(slug: string, stage: string, slot: string): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const maps = (access.tournament.pool[stage] ?? []).filter((m) => m.slot !== slot);
  const pool = { ...access.tournament.pool, [stage]: maps };
  return saved(slug, await saveTournament(access.tournament.id, { pool }), { message: `${slot} removed.` });
}

// Rows: team, slot, score. Uses the pool of the "Qualifiers" stage (or the
// first stage) for the map list.
export async function importQualifiers(slug: string, text: string, qualified: number): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const t = access.tournament;
  const stage = t.stages.find((s) => /qualif/i.test(s)) ?? t.stages[0];
  const maps = t.pool[stage] ?? [];
  if (!maps.length) return { status: "invalid", message: `Import the ${stage} pool first.` };
  const rows = parseSheet(text, /^team/i);
  const scores = rows.map(([team, slot, score]) => ({ team, slot: (slot ?? "").toUpperCase(), score: Number(String(score ?? "").replace(/[^\d.]/g, "")) || 0 }));
  if (!scores.length) return { status: "invalid", message: "Nothing to import." };
  const result = computeQualifiers(scores, maps, Math.max(1, Number(qualified) || scores.length));
  return saved(slug, await saveTournament(t.id, { qualifiers: result }), { message: `${result.teams.length} teams seeded.` });
}

export async function clearQualifiers(slug: string): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  return saved(slug, await saveTournament(access.tournament.id, { qualifiers: null }));
}

// Rows: name, osu! id or username (optional), twitch (optional).
export async function importCasters(slug: string, text: string): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  try {
    const casters: Caster[] = [];
    for (const [name, osu, twitch] of parseSheet(text, /^name/i)) {
      const player = osu ? (await resolvePlayers([osu]))[0] : null;
      casters.push(
        casterSchema.parse({
          name: name || player?.name,
          ...(player ? { osuId: player.osuId, country: player.country } : {}),
          ...(twitch ? { twitch } : {}),
        })
      );
    }
    return saved(slug, await saveTournament(access.tournament.id, { casters }), { message: `${casters.length} casters saved.` });
  } catch (err) {
    return fail(err);
  }
}

// Read key for GET /api/overlay/[slug]. Only the digest is stored; the raw key
// is returned once. Generating a new one invalidates the old one.
export async function generateReadKey(slug: string): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const key = `tov_${randomBytes(24).toString("base64url")}`;
  const { error } = await supabase
    .from("tournaments")
    .update({ read_key_hash: hashApiKey(key), read_key_created_at: new Date().toISOString() })
    .eq("id", access.tournament.id);
  if (error) return fail(error);
  revalidatePath(`/tournaments/${slug}`);
  return { status: "done", key };
}

export async function revokeReadKey(slug: string): Promise<ActionResult> {
  const access = await editor(slug);
  if (!access) return unauthorized;
  const { error } = await supabase.from("tournaments").update({ read_key_hash: null, read_key_created_at: null }).eq("id", access.tournament.id);
  if (error) return fail(error);
  revalidatePath(`/tournaments/${slug}`);
  return { status: "done" };
}

// Members: site admin only.
export async function addMember(slug: string, user: string, role: "host" | "viewer"): Promise<ActionResult> {
  const access = await getTournamentAccess(slug);
  if (access?.role !== "admin") return unauthorized;
  if (role !== "host" && role !== "viewer") return { status: "invalid" };
  try {
    const [player] = await resolvePlayers([String(user ?? "").trim()]);
    const { error } = await supabase
      .from("tournament_members")
      .upsert({ tournament_id: access.tournament.id, user_id: String(player.osuId), username: player.name, role }, { onConflict: "tournament_id,user_id" });
    if (error) return fail(error);
    revalidatePath(`/tournaments/${slug}`);
    return { status: "done", message: `${player.name} added as ${role}.` };
  } catch (err) {
    return fail(err);
  }
}

export async function removeMember(slug: string, userId: string): Promise<ActionResult> {
  const access = await getTournamentAccess(slug);
  if (access?.role !== "admin") return unauthorized;
  const { error } = await supabase.from("tournament_members").delete().eq("tournament_id", access.tournament.id).eq("user_id", userId);
  if (error) return fail(error);
  revalidatePath(`/tournaments/${slug}`);
  return { status: "done" };
}

export async function deleteTournament(slug: string): Promise<ActionResult> {
  const access = await getTournamentAccess(slug);
  if (access?.role !== "admin") return unauthorized;
  const { error } = await supabase.from("tournaments").delete().eq("id", access.tournament.id);
  if (error) return fail(error);
  revalidatePath("/tournaments");
  return { status: "done" };
}
