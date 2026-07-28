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

export const getSiteStats = unstable_cache(
  async () => {
    const [skins, users] = await Promise.all([
      supabase.from("skins").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
    ]);
    return { skins: skins.count ?? 0, users: users.count ?? 0 };
  },
  ["site-stats"],
  { tags: ["skins", "users"], revalidate: 86400 }
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
