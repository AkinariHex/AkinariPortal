import { MODS, type PoolMap } from "./bundle";

const modRank = (m: PoolMap) => MODS.indexOf(m.mods);
const slotNumber = (m: PoolMap) => Number(m.slot.replace(/\D/g, "")) || 0;

// Imported maps into a stage's pool: a slot that already exists is replaced,
// a new slot is added. Result sorted NM, HD, HR, DT, ... then by slot number.
export function mergePool(existing: PoolMap[], incoming: PoolMap[]): PoolMap[] {
  const bySlot = new Map(existing.map((m) => [m.slot, m]));
  for (const m of incoming) bySlot.set(m.slot, m);
  return [...bySlot.values()].sort((a, b) => modRank(a) - modRank(b) || slotNumber(a) - slotNumber(b));
}
