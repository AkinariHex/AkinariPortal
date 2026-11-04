// Self-check for the pure tournament helpers: npx tsx scripts/check-tournaments.ts
import assert from "node:assert/strict";
import { applyModStats } from "../src/lib/tournaments/applyModStats";
import { beatmapIdFromInput } from "../src/lib/tournaments/beatmapIdFromInput";
import { computeQualifiers } from "../src/lib/tournaments/computeQualifiers";
import { mergePool } from "../src/lib/tournaments/mergePool";
import { parseSheet } from "../src/lib/tournaments/parseSheet";
import { slotMods } from "../src/lib/tournaments/slotMods";

assert.equal(slotMods("hr2"), "HR");
assert.equal(slotMods("X1"), "FM");
assert.equal(beatmapIdFromInput("https://osu.ppy.sh/beatmapsets/123#osu/456"), 456);
assert.deepEqual(parseSheet("Team\tSlot\nA\tNM1\n\nB\tNM2", /^team/i), [["A", "NM1"], ["B", "NM2"]]);
assert.deepEqual(parseSheet("NM3 4500604 \nHD2   24695\n NM1 806017"), [["NM3", "4500604"], ["HD2", "24695"], ["NM1", "806017"]]);
assert.deepEqual(parseSheet("Pasta al dente, 2, WhiteCat"), [["Pasta al dente", "2", "WhiteCat"]]);

const dt = applyModStats({ bpm: 180, cs: 4, ar: 9, od: 8, length: 120 }, "DT");
assert.deepEqual(dt, { bpm: 270, cs: 4, ar: 10.3, od: 9.8, length: 80 });
assert.equal(applyModStats({ bpm: 1, cs: 4, ar: 9, od: 8, length: 1 }, "HR").ar, 10);

const map = (slot: string, mods: string) => ({ slot, mods, beatmapId: 1, setId: 1, title: "", artist: "", version: "", mapper: "", sr: 0, bpm: 0, cs: 0, ar: 0, od: 0, length: 0 }) as any;
const q = computeQualifiers(
  [
    { team: "A", slot: "NM1", score: 900 }, { team: "A", slot: "HR1", score: 100 },
    { team: "B", slot: "NM1", score: 500 }, { team: "B", slot: "HR1", score: 800 },
    { team: "C", slot: "NM1", score: 100 }, { team: "C", slot: "HR1", score: 50 },
  ],
  [map("NM1", "NM"), map("HR1", "HR")],
  2
);
assert.deepEqual(q.teams.map((t) => t.team), ["B", "A", "C"]);
assert.equal(q.teams[0].maps.HR1.placement, 1);
assert.equal(q.teams.find((t) => t.team === "A")!.modSeeds.NM, 1);
console.log("tournament helpers ok");

// Pool import merges by slot: replace existing, add new, keep the rest, sorted by mod then number.
const pm = (slot: string, mods: string, beatmapId: number) => ({ slot, mods, beatmapId }) as any;
const merged = mergePool([pm("NM1", "NM", 1), pm("HD4", "HD", 2), pm("NM2", "NM", 3)], [pm("NM2", "NM", 99), pm("DT1", "DT", 4)]);
assert.deepEqual(merged.map((m) => `${m.slot}:${m.beatmapId}`), ["NM1:1", "NM2:99", "HD4:2", "DT1:4"]);
console.log("pool merge ok");
