# Overlay bundle (consumer spec)

What a stream overlay receives from Akinari Portal for one tournament. Hand this file to
whoever builds an overlay. Portal side: [`tournaments.md`](./tournaments.md).

## Getting it

**Live**

```http
GET https://<portal>/api/overlay/<slug>
x-api-key: <read key>
If-None-Match: "<etag from the previous response>"   (optional)
```

| Status | Meaning |
|---|---|
| `200` | Body = bundle (JSON). Keep the `ETag` header. |
| `304` | Nothing changed since that ETag. |
| `401` | `{"error":"Invalid or missing key."}`: wrong slug, wrong / revoked key. |
| `429` | Rate limited, retry after `Retry-After` seconds. |

The key and slug are on the tournament's **Overlay** tab (key shown once). Never put the key
in a URL. CORS only allows `http://127.0.0.1:*` and `http://localhost:*`: run the overlay
from tosu (`http://127.0.0.1:24050/<overlay>/`) or a local dev server. Fetch on demand (on load / a refresh button) rather than polling; if you poll, every 10 s or
more.

**Offline**: the same JSON downloaded as `bundle.json` from the Overlay tab.

## Schema (v1)

zod source: `src/lib/tournaments/bundle.ts` (also in `tosu-overlay-preset`).

```jsonc
{
  "version": 1,                       // reject anything else
  "updatedAt": "2026-11-04T18:00:00Z",
  "tournament": {
    "slug": "csc2", "name": "Che Sfondo Cup 2", "acronym": "CSC2",
    "teamSize": 3,
    "stages": ["Qualifiers", "RO16", "QF", "SF", "F", "GF"],
    "currentStage": "RO16"            // pool to show by default
  },
  "teams": [{
    "name": "Pasta al dente", "acronym": "PAD",   // acronym optional
    "image": "https://...", "seed": 3,             // optional
    "players": [{ "osuId": 2, "name": "peppy", "country": "AU" }]
  }],
  "pool": {
    "RO16": [{
      "slot": "NM1", "mods": "NM",    // NM HD HR DT FM EZ FL CS TB
      "beatmapId": 4352345, "setId": 123,
      "title": "...", "artist": "...", "version": "Insane", "mapper": "...",
      "sr": 6.12,                     // with the slot's mods
      "bpm": 270, "cs": 4, "ar": 10.3, "od": 9.8,   // with the slot's mods
      "length": 80                    // drain seconds, after DT
    }]
  },
  "qualifiers": {                     // or null
    "qualified": 16,
    "teams": [{
      "team": "Pasta al dente", "seed": 1, "zsum": 4.213, "avgScore": 812345,
      "modSeeds": { "NM": 2, "HR": 1 },
      "maps": { "NM1": { "score": 900000, "placement": 1 } }
    }]
  },
  "casters": [{ "name": "Akinari", "osuId": 2, "country": "IT", "twitch": "akinari" }],
  "theme": { "teamA": "#F25D0D", "teamB": "#0DB5F2" }   // optional, each colour optional
}
```

Notes:
- Match tosu's `tourney.manager.teamName.left/right` against `teams[].name` or `acronym`
  (case-insensitive).
- Images: avatar `https://a.ppy.sh/<osuId>`, cover
  `https://assets.ppy.sh/beatmaps/<setId>/covers/cover.jpg`.
- `qualifiers.teams[].team` is the team name as typed in the scores sheet.
