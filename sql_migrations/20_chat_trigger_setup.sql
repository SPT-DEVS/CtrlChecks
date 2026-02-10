-- ============================================
-- CHAT TRIGGER DATABASE MIGRATION
-- ============================================
-- This migration sets up the database schema for Chat Trigger functionality
-- Run this file in your Supabase SQL Editor
-- 
-- What this migration does:
-- 1. Adds 'chat' value to execution_trigger enum
-- 2. Ensures 'waiting' status exists in execution_status enum (if not already added)
-- 3. Ensures waiting_for_node_id column exists (if not already added)
--
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- ============================================
-- STEP 1: Add 'chat' to execution_trigger enum
-- ============================================
-- The 'chat' trigger type indicates the execution was triggered by a chat message.
-- NOTE: Must be in a separate transaction from index creation

DO $$
BEGIN
  -- Check if 'chat' value already exists in the execution_trigger enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'chat' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'execution_trigger'
    )
  ) THEN
    -- Add 'chat' value to the enum
    ALTER TYPE execution_trigger ADD VALUE 'chat';
    RAISE NOTICE '✅ Added ''chat'' to execution_trigger enum';
  ELSE
    RAISE NOTICE 'ℹ️ ''chat'' already exists in execution_trigger enum';
  END IF;
END $$;

-- ============================================
-- STEP 2: Ensure 'waiting' exists in execution_status enum
-- ============================================
-- This is required for Chat Trigger to work properly.
-- The 'waiting' status indicates an execution is paused, waiting for chat message.

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
-- STEP 3: Ensure waiting_for_node_id column exists
-- ============================================
-- This column tracks which chat trigger node an execution is waiting for.
-- When a Chat Trigger workflow is activated, execution status becomes 'waiting'
-- and this field stores the chat trigger node ID.

ALTER TABLE executions 
ADD COLUMN IF NOT EXISTS waiting_for_node_id TEXT;

-- Index for fast lookups when finding waiting executions by node ID
CREATE INDEX IF NOT EXISTS idx_executions_waiting_node 
ON executions(waiting_for_node_id) 
WHERE waiting_for_node_id IS NOT NULL;

-- ============================================
-- Migration Complete
-- ============================================
-- The chat trigger functionality should now work properly.
-- You can test it by:
-- 1. Creating a workflow with a Chat Trigger node
-- 2. Activating the workflow
-- 3. Opening the chat URL that appears in the logs
-- 4. Sending messages through the chat interface
