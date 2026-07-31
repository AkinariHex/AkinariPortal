# Keyboards / keypads feature

## What exists

- **Table `keyboards`** (device catalog) + **`keyboard_requests`** (user requests), and
  `users.keyboard` (device id) + `users.keyboard_keys` (jsonb `["Z","X"]`). SQL: `docs/keyboards.sql`
  (run it once in Supabase — creates tables, adds columns, adds `vendor_id`/`product_id`, seeds a
  curated device list).
- **Settings**: user picks a device (searchable combobox), picks the keys they tap (click keys on a
  keypad layout, or add keys for layout-less keyboards), Save -> `saveKeyboard` action.
- **Profile**: read-only view of the device + the tapped keys.
- **Admin**: manage the catalog (create/edit/delete devices incl. `layout` JSON, `model_url`,
  `vendor_id`/`product_id`) and review/resolve `keyboard_requests`.
- **WebHID detect**: "Detect device" button uses `navigator.hid.requestDevice({ filters:
  [{ usagePage: 0xFF60 }, { vendorId: 0x31e3 }] })` — matches VIA/QMK raw-HID boards (usage page
  0xFF60) and Wooting (vendor id 0x31e3 = 12771) against the catalog by VID/PID; unmatched -> prefills
  the "Request a keyboard" form. Chromium-only (Chrome/Edge/Opera), HTTPS + user gesture; generic OEM
  keyboards are blocklisted by the browser and cannot be detected.

## The preview (two views, user-picked)

`src/components/KeyboardView/KeyboardView.tsx` renders the device layout in one of two styles, chosen
by the user in Settings and stored in `users.keyboard_view` (SQL: `docs/keyboard-settings.sql`):

- **`instrumented`** (default) - muted board plus a rail listing every tap key with its actuation
  point, rapid trigger and switch model. Tapped keys are filled from the top down to their actuation
  depth (magnetic switches only).
- **`plate`** - physical render: case, plate, keycaps with a skirt, tapped keys lit.

Devices with no `layout` fall back to a single row built from the tap keys, so both views work for
full keyboards that are not in the catalog with a layout. A `model_url` image is shown above the
board instead of replacing it.

## Switch settings

`users.keyboard_settings` (jsonb) holds switch type / feel / model, polling rate, travel, actuation
point, rapid trigger + sensitivity and the **per-key overrides**: `key_actuation` and `key_switch`,
both keyed by key label (boards are often built with a different switch under the keys the user taps
with). Shape and validation: `src/lib/keyboardSettings.ts` (`keyboardSettingsSchema`), reused by the
`saveKeyboard` server action. Actuation and rapid trigger are only offered for **magnetic (hall
effect)** switches - those are the analog ones (`isAnalog`); mechanical and optical are digital. The
per-key switch override is offered whatever the technology.
UI: `src/components/KeyboardSettingsForm/KeyboardSettingsForm.tsx`, with the model picked through
`src/components/SwitchModelCombobox/SwitchModelCombobox.tsx` - a searchable list of known switches
(`SWITCH_MODELS`, filtered by the chosen technology) that is **not** a closed set: typing a model
that is not listed and pressing Enter saves that text.

`saveKeyboard` retries without the two new columns if the migration has not run yet, so the device
and tap keys still save on an un-migrated database.

### Wootility import

The Settings form takes a Wootility profile export (JSON) and maps actuation, rapid trigger +
sensitivity and per-key actuation onto `keyboard_settings`. **There is no public API and no
documented export schema**, so `parseWootilityProfile` reads the field names seen in the wild
(`actuation_point` / `actuation` / `actuationPoint`, `rapid_trigger*`, a `keys` array or map) and
returns null when nothing matches. Values above the switch travel are read as a 0-100 percentage of
it. Tap keys are never overwritten by an import. Talking to the device directly over WebHID would
need Wooting's undocumented config protocol, so it is not attempted.

## 3D model (BLOCKED on Wooting permission)

Goal (user): replicate the Wootility-web keyboard preview for Wooting keyboards/keypads. Findings:
- Wooting's open repo `WootingKb/wooting-design` has **STL/STEP** files under **CERN-OHL-S**
  (copyleft: attribution + share-alike on derivatives). These are CAD, NOT web-ready and have **no
  named per-key meshes**, so coloring individual keys needs STL->GLB conversion + manual key
  segmentation. Wootility's in-app models are not confirmed reusable.
- Wootility web's exact renderer isn't publicly documented (likely a top-down 2D/WebGL per-key view).

### When permission / assets are available — plan to implement
1. Obtain a **`.glb` per supported device** with **named key meshes** (e.g. mesh per keycap, named by
   key label) and a license that permits web use/redistribution (Wooting permission, or commissioned).
   Host them and put the URL in `keyboards.model_url`.
2. Add `three` + `@react-three/fiber` + `@react-three/drei`. Extend `KeyboardView`: when `model_url`
   ends in `.glb`/`.gltf`, render it with react-three-fiber (`<Canvas>` + `useGLTF`), a fixed
   semi-3D camera angle, and **color the meshes whose name matches `tapKeys`** (accent color),
   others neutral. Keep the CSS semi-3D as the fallback for devices without a GLB.
3. Optional: a fuller top-down 2D layout render (SVG) for keyboards that only have a `layout` (no GLB),
   to approximate the Wootility look without 3D assets.

## Sources
- Wooting design files + license: https://github.com/WootingKb/wooting-design (CERN-OHL-S)
- WebHID API: https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
- Chrome keyboard HID blocklist: https://developer.chrome.com/docs/capabilities/hid
- QMK raw HID (usage page 0xFF60): https://docs.qmk.fm/features/rawhid
