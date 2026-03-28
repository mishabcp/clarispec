-- Performance / latency events for Clarispec (written with service role from app).
-- RLS enabled with no policies: PostgREST anon/authenticated cannot access; service role bypasses RLS.

create table if not exists public.perf_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  kind text not null,
  name text not null,
  duration_ms double precision not null,
  path text,
  method text,
  status integer,
  correlation_id text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists perf_events_created_at_idx on public.perf_events (created_at desc);
create index if not exists perf_events_kind_name_idx on public.perf_events (kind, name);
create index if not exists perf_events_path_idx on public.perf_events (path);

alter table public.perf_events enable row level security;

comment on table public.perf_events is 'App-instrumented timings; insert via service role only.';
