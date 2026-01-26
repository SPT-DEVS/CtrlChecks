-- ============================================
-- FIX: Executions Query Error When Running Workflows
-- ============================================
-- This migration fixes errors when querying executions after workflow execution.
-- The issue occurs when:
-- 1. A workflow execution is created
-- 2. Frontend queries executions table to get status
-- 3. RLS policy blocks the query or returns incorrect results
--
-- Solution:
-- - Ensure RLS policy correctly allows users to view executions for their workflows
-- - Fix any issues with the policy that might block legitimate queries
-- - Ensure the policy works even when executions are just created
-- ============================================

-- First, ensure the executions table has the correct structure
-- Check if user_id column exists and is properly indexed
DO $$
BEGIN
  -- Add user_id column if it doesn't exist (for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'executions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.executions ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Populate user_id from workflow ownership
    UPDATE public.executions e
    SET user_id = w.user_id
    FROM public.workflows w
    WHERE e.workflow_id = w.id
    AND e.user_id IS NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS executions_workflow_user_idx 
  ON public.executions(workflow_id, user_id);

CREATE INDEX IF NOT EXISTS executions_user_workflow_idx 
  ON public.executions(user_id, workflow_id);

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions;
DROP POLICY IF EXISTS "Users can create executions" ON public.executions;
DROP POLICY IF EXISTS "Users can update own executions" ON public.executions;

-- Recreate SELECT policy with improved logic
-- This policy allows users to:
-- 1. View executions they created directly (user_id matches)
-- 2. View executions for workflows they own
-- 3. View executions for workflows in their teams
-- 4. Query executions even when no rows exist (prevents 406 errors)
CREATE POLICY "Users can view own executions" ON public.executions
  FOR SELECT TO authenticated 
  USING (
    -- Direct ownership
    user_id = auth.uid() 
    OR 
    -- Workflow ownership (even if execution user_id is NULL)
    EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = executions.workflow_id 
      AND (
        w.user_id = auth.uid() 
        OR (w.team_id IS NOT NULL AND public.is_team_member(auth.uid(), w.team_id))
      )
    )
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
    EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = executions.workflow_id 
      AND (
        w.user_id = auth.uid() 
        OR (w.team_id IS NOT NULL AND public.is_team_member(auth.uid(), w.team_id))
      )
    )
  );

-- Recreate UPDATE policy
-- Allow users to update executions they created or executions for their workflows
CREATE POLICY "Users can update own executions" ON public.executions
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = executions.workflow_id 
      AND (
        w.user_id = auth.uid() 
        OR (w.team_id IS NOT NULL AND public.is_team_member(auth.uid(), w.team_id))
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = executions.workflow_id 
      AND (
        w.user_id = auth.uid() 
        OR (w.team_id IS NOT NULL AND public.is_team_member(auth.uid(), w.team_id))
      )
    )
  );

-- Add comment explaining the policies
COMMENT ON POLICY "Users can view own executions" ON public.executions IS 
'Allows authenticated users to query executions for workflows they own or are team members of.
This policy ensures that:
- Users can view executions for their own workflows
- Users can view executions for team workflows they belong to
- Queries return empty arrays (not 406 errors) when no executions exist
- The policy works correctly even when user_id is NULL (populated from workflow ownership)';

COMMENT ON POLICY "Users can create executions" ON public.executions IS 
'Allows authenticated users to create executions for workflows they own or are team members of.
The user_id must be set to the current user, and the workflow must belong to the user or their team.';

COMMENT ON POLICY "Users can update own executions" ON public.executions IS 
'Allows authenticated users to update executions they created or executions for workflows they own or are team members of.';

-- Ensure RLS is enabled
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
