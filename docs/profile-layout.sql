-- Profile layout choice. Run once in the Supabase SQL editor.
-- Until this runs the app falls back to 'side-panel' for everyone and the
-- setting in /settings silently keeps failing to save, so run it before
-- shipping.

alter table users
  add column if not exists profile_layout text not null default 'side-panel';

alter table users
  drop constraint if exists users_profile_layout_check;

-- Earlier drafts of this file used 'rail' / 'editorial'; migrate any row that
-- was written before the rename, otherwise the check below rejects it.
update users set profile_layout = 'side-panel' where profile_layout = 'rail';
update users set profile_layout = 'big-cover' where profile_layout = 'editorial';

alter table users
  alter column profile_layout set default 'side-panel';

alter table users
  add constraint users_profile_layout_check
  check (profile_layout in ('side-panel', 'big-cover'));
