-- Keyboard view + switch settings. Run once in the Supabase SQL editor,
-- after docs/keyboards.sql.

-- Which of the two keyboard renders the profile shows.
alter table users add column if not exists keyboard_view text default 'instrumented';

-- Switch setup, shape mirrored by keyboardSettingsSchema in
-- src/lib/keyboardSettings.ts:
--   {
--     "switch_tech": "magnetic",          -- 'mechanical' | 'optical' | 'magnetic'
--     "feel": "linear",                   -- 'linear' | 'tactile' | 'clicky'
--     "switch_model": "Lekker L60",
--     "polling_hz": 1000,
--     "travel_mm": 4,
--     "actuation_mm": 0.4,                -- magnetic (analog) switches only
--     "rapid_trigger": true,
--     "rapid_trigger_mm": 0.2,
--     "key_actuation": { "Z": 0.3, "X": 0.3 },  -- per-key overrides, by label
--     "key_switch": { "Z": "Gateron Magnetic Jade" }  -- per-key switch model
--   }
alter table users add column if not exists keyboard_settings jsonb;

-- Existing rows keep the default view; a null keyboard_settings falls back to
-- DEFAULT_KEYBOARD_SETTINGS in the app, so no backfill is needed.
