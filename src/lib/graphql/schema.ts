import "server-only";
import { createSchema } from "graphql-yoga";
import { GraphQLError, GraphQLScalarType } from "graphql";
import supabase from "@/lib/supabaseServer";
import type { ViewerRow } from "@/lib/apiKey";

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
    osuSettings: JSON
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
    width: Float
    height: Float
  }

  type Keyboard {
    id: ID!
    name: String!
    brand: String
    type: String
    keys: [String!]!
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

      const { data, error } = id
        ? await supabase.from("users").select("id,username").eq("id", id).maybeSingle()
        : await supabase
            .from("users")
            .select("id,username")
            .ilike("username", username as string)
            .maybeSingle();

      if (error || !data) return null;

      return { id: data.id, username: data.username, loadSkins: createSkinsLoader(data.id) };
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

    tablet: (user: ViewerRow) => user.tablet ?? null,

    // No FK on users.keyboard, so the device row is fetched directly.
    keyboard: async (user: ViewerRow) => {
      if (!user.keyboard) return null;
      const { data } = await supabase
        .from("keyboards")
        .select("id,name,brand,type")
        .eq("id", user.keyboard)
        .maybeSingle();
      if (!data) return null;
      return {
        ...data,
        keys: Array.isArray(user.keyboard_keys) ? user.keyboard_keys : [],
      };
    },

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
    skinCount: async (user: any) => (await user.loadSkins()).length,
    totalDownloads: async (user: any) =>
      (await user.loadSkins()).reduce((sum: number, skin: any) => sum + (skin.Downloads ?? 0), 0),
    skins: async (
      user: any,
      args: { mode?: string; tag?: string; search?: string; limit?: number }
    ) => applySkinFilters(await user.loadSkins(), args),
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
