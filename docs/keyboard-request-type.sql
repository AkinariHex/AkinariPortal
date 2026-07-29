-- Keyboard requests: let the requester say whether it's a keyboard or a keypad.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Kept out of keyboards.sql on purpose: that file re-seeds the device catalog,
-- so re-running it would resurrect devices you deleted.

alter table keyboard_requests
  add column if not exists type text not null default 'keyboard';

alter table keyboard_requests
  drop constraint if exists keyboard_requests_type_check;

alter table keyboard_requests
  add constraint keyboard_requests_type_check
  check (type in ('keyboard', 'keypad'));
