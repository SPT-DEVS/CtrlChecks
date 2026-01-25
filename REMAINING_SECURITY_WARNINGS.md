# Remaining Security Warnings - Action Required

After running migrations `13` and `14`, you should have fixed:
- ✅ 4 functions with mutable search_path (including `invoke_scheduled_workflows`)
- ✅ RLS policy on `test_records`

## Remaining Warnings (4)

### 1. Function Search Path Mutable - `invoke_scheduled_workflows`
**Status**: Should be auto-fixed by migration 14

If still showing:
1. Run migration 14 again
2. Check function definition:
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'invoke_scheduled_workflows';
   ```
3. If `SET search_path` is missing, manually add it:
   ```sql
   -- Get current definition first
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'invoke_scheduled_workflows';
   
   -- Then recreate with SET search_path = public
   -- (Copy the definition and add SET search_path = public before AS)
   ```

### 2. Extension in Public - `public.vector`
**Status**: Requires manual migration (destructive)

**Risk Level**: Medium - Moving requires dropping/recreating extension

**Action Required**:
1. Schedule maintenance window
2. Backup all vector columns and indexes
3. Run migration `15_fix_extensions_manual.sql` (uncomment and execute)
4. Restore vector columns from backup

**Alternative**: Accept warning if vector usage is minimal or can be recreated

### 3. Extension in Public - `public.pg_net`
**Status**: Requires manual migration (destructive)

**Risk Level**: Low-Medium - Moving requires dropping/recreating extension

**Action Required**:
1. Schedule maintenance window
2. Backup pg_net configuration
3. Run migration `15_fix_extensions_manual.sql` (uncomment and execute)
4. Restore pg_net configuration from backup

**Alternative**: Accept warning if pg_net usage is minimal

### 4. (Unknown - cut off in screenshot)
Check Security Advisor for the 4th warning.

## Quick Fix Priority

1. **High Priority**: Fix `invoke_scheduled_workflows` (should be auto-fixed)
2. **Medium Priority**: Move extensions (if using vector/pg_net heavily)
3. **Low Priority**: Accept extension warnings (if usage is minimal)

## Verification

After fixes, verify with:

```sql
-- Check all functions have search_path
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '⚠️ NO search_path'
    ELSE '✅ HAS search_path'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('invoke_scheduled_workflows', 'update_job_status', 'start_job', 'add_job_progress_log', 'cleanup_old_jobs')
ORDER BY p.proname;

-- Check extension locations
SELECT 
  e.extname,
  n.nspname as schema,
  CASE 
    WHEN n.nspname = 'public' THEN '⚠️ IN PUBLIC'
    ELSE '✅ OK'
  END as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('vector', 'pg_net');
```
