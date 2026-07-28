import "server-only";
import supabase from "./supabaseServer";

// Move any pending badges for a user into their assigned badges, then clear them.
// This is the "insert pending badges on login" flow.
export async function addPendingBadges(userId: string | number) {
  const { data: pendingBadges } = await supabase
    .from("pending_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (pendingBadges && pendingBadges.length > 0) {
    for (const badge of pendingBadges) {
      await supabase
        .from("users_badges")
        .upsert(
          { user_id: userId, badge_id: badge.badge_id },
          { onConflict: "user_id,badge_id" }
        );
    }

    await supabase.from("pending_badges").delete().eq("user_id", userId);
  }
}

async function insertUser(profile: any) {
  const { error } = await supabase.from("users").insert([
    {
      id: profile.id,
      username: profile.username,
      banner: profile.cover_url,
      country: JSON.stringify(profile.country),
      playmode: profile.playmode,
      discord: profile.discord,
      twitter: profile.twitter,
    },
  ]);

  if (error) {
    console.error(error);
    return;
  }

  await addPendingBadges(profile.id);
}

// Upsert the osu! user on login and sync pending badges.
export async function syncUserOnLogin(profile: any) {
  const player = await supabase.from("users").select("*").eq("id", profile.id);

  if (player.data && player.data.length > 0) {
    const { error } = await supabase
      .from("users")
      .update({
        username: profile.username,
        banner: profile.cover_url,
        country: JSON.stringify(profile.country),
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      return;
    }

    await addPendingBadges(profile.id);
    return;
  }

  await insertUser(profile);
}
