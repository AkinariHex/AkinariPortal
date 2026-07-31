-- Public GraphQL API: hash the user secret key at rest.
-- Run in the Supabase SQL editor. See docs/api-graphql.md.
--
-- Step 1 is safe to re-run and must be run BEFORE deploying. It backfills a
-- digest for every key that already exists, so connected clients keep working
-- without the user doing anything.

alter table users add column if not exists secret_key_hash text;
alter table users add column if not exists secret_key_created_at timestamptz;

-- sha256() is a Postgres builtin (PG 11+). encode(..., 'hex') produces exactly
-- what Node's createHash("sha256").digest("hex") produces in src/lib/apiKey.ts.
update users
  set secret_key_hash = encode(sha256(secret_key::bytea), 'hex'),
      secret_key_created_at = coalesce(secret_key_created_at, now())
  where coalesce(secret_key, '') <> ''
    and secret_key_hash is null;

create unique index if not exists users_secret_key_hash_key
  on users (secret_key_hash)
  where secret_key_hash is not null;

-- Step 2: run ONLY after the deploy is verified (see the checklist in
-- docs/api-graphql.md). Irreversible: after this the plaintext key is gone, and
-- any user who never copied theirs has to generate a new one.
--
-- alter table users drop column secret_key;
