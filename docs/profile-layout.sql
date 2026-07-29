-- Profile layout choice. Run once in the Supabase SQL editor.
-- Until this runs the app falls back to 'rail' for everyone and the setting
-- in /settings silently keeps failing to save, so run it before shipping.

alter table users
  add column if not exists profile_layout text not null default 'rail';

alter table users
  drop constraint if exists users_profile_layout_check;

alter table users
  add constraint users_profile_layout_check
  check (profile_layout in ('rail', 'editorial'));
