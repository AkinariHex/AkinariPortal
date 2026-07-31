import "server-only";
import { createSchema } from "graphql-yoga";
import { GraphQLError, GraphQLScalarType } from "graphql";
import supabase from "@/lib/supabaseServer";
import type { ViewerRow } from "@/lib/apiKey";
import {
  actuationFor,
  DEFAULT_KEYBOARD_VIEW,
  isAnalog,
  KEYBOARD_VIEWS,
  readKeyboardSettings,
  switchModelFor,
  type KeyboardSettings,
} from "@/lib/keyboardSettings";
import { namedLabelsOf, slotCountOf, slotValues } from "@/lib/keyboardSlots";

export type GraphQLContext = {
  user: ViewerRow;
  origin: string;
  // Memoized per request: skinCount, totalDownloads and skins all read the same
  // list, and one query per request is enough.
  loadSkins: () => Promise<any[]>;
};

const typeDefs = /* GraphQL */ `
  """
  An arbitrary JSON value. Used for osu! settings, whose shape is validated on
  write by the strict zod schema in src/app/settings/actions.ts.
  """
  scalar JSON

  type Query {
    "The user the API key belongs to. There is no way to read anyone else."
    viewer: Viewer!
    """
    Public profile lookup by id or username. This data is already public on the
    user's profile page, so any valid API key may look up any account — provide
    either id or username. Returns null if no matching account exists.
    """
    user(id: ID, username: String): PublicUser
  }

  type Viewer {
    id: ID!
    username: String!
    avatarUrl: String!
    bannerUrl: String
    profileUrl: String!
    country: Country
    playmode: String
    socials: Socials!
    badges: [Badge!]!
    tablet: Tablet
    keyboard: Keyboard
    osuSettings: OsuSettings
    skinCount: Int!
    totalDownloads: Int!
    skins(
      "Exact mode, e.g. \\"osu!standard\\", \\"osu!mania\\", \\"osu!taiko\\", \\"osu!ctb\\""
      mode: String
      "Exact tag, e.g. \\"current\\", \\"lazer\\", \\"HD\\""
      tag: String
      "Case-insensitive match on name or creator"
      search: String
      "1-100, defaults to 50"
      limit: Int = 50
    ): [Skin!]!
  }

  type PublicUser {
    id: ID!
    username: String!
    avatarUrl: String!
    profileUrl: String!
    "Same tablet and area setup the profile page shows publicly."
    tablet: Tablet
    "Same device and switch setup the profile page shows publicly."
    keyboard: Keyboard
    "Same osu! settings the profile page shows publicly."
    osuSettings: OsuSettings
    skinCount: Int!
    totalDownloads: Int!
    skins(
      "Exact mode, e.g. \\"osu!standard\\", \\"osu!mania\\", \\"osu!taiko\\", \\"osu!ctb\\""
      mode: String
      "Exact tag, e.g. \\"current\\", \\"lazer\\", \\"HD\\""
      tag: String
      "Case-insensitive match on name or creator"
      search: String
      "1-100, defaults to 50"
      limit: Int = 50
    ): [Skin!]!
  }

  type Skin {
    id: ID!
    name: String!
    creator: String!
    bannerUrl: String
    url: String!
    modes: [String!]!
    tags: [String!]!
    downloads: Int!
    createdAt: String
    pageUrl: String!
  }

  type Country {
    code: String
    name: String
  }

  type Socials {
    twitch: String
    twitter: String
    youtube: String
    github: String
    discord: String
  }

  type Badge {
    id: ID!
    title: String!
    imageUrl: String!
    awardedAt: String
  }

  type Tablet {
    name: String!
    "Full width of the tablet surface, in millimetres."
    width: Float
    "Full height of the tablet surface, in millimetres."
    height: Float
    """
    The area the user actually maps, read from their OpenTabletDriver export.
    Null when they published a tablet without uploading its settings. The
    uploaded file itself is never served.
    """
    area: TabletArea
  }

  type TabletArea {
    "absolute | relative. Null when the export names a mode this API does not know."
    mode: String
    "Width of the mapped area in millimetres."
    width: Float
    "Height of the mapped area in millimetres."
    height: Float
    "Horizontal centre of the area, in millimetres from the left edge."
    x: Float
    "Vertical centre of the area, in millimetres from the top edge."
    y: Float
    "Rotation of the area in degrees."
    rotation: Float
    "Screen region the area maps onto, in pixels."
    display: TabletDisplayArea
    lockAspectRatio: Boolean
    areaClipping: Boolean
    areaLimiting: Boolean
    "Relative-mode sensitivity. Null on tablets mapped in absolute mode."
    relative: TabletRelativeSettings
    "When the user last uploaded these settings."
    updatedAt: String
  }

  type TabletDisplayArea {
    width: Float
    height: Float
    x: Float
    y: Float
    rotation: Float
  }

  type TabletRelativeSettings {
    "Horizontal sensitivity, in pixels per millimetre."
    xSensitivity: Float
    "Vertical sensitivity, in pixels per millimetre."
    ySensitivity: Float
    rotation: Float
  }

  type OsuSettings {
    "stable | lazer | manual - the client the settings were imported from."
    source: String
    "When the user last published them."
    updatedAt: String
    display: OsuDisplaySettings
    audio: OsuAudioSettings
    cursor: OsuCursorSettings
    gameplay: OsuGameplaySettings
    """
    The same settings exactly as stored. Every group and leaf is optional: a
    setting the user never touched is absent rather than defaulted.
    """
    raw: JSON
  }

  type OsuDisplaySettings {
    resolution: Resolution
    "fullscreen | borderless | windowed"
    windowMode: String
    letterboxing: Boolean
    "Letterbox position, -100 to 100 on each axis."
    letterboxOffset: Offset
    "vsync | 120fps | 240fps | custom | unlimited | 2x | 4x | 8x"
    frameLimiter: String
    "Frame cap in fps. Only set when frameLimiter is custom."
    customFrameLimit: Int
    refreshRate: Int
    "automatic | opengl | direct3d11 | vulkan | metal"
    renderer: String
    compatibilityMode: Boolean
  }

  type Resolution {
    width: Int!
    height: Int!
  }

  type Offset {
    x: Int!
    y: Int!
  }

  type OsuAudioSettings {
    "0-100."
    master: Int
    music: Int
    effects: Int
    "Universal offset in milliseconds."
    offsetMs: Int
    ignoreBeatmapHitsounds: Boolean
    useSkinSamples: Boolean
  }

  type OsuCursorSettings {
    "Cursor size multiplier, 0.1 to 2."
    size: Float
    automaticSizing: Boolean
    rawInput: Boolean
    "Mouse sensitivity, 0.1 to 6. Only meaningful with raw input on."
    sensitivity: Float
    mapAbsoluteToWindow: Boolean
    "True when the mouse buttons are disabled in game."
    disableButtons: Boolean
    disableWheel: Boolean
    "never | fullscreen | during-gameplay | always"
    confine: String
    useSkinCursor: Boolean
    ripples: Boolean
  }

  type OsuGameplaySettings {
    "0-100."
    backgroundDim: Int
    backgroundVideo: Boolean
    storyboard: Boolean
    snakingSliders: Boolean
    hitLighting: Boolean
    comboBursts: Boolean
    "osu!mania scroll speed, 1-40."
    maniaScrollSpeed: Int
    maniaScaleWithBpm: Boolean
    maniaSpeedPerBeatmap: Boolean
  }

  type Keyboard {
    id: ID!
    name: String!
    brand: String
    "keyboard | keypad"
    type: String
    "Image of the device, when the catalog has one."
    modelUrl: String
    "Keys the user taps with. Unset positions are omitted."
    keys: [String!]!
    "How the profile renders this device: instrumented or plate."
    view: String!
    """
    Every physical key of the device, row by row. Empty for devices the catalog
    has no layout for - only \`keys\` is known for those.
    """
    layout: [KeyboardKey!]!
    switches: SwitchSettings!
  }

  type KeyboardKey {
    "Row index in the device layout, starting at 0."
    row: Int!
    "Legend printed on the keycap. Null on keypads whose keys carry none."
    label: String
    "Position among the unlabeled keys, null when the layout names this one."
    slot: Int
    "The key the user taps with here. Null when nothing is bound to it."
    key: String
    "True when the user taps with this key."
    tap: Boolean!
    "Width in key units: 1 is a standard key, 6.25 a spacebar."
    width: Float!
    """
    Actuation point of this key in millimetres, its per-key override when it has
    one. Null on digital switches and on keys nothing is bound to.
    """
    actuationMm: Float
    """
    Switch under this key: its per-key override when it has one, the board's
    model otherwise. Null when neither is set or nothing is bound here.
    """
    switchModel: String
  }

  type SwitchSettings {
    "mechanical | optical | magnetic"
    type: String!
    "linear | tactile | clicky"
    feel: String!
    model: String
    pollingHz: Int!
    """
    True for magnetic (hall effect) switches. Only those report travel, so
    actuation and rapid trigger are null on anything else.
    """
    analog: Boolean!
    "Total travel of the switch in millimetres."
    travelMm: Float!
    "Actuation point applied to every key without an override."
    actuationMm: Float
    rapidTrigger: Boolean!
    "Rapid trigger sensitivity, null when rapid trigger is off."
    rapidTriggerMm: Float
    "Per-key overrides of the actuation point."
    keyActuation: [KeyActuation!]!
    "Per-key overrides of the switch model, for boards built with more than one."
    keySwitches: [KeySwitch!]!
  }

  type KeyActuation {
    key: String!
    actuationMm: Float!
  }

  type KeySwitch {
    key: String!
    model: String!
  }
`;

// Output-only: the schema never takes JSON as an input, so parsing is refused
// rather than silently accepting an arbitrary literal.
const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "An arbitrary JSON value.",
  serialize: (value) => value,
  parseValue() {
    throw new GraphQLError("JSON is an output-only scalar.");
  },
  parseLiteral() {
    throw new GraphQLError("JSON is an output-only scalar.");
  },
});

// `Modes` and `Tags` are text columns holding a JSON array *string*, e.g.
// '["osu!standard"]'. Parsing here means clients get real arrays and filtering
// is exact, instead of the substring matching the profile UI does.
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function emptyToNull(value: unknown): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? null : str;
}

// Shared by Viewer.skins and PublicUser.skins — both apply the same
// mode/tag/search filters and the same 1-100 limit clamp to an already-loaded
// skin list.
function applySkinFilters(
  skins: any[],
  args: { mode?: string; tag?: string; search?: string; limit?: number }
): any[] {
  let result = skins;

  if (args.mode) {
    result = result.filter((skin: any) => parseJsonArray(skin.Modes).includes(args.mode as string));
  }
  if (args.tag) {
    result = result.filter((skin: any) => parseJsonArray(skin.Tags).includes(args.tag as string));
  }
  if (args.search) {
    const needle = args.search.toLowerCase();
    result = result.filter(
      (skin: any) =>
        String(skin.Name ?? "").toLowerCase().includes(needle) ||
        String(skin.Creator ?? "").toLowerCase().includes(needle)
    );
  }

  const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
  return result.slice(0, limit);
}

type TabletPayload = {
  device: any;
  profile: any;
  updatedAt: string | null;
};

// Shared by Viewer.tablet and PublicUser.tablet. `tabletSettingsFile` is the
// OpenTabletDriver export, already narrowed to the one profile the user picked
// (src/app/settings/SettingsClient.tsx). Only the numbers of that profile are
// ever exposed - never the file, its name, or a link to it.
function loadTablet(row: any): TabletPayload | null {
  const device = row?.tablet;
  if (!device) return null;

  const stamp = Number(row?.tabletFileUploadInfo?.date);
  const uploaded = Number.isFinite(stamp) ? new Date(stamp) : null;

  return {
    device,
    profile: row?.tabletSettingsFile?.Profiles?.[0] ?? null,
    updatedAt: uploaded ? uploaded.toISOString() : null,
  };
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

// OpenTabletDriver writes the output mode either as a bare type name or as
// { Path: "...", Settings: [...] }, depending on the version that exported.
function outputMode(profile: any): string | null {
  const raw = profile?.OutputMode;
  const path = typeof raw === "string" ? raw : raw?.Path;
  if (typeof path !== "string") return null;
  if (path.includes("Absolute")) return "absolute";
  if (path.includes("Relative")) return "relative";
  return null;
}

type KeyboardPayload = {
  device: any;
  tapKeys: string[];
  settings: KeyboardSettings;
  view: string;
};

// Shared by Viewer.keyboard and PublicUser.keyboard. No FK on users.keyboard, so
// the device row is fetched directly, and only when the field is asked for.
async function loadKeyboard(row: any): Promise<KeyboardPayload | null> {
  if (!row?.keyboard) return null;

  const { data } = await supabase
    .from("keyboards")
    .select("id,name,brand,type,layout,model_url")
    .eq("id", row.keyboard)
    .maybeSingle();

  if (!data) return null;

  return {
    device: data,
    tapKeys: Array.isArray(row.keyboard_keys)
      ? row.keyboard_keys.map(String)
      : [],
    settings: readKeyboardSettings(row.keyboard_settings),
    view: KEYBOARD_VIEWS.includes(row.keyboard_view)
      ? row.keyboard_view
      : DEFAULT_KEYBOARD_VIEW,
  };
}

// Flattens the device layout into one entry per physical key, resolved against
// the user's tap keys. Keypads whose keycaps carry no legend are stored with
// blank labels and bind their keys by position - see src/lib/keyboardSlots.ts.
function buildLayout(keyboard: KeyboardPayload) {
  const rows: { label: string; w?: number }[][] =
    keyboard.device?.layout?.rows ?? [];
  if (rows.length === 0) return [];

  const { settings, tapKeys } = keyboard;
  const analog = isAnalog(settings.switch_tech);
  const named = namedLabelsOf(keyboard.device);
  const values = slotValues(tapKeys, named, slotCountOf(keyboard.device));

  let slot = 0;

  return rows.flatMap((row, rowIndex) =>
    row.map((key) => {
      const label = key.label.trim();
      const bound = label
        ? (tapKeys.find(
            (k) => k.trim().toLowerCase() === label.toLowerCase()
          ) ?? null)
        : values[slot] || null;

      const entry = {
        row: rowIndex,
        label: label || null,
        slot: label ? null : slot,
        key: bound,
        tap: Boolean(bound),
        width: key.w ?? 1,
        actuationMm: analog && bound ? actuationFor(settings, bound) : null,
        switchModel: bound ? switchModelFor(settings, bound) || null : null,
      };

      if (!label) slot += 1;
      return entry;
    })
  );
}

export function createSkinsLoader(userId: string) {
  let pending: Promise<any[]> | null = null;

  return () => {
    pending ??= (async () => {
      const { data, error } = await supabase
        .from("skins")
        .select("id,Player,Name,Creator,Banner,Modes,Tags,URL,Downloads,created_at")
        .eq("Player", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        throw new GraphQLError("Could not load skins.");
      }

      return data ?? [];
    })();

    return pending;
  };
}

const resolvers = {
  JSON: JSONScalar,

  Query: {
    viewer: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => ctx.user,

    user: async (_parent: unknown, args: { id?: string; username?: string }) => {
      const id = args.id?.trim();
      const username = args.username?.trim();
      if (!id && !username) {
        throw new GraphQLError("Provide id or username.");
      }

      // keyboard_view / keyboard_settings ship with docs/keyboard-settings.sql
      // and osu_settings with docs/osu-settings.sql; fall back through the older
      // column sets until they have been run, same as resolveApiKeyUser.
      const lookup = (columns: string) =>
        id
          ? supabase.from("users").select(columns).eq("id", id).maybeSingle()
          : supabase
              .from("users")
              .select(columns)
              .ilike("username", username as string)
              .maybeSingle();

      const PUBLIC_COLUMNS =
        "id,username,keyboard,keyboard_keys," +
        "tablet(name,width,height),tabletSettingsFile,tabletFileUploadInfo";
      let res: any = await lookup(
        `${PUBLIC_COLUMNS},keyboard_view,keyboard_settings,osu_settings`
      );
      if (res.error) res = await lookup(`${PUBLIC_COLUMNS},osu_settings`);
      if (res.error) res = await lookup(PUBLIC_COLUMNS);

      const data: any = res.data;
      if (res.error || !data) return null;

      return { ...data, loadSkins: createSkinsLoader(data.id) };
    },
  },

  Viewer: {
    // Avatars are not stored: osu! serves them by user id, same as the profile
    // cards do (src/components/SkinCard/SkinCard.tsx).
    avatarUrl: (user: ViewerRow) => `https://s.ppy.sh/a/${user.id}`,
    bannerUrl: (user: ViewerRow) => emptyToNull(user.banner),
    profileUrl: (user: ViewerRow, _args: unknown, ctx: GraphQLContext) =>
      `${ctx.origin}/users/${user.id}`,

    // Stored as a JSON string on `users`, like src/app/users/[id]/data.ts.
    country: (user: ViewerRow) => {
      if (user.country && typeof user.country === "object") return user.country;
      try {
        return JSON.parse(user.country);
      } catch {
        return null;
      }
    },

    socials: (user: ViewerRow) => ({
      twitch: emptyToNull(user.twitch),
      twitter: emptyToNull(user.twitter),
      youtube: emptyToNull(user.youtube),
      github: emptyToNull(user.github),
      discord: emptyToNull(user.discord),
    }),

    // users_badges rows carry the award date, the badge row the title. Same
    // flatten + admin-controlled sort_order ordering as the profile.
    badges: (user: ViewerRow, _args: unknown, ctx: GraphQLContext) =>
      (user.badges ?? [])
        .map((entry: any) => ({ ...entry.badge, awardedAt: entry.created_at }))
        .filter((badge: any) => badge?.id != null)
        .sort((a: any, b: any) => {
          const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return String(a.id).localeCompare(String(b.id));
        })
        .map((badge: any) => ({
          id: badge.id,
          title: badge.title ?? String(badge.id),
          imageUrl: `${ctx.origin}/img/badges/${badge.id}.webp`,
          awardedAt: badge.awardedAt ?? null,
        })),

    tablet: (user: ViewerRow) => loadTablet(user),

    keyboard: (user: ViewerRow) => loadKeyboard(user),

    osuSettings: (user: ViewerRow) => user.osu_settings ?? null,

    skinCount: async (
      _user: ViewerRow,
      _args: unknown,
      ctx: GraphQLContext
    ) => (await ctx.loadSkins()).length,

    totalDownloads: async (
      _user: ViewerRow,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      (await ctx.loadSkins()).reduce(
        (sum: number, skin: any) => sum + (skin.Downloads ?? 0),
        0
      ),

    skins: async (
      _user: ViewerRow,
      args: { mode?: string; tag?: string; search?: string; limit?: number },
      ctx: GraphQLContext
    ) => applySkinFilters(await ctx.loadSkins(), args),
  },

  // The parent object here is whatever Query.user resolved: { id, username, loadSkins }.
  PublicUser: {
    avatarUrl: (user: any) => `https://s.ppy.sh/a/${user.id}`,
    profileUrl: (user: any, _args: unknown, ctx: GraphQLContext) => `${ctx.origin}/users/${user.id}`,
    tablet: (user: any) => loadTablet(user),
    keyboard: (user: any) => loadKeyboard(user),
    osuSettings: (user: any) => user.osu_settings ?? null,
    skinCount: async (user: any) => (await user.loadSkins()).length,
    totalDownloads: async (user: any) =>
      (await user.loadSkins()).reduce((sum: number, skin: any) => sum + (skin.Downloads ?? 0), 0),
    skins: async (
      user: any,
      args: { mode?: string; tag?: string; search?: string; limit?: number }
    ) => applySkinFilters(await user.loadSkins(), args),
  },

  Tablet: {
    name: (t: TabletPayload) => t.device.name,
    width: (t: TabletPayload) => num(t.device.width),
    height: (t: TabletPayload) => num(t.device.height),
    area: (t: TabletPayload) => (t.profile ? t : null),
  },

  // The parent is the whole TabletPayload: the area fields come from the
  // OpenTabletDriver profile, `updatedAt` from the upload stamp beside it.
  TabletArea: {
    mode: (t: TabletPayload) => outputMode(t.profile),
    width: (t: TabletPayload) => num(t.profile?.AbsoluteModeSettings?.Tablet?.Width),
    height: (t: TabletPayload) => num(t.profile?.AbsoluteModeSettings?.Tablet?.Height),
    x: (t: TabletPayload) => num(t.profile?.AbsoluteModeSettings?.Tablet?.X),
    y: (t: TabletPayload) => num(t.profile?.AbsoluteModeSettings?.Tablet?.Y),
    rotation: (t: TabletPayload) =>
      num(t.profile?.AbsoluteModeSettings?.Tablet?.Rotation),
    display: (t: TabletPayload) =>
      t.profile?.AbsoluteModeSettings?.Display ?? null,
    lockAspectRatio: (t: TabletPayload) =>
      bool(t.profile?.AbsoluteModeSettings?.LockAspectRatio),
    areaClipping: (t: TabletPayload) =>
      bool(t.profile?.AbsoluteModeSettings?.EnableClipping),
    areaLimiting: (t: TabletPayload) =>
      bool(t.profile?.AbsoluteModeSettings?.EnableAreaLimiting),
    relative: (t: TabletPayload) =>
      outputMode(t.profile) === "relative"
        ? (t.profile?.RelativeModeSettings ?? null)
        : null,
    updatedAt: (t: TabletPayload) => t.updatedAt,
  },

  TabletDisplayArea: {
    width: (d: any) => num(d?.Width),
    height: (d: any) => num(d?.Height),
    x: (d: any) => num(d?.X),
    y: (d: any) => num(d?.Y),
    rotation: (d: any) => num(d?.Rotation),
  },

  TabletRelativeSettings: {
    xSensitivity: (r: any) => num(r?.XSensitivity),
    ySensitivity: (r: any) => num(r?.YSensitivity),
    rotation: (r: any) => num(r?.RelativeRotation),
  },

  // Every other field of every osu! group resolves by name: the stored JSON
  // already uses these keys, validated on write by the zod schema in
  // src/app/settings/actions.ts.
  OsuSettings: {
    raw: (settings: any) => settings,
  },

  Keyboard: {
    id: (kb: KeyboardPayload) => kb.device.id,
    name: (kb: KeyboardPayload) => kb.device.name,
    brand: (kb: KeyboardPayload) => emptyToNull(kb.device.brand),
    type: (kb: KeyboardPayload) => emptyToNull(kb.device.type),
    modelUrl: (kb: KeyboardPayload) => emptyToNull(kb.device.model_url),
    // Blank entries are positions the user left unset, not keys.
    keys: (kb: KeyboardPayload) =>
      kb.tapKeys.map((k) => k.trim()).filter(Boolean),
    view: (kb: KeyboardPayload) => kb.view,
    layout: (kb: KeyboardPayload) => buildLayout(kb),
    switches: (kb: KeyboardPayload) => kb.settings,
  },

  SwitchSettings: {
    type: (s: KeyboardSettings) => s.switch_tech,
    feel: (s: KeyboardSettings) => s.feel,
    model: (s: KeyboardSettings) => emptyToNull(s.switch_model),
    pollingHz: (s: KeyboardSettings) => s.polling_hz,
    analog: (s: KeyboardSettings) => isAnalog(s.switch_tech),
    travelMm: (s: KeyboardSettings) => s.travel_mm,
    actuationMm: (s: KeyboardSettings) =>
      isAnalog(s.switch_tech) ? s.actuation_mm : null,
    rapidTrigger: (s: KeyboardSettings) =>
      isAnalog(s.switch_tech) && s.rapid_trigger,
    rapidTriggerMm: (s: KeyboardSettings) =>
      isAnalog(s.switch_tech) && s.rapid_trigger ? s.rapid_trigger_mm : null,
    keyActuation: (s: KeyboardSettings) =>
      isAnalog(s.switch_tech)
        ? Object.entries(s.key_actuation).map(([key, actuationMm]) => ({
            key,
            actuationMm,
          }))
        : [],
    keySwitches: (s: KeyboardSettings) =>
      Object.entries(s.key_switch)
        .filter(([, model]) => model.trim())
        .map(([key, model]) => ({ key, model })),
  },

  Skin: {
    id: (skin: any) => skin.id,
    name: (skin: any) => skin.Name,
    creator: (skin: any) => skin.Creator,
    bannerUrl: (skin: any) => emptyToNull(skin.Banner),
    url: (skin: any) => skin.URL,
    modes: (skin: any) => parseJsonArray(skin.Modes),
    tags: (skin: any) => parseJsonArray(skin.Tags),
    downloads: (skin: any) => skin.Downloads ?? 0,
    createdAt: (skin: any) => skin.created_at ?? null,
    // Always the skin's own owner, not the caller — a Skin is reachable from
    // both Viewer.skins (owner === caller) and PublicUser.skins (owner !== caller).
    pageUrl: (skin: any, _args: unknown, ctx: GraphQLContext) =>
      `${ctx.origin}/users/${skin.Player}#${skin.id}`,
  },
};

export const schema = createSchema({ typeDefs, resolvers });
