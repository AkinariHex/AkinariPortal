import { z } from "zod";

export const SWITCH_TECHS = ["mechanical", "optical", "magnetic"] as const;
export const SWITCH_FEELS = ["linear", "tactile", "clicky"] as const;
export const KEYBOARD_VIEWS = ["instrumented", "plate"] as const;

export type SwitchTech = (typeof SWITCH_TECHS)[number];
export type SwitchFeel = (typeof SWITCH_FEELS)[number];
export type KeyboardViewVariant = (typeof KEYBOARD_VIEWS)[number];

export const DEFAULT_KEYBOARD_VIEW: KeyboardViewVariant = "instrumented";
export const DEFAULT_TRAVEL_MM = 4;

export const keyboardSettingsSchema = z.object({
  switch_tech: z.enum(SWITCH_TECHS).default("mechanical"),
  feel: z.enum(SWITCH_FEELS).default("linear"),
  switch_model: z.string().max(48).default(""),
  polling_hz: z.number().int().min(1).max(8000).default(1000),
  travel_mm: z.number().min(0.5).max(10).default(DEFAULT_TRAVEL_MM),
  actuation_mm: z.number().min(0.05).max(10).default(2),
  rapid_trigger: z.boolean().default(false),
  rapid_trigger_mm: z.number().min(0.01).max(4).default(0.2),
  // Per-key overrides, keyed by the key label as it appears in the layout.
  key_actuation: z.record(z.string(), z.number().min(0.05).max(10)).default({}),
  // Boards are often built with a different switch under the keys the user
  // taps with, so the model is overridable per key too.
  key_switch: z.record(z.string(), z.string().max(48)).default({}),
});

export type KeyboardSettings = z.infer<typeof keyboardSettingsSchema>;

export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings =
  keyboardSettingsSchema.parse({});

// Magnetic (hall effect) switches are the analog ones: they report travel, so
// actuation point and rapid trigger only mean something there.
export function isAnalog(tech: SwitchTech) {
  return tech === "magnetic";
}

export function readKeyboardSettings(raw: unknown): KeyboardSettings {
  const parsed = keyboardSettingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : DEFAULT_KEYBOARD_SETTINGS;
}

function overrideKey(map: Record<string, unknown>, label: string) {
  return Object.keys(map).find((k) => k.toLowerCase() === label.toLowerCase());
}

export function actuationFor(
  settings: KeyboardSettings,
  label: string
): number {
  const key = overrideKey(settings.key_actuation, label);
  return key ? settings.key_actuation[key] : settings.actuation_mm;
}

export function switchModelFor(
  settings: KeyboardSettings,
  label: string
): string {
  const key = overrideKey(settings.key_switch, label);
  return (key ? settings.key_switch[key] : "") || settings.switch_model;
}

export function hasSwitchOverride(settings: KeyboardSettings, label: string) {
  const key = overrideKey(settings.key_switch, label);
  return Boolean(key && settings.key_switch[key].trim());
}

// Suggestions only: the field takes any text, so a switch nobody listed here
// still saves.
export const SWITCH_MODELS: Record<SwitchTech, string[]> = {
  magnetic: [
    "Wooting Lekker L60",
    "Gateron Magnetic Jade",
    "Gateron KS-20",
    "Geon Raptor HE",
    "DrunkDeer Magnetic",
    "Keychron Gateron Double-Rail",
    "Akko Cream Magnetic",
    "SteelSeries OmniPoint 2.0",
  ],
  mechanical: [
    "Cherry MX Red",
    "Cherry MX Speed Silver",
    "Cherry MX Brown",
    "Cherry MX Blue",
    "Cherry MX Black",
    "Gateron Yellow",
    "Gateron Red",
    "Alpaca Linear",
    "Tangerine",
    "Boba U4T",
    "Holy Panda",
    "NovelKeys Cream",
    "Zealios V2",
    "Akko Jelly Pink",
    "Kailh Box White",
  ],
  optical: [
    "Razer Optical Linear Gen 2",
    "Razer Optical Clicky",
    "Gateron Optical Yellow",
    "Gateron Optical Red",
    "TTC Gold Optical",
    "Bloody LK Libra Brown",
    "Keychron Optical Banana",
  ],
};

/* Wootility import ------------------------------------------------------- */

export type WootilityImport = {
  name?: string;
  actuation_mm?: number;
  rapid_trigger?: boolean;
  rapid_trigger_mm?: number;
  key_actuation: Record<string, number>;
};

// Wootility profile exports have no documented public schema, so this reads the
// field names seen in the wild and ignores everything else rather than failing.
// Values above the switch travel are treated as a 0-100 percentage of it.
function toMm(value: unknown, travel = DEFAULT_TRAVEL_MM) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return undefined;
  const mm = value > travel ? (value / 100) * travel : value;
  return mm > 0 && mm <= travel ? Number(mm.toFixed(2)) : undefined;
}

function pickNumber(src: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const mm = toMm(src[k]);
    if (mm !== undefined) return mm;
  }
  return undefined;
}

function pickBoolean(src: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    if (typeof src[k] === "boolean") return src[k] as boolean;
  }
  return undefined;
}

function readKeyEntries(src: Record<string, unknown>) {
  const out: Record<string, number> = {};
  const container = src.keys ?? src.key_config ?? src.keyConfig ?? src.bindings;

  const put = (label: unknown, mm: number | undefined) => {
    if (typeof label !== "string" || !label.trim() || mm === undefined) return;
    out[label.trim()] = mm;
  };

  if (Array.isArray(container)) {
    for (const entry of container) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      put(
        e.key ?? e.name ?? e.label ?? e.code,
        pickNumber(e, ["actuation_point", "actuation", "actuationPoint"])
      );
    }
  } else if (typeof container === "object" && container !== null) {
    for (const [label, value] of Object.entries(
      container as Record<string, unknown>
    )) {
      if (typeof value === "number") put(label, toMm(value));
      else if (typeof value === "object" && value !== null)
        put(
          label,
          pickNumber(value as Record<string, unknown>, [
            "actuation_point",
            "actuation",
            "actuationPoint",
          ])
        );
    }
  }

  return out;
}

export function parseWootilityProfile(raw: unknown): WootilityImport | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const nested = obj.profile ?? obj.data ?? obj.settings;
  const src = (
    typeof nested === "object" && nested !== null ? nested : obj
  ) as Record<string, unknown>;

  const result: WootilityImport = {
    name:
      typeof src.name === "string"
        ? src.name
        : typeof obj.name === "string"
          ? obj.name
          : undefined,
    actuation_mm: pickNumber(src, [
      "actuation_point",
      "actuation",
      "actuationPoint",
      "global_actuation",
    ]),
    rapid_trigger: pickBoolean(src, [
      "rapid_trigger",
      "rapidTrigger",
      "rapid_trigger_enabled",
    ]),
    rapid_trigger_mm: pickNumber(src, [
      "rapid_trigger_sensitivity",
      "rapidTriggerSensitivity",
      "rapid_trigger_mm",
      "sensitivity",
    ]),
    key_actuation: readKeyEntries(src),
  };

  const hasData =
    result.actuation_mm !== undefined ||
    result.rapid_trigger !== undefined ||
    result.rapid_trigger_mm !== undefined ||
    Object.keys(result.key_actuation).length > 0;

  return hasData ? result : null;
}
