import {
  getStoredTwitchToken,
  refreshStoredTwitchToken,
} from "../../../lib/twitch";

async function searchChannel(channel, token) {
  return fetch(
    `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(
      channel
    )}&first=1`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Client-Id": `${process.env.TWITCH_CLIENT_ID}`,
      },
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET" || !req.query.channel) {
    return res.status(400).json({ message: "Bad request" });
  }

  try {
    let token = (await getStoredTwitchToken()) || (await refreshStoredTwitchToken());

    let response = await searchChannel(req.query.channel, token);
    if (response.status === 401) {
      // Stored token expired: mint a new one server-side and retry once.
      token = await refreshStoredTwitchToken();
      response = await searchChannel(req.query.channel, token);
    }

    const json = await response.json();
    return res.status(200).json(json.data?.[0] ?? { is_live: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error" });
  }
}
