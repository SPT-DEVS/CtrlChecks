# Fix: Executions Query Error When Running Workflows

## Problem

When running a workflow in the web application, you may encounter an error when querying the `executions` table. The error occurs when:

1. A workflow execution is created
2. The frontend queries the executions table to get the latest execution status
3. The query fails with an error (could be 406, 401, 403, or permission errors)

The error URL pattern:
```
nvrrqvlqnnvlihtlgmzn.supabase.co/rest/v1/executions?select=started_at%2Cstatus&workflow_id=eq.{workflow_id}&order=started_at.desc&limit=1
```

## Root Causes

1. **RLS (Row Level Security) Policy Issues**: The RLS policy might not correctly allow users to view executions for their workflows
2. **Missing user_id Column**: Executions might not have the `user_id` column populated, causing RLS checks to fail
3. **Permission Errors**: The user might not have permission to view executions for the workflow
4. **Timing Issues**: The execution might be created but not yet visible due to RLS policy checks

## Solution

### 1. Apply Database Migration

Run the new migration to fix RLS policies:

```sql
-- File: sql_migrations/16_fix_executions_query_error.sql
```

This migration:
- Ensures the `user_id` column exists and is populated
- Creates proper indexes for better query performance
- Fixes RLS policies to allow users to view executions for their workflows
- Handles team workflows correctly

**To apply the migration:**

1. **Via Supabase Dashboard:**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and paste the contents of `sql_migrations/16_fix_executions_query_error.sql`
   - Run the migration

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

3. **Via psql:**
   ```bash
   psql -h your-db-host -U postgres -d postgres -f sql_migrations/16_fix_executions_query_error.sql
   ```

### 2. Improved Error Handling

The frontend code has been updated to:
- Handle 406 errors gracefully (expected when no executions exist)
- Handle permission errors without breaking the UI
- Provide better error logging for debugging
- Continue working even when execution queries fail

### 3. Verify Your Setup

After applying the migration, verify:

1. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'executions';
   ```

2. **Check policies exist:**
   ```sql
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'executions';
   ```

3. **Test the query:**
   ```sql
   -- Replace with your workflow_id and user_id
   SELECT started_at, status 
   FROM executions 
   WHERE workflow_id = 'your-workflow-id' 
   ORDER BY started_at DESC 
   LIMIT 1;
   ```

## Error Types and Handling

### 406 Error (Not Acceptable)
- **Meaning**: No executions exist for the workflow (expected)
- **Handling**: Treated as empty result set, no error shown
- **Action**: None needed - this is normal for new workflows

### 401/403 Error (Unauthorized/Forbidden)
- **Meaning**: User doesn't have permission to view executions
- **Handling**: Logged for debugging, UI continues to work
- **Action**: Check RLS policies and user permissions

### Permission Denied / RLS Error
- **Meaning**: Row Level Security is blocking access
- **Handling**: Logged for debugging, UI continues to work
- **Action**: Apply the migration to fix RLS policies

### Other Errors
- **Meaning**: Unexpected database or network errors
- **Handling**: Logged with full details for debugging
- **Action**: Check database connection and Supabase status

## Testing

After applying the fix:

1. **Create a new workflow**
2. **Run the workflow**
3. **Check the browser console** - should see no errors
4. **Check the Execution Console** - should show the execution
5. **Check the Dashboard** - should show execution status

## Troubleshooting

### Still Getting Errors?

1. **Check Migration Applied:**
   ```sql
   SELECT version FROM schema_migrations 
   WHERE name = '16_fix_executions_query_error';
   ```

2. **Check User Permissions:**
   - Ensure you're logged in
   - Verify the workflow belongs to you or your team
   - Check if `auth.uid()` returns your user ID

3. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'executions';
   ```

4. **Check Execution Records:**
   ```sql
   SELECT id, workflow_id, user_id, status, started_at 
   FROM executions 
   WHERE workflow_id = 'your-workflow-id' 
   LIMIT 5;
   ```

5. **Check Workflow Ownership:**
   ```sql
   SELECT id, user_id, team_id, name 
   FROM workflows 
   WHERE id = 'your-workflow-id';
   ```

### Common Issues

**Issue**: "Permission denied" errors
- **Solution**: Apply the migration - it fixes RLS policies

**Issue**: "user_id is NULL" errors
- **Solution**: The migration populates user_id from workflow ownership

**Issue**: "is_team_member function not found"
- **Solution**: Ensure migration `01_database_setup.sql` was applied (creates the function)

**Issue**: Queries work in SQL Editor but fail in app
- **Solution**: Check that you're authenticated in the app (Supabase session exists)

## Files Modified

1. **`sql_migrations/16_fix_executions_query_error.sql`** - Database migration to fix RLS
2. **`src/pages/Dashboard.tsx`** - Improved error handling for execution queries
3. **`src/components/workflow/ExecutionConsole.tsx`** - Already has error handling (no changes needed)

## Related Issues

- See `sql_migrations/12_fix_executions_rls_406.sql` for previous 406 error fix
- See `src/lib/utils.ts` for `is406Error()` helper function

## Support

If you continue to experience issues after applying the migration:

1. Check the browser console for detailed error messages
2. Check Supabase logs for database errors
3. Verify all migrations have been applied
4. Ensure you're using the latest code from the repository
