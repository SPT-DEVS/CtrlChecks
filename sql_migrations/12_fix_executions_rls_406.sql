-- ============================================
-- FIX: Executions RLS 406 Error
-- ============================================
-- This migration fixes 406 errors when querying executions for workflows
-- with no execution history. PostgREST returns 406 when RLS blocks all
-- visible rows, even if the query itself is valid.
--
-- Root Cause:
-- - When querying executions for a workflow with no executions
-- - RLS policy checks if user can see any executions
-- - PostgREST returns 406 instead of 200 [] because it can't distinguish
--   between "no rows exist" vs "RLS blocked all rows"
--
-- Solution:
-- - Ensure RLS policy allows queries to return empty arrays
-- - Policy should verify workflow ownership, not execution existence
-- ============================================

-- Drop and recreate the SELECT policy to ensure it allows empty result sets
-- The policy checks workflow ownership, which allows the query to succeed
-- even when no executions exist for that workflow

DROP POLICY IF EXISTS "Users can view own executions" ON public.executions;

CREATE POLICY "Users can view own executions" ON public.executions
  FOR SELECT TO authenticated 
  USING (
    -- Allow if execution belongs to user directly
    user_id = auth.uid() 
    OR 
    -- OR if the workflow belongs to the user (even if no executions exist yet)
    EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = executions.workflow_id 
      AND (
        w.user_id = auth.uid() 
        OR public.is_team_member(auth.uid(), w.team_id)
      )
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view own executions" ON public.executions IS 
'Allows users to query executions for their workflows. This policy allows empty 
result sets when workflows have no executions, preventing 406 errors from PostgREST.

NOTE: The frontend now handles 406 errors gracefully, treating them as "no executions yet".
This policy ensures the RLS is correctly configured to allow querying executions for
workflows that may not have execution history yet.';
