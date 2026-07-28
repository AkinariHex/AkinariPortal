import { NextResponse } from "next/server";
import { refreshStoredTwitchToken } from "@/lib/twitch";

// Internal/cron endpoint to (re)mint the Twitch app token. Fails closed:
// denies unless TWITCH_GENERATE_SECRET is set and matches. The public livestream
// check (checklivestream) self-heals its own token, so clients never call this.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");

  if (
    !process.env.TWITCH_GENERATE_SECRET ||
    secret !== process.env.TWITCH_GENERATE_SECRET
  ) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const token = await refreshStoredTwitchToken();
  if (!token) {
    return NextResponse.json(
      { message: "error creating token" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "token created" });
}
