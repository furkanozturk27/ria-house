-- ============================================================================
-- Add Client Secret for IDOR Protection
-- ============================================================================
-- 
-- Security Fix: Prevent Insecure Direct Object Reference (IDOR) attacks
-- by requiring a device-bound secret key to access application data
--
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Add client_secret column to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS client_secret UUID;

-- Add index for performance on lookups
CREATE INDEX IF NOT EXISTS idx_applications_client_secret ON public.applications(client_secret);

-- Add comment for documentation
COMMENT ON COLUMN public.applications.client_secret IS 'Device-bound secret key generated client-side to prevent IDOR attacks. Required to access application data.';

-- ============================================================================
-- Security Note
-- ============================================================================
-- 
-- This column stores a UUID generated on the client device (crypto.randomUUID()).
-- When querying applications, both instagram_handle AND client_secret must match.
-- This prevents attackers from accessing other users' data by guessing handles.
--
-- ============================================================================

