-- Admin security hardening migration
-- Run this in Supabase SQL Editor from TOP TO BOTTOM (do not run only the RLS lines).
-- If you see "admin_sessions does not exist", run the CREATE TABLE block below first.

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES superadmins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS admin_sessions_revoked_at_idx ON admin_sessions(revoked_at);

-- Row Level Security (Security Advisor: "RLS Disabled in Public")
-- These tables are only accessed from server code via SUPABASE_SERVICE_ROLE_KEY.
-- The service role bypasses RLS, so admin login/session flows keep working.
-- With RLS enabled and no policies, anon/authenticated clients cannot read/write
-- via PostgREST (blocks direct API/browser access to sensitive rows).
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Only enable RLS on admin_sessions after the table exists (see CREATE TABLE above).
DO $$
BEGIN
  IF to_regclass('public.admin_sessions') IS NOT NULL THEN
    ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
