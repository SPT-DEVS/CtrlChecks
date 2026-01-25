-- ============================================
-- Manual Fix: Move Extensions from Public Schema
-- ============================================
-- WARNING: This is a DESTRUCTIVE operation
-- Run during maintenance window with full backups
-- 
-- This migration provides the exact SQL to move extensions
-- but does NOT execute it automatically (too dangerous)
-- ============================================

-- ============================================
-- STEP 1: Backup Current State
-- ============================================
-- Before running, create backups:
-- 1. Backup all tables using vector columns
-- 2. Backup pg_net configuration/data
-- 3. Document all vector indexes and columns

-- ============================================
-- STEP 2: Move vector Extension
-- ============================================
-- Uncomment and run these commands during maintenance window:

/*
-- 1. Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Drop vector extension (this will drop all vector columns and indexes!)
DROP EXTENSION IF EXISTS vector CASCADE;

-- 3. Recreate in extensions schema
CREATE EXTENSION vector SCHEMA extensions;

-- 4. Restore vector columns and indexes from backup
-- (You'll need to recreate these manually or from backup)
*/

-- ============================================
-- STEP 3: Move pg_net Extension
-- ============================================
-- Uncomment and run these commands during maintenance window:

/*
-- 1. Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Drop pg_net extension
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- 3. Recreate in extensions schema
CREATE EXTENSION pg_net SCHEMA extensions;

-- 4. Restore pg_net configuration from backup
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check current extension locations
SELECT 
  e.extname as extension_name,
  n.nspname as schema_name,
  CASE 
    WHEN n.nspname = 'public' THEN '⚠️ IN PUBLIC SCHEMA - NEEDS MIGRATION'
    WHEN n.nspname = 'extensions' THEN '✅ IN EXTENSIONS SCHEMA'
    ELSE 'ℹ️ IN ' || n.nspname || ' SCHEMA'
  END as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('vector', 'pg_net')
ORDER BY e.extname;

-- Check for vector columns (will be dropped when extension is moved)
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  a.attname as column_name,
  format_type(a.atttypid, a.atttypmod) as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE a.atttypid::regtype::text LIKE '%vector%'
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY n.nspname, c.relname, a.attname;

-- ============================================
-- Safe Alternative: Keep Extensions in Public
-- ============================================
-- If moving extensions is too risky, you can:
-- 1. Accept the security warning (extensions in public are less critical)
-- 2. Ensure proper RLS policies are in place
-- 3. Monitor for unauthorized access
-- 
-- The security risk is minimal if:
-- - RLS is enabled on all tables
-- - Service role key is protected
-- - Database access is restricted
