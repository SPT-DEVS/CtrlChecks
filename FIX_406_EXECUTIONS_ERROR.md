# Fix: 406 (Not Acceptable) Errors on Executions Queries

## Problem

When querying the `executions` table for workflows that have no execution history, you may see 406 (Not Acceptable) errors in the browser console:

```
GET https://your-project.supabase.co/rest/v1/executions?select=started_at,status&workflow_id=eq.{workflow_id}&order=started_at.desc&limit=1 406 (Not Acceptable)
```

## Root Cause

PostgREST (the API layer used by Supabase) returns 406 errors when:
1. A query is syntactically valid
2. Row Level Security (RLS) is enabled
3. The query would return rows, but RLS blocks all of them
4. PostgREST can't distinguish between "no rows exist" vs "RLS blocked all rows"

This is a known limitation of PostgREST when RLS policies check row existence rather than access permissions.

## Solution

The fix involves updating the RLS policy on the `executions` table to use a helper function that checks workflow access permissions, rather than checking execution existence. This allows queries to return empty arrays (200 []) instead of 406 errors when no executions exist for accessible workflows.

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `ctrl_checks/sql_migrations/17_fix_executions_406_rls.sql`
4. Copy the entire contents of the file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Via Supabase CLI

```bash
# Navigate to your project directory
cd ctrl_checks

# Apply the migration
supabase db push
```

Or manually:

```bash
# Connect to your database and run the migration
psql -h your-db-host -U postgres -d postgres -f sql_migrations/17_fix_executions_406_rls.sql
```

### Option 3: Via psql

```bash
psql -h your-db-host -U postgres -d postgres -f sql_migrations/17_fix_executions_406_rls.sql
```

## What the Migration Does

1. **Creates a helper function** `can_access_workflow_executions()` that checks if a user can access executions for a given workflow
   - Returns `true` if the user owns the workflow, is a team member, or is an admin
   - This function is used in RLS policies to allow queries even when no executions exist

2. **Updates the RLS policies** on the `executions` table:
   - **SELECT policy**: Allows users to query executions for workflows they can access, even when no executions exist
   - **INSERT policy**: Allows users to create executions for workflows they own or are team members of
   - **UPDATE policy**: Allows users to update executions they created or executions for their workflows

3. **Grants necessary permissions** to authenticated users to execute the helper function

## Verification

After applying the migration:

1. **Check the function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'can_access_workflow_executions';
   ```

2. **Check the policies are updated**:
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'executions';
   ```

3. **Test the query**:
   - Open your application
   - Navigate to a workflow that has no executions
   - Check the browser console - you should no longer see 406 errors
   - The query should return an empty array (200 []) instead

## Frontend Error Handling

The frontend code already handles 406 errors gracefully:
- `Dashboard.tsx` suppresses 406 errors in the console
- `ExecutionConsole.tsx` treats 406 errors as "no executions yet"
- `Workflows.tsx` handles 406 errors gracefully

However, with this database fix, 406 errors should no longer occur, and queries will return proper empty arrays.

## Additional Notes

- The migration is idempotent (safe to run multiple times)
- It uses `DROP POLICY IF EXISTS` and `CREATE OR REPLACE FUNCTION` to ensure clean updates
- The function is marked as `SECURITY DEFINER` to allow it to access the `auth` schema
- The function is marked as `STABLE` for query optimization

## Related Files

- Migration: `sql_migrations/17_fix_executions_406_rls.sql`
- Previous attempts: `sql_migrations/12_fix_executions_rls_406.sql`, `sql_migrations/16_fix_executions_query_error.sql`
- Frontend error handling: `src/lib/utils.ts` (is406Error function)
- Frontend components: `src/pages/Dashboard.tsx`, `src/components/workflow/ExecutionConsole.tsx`, `src/pages/Workflows.tsx`
