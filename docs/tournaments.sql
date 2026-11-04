-- Tournaments: overlay data for tosu overlays (see docs/tournaments.md).
-- Run once in the Supabase SQL editor before deploying the /tournaments pages.

create table if not exists tournaments (
  id            bigint generated always as identity primary key,
  slug          text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name          text not null,
  acronym       text not null default '',
  team_size     int  not null default 2,
  stages        text[] not null default array['Qualifiers']::text[],
  current_stage text not null default 'Qualifiers',
  teams         jsonb not null default '[]'::jsonb,
  pool          jsonb not null default '{}'::jsonb,
  qualifiers    jsonb,
  casters       jsonb not null default '[]'::jsonb,
  theme         jsonb,
  -- sha256 hex of the overlay read key (raw key shown once, like users.secret_key_hash)
  read_key_hash       text unique,
  read_key_created_at timestamptz,
  created_by    text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Access is granted by osu! id, so a host can be added before their first login.
create table if not exists tournament_members (
  tournament_id bigint not null references tournaments(id) on delete cascade,
  user_id       text   not null,
  username      text   not null,
  role          text   not null check (role in ('host', 'viewer')),
  added_at      timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create index if not exists tournament_members_user_idx on tournament_members (user_id);

-- Only the service-role client (server) touches these tables.
alter table tournaments enable row level security;
alter table tournament_members enable row level security;
