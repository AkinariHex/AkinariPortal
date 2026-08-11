-- Labeled API keys: lets admins mint extra, independently revocable keys
-- (e.g. one per external integration) without touching their personal key
-- (users.secret_key_hash, see docs/api-graphql.sql). Run in the Supabase SQL
-- editor. Safe to re-run.

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id numeric not null references users(id) on delete cascade,
  label text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists api_keys_key_hash_key on api_keys (key_hash);
create index if not exists api_keys_user_id_idx on api_keys (user_id);
