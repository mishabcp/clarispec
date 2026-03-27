-- Run in Supabase SQL Editor or via CLI migrate.
-- Stores opt-in client + edge diagnostics (no secrets; truncate in app).

create table if not exists public.app_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('client', 'edge', 'server')),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  path text,
  user_agent text,
  release text,
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists app_logs_created_at_idx on public.app_logs (created_at desc);
create index if not exists app_logs_source_created_idx on public.app_logs (source, created_at desc);

alter table public.app_logs enable row level security;

-- PostgREST: no grants to anon/authenticated for this table; inserts use service role in Next API only.
revoke all on public.app_logs from anon, authenticated;
grant select, insert, delete on public.app_logs to service_role;

comment on table public.app_logs is 'Remote diagnostics; insert via Next /api/logs with SUPABASE_SERVICE_ROLE_KEY only.';
