# osu! game settings

Players can publish their in-game osu! settings on their profile, next to the
tablet and keyboard cards. Filled either by importing a config file or by hand.

## Data

`users.osu_settings` (jsonb, nullable). Migration:
[`osu-settings.sql`](./osu-settings.sql), run once in the Supabase SQL editor.

`src/app/users/[id]/data.ts` and `src/app/settings/page.tsx` select the column
through a three-step fallback (`+profile_layout,+osu_settings` ->
`+profile_layout` -> base columns), so an un-run migration degrades instead of
breaking the page, and one missing column does not hide the other.

Shape (every leaf optional, only what is set is stored):

```jsonc
{
  "source": "stable" | "lazer" | "manual",
  "updatedAt": "2026-07-29T22:10:00.000Z",   // written server-side, never trusted from the client
  "display":  { "resolution": { "width": 1920, "height": 1080 }, "windowMode": "fullscreen",
                "letterboxing": true, "letterboxOffset": { "x": 0, "y": 0 },
                "frameLimiter": "240fps", "customFrameLimit": 1000, "refreshRate": 240,
                "renderer": "automatic", "compatibilityMode": false },
  "audio":    { "master": 40, "music": 40, "effects": 80, "offsetMs": -12,
                "ignoreBeatmapHitsounds": false, "useSkinSamples": true },
  "cursor":   { "size": 1.2, "automaticSizing": false, "rawInput": true, "sensitivity": 0.85,
                "mapAbsoluteToWindow": true, "disableButtons": true, "disableWheel": true,
                "confine": "fullscreen", "useSkinCursor": false, "ripples": false },
  "gameplay": { "backgroundDim": 80, "backgroundVideo": true, "storyboard": false,
                "snakingSliders": true, "hitLighting": false, "comboBursts": false,
                "maniaScrollSpeed": 22, "maniaScaleWithBpm": false, "maniaSpeedPerBeatmap": true }
}
```

## Privacy

`osu!.<user>.cfg` contains `Username` and `Password` (hashed) in plaintext, plus
`BeatmapDirectory`, which usually holds the person's real Windows account name.
The file name itself is PII for the same reason - so, unlike the tablet feature,
**no file name is ever stored or displayed**.

Four barriers, in order:

1. **Allowlist at the read.** `parseIni` in `src/lib/osuConfig.ts` drops every key
   outside the allowlist inside its own loop, before the value is assigned
   anywhere. The file is read in the browser and never uploaded.
2. **No file text reaches the output.** Numbers and booleans are re-derived from
   scratch; the only strings the parsers can emit come from fixed enum tables, or
   a tap key matching `/^[A-Za-z0-9]{1,12}$/`. A value from the file has no path
   into the result at all - this is what makes a credential leak structural
   rather than merely unlikely. `assertNoForeignStrings` enforces it on every
   import and throws rather than return anything unrecognized.
3. **Tripwire on the allowlist itself.** `NEVER_READ` lists the credential keys,
   and a module-level check throws at import time if any of them is ever added to
   an allowlist. A future edit that would start reading `Password` fails loudly
   at build time instead of shipping.
4. **Server refuses regardless.** `saveOsuSettings` first rejects any payload
   whose JSON carries a credential key, then validates with a zod schema where
   every level is `.strict()` - an unrecognized key at any depth fails the parse.
   The client-side allowlist is a convenience; barriers 3 and 4 are the guarantee.

What is unavoidable: the file's text exists as a string in browser memory for the
duration of parsing. It is never sent, never logged (the import `catch` does not
touch the content), and is garbage collected right after. Reading a file to parse
it cannot avoid that step.

Users see this in `/settings`: a highlighted note above the import buttons and a
"See exactly what is sent" dialog listing the published fields and the
never-read ones, both generated from `PUBLISHED_FIELDS` / `NEVER_READ_FIELDS` in
`osuConfig.ts` so the copy cannot drift from the code. Both places also carry:

- the **stripped-copy hint**: copy the file, delete the `Username`, `Password`
  and `BeatmapDirectory` lines from the copy, import that. The parser only reads
  settings lines, so a stripped file imports identically. This is the one
  guarantee that does not require trusting this codebase at all, which is why it
  is offered up front rather than buried.
- a line stating that choosing a file is the user's decision and that they take
  responsibility for having uploaded it.

Never imported: `Username`, `Password`, `SavePassword`, `BeatmapDirectory`,
`Skin`, `AudioDevice`, the file name, and every `key*` binding except the three
gameplay keys below.

## What each client can give

lazer splits its config across two files in `%APPDATA%/osu`, so the lazer import
accepts both at once and folds `game.ini` over `framework.ini` (where they
overlap, `game.ini` is what the player sees in the options).

| Group | osu! stable (`osu!.<user>.cfg`) | lazer `framework.ini` | lazer `game.ini` |
| --- | --- | --- | --- |
| Display | full | window mode, resolution, frame limiter, renderer | - |
| Audio | full | volumes | universal offset, ignore beatmap hitsounds |
| Cursor | full | confine cursor | size, auto sizing, mouse buttons and wheel, confine cursor |
| Gameplay | full | - | dim, storyboard, hit lighting, background video |
| Tap keys | `keyOsuLeft` / `keyOsuRight` / `keyOsuSmoke` | - | - |

Still out of reach on lazer: raw input, sensitivity, snaking sliders, combo
bursts, mania scroll speed and the keybinds. Those live in `client.realm`, a
binary Realm database, or in per-ruleset config files.

**`game.ini` is the dangerous one.** It holds `Username` and `Token`, a live
session token (verified in `OsuConfigManager.cs`), so both are in `NEVER_READ`
and neither appears in any allowlist. On stable the equivalents are `Username`
and `Password`.

Two encoding differences that are easy to get wrong, both handled in
`osuConfig.ts`:

- **Volumes**: stable writes `VolumeUniversal = 100` (0-100 int), lazer writes
  `VolumeUniversal = 0.35` (0.0-1.0 double). Reading lazer's as stable's would be
  a silent 100x error. Same story for `DimLevel`: 0-100 on stable, 0.0-1.0 in
  lazer's `game.ini`.
- **Booleans**: stable writes `1`/`0`, lazer writes `True`/`False`.
- **Inverted questions**: lazer's `BeatmapHitsounds` and `PreferNoVideo` are the
  negation of stable's `IgnoreBeatmapSamples` and `Video`.
- **Confine cursor**: stable and `framework.ini` use `Never`/`Fullscreen`/
  `Always`; `game.ini` uses `Never`/`DuringGameplay`/`Always`. Two different
  enums for one setting, so the normalized union carries all four values.
- **`SizeFullscreen = 9999x9999`** is lazer's sentinel for "use the desktop
  resolution", not a resolution. Sizes outside a plausible monitor range are
  dropped, otherwise every lazer import would publish 9999x9999 and be rejected
  by the server schema. Because the file genuinely has no number in that case,
  the form offers a "Use my screen (W x H)" button built from
  `window.screen` times `devicePixelRatio`, and the import toast says why the
  field is empty. The value is a suggestion, editable like any other field.
- Some stable builds write decimals with the OS locale separator
  (`MouseSpeed = 0,85`), so commas are normalized before parsing.

## Frame limiter mapping

The two clients mean different things, so the normalized enum covers both.
Stable caps at an absolute fps; lazer caps at a multiple of the refresh rate.

| stable `FrameSync` | lazer `FrameSync` | stored |
| --- | --- | --- |
| `VSync` | `VSync` | `vsync` |
| `Limit120` | - | `120fps` |
| `Limit240` | - | `240fps` |
| `Custom` (+ `CustomFrameLimit`) | - | `custom` |
| `Unlimited` | `Unlimited` | `unlimited` |
| - | `Limit2x` / `Limit4x` / `Limit8x` | `2x` / `4x` / `8x` |

lazer's list is complete (verified against osu-framework's `FrameSync.cs`).
Stable's is not guaranteed complete: an unrecognized value is **dropped**, never
guessed, and the player can set it by hand.

## Code map

| File | Role |
| --- | --- |
| `src/lib/osuConfig.ts` | Types, allowlists, INI parsing, coercion, normalization |
| `src/app/settings/actions.ts` | `saveOsuSettings` + the strict zod schema |
| `src/components/OsuSettingsForm/OsuSettingsForm.tsx` | Controlled manual editor (sliders, switches, selects) |
| `src/components/OsuSettingsCard/OsuSettingsCard.tsx` | Read-only profile card, renders only what is set |
| `src/components/ui/slider.tsx`, `switch.tsx` | shadcn-style wrappers over the installed `radix-ui` |
| `src/app/settings/SettingsClient.tsx` | Section, import buttons, tap-keys dialog |
| `ProfileSidePanel.tsx`, `ProfileBigCover.tsx` | Third card in the Setup area of both layouts |

## Behaviour notes

- Importing **does not save**. It fills the form so the player sees what is about
  to become public, then presses Save.
- A control never touched stays `undefined` and is not published; the card skips
  it. Groups with nothing set render nothing at all.
- Tap keys from the cfg go to the existing `users.keyboard_keys` through
  `saveKeyboard`, behind a confirmation dialog - never a silent overwrite. The
  dialog passes the currently selected `keyboardId`, because `saveKeyboard`
  writes both columns and would otherwise null the device.
- The profile card is gated on `hasAnySetting`, so having only osu! settings is
  enough to make the Big cover Setup tab appear.
