# Akinari Portal API - integration guide

Everything a client needs to read a user's portal profile. This document describes the
contract only: how many commands or features you build on top of it, and what you call
them, is entirely up to you.

## The endpoint

```
POST https://<portal-host>/api/graphql
Content-Type: application/json
Authorization: Bearer <the user's secret key>
```

Body:

```json
{ "query": "...", "variables": { } }
```

`GET` only serves the GraphiQL explorer, and only in development. Always `POST`.

## Authentication

Every request is authenticated with **one end user's secret key**, sent as a Bearer token.
(`x-api-key: <key>` is accepted as an alternative header if a Bearer token is awkward in
your HTTP client.)

The key *is* the identity. The `viewer` query always answers for the account the key
belongs to and for no one else, so you never send a user id, an osu! id, or a username to
it. The one exception is `user(id, username)` (see Schema below): it looks up *any*
account's already-public profile and skins, using your key only to authenticate the
request (identity/rate-limit), not to scope the result.

### Getting the key

The end user generates it on the portal settings page and copies it. Your client receives
it from the user and stores it in **your own** database, keyed by whatever identity your
platform uses. The portal stores nothing about your platform.

Rules to follow when you accept a key:

- Accept it only through a private channel. On a chat platform that means an ephemeral or
  DM-only interaction - if the key can land in a public channel's history, the flow is
  wrong.
- Never echo the key back to the user or print it in a log.
- Validate it once, at the moment you store it, with the cheapest possible query
  (`{ viewer { id username } }`). Store it only if that returns `200`.
- Store it as a secret. Anyone holding it can read that user's profile through this API.

### Rotation and revocation

The user can regenerate or destroy their key on the portal at any time. From that moment
the key you stored returns `401`. Treat a `401` on a previously working key as
"this user is disconnected": delete your stored copy and tell the user to supply a new
one. Do not retry, and do not keep the dead key.

## Schema

```graphql
type Query {
  "The user the API key belongs to. There is no way to read anyone else."
  viewer: Viewer!
  """
  Public profile lookup by id or username. This data is already public on the
  user's profile page, so any valid API key may look up any account — provide
  either id or username. Returns null if no matching account exists.
  """
  user(id: ID, username: String): PublicUser
}

type PublicUser {
  id: ID!
  username: String!
  avatarUrl: String!
  profileUrl: String!
  skinCount: Int!
  totalDownloads: Int!
  skins(
    mode: String
    tag: String
    search: String
    limit: Int = 50
  ): [Skin!]!
}

type Viewer {
  id: ID!                 # osu! user id
  username: String!
  avatarUrl: String!
  bannerUrl: String
  profileUrl: String!     # the user's page on the portal
  country: Country
  playmode: String        # "osu", "taiko", "fruits", "mania"
  socials: Socials!
  badges: [Badge!]!
  tablet: Tablet
  keyboard: Keyboard
  osuSettings: JSON       # the user's osu! game settings, or null
  skinCount: Int!
  totalDownloads: Int!
  skins(
    mode: String          # exact: "osu!standard" | "osu!mania" | "osu!taiko" | "osu!ctb"
    tag: String           # exact, e.g. "current", "lazer", "HD"
    search: String        # case-insensitive, matches name or creator
    limit: Int = 50       # clamped to 1-100
  ): [Skin!]!
}

type Skin {
  id: ID!
  name: String!
  creator: String!
  bannerUrl: String
  url: String!            # download link
  modes: [String!]!
  tags: [String!]!
  downloads: Int!
  createdAt: String       # ISO 8601
  pageUrl: String!        # deep link to the skin on the portal
}

type Country { code: String  name: String }
type Socials { twitch: String  twitter: String  youtube: String  github: String  discord: String }
type Badge   { id: ID!  title: String!  imageUrl: String!  awardedAt: String }
type Tablet  { name: String!  width: Float  height: Float }
type Keyboard { id: ID!  name: String!  brand: String  type: String  keys: [String!]! }

scalar JSON
```

`osuSettings` is a nested JSON object (display, audio, gameplay, mouse, ... - keys are
optional and absent when the user has not published them). Read it defensively.

Available tags: `lazer, current, tournaments, casual, old, aim, stream, tech, reading,
speed, highAR, lowAR, highCS, lowCS, troll, NM, HD, HR, DT, EZ, FL`.

## Examples

Validate a key and identify the account:

```bash
curl -s https://<portal-host>/api/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KEY" \
  -d '{"query":"{ viewer { id username } }"}'
```

```json
{ "data": { "viewer": { "id": "4409070", "username": "Akinari" } } }
```

List skins:

```json
{
  "query": "query Skins($limit: Int) { viewer { username skinCount totalDownloads skins(limit: $limit) { id name creator url modes tags downloads pageUrl } } }",
  "variables": { "limit": 10 }
}
```

```json
{
  "data": {
    "viewer": {
      "username": "Akinari",
      "skinCount": 12,
      "totalDownloads": 3480,
      "skins": [
        {
          "id": "87",
          "name": "- # -",
          "creator": "Akinari",
          "url": "https://drive.google.com/...",
          "modes": ["osu!standard", "osu!mania"],
          "tags": ["current", "lazer", "HD"],
          "downloads": 512,
          "pageUrl": "https://<portal-host>/users/4409070#87"
        }
      ]
    }
  }
}
```

`modes` and `tags` come back as real arrays. Filtering is exact, so
`skins(mode: "osu!mania")` returns only mania skins and `skins(tag: "current")` only the
current one.

Look up someone else's public skins, authenticating with your own key:

```json
{
  "query": "query ($username: String) { user(username: $username) { username skinCount skins(limit: 10) { id name creator url pageUrl } } }",
  "variables": { "username": "SomeOtherPlayer" }
}
```

`user` returns `null` (not an error) if no account matches the given id or username.

Hardware and settings in a single round trip:

```json
{ "query": "{ viewer { tablet { name width height } keyboard { name brand keys } osuSettings } }" }
```

## Errors

| Status | When | What to do |
|---|---|---|
| `401` | Key missing, malformed, wrong, or revoked | Treat the user as disconnected, drop the stored key, ask for a new one. Do not retry. |
| `429` | Rate limited | Wait the number of seconds in the `Retry-After` header, then retry once. |
| `200` with `errors[]` | The query is invalid (unknown field, wrong argument type) | A bug in your query. Fix it; retrying will not help. |
| `200` with `errors[]` and a generic message | Something failed server-side | Internal errors are masked, so the message is never actionable. Retry later or report it - do not parse it. |

A GraphQL response can carry both `data` and `errors`. Check `errors` before using
`data`, and never assume `data.viewer` exists just because the status was `200`.

## Rate limits

- **30 requests per minute per key**
- **60 requests per minute per IP**

These are enforced per server instance and reset when an instance restarts, so do not
treat them as an exact budget. Practical consequences for a client:

- Ask for the fields you actually need. One query with several fields is one request;
  four queries are four.
- Do not poll. Fetch on user action, and cache the result for a short while if the same
  data is needed again immediately.
- Back off on `429` rather than retrying in a loop.
