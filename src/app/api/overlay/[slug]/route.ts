import { createHash } from "node:crypto";
import { hashApiKey } from "@/lib/apiKey";
import { clientIp, IP_LIMIT, KEY_LIMIT, limit } from "@/lib/rateLimit";
import supabase from "@/lib/supabaseServer";
import { buildBundle } from "@/lib/tournaments/buildBundle";
import { TOURNAMENT_COLUMNS, type TournamentRow } from "@/lib/tournaments/types";

// Overlay bundle for tosu overlays. Spec: docs/overlay-bundle.md.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_KEY_LENGTH = 16;

// Overlays run from tosu (http://127.0.0.1:24050) or a local dev server.
function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "x-api-key, if-none-match",
    "Access-Control-Expose-Headers": "ETag, Retry-After",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request: Request, status: number, body: unknown, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...corsHeaders(request), "Cache-Control": "no-store", ...extra } });
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = limit(`overlay-ip:${clientIp(request)}`, IP_LIMIT.max, IP_LIMIT.windowMs);
  if (!ip.ok) return json(request, 429, { error: "Rate limit exceeded." }, { "Retry-After": String(ip.retryAfter) });

  const { slug } = await params;
  const key = (request.headers.get("x-api-key") ?? "").trim();
  const unauthorized = () => json(request, 401, { error: "Invalid or missing key." });
  if (key.length < MIN_KEY_LENGTH) return unauthorized();

  const hash = hashApiKey(key);
  const perKey = limit(`overlay-key:${hash}`, KEY_LIMIT.max, KEY_LIMIT.windowMs);
  if (!perKey.ok) return json(request, 429, { error: "Rate limit exceeded." }, { "Retry-After": String(perKey.retryAfter) });

  // Slug AND key must match: a key only ever opens its own tournament.
  const { data } = await supabase
    .from("tournaments")
    .select(TOURNAMENT_COLUMNS)
    .eq("slug", slug)
    .eq("read_key_hash", hash)
    .maybeSingle();
  if (!data) return unauthorized();

  const t = data as TournamentRow;
  const etag = `"${createHash("sha1").update(`${t.slug}:${t.updated_at}`).digest("hex")}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ...corsHeaders(request), ETag: etag } });
  }
  return json(request, 200, buildBundle(t), { ETag: etag });
}
