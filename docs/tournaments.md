# Tournaments

Overlay data for osu! tournament streams. A site admin creates a tournament and gives
osu! users access to it. Hosts enter teams, mappools, qualifier scores and casters (only
ids: names, countries, map metadata and mod-adjusted stats come from the osu! API). The
result is one JSON document, the **tournament bundle**, that tosu overlays built from
`tosu-overlay-preset` read live from the API or from a downloaded `bundle.json`.

Consumer spec (what an overlay sees): [`overlay-bundle.md`](./overlay-bundle.md).

## Setup

1. Run `docs/tournaments.sql` in the Supabase SQL editor (2 tables, RLS on, server only).
2. Deploy. Nothing else: the osu! API uses the existing `OSU_CLIENT_ID` / `OSU_CLIENT_SECRET`
   client-credentials token (`src/lib/osu.js`).

## Roles

| Role | Who | Can |
|---|---|---|
| `admin` | site admin (`users.role = 'admin'`) | everything on every tournament, create / delete, manage access |
| `host` | added by an admin | edit all data, change stage, generate / revoke the overlay key, download |
| `viewer` | added by an admin | read every tab, download `bundle.json` |

Access is stored by osu! id in `tournament_members`, so people can be added before their
first login. No access and "no such tournament" both render a 404.

## Pages

- `/settings` > **New tournament** (admin only, `#tournaments`): name, slug, acronym,
  players per team, stages, and the people who can open it (osu! id or username, host or
  viewer). Members are resolved on osu! before the tournament is created.
- `/tournaments`: my tournaments (all of them for admins).
- `/tournaments/[slug]` tabs:
  - **Overview**: name, acronym, players per team, stages, **current stage** (which pool the
    overlay shows), optional team colours.
  - **Teams**: paste rows `team name, player, player, ...` (osu! ids or usernames; a cell
    starting with `http` is the team image), replace or append; edit acronym / image / seed.
  - **Mappool**: per stage, paste `slot, beatmap id or link`. By default it merges by slot
    (`mergePool.ts`): an existing slot is replaced, a new one added, the rest kept, sorted
    by mod then number; "Replace the whole stage" swaps the stage for the pasted maps. Each
    map has a remove button. Mods come from the slot prefix
    (`NM HD HR DT FM EZ FL CS TB`, anything else is FM). Star rating for HR/DT/EZ/FL comes
    from `POST /beatmaps/{id}/attributes`; CS/AR/OD/BPM/length are adjusted in
    `applyModStats.ts`.
  - **Qualifiers**: paste `team, slot, score`; uses the pool of the stage whose name contains
    "qualif" (or the first stage). Seeding = z-sum (per map z-score, missing score = 0),
    placements per map, per-mod seeds (`computeQualifiers.ts`).
  - **Casters**: paste `name, osu! id/username (optional), twitch (optional)`.
  - **Overlay**: bundle validation, download `bundle.json`, live API URL + slug, generate /
    revoke the read key (shown once, only its sha256 is stored), **Download config**:
    `overlay.config.json` with source (portal / local), API URL and key for the overlay
    folder. Without a key generated in this session, a live config mints a new key.
    "Test" calls the API with a pasted key.
  - **Access** (admin): add / remove members, delete the tournament.

Pasted text can be copied straight from Google Sheets / Excel (tab separated), be CSV, or
be typed with spaces (`NM1 4500604`); names containing spaces need tabs or commas. A
header row is skipped automatically (`parseSheet.ts`).

## Files

| File | Role |
|---|---|
| `docs/tournaments.sql` | Migration. |
| `src/lib/tournaments/bundle.ts` | zod schema of the bundle. **Same file as `tosu-overlay-preset/src/core/schema/bundle.ts`**: edit both, bump `BUNDLE_VERSION` on breaking changes. |
| `src/lib/tournaments/authz.ts` | `getTournamentAccess(slug)`: tournament + role, used by every page and action. |
| `src/lib/tournaments/osuLookup.ts` | `resolvePlayers`, `resolvePoolMap` (osu! API). |
| `src/lib/tournaments/computeQualifiers.ts` | seeding from raw scores. |
| `src/lib/tournaments/buildBundle.ts` | row -> bundle. |
| `src/lib/tournaments/saveTournament.ts` | every write, bumps `updated_at` (the API ETag). |
| `src/app/tournaments/**` | pages + server actions. |
| `src/app/api/overlay/[slug]/route.ts` | live API. |
| `src/components/Tournament*/`, `SheetImport`, `TeamEditRow`, `CopyField`, `CreateTournamentForm` | UI. |
| `scripts/check-tournaments.ts` | self-check of the pure helpers: `npx tsx scripts/check-tournaments.ts`. |

## Live API

`GET /api/overlay/[slug]` with header `x-api-key: <read key>`. Slug and key must match.
Same 401 for missing / wrong key or slug. Rate limits from `src/lib/rateLimit.ts` (60/min
per IP, 30/min per key; overlays call it on load and on the streamer's Refresh data button, no polling by default). CORS allows `http://127.0.0.1:*` and
`http://localhost:*` only (tosu and local dev servers). `ETag` + `If-None-Match` -> 304, so
polling an unchanged tournament transfers nothing.
