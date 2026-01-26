-- ============================================
-- FIX: Executions 406 Error - Proper RLS Policy
-- ============================================
-- This migration fixes 406 errors when querying executions for workflows
-- with no execution history.
--
-- Root Cause:
-- PostgREST returns 406 (Not Acceptable) when:
-- 1. A query is syntactically valid
-- 2. RLS policy is enabled
-- 3. The query would return rows, but RLS blocks all of them
-- 4. PostgREST can't distinguish between "no rows exist" vs "RLS blocked all rows"
--
-- Solution:
-- Create a helper function that checks workflow access, allowing the RLS policy
-- to be evaluated even when no executions exist. This allows queries to return
-- empty arrays (200 []) instead of 406 errors.
-- ============================================

-- Create a function to check if a user can access executions for a workflow
-- This function is used in the RLS policy to allow queries even when no executions exist
CREATE OR REPLACE FUNCTION public.can_access_workflow_executions(_workflow_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workflows w
    WHERE w.id = _workflow_id
    AND (
      w.user_id = auth.uid()
      OR (w.team_id IS NOT NULL AND public.is_team_member(auth.uid(), w.team_id))
      OR public.has_role(auth.uid(), 'admin')
    )
  )
$$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions;
DROP POLICY IF EXISTS "Users can create executions" ON public.executions;
DROP POLICY IF EXISTS "Users can update own executions" ON public.executions;

-- Recreate SELECT policy using the helper function
-- This allows queries to return empty arrays when no executions exist
-- The policy checks workflow access, not execution existence
CREATE POLICY "Users can view own executions" ON public.executions
  FOR SELECT TO authenticated 
  USING (
    -- Direct ownership via user_id
    user_id = auth.uid()
    OR
    -- Access via workflow ownership (allows queries even when no executions exist)
    public.can_access_workflow_executions(workflow_id)
  );

-- Recreate INSERT policy
-- Allow users to create executions for workflows they own or are team members of
CREATE POLICY "Users can create executions" ON public.executions
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- Must set user_id to current user
    user_id = auth.uid()
    AND
    -- Workflow must belong to user or their team
    public.can_access_workflow_executions(workflow_id)
  );

-- Recreate UPDATE policy
-- Allow users to update executions they created or executions for their workflows
CREATE POLICY "Users can update own executions" ON public.executions
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid() 
    OR public.can_access_workflow_executions(workflow_id)
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR public.can_access_workflow_executions(workflow_id)
  );

-- Add comments explaining the policies
COMMENT ON FUNCTION public.can_access_workflow_executions(UUID) IS 
'Checks if the current user can access executions for a given workflow.
Returns true if:
- User owns the workflow
- User is a team member of the workflow''s team
- User is an admin

This function is used in RLS policies to allow queries even when no executions exist,
preventing 406 errors from PostgREST.';

COMMENT ON POLICY "Users can view own executions" ON public.executions IS 
'Allows authenticated users to query executions for workflows they can access.
This policy uses can_access_workflow_executions() to check workflow access,
allowing queries to return empty arrays (200 []) instead of 406 errors when
no executions exist for accessible workflows.';

COMMENT ON POLICY "Users can create executions" ON public.executions IS 
'Allows authenticated users to create executions for workflows they own or are team members of.
The user_id must be set to the current user, and the workflow must be accessible.';

COMMENT ON POLICY "Users can update own executions" ON public.executions IS 
'Allows authenticated users to update executions they created or executions for workflows they can access.';

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.can_access_workflow_executions(UUID) TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
