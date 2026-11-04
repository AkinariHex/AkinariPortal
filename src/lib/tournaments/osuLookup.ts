import "server-only";
import { getAccessToken, osuApiFetch } from "@/lib/osu";
import type { Mod, Player, PoolMap } from "./bundle";
import { applyModStats } from "./applyModStats";

const SR_MODS: Partial<Record<Mod, string[]>> = { HR: ["HR"], DT: ["DT"], EZ: ["EZ"], FL: ["FL"] };

async function osuApiPost(endpoint: string, body: unknown) {
  const token = await getAccessToken();
  const res = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`osu! API error (${res.status})`);
  return res.json();
}

const toPlayer = (u: any): Player => ({ osuId: Number(u.id), name: String(u.username), country: String(u.country_code ?? "") });

// osu! ids or usernames -> players, in input order. Ids go in batches of 50,
// usernames one call each. Throws naming the first input osu! does not know.
export async function resolvePlayers(inputs: string[]): Promise<Player[]> {
  const ids = [...new Set(inputs.filter((i) => /^\d+$/.test(i)))];
  const byId = new Map<string, Player>();
  for (let i = 0; i < ids.length; i += 50) {
    const query = ids
      .slice(i, i + 50)
      .map((id) => `ids[]=${id}`)
      .join("&");
    const data: any = await osuApiFetch(`users?${query}`);
    for (const u of data.users ?? []) byId.set(String(u.id), toPlayer(u));
  }

  const out: Player[] = [];
  for (const input of inputs) {
    if (/^\d+$/.test(input)) {
      const p = byId.get(input);
      if (!p) throw new Error(`osu! user ${input} not found`);
      out.push(p);
      continue;
    }
    try {
      out.push(toPlayer(await osuApiFetch(`users/${encodeURIComponent(input)}?key=username`)));
    } catch {
      throw new Error(`osu! user "${input}" not found`);
    }
  }
  return out;
}

// One pool slot filled from the osu! API: metadata, mod-adjusted stats and SR.
export async function resolvePoolMap(slot: string, mods: Mod, beatmapId: number): Promise<PoolMap> {
  let b: any;
  try {
    b = await osuApiFetch(`beatmaps/${beatmapId}`);
  } catch {
    throw new Error(`${slot}: beatmap ${beatmapId} not found`);
  }

  let sr = Number(b.difficulty_rating);
  const srMods = SR_MODS[mods];
  if (srMods) {
    const attr = await osuApiPost(`beatmaps/${beatmapId}/attributes`, { mods: srMods, ruleset: "osu" });
    sr = Number(attr?.attributes?.star_rating ?? sr);
  }

  const stats = applyModStats({ bpm: Number(b.bpm), cs: Number(b.cs), ar: Number(b.ar), od: Number(b.accuracy), length: Number(b.hit_length) }, mods);

  return {
    slot,
    mods,
    beatmapId,
    setId: Number(b.beatmapset_id),
    title: String(b.beatmapset?.title ?? ""),
    artist: String(b.beatmapset?.artist ?? ""),
    version: String(b.version ?? ""),
    mapper: String(b.beatmapset?.creator ?? ""),
    sr: Math.round(sr * 100) / 100,
    ...stats,
  };
}
