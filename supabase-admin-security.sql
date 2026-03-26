-- Admin security hardening migration
-- Run this in Supabase SQL Editor.

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
