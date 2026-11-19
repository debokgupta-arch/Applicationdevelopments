-- LOCAL DEVELOPMENT ONLY. Never run this on a Supabase project.
--
-- Recreates the small set of objects that Supabase provides out of the box, so
-- the same Drizzle migrations and row-level security policies run unchanged
-- against plain Postgres:
--   * roles: anon, authenticated, service_role
--   * schema auth with auth.users and auth.uid()
--   * Supabase's default grants on the public schema
-- Idempotent: safe to run more than once.

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant anon, authenticated, service_role to postgres;

create schema if not exists auth;

-- A subset of Supabase's auth.users: the columns drizzle-orm/supabase's authUsers maps.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table auth.users add column if not exists phone text unique;
alter table auth.users add column if not exists email_confirmed_at timestamptz;
alter table auth.users add column if not exists phone_confirmed_at timestamptz;
alter table auth.users add column if not exists last_sign_in_at timestamptz;
alter table auth.users add column if not exists updated_at timestamptz default now();
-- Same column name Supabase uses. Only the local dev auth backend writes it.
alter table auth.users add column if not exists encrypted_password text;

-- Local dev auth backend: one-time codes and link tokens (hashed). Stands in
-- for Supabase's own OTP / email-link machinery.
create table if not exists auth.dev_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('verify_email', 'verify_mobile', 'login_otp', 'reset_password')),
  destination text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dev_codes_user_purpose_idx on auth.dev_codes (user_id, purpose, created_at desc);

-- Same contract as Supabase: the "sub" claim of the current request's JWT.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    ),
    ''
  )::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
