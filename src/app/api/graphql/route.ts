import { createYoga, createGraphQLError } from "graphql-yoga";
import { resolveApiKeyUser, hashApiKey } from "@/lib/apiKey";
import { clientIp, limit, IP_LIMIT, KEY_LIMIT } from "@/lib/rateLimit";
import {
  schema,
  createSkinsLoader,
  type GraphQLContext,
} from "@/lib/graphql/schema";

// node:crypto and the service-role Supabase client, so no edge runtime. Never
// cached: every response depends on the key in the request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return createGraphQLError("Invalid or missing API key.", {
    extensions: {
      code: "UNAUTHORIZED",
      http: {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      },
    },
  });
}

function tooManyRequests(retryAfter: number) {
  return createGraphQLError("Rate limit exceeded.", {
    extensions: {
      code: "TOO_MANY_REQUESTS",
      http: {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    },
  });
}

function readApiKey(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, ...rest] = authorization.trim().split(/\s+/);
    if (scheme.toLowerCase() === "bearer") return rest.join(" ");
    return null;
  }
  return request.headers.get("x-api-key");
}

function siteOrigin(request: Request): string {
  const configured =
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

const yoga = createYoga<{}, GraphQLContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  // GraphiQL and introspection are a dev convenience; in production this is a
  // machine endpoint only.
  graphiql: process.env.NODE_ENV !== "production",
  batching: false,
  landingPage: false,
  logging: false,
  async context({ request }): Promise<GraphQLContext> {
    // The IP bucket is checked first and is the only limit a request with a bad
    // key ever hits, which is what makes guessing keys expensive.
    const ip = clientIp(request);
    const byIp = limit(`ip:${ip}`, IP_LIMIT.max, IP_LIMIT.windowMs);
    if (!byIp.ok) throw tooManyRequests(byIp.retryAfter);

    const rawKey = readApiKey(request);
    const user = await resolveApiKeyUser(rawKey);
    // Same message whether the key is missing, malformed or wrong.
    if (!user) throw unauthorized();

    const byKey = limit(
      `key:${hashApiKey(rawKey as string).slice(0, 16)}`,
      KEY_LIMIT.max,
      KEY_LIMIT.windowMs
    );
    if (!byKey.ok) throw tooManyRequests(byKey.retryAfter);

    return {
      user,
      origin: siteOrigin(request),
      loadSkins: createSkinsLoader(user.id),
    };
  },
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };
