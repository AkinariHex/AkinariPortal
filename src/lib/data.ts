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
      .select("Banner,URL,Modes,Name,Player(id,username),Downloads")
      .order("created_at", { ascending: false })
      .limit(4);
    return error ? [] : data;
  },
  ["recent-skins"],
  { tags: ["skins"], revalidate: 86400 }
);
