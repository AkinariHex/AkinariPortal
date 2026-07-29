import "server-only";
import { unstable_cache } from "next/cache";
import supabase from "./supabaseServer";

// Cached homepage reads. Served from cache for up to 1 day; invalidated on demand
// by revalidateTag("users") / revalidateTag("skins") from the mutating actions.
export const getRecentUsers = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("users")
      .select()
      .order("created_at", { ascending: false })
      .limit(6);
    return error ? [] : data;
  },
  ["recent-users"],
  { tags: ["users"], revalidate: 86400 }
);

export const getRecentSkins = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("skins")
      .select("id,Banner,URL,Modes,Name,Player(id,username),Downloads")
      .order("created_at", { ascending: false })
      .limit(4);
    return error ? [] : data;
  },
  ["recent-skins"],
  { tags: ["skins"], revalidate: 86400 }
);

export const getMostDownloadedSkins = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("skins")
      .select("id,Banner,URL,Modes,Name,Player(id,username),Downloads")
      .order("Downloads", { ascending: false })
      .limit(4);
    return error ? [] : data;
  },
  ["most-downloaded-skins"],
  { tags: ["skins"], revalidate: 86400 }
);

// Most frequent non-null value of a `users` column. Returns null if the column
// doesn't exist (query errors) or there's no data.
async function mostUsedUserValue(column: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select(column)
    .not(column, "is", null);
  if (error || !data) return null;

  const counts: Record<string, number> = {};
  for (const row of data as any[]) {
    const v = row[column];
    if (typeof v === "string" && v.trim()) counts[v] = (counts[v] ?? 0) + 1;
  }

  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

export const getSiteStats = unstable_cache(
  async () => {
    const [skins, users, tablet, keyboardId] = await Promise.all([
      supabase.from("skins").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      mostUsedUserValue("tablet"),
      mostUsedUserValue("keyboard"),
    ]);

    // `keyboard` stores a device id; resolve it to a display name.
    let keyboard: string | null = keyboardId;
    if (keyboardId) {
      const { data } = await supabase
        .from("keyboards")
        .select("brand, name")
        .eq("id", keyboardId)
        .maybeSingle();
      keyboard = data
        ? [data.brand, data.name].filter(Boolean).join(" ")
        : keyboardId;
    }

    return {
      skins: skins.count ?? 0,
      users: users.count ?? 0,
      tablet,
      keyboard,
    };
  },
  ["site-stats"],
  { tags: ["skins", "users", "keyboards"], revalidate: 86400 }
);

// All keyboard/keypad devices, for the settings picker + admin.
export const getAllKeyboards = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("keyboards")
      .select("*")
      .order("brand", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    return error ? [] : data;
  },
  ["all-keyboards"],
  { tags: ["keyboards"], revalidate: 86400 }
);

// Open keyboard-catalog requests, for the admin page. keyboard_requests.user_id
// has no FK to users (it's set from the logged-in session at request time), so
// resolve usernames with a separate batch lookup instead of a PostgREST join.
export const getKeyboardRequests = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("keyboard_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const userIds = Array.from(
      new Set(data.map((r: any) => r.user_id).filter(Boolean).map(String))
    );
    if (userIds.length === 0) return data;

    const { data: users } = await supabase
      .from("users")
      .select("id,username")
      .in("id", userIds);

    const usernameById = new Map(
      (users ?? []).map((u: any) => [String(u.id), u.username])
    );

    return data.map((r: any) => ({
      ...r,
      username: r.user_id != null ? usernameById.get(String(r.user_id)) ?? null : null,
    }));
  },
  ["keyboard-requests"],
  { tags: ["keyboard-requests"], revalidate: 86400 }
);

// All badge definitions, for the admin page and any badge picker.
export const getAllBadges = unstable_cache(
  async () => {
    // Order by the admin-controlled sort_order. If that column doesn't exist yet
    // (migration not run), the query errors — fall back to id order so the admin
    // page still lists badges.
    let res = await supabase
      .from("badges")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
    if (res.error) {
      res = await supabase
        .from("badges")
        .select("*")
        .order("id", { ascending: true });
    }
    return res.error ? [] : res.data;
  },
  ["all-badges"],
  { tags: ["badges"], revalidate: 86400 }
);
