-- ============================================
-- FORM TRIGGER DATABASE MIGRATION
-- ============================================
-- This migration sets up the database schema for Form Trigger functionality
-- Run this file in your Supabase SQL Editor
-- 
-- What this migration does:
-- 1. Adds 'waiting' value to execution_status enum
-- 2. Adds waiting_for_node_id column to executions table
-- 3. Creates form_submissions table for idempotency and audit trail
-- 4. Creates indexes for performance
-- 5. Sets up optional RLS policies
--
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- ============================================
-- STEP 0: Add 'waiting' to execution_status enum
-- ============================================
-- This is required for Form Trigger to work properly.
-- The 'waiting' status indicates an execution is paused, waiting for form submission.
-- NOTE: Must be in a separate transaction from index creation

DO $$
BEGIN
  -- Check if 'waiting' value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'waiting' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_status'
    )
  ) THEN
    -- Add 'waiting' value to the enum
    ALTER TYPE execution_status ADD VALUE 'waiting';
    RAISE NOTICE '✅ Added ''waiting'' to execution_status enum';
  ELSE
    RAISE NOTICE 'ℹ️ ''waiting'' already exists in execution_status enum';
  END IF;
END $$;

-- ============================================
-- STEP 0b: Add 'form' to execution_trigger enum
-- ============================================
-- The 'form' trigger type indicates the execution was triggered by a form submission.
-- NOTE: Must be in a separate transaction from index creation

DO $$
BEGIN
  -- Check if 'form' value already exists in the execution_trigger enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'form' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_trigger'
    )
  ) THEN
    -- Add 'form' value to the enum
    ALTER TYPE execution_trigger ADD VALUE 'form';
    RAISE NOTICE '✅ Added ''form'' to execution_trigger enum';
  ELSE
    RAISE NOTICE 'ℹ️ ''form'' already exists in execution_trigger enum';
  END IF;
END $$;

-- ============================================
-- STEP 1: Add waiting_for_node_id to executions
-- ============================================
-- This column tracks which form node an execution is waiting for.
-- When a Form Trigger workflow is activated, execution status becomes 'waiting'
-- and this field stores the form node ID.

ALTER TABLE executions 
ADD COLUMN IF NOT EXISTS waiting_for_node_id TEXT;

-- Index for fast lookups when finding waiting executions by node ID
CREATE INDEX IF NOT EXISTS idx_executions_waiting_node 
ON executions(waiting_for_node_id) 
WHERE waiting_for_node_id IS NOT NULL;

-- Composite index for efficient queries when finding waiting executions
-- Used by form-trigger function to find the oldest waiting execution
-- NOTE: Using dynamic SQL to avoid transaction issues with newly added enum values
DO $$
BEGIN
  -- Check if 'waiting' enum exists before creating index
  IF EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'waiting' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_status'
    )
  ) THEN
    -- Create index using dynamic SQL to avoid transaction issues
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_executions_waiting_status'
    ) THEN
      EXECUTE 'CREATE INDEX idx_executions_waiting_status 
               ON executions(workflow_id, status, trigger, waiting_for_node_id) 
               WHERE status = ''waiting''';
      RAISE NOTICE '✅ Created waiting status index';
    ELSE
      RAISE NOTICE 'ℹ️ Index idx_executions_waiting_status already exists';
    END IF;
  ELSE
    RAISE WARNING '❌ Cannot create index: ''waiting'' enum value does not exist. Run enum additions first.';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create form_submissions table
-- ============================================
-- This table stores all form submissions for:
-- 1. Idempotency (preventing duplicate submissions)
-- 2. Audit trail (who submitted what and when)
-- 3. Linking submissions to executions

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE NOT NULL,
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes for form_submissions
-- ============================================

-- Index for idempotency key lookups (prevents duplicate submissions)
-- This is the most critical index for preventing duplicate form submissions
CREATE INDEX IF NOT EXISTS idx_form_submissions_idempotency 
ON form_submissions(idempotency_key);

-- Index for finding submissions by workflow and node
-- Useful for analytics and debugging
CREATE INDEX IF NOT EXISTS idx_form_submissions_workflow_node 
ON form_submissions(workflow_id, node_id);

-- Index for finding submissions by execution
-- Useful for linking submissions to specific executions
CREATE INDEX IF NOT EXISTS idx_form_submissions_execution 
ON form_submissions(execution_id);

-- Index for time-based queries (recent submissions, etc.)
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at 
ON form_submissions(submitted_at DESC);

-- ============================================
-- STEP 4: Optional RLS Policies
-- ============================================
-- Uncomment these if you want users to read their own form submissions
-- Service role has full access automatically

-- Allow users to read their own form submissions
-- CREATE POLICY IF NOT EXISTS "Users can read their own form submissions"
-- ON form_submissions
-- FOR SELECT
-- USING (
--   workflow_id IN (
--     SELECT id FROM workflows WHERE user_id = auth.uid()
--   )
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify everything is set up correctly

-- Check if 'waiting' enum value exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'waiting' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_status'
    )
  ) THEN
    RAISE NOTICE '✅ ''waiting'' enum value exists';
  ELSE
    RAISE WARNING '❌ ''waiting'' enum value NOT found';
  END IF;

  -- Check if 'form' enum value exists
  IF EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'form' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_trigger'
    )
  ) THEN
    RAISE NOTICE '✅ ''form'' enum value exists';
  ELSE
    RAISE WARNING '❌ ''form'' enum value NOT found';
  END IF;
END $$;

-- Check waiting_for_node_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'executions' 
    AND column_name = 'waiting_for_node_id'
  ) THEN
    RAISE NOTICE '✅ waiting_for_node_id column exists';
  ELSE
    RAISE WARNING '❌ waiting_for_node_id column NOT found';
  END IF;
END $$;

-- Check form_submissions table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'form_submissions'
  ) THEN
    RAISE NOTICE '✅ form_submissions table exists';
  ELSE
    RAISE WARNING '❌ form_submissions table NOT found';
  END IF;
END $$;

-- Check indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename IN ('executions', 'form_submissions')
  AND indexname LIKE 'idx_%';
  
  IF index_count >= 5 THEN
    RAISE NOTICE '✅ All indexes created (% indexes found)', index_count;
  ELSE
    RAISE WARNING '❌ Some indexes may be missing (found % indexes, expected at least 5)', index_count;
  END IF;
END $$;

-- ============================================
-- TEST INSERT (Optional - for verification)
-- ============================================
-- Uncomment to test that the table works correctly
-- Then delete the test record

/*
-- Test insert
INSERT INTO form_submissions (
  workflow_id, 
  node_id, 
  execution_id, 
  idempotency_key, 
  form_data
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test_node',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test_key_' || NOW()::text || '_' || random()::text,
  '{"test": "data"}'::jsonb
);

-- Verify insert worked
SELECT 'Test insert successful!' AS status, id, idempotency_key 
FROM form_submissions 
WHERE idempotency_key LIKE 'test_key_%'
ORDER BY created_at DESC 
LIMIT 1;

-- Clean up test record
DELETE FROM form_submissions WHERE idempotency_key LIKE 'test_key_%';
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- You should see success messages above
-- If you see any warnings, check the error messages
-- 
-- Next steps:
-- 1. Test creating a Form Trigger node
-- 2. Add form fields in the node UI
-- 3. Activate workflow (should enter WAITING state)
-- 4. Submit form via public URL
-- 5. Verify execution resumes correctly
-- ============================================

SELECT 
  'Form Trigger Migration Complete!' AS status,
  NOW() AS migrated_at;

