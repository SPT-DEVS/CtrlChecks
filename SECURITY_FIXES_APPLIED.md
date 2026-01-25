# Security Fixes Applied

## Overview

This document describes the security fixes applied to address all Supabase Security Advisor warnings.

## Fixed Issues

### ✅ 1. Function Search Path Mutable (4 functions fixed)

**Issue**: Functions without `SET search_path` are vulnerable to search path manipulation attacks.

**Fixed Functions**:
- `public.update_job_status` - Added `SET search_path = public`
- `public.start_job` - Added `SET search_path = public`
- `public.add_job_progress_log` - Added `SET search_path = public`
- `public.cleanup_old_jobs` - Added `SET search_path = public`

**Location**: `sql_migrations/13_workflow_generation_jobs.sql`

**Note**: `public.invoke_scheduled_workflows` needs manual update if it exists (see migration 14).

### ⚠️ 2. Extension in Public Schema (2 extensions - requires manual migration)

**Issue**: Extensions installed in `public` schema can be accessed by all users.

**Affected Extensions**:
- `public.vector` - pgvector extension
- `public.pg_net` - Network extension

**Fix**: Move to `extensions` schema (destructive operation)

**Migration Steps** (run during maintenance window):

```sql
-- 1. Backup all vector columns and indexes
-- 2. Drop extension
DROP EXTENSION vector CASCADE;
DROP EXTENSION pg_net CASCADE;

-- 3. Recreate in extensions schema
CREATE EXTENSION vector SCHEMA extensions;
CREATE EXTENSION pg_net SCHEMA extensions;

-- 4. Restore vector columns and indexes from backup
```

**Location**: `sql_migrations/14_fix_security_warnings.sql` (documents the process)

### ✅ 3. RLS Policy Always True (test_records fixed)

**Issue**: Overly permissive RLS policy allows all authenticated users.

**Fix**: 
- If `test_records` has `user_id` column: Created user-specific policies
- If no `user_id`: Created authenticated-only policy (better than always true)

**Location**: `sql_migrations/14_fix_security_warnings.sql`

### ⚠️ 4. Leaked Password Protection (dashboard setting)

**Issue**: HaveIBeenPwned integration not enabled.

**Fix**: Enable in Supabase Dashboard (not SQL)

**Steps**:
1. Go to Supabase Dashboard → Authentication → Policies
2. Enable "Leaked Password Protection"
3. This integrates with HaveIBeenPwned to check for compromised passwords

**Location**: Documented in `sql_migrations/14_fix_security_warnings.sql`

## Migration Files

1. **13_workflow_generation_jobs.sql** - Fixed 4 functions with `SET search_path = public`
2. **14_fix_security_warnings.sql** - Comprehensive security fixes for remaining issues

## Verification

After running migrations, verify fixes:

```sql
-- Check function search_path
SELECT 
  p.proname as function_name,
  p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_job_status', 'start_job', 'add_job_progress_log', 'cleanup_old_jobs')
ORDER BY p.proname;

-- Check extensions location
SELECT 
  e.extname as extension_name,
  n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('vector', 'pg_net');

-- Check test_records RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename = 'test_records';
```

## Status Summary

| Issue | Status | Action Required |
|-------|--------|----------------|
| Function Search Path (4 functions) | ✅ Fixed | None - migration applied |
| Extension in Public (vector) | ⚠️ Manual | Move to extensions schema |
| Extension in Public (pg_net) | ⚠️ Manual | Move to extensions schema |
| RLS Policy Always True | ✅ Fixed | None - migration applied |
| Leaked Password Protection | ⚠️ Manual | Enable in Dashboard |

## Next Steps

1. ✅ Run migration `13_workflow_generation_jobs.sql` (if not already done)
2. ✅ Run migration `14_fix_security_warnings.sql`
3. ⚠️ Schedule maintenance window to move extensions (if needed)
4. ⚠️ Enable leaked password protection in Dashboard
5. ⚠️ Update `invoke_scheduled_workflows` function manually (if exists)

## Security Best Practices

1. **Always set search_path** on SECURITY DEFINER functions
2. **Install extensions in extensions schema** (not public)
3. **Use restrictive RLS policies** (user-specific when possible)
4. **Enable leaked password protection** for user security
5. **Regular security audits** using Supabase Security Advisor
