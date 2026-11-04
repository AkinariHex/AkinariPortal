import { MODS, type Mod } from "./bundle";

// "HR2" -> "HR", "nm1" -> "NM"; unknown prefixes are FreeMod.
export function slotMods(slot: string): Mod {
  const prefix = slot.toUpperCase().replace(/[^A-Z]/g, "") as Mod;
  return (MODS as readonly string[]).includes(prefix) ? prefix : "FM";
}
