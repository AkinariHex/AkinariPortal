# Public GraphQL API

`POST /api/graphql` lets an external client (a Discord bot, a stream overlay, anything)
read **one** user's public profile, authenticated by that user's secret key. There is no
way to read another user: the key identifies the account and the schema only exposes
`viewer`.

The client-facing spec, the one to hand to whoever writes the bot, is
[`bot-consumer.md`](./bot-consumer.md). This file is the portal side.

## Files

| File | Role |
|---|---|
| `docs/api-graphql.sql` | Migration. Two steps, see below. |
| `src/app/api/graphql/route.ts` | Yoga handler: auth, rate limiting, context. |
| `src/lib/graphql/schema.ts` | SDL + resolvers. |
| `src/lib/apiKey.ts` | `hashApiKey` and `resolveApiKeyUser`. |
| `src/lib/rateLimit.ts` | In-memory sliding window. |

## The key

Minted by `generateApiKey()` in `src/app/settings/actions.ts` with the same
`generate-api-key` uuidv5 scheme as before, but **only the sha256 digest is stored**, in
`users.secret_key_hash`. The raw key is returned to the browser once and never again:
the settings page shows it right after generation, then only "Secret key active" plus the
date from `users.secret_key_created_at`.

`destroyApiKey()` sets both columns to `null` (not `""`, which used to make every key-less
user match a lookup by an empty key).

Consumers resolve a key with `resolveApiKeyUser(raw)`, which rejects anything shorter than
16 characters before it reaches the database. Both the GraphQL route and
`POST /api/twitch/extension` go through it.

## Migration

Run **step 1** of `docs/api-graphql.sql` in the Supabase SQL editor *before* deploying. It
adds the two columns and backfills a digest for every key that already exists, so anything
already connected keeps working with no user action - Postgres
`encode(sha256(key::bytea), 'hex')` produces exactly what `hashApiKey` produces in Node.

Run **step 2** (`alter table users drop column secret_key`) only after verifying the
deploy. It is irreversible: after it, a user who never copied their key must generate a
new one.

Checklist before step 2:

1. An existing key still authenticates against `/api/graphql`.
2. The Twitch extension still links an account.
3. Generating a new key from settings works and the old one stops working.

## Auth and limits

- `Authorization: Bearer <key>`, or `x-api-key: <key>`.
- Missing, malformed and wrong keys all get the same `401` with
  `"Invalid or missing API key."` - nothing tells an attacker which one it was.
- 30 requests/min per key, 60/min per IP. The IP bucket is checked first and is the only
  limit a request with a bad key hits, which is what makes guessing keys expensive.
- `429` carries `Retry-After` in seconds.
- **The limiter is in-process.** On serverless each instance counts on its own and
  everything resets on a cold start, so it stops naive spam, not a distributed attacker.
  Moving to a shared store (Upstash or a Supabase counter) only touches
  `src/lib/rateLimit.ts`.
- `batching: false` and no cycles in the schema (`Skin` has no back-reference to `Viewer`),
  so query depth is bounded by the schema itself and no depth-limit plugin is needed.
- `maskedErrors` is left on, so a Supabase error surfaces as a generic message.

GraphiQL is served in dev only. It loads without a key, but running a query - including
introspection - needs the `Authorization` header set in the GraphiQL headers tab.

## What is exposed

Only what is already on the public profile: id, username, avatar, banner, country,
playmode, socials, badges, tablet (name and dimensions), keyboard and keys, osu! settings,
and skins. Never `secret_key`, `secret_key_hash`, `UUID`, `twitch_id`, or the tablet
settings file fields.

`Modes` and `Tags` are text columns holding a JSON array *string*; the resolvers parse
them, so clients get real arrays and `skins(mode:)` / `skins(tag:)` filter exactly rather
than by substring like the profile UI does.

## Extending it

Add the field to `typeDefs` and a resolver in `src/lib/graphql/schema.ts`. If it needs a
new column, add it to `VIEWER_COLUMNS` in `src/lib/apiKey.ts` - that select is the
allowlist, so a column that is not listed there cannot leak through a resolver by
accident. Keep `Skin` free of a `Viewer` back-reference unless you also add depth limiting.
