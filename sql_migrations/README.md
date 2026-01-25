# SQL Migrations - Organized Database Setup

This folder contains all SQL migration files organized in execution order without duplicates.

## Execution Order

Run these files in order (01 through 11) for a complete database setup:

### 1. `01_database_setup.sql` ⭐ **REQUIRED FIRST**
- **Purpose**: Complete database schema setup
- **Contains**: 
  - All enum types (app_role, workflow_status, execution_status, etc.)
  - Core tables (profiles, user_roles, teams, workflows, executions, templates, etc.)
  - Row Level Security (RLS) policies
  - Helper functions (has_role, is_team_member, etc.)
  - Triggers (handle_new_user, update timestamps, etc.)
- **Run this FIRST** before any other migration

### 2. `02_agent_memory_tables.sql`
- **Purpose**: Add agent and memory system support
- **Contains**:
  - Memory sessions and messages tables
  - Agent executions table
  - Vector embeddings support (pgvector)
  - Workflow type and configuration columns
- **Requires**: `01_database_setup.sql`

### 3. `03_google_oauth_tokens.sql`
- **Purpose**: Add Google OAuth token storage
- **Contains**:
  - google_oauth_tokens table
  - RLS policies for token access
  - Token update triggers
- **Requires**: `01_database_setup.sql`

### 4. `04_form_trigger_setup.sql`
- **Purpose**: Add form trigger functionality
- **Contains**:
  - Add 'waiting' to execution_status enum
  - Add 'form' to execution_trigger enum
  - waiting_for_node_id column
  - form_submissions table
  - Indexes for performance
- **Requires**: `01_database_setup.sql`

### 5. `05_role_based_templates.sql`
- **Purpose**: Add role-based template system
- **Contains**:
  - Template versioning
  - Active/inactive status
  - Template tracking in workflows
  - Template metadata functions
- **Requires**: `01_database_setup.sql`

### 6. `06_update_signup_role_handling.sql`
- **Purpose**: Update signup to handle roles from metadata
- **Contains**:
  - Updated handle_new_user() function
  - Role assignment from signup metadata
- **Requires**: `01_database_setup.sql`

### 7. `07_sample_data.sql` (Optional)
- **Purpose**: Insert sample workflow templates
- **Contains**: Pre-built workflow templates for users
- **Optional**: Only run if you want sample templates
- **Requires**: `01_database_setup.sql`, `05_role_based_templates.sql`

### 8. `08_admin_setup.sql` (Utility Script)
- **Purpose**: Helper script to set up admin users
- **Contains**: Queries to find users and assign admin roles
- **Usage**: Run after creating user accounts via signup
- **Not a migration**: Utility script for manual admin setup
- **Requires**: `01_database_setup.sql`

### 9. `09_comprehensive_templates.sql` (Optional)
- **Purpose**: Add 30 comprehensive workflow templates with 100% node coverage
- **Contains**:
  - Beginner templates (1-10): Teaching core node families
  - Intermediate templates (11-20): Combining concepts
  - Advanced templates (21-30): Complex workflows
  - Covers all 150+ nodes in the platform
- **Note**: This resets and replaces all existing templates
- **Optional**: Only run if you want comprehensive template library
- **Requires**: `01_database_setup.sql`, `05_role_based_templates.sql`

### 10a. `10_advanced_ai_agent_templates.sql` (Optional)
- **Purpose**: Add production-ready AI agent workflow templates
- **Contains**:
  - Customer Support Agent
  - Sales Assistant Agent
  - Data Analysis Agent
  - Content Generation Agent
  - And other advanced AI agent templates
- **Note**: These are fully working, production-ready templates
- **Optional**: Only run if you want advanced AI agent templates
- **Requires**: `01_database_setup.sql`, `05_role_based_templates.sql`, `02_agent_memory_tables.sql`

### 10b. `10_fix_user_roles_rls.sql` (Required if experiencing 406 errors)
- **Purpose**: Fix user_roles 406 error by enabling RLS
- **Contains**:
  - Enable RLS on user_roles table
  - Create policy: "Users can view own roles"
  - Allow both authenticated and anon access for initial signup
- **When to run**: If you're experiencing 406 errors related to user_roles table
- **Requires**: `01_database_setup.sql`

### 11. `11_fix_security_issues.sql` (Recommended)
- **Purpose**: Fix all Supabase security warnings
- **Contains**:
  - Enable RLS on form_submissions table
  - Enable RLS on test_records table (if exists)
  - Fix RLS policy performance issues on agent_executions
  - Fix function search_path security issues
  - Move extensions from public schema where applicable
- **Recommended**: Run this to resolve security warnings in Supabase dashboard
- **Requires**: `01_database_setup.sql`, `02_agent_memory_tables.sql`, `04_form_trigger_setup.sql`

## Quick Start

### Fresh Database Setup
```sql
-- Run in Supabase SQL Editor in this order:
1. 01_database_setup.sql                    ⭐ REQUIRED FIRST
2. 02_agent_memory_tables.sql               ⭐ Required
3. 03_google_oauth_tokens.sql               ⭐ Required
4. 04_form_trigger_setup.sql                ⭐ Required
5. 05_role_based_templates.sql              ⭐ Required
6. 06_update_signup_role_handling.sql       ⭐ Required
7. 10_fix_user_roles_rls.sql                ⭐ Recommended (fixes 406 errors)
8. 11_fix_security_issues.sql               ⭐ Recommended (fixes security warnings)
9. 07_sample_data.sql                       ⚪ Optional (sample templates)
10. 09_comprehensive_templates.sql          ⚪ Optional (30 comprehensive templates)
11. 10_advanced_ai_agent_templates.sql      ⚪ Optional (AI agent templates)
```

**Note**: Files 10a and 10b have the same number prefix. Run `10_fix_user_roles_rls.sql` for security fixes. Run `10_advanced_ai_agent_templates.sql` only if you want AI agent templates.

### After Setup
```sql
-- Set up admin user (replace email):
-- Run: 08_admin_setup.sql
-- Replace 'your-email@example.com' with actual email
```

## Removed Duplicates

The following duplicate files were removed:
- ❌ `APPLY_GOOGLE_SHEETS_MIGRATION.sql` (duplicate of `03_google_oauth_tokens.sql`)
- ❌ `form_trigger_setup_part1.sql` (merged into `04_form_trigger_setup.sql`)
- ❌ `form_trigger_setup_part2.sql` (merged into `04_form_trigger_setup.sql`)
- ❌ `20251207070215_6d88d90b-5112-413a-bf41-753c414177a5.sql` (duplicate of `01_database_setup.sql`)

## Important Notes

### Naming Conflict
- There are two files numbered "10":
  - `10_advanced_ai_agent_templates.sql` - Optional AI agent templates
  - `10_fix_user_roles_rls.sql` - Required security fix
- Both can be run, but `10_fix_user_roles_rls.sql` should be run earlier if you're experiencing 406 errors

### Template Files
- **`07_sample_data.sql`**: Basic sample templates (if you want simple examples)
- **`09_comprehensive_templates.sql`**: 30 comprehensive templates covering all nodes (replaces existing templates)
- **`10_advanced_ai_agent_templates.sql`**: Production-ready AI agent templates
- **Note**: `09_comprehensive_templates.sql` will DELETE all existing templates before inserting new ones

### Safety Features
- All files use `IF NOT EXISTS` where possible for safe re-running
- Enum additions are handled safely with existence checks
- RLS policies are created with `DROP POLICY IF EXISTS` for safety
- Functions and triggers use `CREATE OR REPLACE` for updates

## Verification

After running migrations, verify setup:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'execution_status');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

