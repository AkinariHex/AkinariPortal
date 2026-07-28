import { NextResponse } from "next/server";
import {
  getStoredTwitchToken,
  refreshStoredTwitchToken,
} from "@/lib/twitch";

async function searchChannel(channel: string, token: string) {
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

export async function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel");
  if (!channel) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }

  try {
    let token =
      (await getStoredTwitchToken()) || (await refreshStoredTwitchToken());

    let response = await searchChannel(channel, token);
    if (response.status === 401) {
      // Stored token expired: mint a new one server-side and retry once.
      token = await refreshStoredTwitchToken();
      response = await searchChannel(channel, token);
    }

    const json = await response.json();
    return NextResponse.json(json.data?.[0] ?? { is_live: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
