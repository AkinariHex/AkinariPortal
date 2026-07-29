/**
 * Parsing of osu! client config files, in the browser.
 *
 * SECURITY: `osu!.<user>.cfg` holds `Username` and `Password` (hashed) in
 * plaintext, and `BeatmapDirectory`, which normally contains the person's real
 * Windows account name. Nothing here ever returns a key it wasn't explicitly
 * asked for: the raw file is reduced to an allowlist immediately, and every
 * result is built as a fresh object literal - never a spread of the parsed map -
 * so no future edit can leak a key by accident. The file itself is never
 * uploaded or stored; only the normalized object below leaves the browser, and
 * the server re-validates it with a strict schema.
 */

export type WindowMode = "fullscreen" | "borderless" | "windowed";
export type FrameLimiter =
  | "vsync"
  | "120fps"
  | "240fps"
  | "unlimited"
  | "custom"
  | "2x"
  | "4x"
  | "8x";
// "during-gameplay" only exists in lazer's game.ini; "fullscreen" only in
// stable and in lazer's framework.ini. The union covers both.
export type ConfineMouse =
  | "never"
  | "during-gameplay"
  | "fullscreen"
  | "always";
export type Renderer =
  | "automatic"
  | "opengl"
  | "direct3d11"
  | "vulkan"
  | "metal";

export type OsuDisplaySettings = {
  resolution?: { width: number; height: number };
  windowMode?: WindowMode;
  letterboxing?: boolean;
  letterboxOffset?: { x: number; y: number };
  frameLimiter?: FrameLimiter;
  customFrameLimit?: number;
  refreshRate?: number;
  renderer?: Renderer;
  compatibilityMode?: boolean;
};

export type OsuAudioSettings = {
  master?: number;
  music?: number;
  effects?: number;
  offsetMs?: number;
  ignoreBeatmapHitsounds?: boolean;
  useSkinSamples?: boolean;
};

export type OsuCursorSettings = {
  size?: number;
  automaticSizing?: boolean;
  rawInput?: boolean;
  sensitivity?: number;
  mapAbsoluteToWindow?: boolean;
  disableButtons?: boolean;
  disableWheel?: boolean;
  confine?: ConfineMouse;
  useSkinCursor?: boolean;
  ripples?: boolean;
};

export type OsuGameplaySettings = {
  backgroundDim?: number;
  backgroundVideo?: boolean;
  storyboard?: boolean;
  snakingSliders?: boolean;
  hitLighting?: boolean;
  comboBursts?: boolean;
  maniaScrollSpeed?: number;
  maniaScaleWithBpm?: boolean;
  maniaSpeedPerBeatmap?: boolean;
};

export type OsuSettingsSource = "stable" | "lazer" | "manual";

export type OsuSettings = {
  source?: OsuSettingsSource;
  updatedAt?: string;
  display?: OsuDisplaySettings;
  audio?: OsuAudioSettings;
  cursor?: OsuCursorSettings;
  gameplay?: OsuGameplaySettings;
};

export type StableImport = { settings: OsuSettings; tapKeys: string[] };

// Keys read from osu! stable's osu!.<user>.cfg. Anything absent from this list
// is dropped before it is ever looked at - including Username and Password.
const STABLE_ALLOWLIST = new Set([
  "Width",
  "Height",
  "WidthFullscreen",
  "HeightFullscreen",
  "Fullscreen",
  "Letterboxing",
  "LetterboxPositionX",
  "LetterboxPositionY",
  "FrameSync",
  "CustomFrameLimit",
  "OverrideRefreshRate",
  "RefreshRate",
  "CompatibilityContext",
  "VolumeUniversal",
  "VolumeMusic",
  "VolumeEffect",
  "Offset",
  "IgnoreBeatmapSamples",
  "SkinSamples",
  "CursorSize",
  "AutomaticCursorSizing",
  "RawInput",
  "MouseSpeed",
  "AbsoluteToOsuWindow",
  "MouseDisableButtons",
  "MouseDisableWheel",
  "ConfineMouse",
  "UseSkinCursor",
  "CursorRipple",
  "DimLevel",
  "Video",
  "ShowStoryboard",
  "SnakingSliders",
  "HitLighting",
  "ComboBurst",
  "ManiaSpeed",
  "ManiaSpeedBPMScale",
  "UsePerBeatmapManiaSpeed",
  "keyOsuLeft",
  "keyOsuRight",
  "keyOsuSmoke",
]);

// osu! lazer splits its settings: framework.ini holds the window, frame limiter
// and volume settings below (verified against osu-framework's
// FrameworkConfigManager.cs), while cursor size, dim, offset and the keybinds
// live in client.realm - a binary Realm database that cannot be read here.
// CursorSensitivity and MapAbsoluteInputToWindow are in the file but marked
// [Obsolete] upstream, so their values can be stale: deliberately left out.
const LAZER_ALLOWLIST = new Set([
  "WindowMode",
  "SizeFullscreen",
  "WindowedSize",
  "FrameSync",
  "Renderer",
  "ConfineMouseMode",
  "VolumeUniversal",
  "VolumeMusic",
  "VolumeEffect",
]);

// osu! lazer's second config file, game.ini, holds the in-game options. It also
// holds `Username` and `Token` (a live session token, verified in
// OsuConfigManager.cs) - the only genuinely dangerous keys in the lazer setup,
// and both are absent from this list.
const LAZER_GAME_ALLOWLIST = new Set([
  "AudioOffset",
  "BeatmapHitsounds",
  "GameplayCursorSize",
  "AutoCursorSize",
  "MouseDisableButtons",
  "MouseDisableWheel",
  "ConfineMouseMode",
  "DimLevel",
  "ShowStoryboard",
  "HitLighting",
  "PreferNoVideo",
]);

function parseIni(text: string, allowlist: Set<string>) {
  const values = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";") || line.startsWith("//")) {
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) continue;

    // Split on the first `=` only: values can contain more of them.
    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!allowlist.has(key)) continue;

    values.set(key, line.slice(separator + 1).trim());
  }

  return values;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function toInt(raw: string | undefined, min: number, max: number) {
  if (raw === undefined) return undefined;
  const parsed = Number.parseInt(raw, 10);
  // A value we can't read is left out entirely. Falling back to 0 would publish
  // a number the player never chose.
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : undefined;
}

function toDecimal(raw: string | undefined, min: number, max: number) {
  if (raw === undefined) return undefined;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(parsed)) return undefined;
  return Math.round(clamp(parsed, min, max) * 100) / 100;
}

function toBool(raw: string | undefined) {
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function fromEnum<T extends string>(
  raw: string | undefined,
  map: Record<string, T>
): T | undefined {
  if (raw === undefined) return undefined;
  return map[raw.trim().toLowerCase()];
}

/**
 * Volume as a 0-100 integer. The two clients disagree on the unit: stable
 * writes `VolumeUniversal = 100`, lazer writes `VolumeUniversal = 0.35`.
 * Reading lazer's value as if it were stable's would be a silent 100x error.
 */
function toUnitPercent(raw: string | undefined) {
  if (raw === undefined) return undefined;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(parsed)) return undefined;
  return Math.round(clamp(parsed, 0, 1) * 100);
}

/**
 * `1920x1080` (and the `1920,1080` variant) as written by osu-framework.
 *
 * lazer ships `SizeFullscreen = 9999x9999` as a sentinel meaning "whatever the
 * desktop is", so a literal reading would publish a resolution nobody has - and
 * would be rejected by the server schema anyway. Anything outside a plausible
 * monitor size is treated as unset.
 */
function toSize(raw: string | undefined) {
  if (raw === undefined) return undefined;
  const match = raw.match(/(\d{2,5})\s*[x,]\s*(\d{2,5})/i);
  if (!match) return undefined;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 320 || width > 15360 || height < 240 || height > 8640) {
    return undefined;
  }
  return { width, height };
}

const STABLE_FRAME_SYNC: Record<string, FrameLimiter> = {
  vsync: "vsync",
  limit120: "120fps",
  limit240: "240fps",
  unlimited: "unlimited",
  custom: "custom",
};

const LAZER_FRAME_SYNC: Record<string, FrameLimiter> = {
  vsync: "vsync",
  limit2x: "2x",
  limit4x: "4x",
  limit8x: "8x",
  unlimited: "unlimited",
};

/** stable's `ConfineMouse` and lazer framework.ini's `ConfineMouseMode`. */
const CONFINE_MOUSE: Record<string, ConfineMouse> = {
  never: "never",
  fullscreen: "fullscreen",
  always: "always",
};

/** lazer game.ini uses a different enum for the same setting. */
const GAME_CONFINE_MOUSE: Record<string, ConfineMouse> = {
  never: "never",
  duringgameplay: "during-gameplay",
  always: "always",
};

const WINDOW_MODE: Record<string, WindowMode> = {
  fullscreen: "fullscreen",
  borderless: "borderless",
  windowed: "windowed",
};

const RENDERER: Record<string, Renderer> = {
  automatic: "automatic",
  opengl: "opengl",
  direct3d11: "direct3d11",
  vulkan: "vulkan",
  metal: "metal",
};

/** Drops undefined entries; returns undefined when nothing is left. */
function compact<T extends object>(group: T): T | undefined {
  const entries = Object.entries(group).filter(([, value]) => value !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

/**
 * Strips empty groups so the profile card never renders an empty section, and
 * drops undefined keys entirely. The second part matters: a key left present
 * with an undefined value still counts as an unrecognized key for the strict
 * server schema, so leaving it in would make every save fail.
 */
export function compactSettings(settings: OsuSettings): OsuSettings {
  return compact({
    source: settings.source,
    updatedAt: settings.updatedAt,
    display: settings.display && compact(settings.display),
    audio: settings.audio && compact(settings.audio),
    cursor: settings.cursor && compact(settings.cursor),
    gameplay: settings.gameplay && compact(settings.gameplay),
  }) as OsuSettings;
}

export function hasAnySetting(settings: OsuSettings | null | undefined) {
  if (!settings) return false;
  return Boolean(
    (settings.display && Object.keys(settings.display).length) ||
      (settings.audio && Object.keys(settings.audio).length) ||
      (settings.cursor && Object.keys(settings.cursor).length) ||
      (settings.gameplay && Object.keys(settings.gameplay).length)
  );
}

/**
 * Keys that must never be read, under any circumstance. This list is
 * documentation and a tripwire, not the mechanism: the allowlist above already
 * excludes everything not named there. Keeping it explicit means a future edit
 * that adds one of these to the allowlist fails the guard below instead of
 * shipping.
 */
const NEVER_READ = [
  "Username",
  "Password",
  "Token",
  "SavePassword",
  "SaveUsername",
  "CredentialEndpoint",
  "BeatmapDirectory",
  "Skin",
  "AudioDevice",
  "ScreenshotFormat",
];

for (const key of NEVER_READ) {
  if (
    STABLE_ALLOWLIST.has(key) ||
    LAZER_ALLOWLIST.has(key) ||
    LAZER_GAME_ALLOWLIST.has(key)
  ) {
    throw new Error(
      `osuConfig: "${key}" must never be read from an osu! config file.`
    );
  }
}

/**
 * Every string the parsers are allowed to emit. The output carries no free text
 * from the file at all: numbers and booleans are re-derived, and strings can
 * only come from these fixed tables (or a tap key, checked separately). That is
 * what makes a credential leak structurally impossible rather than merely
 * unlikely - a value from the file has no path into the result.
 */
const SAFE_STRINGS = new Set<string>([
  "stable",
  "lazer",
  "manual",
  ...Object.values(STABLE_FRAME_SYNC),
  ...Object.values(LAZER_FRAME_SYNC),
  ...Object.values(CONFINE_MOUSE),
  ...Object.values(GAME_CONFINE_MOUSE),
  ...Object.values(WINDOW_MODE),
  ...Object.values(RENDERER),
]);

const TAP_KEY = /^[A-Za-z0-9]{1,12}$/;

/**
 * Last line of defence, run on every import. Refuses to hand back a result that
 * contains any string we did not put there ourselves.
 */
function assertNoForeignStrings(settings: OsuSettings) {
  const walk = (node: unknown) => {
    if (typeof node === "string") {
      if (!SAFE_STRINGS.has(node)) {
        throw new Error("osuConfig: refusing to emit unrecognised text.");
      }
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (NEVER_READ.includes(key)) {
          throw new Error(`osuConfig: refusing to emit "${key}".`);
        }
        walk(value);
      }
    }
  };
  walk(settings);
  return settings;
}

/** Exactly what leaves the browser, for the disclaimer in the settings page. */
export const PUBLISHED_FIELDS = [
  {
    group: "Display",
    fields:
      "resolution, window mode, letterboxing and its offset, frame limiter, refresh rate, renderer, compatibility mode",
  },
  {
    group: "Audio",
    fields:
      "master / music / effect volume, universal offset, ignore beatmap hitsounds, use skin samples",
  },
  {
    group: "Cursor",
    fields:
      "cursor size, automatic sizing, raw input, sensitivity, absolute input to window, disable mouse buttons and wheel, confine cursor, skin cursor, cursor ripples",
  },
  {
    group: "Gameplay",
    fields:
      "background dim, background video, storyboards, snaking sliders, hit lighting, combo bursts, osu!mania scroll speed and its two options",
  },
  {
    group: "Gameplay keys",
    fields:
      "only the left, right and smoke keys, and only after you confirm them",
  },
] as const;

export const NEVER_READ_FIELDS = NEVER_READ;

function readTapKeys(cfg: Map<string, string>) {
  const keys: string[] = [];
  for (const name of ["keyOsuLeft", "keyOsuRight", "keyOsuSmoke"]) {
    const value = cfg.get(name)?.trim();
    if (!value || !TAP_KEY.test(value)) continue;
    const upper = value.toUpperCase();
    if (!keys.includes(upper)) keys.push(upper);
  }
  return keys;
}

export function parseStableConfig(text: string): StableImport {
  const cfg = parseIni(text, STABLE_ALLOWLIST);
  if (cfg.size === 0) {
    throw new Error("No recognisable osu! stable settings in this file.");
  }

  const fullscreen = toBool(cfg.get("Fullscreen"));
  const resolution = fullscreen
    ? {
        width: toInt(cfg.get("WidthFullscreen"), 320, 15360),
        height: toInt(cfg.get("HeightFullscreen"), 240, 8640),
      }
    : {
        width: toInt(cfg.get("Width"), 320, 15360),
        height: toInt(cfg.get("Height"), 240, 8640),
      };

  const letterboxing = toBool(cfg.get("Letterboxing"));
  const letterboxX = toInt(cfg.get("LetterboxPositionX"), -100, 100);
  const letterboxY = toInt(cfg.get("LetterboxPositionY"), -100, 100);
  const overridesRefreshRate = toBool(cfg.get("OverrideRefreshRate"));

  const settings: OsuSettings = {
    source: "stable",
    display: {
      resolution:
        resolution.width !== undefined && resolution.height !== undefined
          ? { width: resolution.width, height: resolution.height }
          : undefined,
      windowMode:
        fullscreen === undefined ? undefined : fullscreen ? "fullscreen" : "windowed",
      letterboxing,
      letterboxOffset:
        letterboxing && letterboxX !== undefined && letterboxY !== undefined
          ? { x: letterboxX, y: letterboxY }
          : undefined,
      frameLimiter: fromEnum(cfg.get("FrameSync"), STABLE_FRAME_SYNC),
      customFrameLimit: toInt(cfg.get("CustomFrameLimit"), 30, 10000),
      // Only meaningful when the override is on, otherwise it's a leftover.
      refreshRate: overridesRefreshRate
        ? toInt(cfg.get("RefreshRate"), 24, 1000)
        : undefined,
      compatibilityMode: toBool(cfg.get("CompatibilityContext")),
    },
    audio: {
      master: toInt(cfg.get("VolumeUniversal"), 0, 100),
      music: toInt(cfg.get("VolumeMusic"), 0, 100),
      effects: toInt(cfg.get("VolumeEffect"), 0, 100),
      offsetMs: toInt(cfg.get("Offset"), -500, 500),
      ignoreBeatmapHitsounds: toBool(cfg.get("IgnoreBeatmapSamples")),
      useSkinSamples: toBool(cfg.get("SkinSamples")),
    },
    cursor: {
      size: toDecimal(cfg.get("CursorSize"), 0.1, 2),
      automaticSizing: toBool(cfg.get("AutomaticCursorSizing")),
      rawInput: toBool(cfg.get("RawInput")),
      sensitivity: toDecimal(cfg.get("MouseSpeed"), 0.1, 6),
      mapAbsoluteToWindow: toBool(cfg.get("AbsoluteToOsuWindow")),
      disableButtons: toBool(cfg.get("MouseDisableButtons")),
      disableWheel: toBool(cfg.get("MouseDisableWheel")),
      confine: fromEnum(cfg.get("ConfineMouse"), CONFINE_MOUSE),
      useSkinCursor: toBool(cfg.get("UseSkinCursor")),
      ripples: toBool(cfg.get("CursorRipple")),
    },
    gameplay: {
      backgroundDim: toInt(cfg.get("DimLevel"), 0, 100),
      backgroundVideo: toBool(cfg.get("Video")),
      storyboard: toBool(cfg.get("ShowStoryboard")),
      snakingSliders: toBool(cfg.get("SnakingSliders")),
      hitLighting: toBool(cfg.get("HitLighting")),
      comboBursts: toBool(cfg.get("ComboBurst")),
      maniaScrollSpeed: toInt(cfg.get("ManiaSpeed"), 1, 40),
      maniaScaleWithBpm: toBool(cfg.get("ManiaSpeedBPMScale")),
      maniaSpeedPerBeatmap: toBool(cfg.get("UsePerBeatmapManiaSpeed")),
    },
  };

  return {
    settings: assertNoForeignStrings(compactSettings(settings)),
    tapKeys: readTapKeys(cfg),
  };
}

export function parseLazerFramework(text: string): OsuSettings {
  const cfg = parseIni(text, LAZER_ALLOWLIST);
  if (cfg.size === 0) {
    throw new Error("No recognisable osu! lazer settings in this file.");
  }

  const windowMode = fromEnum(cfg.get("WindowMode"), WINDOW_MODE);
  const resolution =
    windowMode === "windowed"
      ? toSize(cfg.get("WindowedSize"))
      : toSize(cfg.get("SizeFullscreen"));

  return assertNoForeignStrings(
    compactSettings({
    source: "lazer",
    display: {
      resolution,
      windowMode,
      frameLimiter: fromEnum(cfg.get("FrameSync"), LAZER_FRAME_SYNC),
      renderer: fromEnum(cfg.get("Renderer"), RENDERER),
    },
    audio: {
      master: toUnitPercent(cfg.get("VolumeUniversal")),
      music: toUnitPercent(cfg.get("VolumeMusic")),
      effects: toUnitPercent(cfg.get("VolumeEffect")),
    },
    cursor: {
      confine: fromEnum(cfg.get("ConfineMouseMode"), CONFINE_MOUSE),
    },
    })
  );
}

/**
 * osu! lazer's game.ini: the in-game options. Volumes and window settings are
 * NOT here, they live in framework.ini - import both to get the full picture.
 */
export function parseLazerGame(text: string): OsuSettings {
  const cfg = parseIni(text, LAZER_GAME_ALLOWLIST);
  if (cfg.size === 0) {
    throw new Error("No recognisable osu! lazer game settings in this file.");
  }

  const beatmapHitsounds = toBool(cfg.get("BeatmapHitsounds"));
  const preferNoVideo = toBool(cfg.get("PreferNoVideo"));

  return assertNoForeignStrings(
    compactSettings({
      source: "lazer",
      audio: {
        offsetMs: toInt(cfg.get("AudioOffset"), -500, 500),
        // lazer asks the opposite question to stable's IgnoreBeatmapSamples.
        ignoreBeatmapHitsounds:
          beatmapHitsounds === undefined ? undefined : !beatmapHitsounds,
      },
      cursor: {
        size: toDecimal(cfg.get("GameplayCursorSize"), 0.1, 2),
        automaticSizing: toBool(cfg.get("AutoCursorSize")),
        disableButtons: toBool(cfg.get("MouseDisableButtons")),
        disableWheel: toBool(cfg.get("MouseDisableWheel")),
        confine: fromEnum(cfg.get("ConfineMouseMode"), GAME_CONFINE_MOUSE),
      },
      gameplay: {
        // 0..1 here, unlike stable's 0..100.
        backgroundDim: toUnitPercent(cfg.get("DimLevel")),
        storyboard: toBool(cfg.get("ShowStoryboard")),
        hitLighting: toBool(cfg.get("HitLighting")),
        backgroundVideo:
          preferNoVideo === undefined ? undefined : !preferNoVideo,
      },
    })
  );
}

/**
 * Combines two parsed results, with `later` winning on every field it defines.
 * Used to fold game.ini over framework.ini: where both describe the same
 * setting (confine cursor), game.ini is the one the player sees in the options.
 */
export function mergeSettings(
  earlier: OsuSettings,
  later: OsuSettings
): OsuSettings {
  return compactSettings({
    source: later.source ?? earlier.source,
    display: { ...earlier.display, ...later.display },
    audio: { ...earlier.audio, ...later.audio },
    cursor: { ...earlier.cursor, ...later.cursor },
    gameplay: { ...earlier.gameplay, ...later.gameplay },
  });
}

export type ConfigKind = "stable" | "lazer-framework" | "lazer-game";

/** Best guess at which file this is, by name first and content second. */
export function detectConfigKind(
  fileName: string,
  text: string
): ConfigKind | null {
  const name = fileName.toLowerCase();
  if (name.endsWith(".cfg") || name.startsWith("osu!.")) return "stable";
  if (name.includes("framework")) return "lazer-framework";
  if (name.includes("game")) return "lazer-game";
  // Content fallback. Stable is checked first: it shares key names with both
  // lazer files (DimLevel, ShowStoryboard, VolumeUniversal), so a stable-only
  // key has to settle it before the lazer signatures run.
  if (/^\s*(CompatibilityContext|AutomaticCursorSizing|SnakingSliders)\s*=/m.test(text))
    return "stable";
  if (/^\s*(WindowMode|SizeFullscreen)\s*=/m.test(text)) return "lazer-framework";
  if (/^\s*(GameplayCursorSize|PreferNoVideo|AutoCursorSize)\s*=/m.test(text))
    return "lazer-game";
  return null;
}
