import "server-only";
import { unstable_cache } from "next/cache";
import supabase from "@/lib/supabaseServer";
import { osuApiFetch } from "@/lib/osu";

// Resolves a /users/[id] route param that may be a numeric osu! id, a current
// username, or a previous username, to the canonical numeric id used
// everywhere else in the app. osu!'s username lookup transparently resolves
// previous usernames too, so a single API fallback covers both cases.
// Returns null if it can't be resolved to a user this site actually tracks.
export function resolveUserId(idParam: string) {
  return unstable_cache(
    async () => {
      const raw = decodeURIComponent(idParam).trim();
      if (!raw) return null;
      if (/^\d+$/.test(raw)) return raw;

      const escaped = raw.replace(/[%_\\]/g, (ch) => `\\${ch}`);
      const { data: localMatch } = await supabase
        .from("users")
        .select("id")
        .ilike("username", escaped)
        .limit(1)
        .maybeSingle();
      if (localMatch?.id) return String(localMatch.id);

      try {
        const osuUser: any = await osuApiFetch(
          `users/${encodeURIComponent(raw)}?key=username`
        );
        if (osuUser?.id) {
          const { data: knownUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", osuUser.id)
            .maybeSingle();
          if (knownUser?.id) return String(knownUser.id);
        }
      } catch {
        // Unknown osu! username, or the osu! API is unreachable.
      }

      return null;
    },
    ["resolve-user-id", idParam],
    { tags: [`resolve-user:${idParam}`], revalidate: 300 }
  )();
}

// Cached per-user reads. Served from cache for up to 1 day; invalidated on demand
// by revalidateTag(`user:${id}`) / revalidateTag(`skins:user:${id}`) from the
// mutating server actions. Replicates the exact queries from the old
// getServerSideProps in src/pages/users/[id].jsx.
export function getUserProfile(id: string) {
  return unstable_cache(
    async () => {
      const statusData = await supabase
        .from("users")
        .select(
          `id,username,badges:users_badges(created_at,badge:badges(*)),country,banner,skin_view,twitch,twitter,youtube,github,discord,tablet(name,width,height),tabletSettingsFile,tabletFileUploadInfo,keyboard,keyboard_keys`
        )
        .eq("id", id)
        .single();

      const data: any = statusData.data;
      if (!data) return null;

      // Resolve the chosen keyboard/keypad device (no FK, so fetch it directly).
      try {
        if (data.keyboard) {
          const { data: device } = await supabase
            .from("keyboards")
            .select("*")
            .eq("id", data.keyboard)
            .maybeSingle();
          data.keyboardDevice = device ?? null;
        }
      } catch (error) {
        console.log(error);
      }

      try {
        if (data.badges) {
          data.badges = data.badges
            .map((entry: any) => ({
              created_at: entry.created_at,
              ...entry.badge,
            }))
            // Admin-controlled global order (badges.sort_order); nulls last,
            // then by id as a stable fallback.
            .sort((a: any, b: any) => {
              const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
              const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
              if (ao !== bo) return ao - bo;
              return String(a.id).localeCompare(String(b.id));
            });
        }
      } catch (error) {
        console.log(error);
      }

      try {
        data.country = JSON.parse(data.country);
      } catch (error) {}

      return data;
    },
    ["user-profile", id],
    { tags: [`user:${id}`, "badges"], revalidate: 86400 }
  )();
}

export function getUserSkins(id: string) {
  return unstable_cache(
    async () => {
      const { data } = await supabase
        .from("skins")
        .select(
          "id,Name,Creator,Player(id,username),Banner,Modes,Tags,URL,Downloads"
        )
        .eq("Player(id)", id)
        .order("created_at", { ascending: false });
      return data && data.length ? data : [];
    },
    ["user-skins", id],
    { tags: [`skins:user:${id}`], revalidate: 86400 }
  )();
}
