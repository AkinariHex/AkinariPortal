import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseServer";

// Twitch extension frontends are served from *.ext-twitch.tv. Only allow those
// origins instead of a wildcard CORS. Route handlers have no `cors` middleware
// or res object, so CORS is handled manually here.
function getAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    const host = new URL(origin).host;
    if (host === "ext-twitch.tv" || host.endsWith(".ext-twitch.tv")) {
      return origin;
    }
  } catch {
    return null;
  }
  return null;
}

function corsHeaders(allowedOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return headers;
}

async function getSkins(userid: string) {
  const { data, error } = await supabase
    .from("skins")
    .select("id,Name,Creator,Banner,Modes,Tags,URL,Downloads")
    .eq("Player", userid)
    .order("created_at", { ascending: false });

  if (error) {
    return "error";
  }

  return data;
}

export async function OPTIONS(req: Request) {
  const allowedOrigin = getAllowedOrigin(req);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin),
  });
}

export async function GET(req: Request) {
  const allowedOrigin = getAllowedOrigin(req);
  const headers = corsHeaders(allowedOrigin);
  const params = new URL(req.url).searchParams;
  const twitchid = params.get("twitchid");
  const type = params.get("type");

  if (twitchid && type === "check") {
    const { data, error } = await supabase
      .from("users")
      .select("id,username")
      .eq("twitch_id", twitchid);
    if (error) {
      return NextResponse.json({ message: "no connection" }, { headers });
    }

    if (data.length === 1) {
      return NextResponse.json(
        { user: data[0], message: "connected" },
        { headers }
      );
    }

    return NextResponse.json({ message: "no connection" }, { headers });
  }

  if (twitchid && type === "skins") {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("twitch_id", twitchid);

    if (error || data.length === 0) {
      return NextResponse.json({ message: "no connection" }, { headers });
    }

    if (data.length === 1) {
      const skins = await getSkins(data[0].id);
      if (skins === "error") {
        return NextResponse.json({ message: "skin error" }, { headers });
      }
      return NextResponse.json(
        {
          user: data[0].id,
          skins: skins,
          message: "skins retrieved",
        },
        { headers }
      );
    }
  }

  return new NextResponse(null, { headers });
}

export async function POST(req: Request) {
  const allowedOrigin = getAllowedOrigin(req);
  const headers = corsHeaders(allowedOrigin);
  const params = new URL(req.url).searchParams;
  const twitchid = params.get("twitchid");
  const secretkey = params.get("secretkey");
  const type = params.get("type");

  if (twitchid && secretkey && type === "submit") {
    const { error } = await supabase
      .from("users")
      .update({
        twitch_id: twitchid,
      })
      .eq("secret_key", secretkey);

    if (error) {
      return NextResponse.json({ message: "wrong secretkey" }, { headers });
    }

    return NextResponse.json({ message: "connected" }, { headers });
  }

  return new NextResponse(null, { headers });
}
