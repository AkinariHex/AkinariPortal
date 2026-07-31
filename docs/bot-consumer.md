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
  tablet: Tablet          # same tablet and mapped area the profile shows
  keyboard: Keyboard      # same device and switch setup the profile shows
  osuSettings: OsuSettings # same osu! settings the profile shows
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
  osuSettings: OsuSettings # the user's osu! game settings, or null
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
type Tablet {
  name: String!
  width: Float            # full surface, mm
  height: Float           # full surface, mm
  area: TabletArea        # the mapped area, null when no settings were uploaded
}

type TabletArea {
  mode: String            # "absolute" | "relative"
  width: Float            # mapped area, mm
  height: Float
  x: Float                # centre of the area, mm from the left edge
  y: Float                # centre of the area, mm from the top edge
  rotation: Float         # degrees
  display: TabletDisplayArea       # screen region it maps onto, px
  lockAspectRatio: Boolean
  areaClipping: Boolean
  areaLimiting: Boolean
  relative: TabletRelativeSettings # null in absolute mode
  updatedAt: String       # ISO 8601, when the settings were uploaded
}

type TabletDisplayArea { width: Float  height: Float  x: Float  y: Float  rotation: Float }
type TabletRelativeSettings { xSensitivity: Float  ySensitivity: Float  rotation: Float }

type OsuSettings {
  source: String          # "stable" | "lazer" | "manual"
  updatedAt: String       # ISO 8601
  display: OsuDisplaySettings
  audio: OsuAudioSettings
  cursor: OsuCursorSettings
  gameplay: OsuGameplaySettings
  raw: JSON               # the same settings exactly as stored
}

type OsuDisplaySettings {
  resolution: Resolution
  windowMode: String      # "fullscreen" | "borderless" | "windowed"
  letterboxing: Boolean
  letterboxOffset: Offset # -100 to 100 on each axis
  frameLimiter: String    # "vsync" | "120fps" | "240fps" | "custom" | "unlimited" | "2x" | "4x" | "8x"
  customFrameLimit: Int   # fps, only when frameLimiter is "custom"
  refreshRate: Int
  renderer: String        # "automatic" | "opengl" | "direct3d11" | "vulkan" | "metal"
  compatibilityMode: Boolean
}

type Resolution { width: Int!  height: Int! }
type Offset     { x: Int!  y: Int! }

type OsuAudioSettings {
  master: Int             # 0-100
  music: Int
  effects: Int
  offsetMs: Int           # universal offset
  ignoreBeatmapHitsounds: Boolean
  useSkinSamples: Boolean
}

type OsuCursorSettings {
  size: Float             # 0.1-2
  automaticSizing: Boolean
  rawInput: Boolean
  sensitivity: Float      # 0.1-6, only meaningful with raw input on
  mapAbsoluteToWindow: Boolean
  disableButtons: Boolean
  disableWheel: Boolean
  confine: String         # "never" | "fullscreen" | "during-gameplay" | "always"
  useSkinCursor: Boolean
  ripples: Boolean
}

type OsuGameplaySettings {
  backgroundDim: Int      # 0-100
  backgroundVideo: Boolean
  storyboard: Boolean
  snakingSliders: Boolean
  hitLighting: Boolean
  comboBursts: Boolean
  maniaScrollSpeed: Int   # 1-40
  maniaScaleWithBpm: Boolean
  maniaSpeedPerBeatmap: Boolean
}

type Keyboard {
  id: ID!
  name: String!
  brand: String
  type: String            # "keyboard" | "keypad"
  modelUrl: String        # image of the device, when the catalog has one
  keys: [String!]!        # the keys the user taps with
  view: String!           # how the profile renders it: "instrumented" | "plate"
  layout: [KeyboardKey!]! # every physical key; empty when the catalog has no layout
  switches: SwitchSettings!
}

type KeyboardKey {
  row: Int!               # row index in the layout, from 0
  label: String           # legend on the keycap, null on unlabeled keypad keys
  slot: Int               # position among the unlabeled keys, else null
  key: String             # the key bound here, null when nothing is
  tap: Boolean!           # true when the user taps with it
  width: Float!           # key units: 1 = standard key, 6.25 = spacebar
  actuationMm: Float      # null on digital switches and unbound keys
  switchModel: String     # the per-key switch when set, else the board's
}

type SwitchSettings {
  type: String!           # "mechanical" | "optical" | "magnetic"
  feel: String!           # "linear" | "tactile" | "clicky"
  model: String
  pollingHz: Int!
  analog: Boolean!        # true only for magnetic (hall effect) switches
  travelMm: Float!
  actuationMm: Float      # global actuation point, null when not analog
  rapidTrigger: Boolean!
  rapidTriggerMm: Float   # null when rapid trigger is off
  keyActuation: [KeyActuation!]!   # per-key actuation overrides
  keySwitches: [KeySwitch!]!       # per-key switch overrides
}

type KeyActuation { key: String!  actuationMm: Float! }
type KeySwitch    { key: String!  model: String! }

scalar JSON
```

Every leaf of `osuSettings` and of `tablet.area` is nullable: a setting the user never
touched is absent rather than defaulted, and a whole group is null when nothing in it is
set. Select only the fields the command prints, or take `osuSettings { raw }` for the
whole object in one go (same shape as the typed fields, one JSON blob).

The uploaded tablet settings file is never served - no download link, no file name. Only
the numbers of the profile the user picked come out, under `tablet.area`.

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
{ "query": "{ viewer { tablet { name width height } keyboard { name brand keys } osuSettings { raw } } }" }
```

The tablet with the area the player actually maps:

```json
{ "query": "{ viewer { tablet { name width height area { mode width height x y rotation lockAspectRatio areaClipping areaLimiting display { width height x y } relative { xSensitivity ySensitivity rotation } updatedAt } } } }" }
```

The osu! settings a "settings" command usually prints:

```json
{ "query": "{ viewer { osuSettings { source updatedAt display { resolution { width height } windowMode letterboxing frameLimiter refreshRate renderer } audio { master music effects offsetMs } cursor { size automaticSizing rawInput sensitivity confine } gameplay { backgroundDim backgroundVideo storyboard snakingSliders hitLighting maniaScrollSpeed } } } }" }
```

The full keyboard setup, including the actuation of every key:

```json
{ "query": "{ viewer { keyboard { name brand type keys switches { type feel model analog travelMm actuationMm rapidTrigger rapidTriggerMm keyActuation { key actuationMm } keySwitches { key model } } layout { row label slot key tap width actuationMm switchModel } } } }" }
```

`switches.analog` is the flag to branch on: it is true only for magnetic (hall effect)
switches, and every actuation and rapid trigger field is null when it is false. On keypads
whose keycaps carry no legend, `layout[].label` is null and the key the user taps with is
in `layout[].key`, bound by `slot`. Another account's setup reads the same way through
`user(username: "...") { tablet { ... } keyboard { ... } osuSettings { ... } }` - the three
setup fields exist on `PublicUser` too, since the profile page already shows them.

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
