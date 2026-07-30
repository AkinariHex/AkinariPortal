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

## The preview / 3D model (BLOCKED on Wooting permission)

Current preview = **`src/components/KeyboardView/KeyboardView.tsx`**: a CSS "semi-3D" keycap render
(keypad layout with tapped keys colored, or just the tap keys for layout-less keyboards). If a device
row has `model_url`, it shows that image instead.

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
