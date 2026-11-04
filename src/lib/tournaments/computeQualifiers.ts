import type { PoolMap, Qualifiers } from "./bundle";

export type QualifierScore = { team: string; slot: string; score: number };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const std = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) || 1;
};

// Raw qualifier scores -> placements per map, z-sum seeding and per-mod seeds.
// z-score per map = (score - map mean) / map std dev; a team that did not play
// a map counts as score 0 on it. Seed = rank by z-sum (desc).
export function computeQualifiers(scores: QualifierScore[], maps: PoolMap[], qualified: number): Qualifiers {
  const teams = [...new Set(scores.map((s) => s.team))];
  const scoreOf = (team: string, slot: string) => scores.find((s) => s.team === team && s.slot === slot)?.score ?? 0;

  const perTeam = new Map(teams.map((t) => [t, { z: 0, zByMod: {} as Record<string, number>, total: 0, played: 0, maps: {} as Record<string, { score: number; placement: number }> }]));

  for (const map of maps) {
    const values = teams.map((t) => scoreOf(t, map.slot));
    const m = mean(values);
    const sd = std(values);
    const ranked = [...teams].sort((a, b) => scoreOf(b, map.slot) - scoreOf(a, map.slot));
    for (const t of teams) {
      const score = scoreOf(t, map.slot);
      const z = (score - m) / sd;
      const row = perTeam.get(t)!;
      row.z += z;
      row.zByMod[map.mods] = (row.zByMod[map.mods] ?? 0) + z;
      row.maps[map.slot] = { score, placement: ranked.indexOf(t) + 1 };
      if (score > 0) {
        row.total += score;
        row.played += 1;
      }
    }
  }

  const bySeed = [...teams].sort((a, b) => perTeam.get(b)!.z - perTeam.get(a)!.z);
  const mods = [...new Set(maps.map((m) => m.mods))];
  const modSeed = (team: string, mod: string) =>
    [...teams].sort((a, b) => (perTeam.get(b)!.zByMod[mod] ?? 0) - (perTeam.get(a)!.zByMod[mod] ?? 0)).indexOf(team) + 1;

  return {
    qualified,
    teams: bySeed.map((team, i) => {
      const row = perTeam.get(team)!;
      return {
        team,
        seed: i + 1,
        zsum: Math.round(row.z * 1000) / 1000,
        avgScore: Math.round(row.total / (row.played || 1)),
        modSeeds: Object.fromEntries(mods.map((mod) => [mod, modSeed(team, mod)])),
        maps: row.maps,
      };
    }),
  };
}
