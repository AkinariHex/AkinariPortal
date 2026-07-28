import { refreshStoredTwitchToken } from "../../../lib/twitch";

// Internal/cron endpoint to (re)mint the Twitch app token. Fails closed:
// denies unless TWITCH_GENERATE_SECRET is set and matches. The public livestream
// check (checklivestream) self-heals its own token, so clients never call this.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "method not allowed" });
  }

  if (
    !process.env.TWITCH_GENERATE_SECRET ||
    req.query.secret !== process.env.TWITCH_GENERATE_SECRET
  ) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const token = await refreshStoredTwitchToken();
  if (!token) {
    return res.status(500).json({ message: "error creating token" });
  }

  return res.status(200).json({ message: "token created" });
}
