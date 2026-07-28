"use server";

import supabase from "@/lib/supabaseServer";

export interface SearchSkin {
  id: any;
  Name: any;
  Creator: any;
  Banner: any;
  URL: any;
  Player: { id: any; username: any } | null;
}

export interface SearchUser {
  id: any;
  username: any;
  banner: any;
}

export interface SearchResults {
  skins: SearchSkin[];
  users: SearchUser[];
}

export async function searchSite(query: string): Promise<SearchResults> {
  const q = (query ?? "").trim();
  if (q.length < 2) return { skins: [], users: [] };

  try {
    const skinSelect = "id,Name,Creator,Banner,URL,Player(id,username)";

    const [byName, byCreator, byUser] = await Promise.all([
      supabase.from("skins").select(skinSelect).ilike("Name", `%${q}%`).limit(8),
      supabase.from("skins").select(skinSelect).ilike("Creator", `%${q}%`).limit(8),
      supabase
        .from("users")
        .select("id,username,banner")
        .ilike("username", `%${q}%`)
        .limit(8),
    ]);

    const mergedSkins: any[] = [
      ...(byName.data ?? []),
      ...(byCreator.data ?? []),
    ];

    const seen = new Set<any>();
    const skins: SearchSkin[] = [];
    for (const skin of mergedSkins) {
      if (seen.has(skin.id)) continue;
      seen.add(skin.id);
      skins.push({
        ...skin,
        Player: Array.isArray(skin.Player) ? skin.Player[0] ?? null : skin.Player ?? null,
      });
      if (skins.length >= 8) break;
    }

    const users: SearchUser[] = (byUser.data ?? []) as SearchUser[];

    return { skins, users };
  } catch (err) {
    return { skins: [], users: [] };
  }
}
