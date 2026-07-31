import "server-only";

// Sliding window kept in process memory. On serverless each instance counts on
// its own and everything resets on a cold start, so this stops naive spam
// rather than a distributed attacker. Swapping in a shared store later only
// touches this file.
const buckets = new Map<string, number[]>();

const MAX_BUCKETS = 5000;
const PRUNE_AFTER_MS = 10 * 60 * 1000;

export const KEY_LIMIT = { max: 30, windowMs: 60_000 };
// Wider, and the only limit a request with a wrong key ever hits - which is
// what makes brute-forcing keys expensive.
export const IP_LIMIT = { max: 60, windowMs: 60_000 };

function prune(now: number) {
  for (const [bucket, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > PRUNE_AFTER_MS) {
      buckets.delete(bucket);
    }
  }
}

export function limit(
  bucket: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(bucket) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    buckets.set(bucket, hits);
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  hits.push(now);
  buckets.set(bucket, hits);
  if (buckets.size > MAX_BUCKETS) prune(now);

  return { ok: true, retryAfter: 0 };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
