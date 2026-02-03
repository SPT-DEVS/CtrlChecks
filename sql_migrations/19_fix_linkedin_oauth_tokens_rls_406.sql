-- ============================================
-- FIX: LinkedIn OAuth Tokens RLS 406 Error
-- ============================================
-- This migration fixes 406 errors when querying linkedin_oauth_tokens
-- PostgREST returns 406 when RLS blocks all visible rows, even if the query
-- itself is valid (e.g., when no tokens exist for a user yet).
--
-- Root Cause:
-- - When querying linkedin_oauth_tokens for a user with no tokens
-- - RLS policy checks if user can see any tokens
-- - PostgREST returns 406 instead of 200 [] because it can't distinguish
--   between "no rows exist" vs "RLS blocked all rows"
--
-- Solution:
-- - Ensure RLS policy allows queries to return empty arrays
-- - Policy should verify user authentication, not token existence
-- ============================================

-- Drop and recreate the SELECT policy to ensure it allows empty result sets
-- The policy checks user authentication, which allows the query to succeed
-- even when no tokens exist for that user

DROP POLICY IF EXISTS "Users can view own LinkedIn tokens" ON public.linkedin_oauth_tokens;

CREATE POLICY "Users can view own LinkedIn tokens" ON public.linkedin_oauth_tokens
  FOR SELECT TO authenticated 
  USING (
    -- Allow if token belongs to authenticated user
    -- This allows queries to return empty arrays when no tokens exist
    auth.uid() = user_id
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view own LinkedIn tokens" ON public.linkedin_oauth_tokens IS 
'Allows authenticated users to query their own LinkedIn OAuth tokens. This policy allows empty 
result sets when users have no tokens yet, preventing 406 errors from PostgREST.

The policy uses auth.uid() = user_id which allows PostgREST to determine that the query
is valid even when no rows match, returning 200 [] instead of 406.';
