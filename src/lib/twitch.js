import supabase from "../config/supabaseClient";

// Fetch a fresh Twitch app-access token (client_credentials). Server-only:
// reads TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET from the environment.
export async function fetchTwitchAppToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const json = await response.json();
  return json.access_token || null;
}

// Read the stored app token from the twitchauth table (single row, id = 1).
export async function getStoredTwitchToken() {
  const { data } = await supabase
    .from("twitchauth")
    .select("access_token")
    .eq("id", 1)
    .single();
  return data?.access_token || null;
}

// Mint a new app token and persist it. Returns the new token (or null on failure).
export async function refreshStoredTwitchToken() {
  const token = await fetchTwitchAppToken();
  if (!token) return null;
  await supabase.from("twitchauth").update({ access_token: token }).eq("id", 1);
  return token;
}
