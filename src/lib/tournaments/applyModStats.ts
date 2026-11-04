import type { Mod } from "./bundle";

const arToMs = (ar: number) => (ar <= 5 ? 1800 - 120 * ar : 1200 - 150 * (ar - 5));
const msToAr = (ms: number) => (ms >= 1200 ? (1800 - ms) / 120 : 5 + (1200 - ms) / 150);
const odToMs = (od: number) => 80 - 6 * od;
const msToOd = (ms: number) => (80 - ms) / 6;
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

type Stats = { bpm: number; cs: number; ar: number; od: number; length: number };

// Map stats as played with the slot's mods (HR / EZ scale CS, AR, OD; DT changes
// clock rate). Star rating comes from the osu! API attributes endpoint instead.
export function applyModStats(s: Stats, mods: Mod): Stats {
  let { bpm, cs, ar, od, length } = s;
  if (mods === "HR") {
    cs = Math.min(10, cs * 1.3);
    ar = Math.min(10, ar * 1.4);
    od = Math.min(10, od * 1.4);
  } else if (mods === "EZ") {
    cs /= 2;
    ar /= 2;
    od /= 2;
  } else if (mods === "DT") {
    bpm *= 1.5;
    length /= 1.5;
    ar = msToAr(arToMs(ar) / 1.5);
    od = msToOd(odToMs(od) / 1.5);
  }
  return { bpm: round(bpm, 0), cs: round(cs), ar: round(ar), od: round(od), length: Math.round(length) };
}
