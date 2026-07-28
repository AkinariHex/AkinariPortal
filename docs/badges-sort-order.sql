-- Global badge display order.
-- Run once in the Supabase SQL editor.

-- 1) Add the column.
alter table badges add column if not exists sort_order integer;

-- 2) Seed the order from when each badge was added (created_at) — you added
--    badges in the intended order over time, so this reproduces it. The only
--    exception is today's LS2026 badges (added out of order): drag just those
--    into place in /admin afterwards (saves instantly).
--    If the badges table has no created_at column, change `order by created_at`
--    to `order by id`.
with ordered as (
  select id, row_number() over (order by created_at) as rn
  from badges
)
update badges b
set sort_order = o.rn
from ordered o
where b.id = o.id;

-- 3) OPTIONAL — set an exact order by hand. Lower number = shown first.
--    Fill in your ids/values, e.g. to place the LS2026 badges right after the
--    matching previous-LS badges. Example (adjust to your real ids/order):
--
-- update badges set sort_order = 10 where id = 'LSAttendee';
-- update badges set sort_order = 11 where id = 'LS26Attendee';
-- update badges set sort_order = 12 where id = 'LSPlayer';
-- update badges set sort_order = 13 where id = 'LS26Player';
-- update badges set sort_order = 14 where id = 'LSRunnerUp';
-- ...
