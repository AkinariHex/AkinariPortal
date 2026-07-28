import "server-only";
import supabase from "@/lib/supabaseServer";

export type BadgeHolder = { id: string; name: string | null; pending: boolean };
export type BadgeHoldersMap = Record<string, BadgeHolder[]>;

// For every badge_id, who holds it: assigned (users_badges) + pending
// (pending_badges). Names are resolved from `users` when the holder has an
// account; holders with no account (typically pending) show only their osu id.
export async function getBadgeHolders(): Promise<BadgeHoldersMap> {
  const [assigned, pending, users] = await Promise.all([
    supabase.from("users_badges").select("badge_id,user_id"),
    supabase.from("pending_badges").select("badge_id,user_id"),
    supabase.from("users").select("id,username"),
  ]);

  const nameById = new Map<string, string>(
    (users.data ?? []).map((u: any) => [String(u.id), u.username])
  );

  const map: BadgeHoldersMap = {};
  const add = (badgeId: any, userId: any, isPending: boolean) => {
    const key = String(badgeId);
    const uid = String(userId);
    if (!map[key]) map[key] = [];
    if (map[key].some((h) => h.id === uid)) return; // dedupe across both tables
    map[key].push({ id: uid, name: nameById.get(uid) ?? null, pending: isPending });
  };

  (assigned.data ?? []).forEach((r: any) => add(r.badge_id, r.user_id, false));
  (pending.data ?? []).forEach((r: any) => add(r.badge_id, r.user_id, true));

  return map;
}
