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
playmode, socials, badges, the tablet with its mapped area, the keyboard setup, osu!
settings, and skins. Never `secret_key`, `secret_key_hash`, `UUID`, `twitch_id`, or the
uploaded tablet settings file itself.

### The tablet and its area

`Tablet` carries the catalog row (`name`, `width`, `height`) and `area`, the region the
player actually maps. `loadTablet` in `src/lib/graphql/schema.ts` reads `area` out of
`users.tabletSettingsFile`, the OpenTabletDriver export, already narrowed on upload to the
one profile the player picked - so the resolvers read `Profiles[0]`, same as
`PlaystyleSection.jsx`. Exposed on both `viewer` and `user(id:/username:)`.

- **Only numbers come out.** `width`, `height`, `x`, `y`, `rotation`, the display region,
  the three toggles, and relative sensitivity. The file is never served: no download link,
  no URL, and no `tabletFileUploadInfo.file` - that is the name of a file on the player's
  machine, and only its timestamp is exposed, as `area.updatedAt`.
- `mode` is derived from `OutputMode`, which older exports write as a bare type name and
  newer ones as `{ Path: ... }`; both are handled, and an unrecognized one gives `null`
  rather than a guess. `relative` is null unless the profile is in relative mode.
- Every field is nullable. A profile that omits a key, or a file from a version that names
  it differently, yields `null` for that field instead of failing the query.
- `area` itself is null when the player published a tablet but never uploaded settings.

### osu! settings

`osuSettings` is a typed object rather than a JSON blob, so a client can select just the
fields it prints. The groups mirror `src/lib/osuConfig.ts` (`display`, `audio`, `cursor`,
`gameplay`) and resolve by name off `users.osu_settings` - the keys already match, because
the zod schema in `src/app/settings/actions.ts` validates that shape on write. `raw`
returns the same object untouched for clients that would rather walk it themselves.

Every leaf is optional and a group is null when the user set nothing in it, which is the
same rule the profile card renders by. Enum-like values stay `String`: `confine` can be
`during-gameplay` and `frameLimiter` `2x`, neither of which is a legal GraphQL enum value.

### The keyboard

`Keyboard` carries the device row (`id`, `name`, `brand`, `type`, `modelUrl`), the tap
keys, the chosen render (`view`), the resolved `layout`, and `switches`. It is exposed on
both `viewer` and `user(id:/username:)` - the profile page shows the same thing publicly.
`loadKeyboard` in `src/lib/graphql/schema.ts` is shared by the two, and only runs when the
field is selected.

- `layout` is one entry per physical key, flattened with its `row` index and `width` in key
  units. Keypads whose keycaps carry no legend are stored with blank labels: those entries
  have `label: null`, a `slot` index and the bound key in `key` (see
  `src/lib/keyboardSlots.ts`, the same helper the UI uses, so the API and the profile can
  never disagree about which key sits where).
- `switches` mirrors `users.keyboard_settings`, validated through `readKeyboardSettings`, so
  a missing or malformed row serves the defaults instead of erroring. `analog` is true only
  for magnetic (hall effect) switches, and every actuation / rapid trigger field is null
  when it is false rather than reporting a number that means nothing.
- Per-key overrides come out twice: as maps under `switches` (`keyActuation`, `keySwitches`)
  and resolved onto each key (`layout[].actuationMm`, `layout[].switchModel`), so a client
  that just renders the board never has to merge them itself.
- Reads of `keyboard_view` / `keyboard_settings` fall back to the older column set until
  `docs/keyboard-settings.sql` has been run; before it, the API serves the default view and
  the default switch settings.

`Modes` and `Tags` are text columns holding a JSON array *string*; the resolvers parse
them, so clients get real arrays and `skins(mode:)` / `skins(tag:)` filter exactly rather
than by substring like the profile UI does.

## Extending it

Add the field to `typeDefs` and a resolver in `src/lib/graphql/schema.ts`. If it needs a
new column, add it to `VIEWER_COLUMNS` in `src/lib/apiKey.ts` - that select is the
allowlist, so a column that is not listed there cannot leak through a resolver by
accident. Columns from a migration that may not have run yet go in the first select of the
fallback chain there (and in `Query.user`'s own chain for the public lookup), never in
`VIEWER_COLUMNS` itself, or every request fails on an un-migrated database. Keep `Skin` free of a `Viewer` back-reference unless you also add depth limiting.
