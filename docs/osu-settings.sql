-- osu! game settings shown on the profile. Run once in the Supabase SQL editor.
-- Safe to re-run.
--
-- Shape of the jsonb is documented in docs/osu-settings.md and enforced by the
-- strict zod schema in src/app/settings/actions.ts. Nothing from the raw osu!
-- config file is ever stored: the browser extracts an allowlist of keys and
-- only the normalized object below reaches the server.

alter table users
  add column if not exists osu_settings jsonb;
