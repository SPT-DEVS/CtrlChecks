-- Fix user_roles 406 Error
-- This enables RLS and creates a policy so users can read their own role

-- Enable RLS on user_roles table
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles anon" ON public.user_roles;

-- Create policy: Users can only see their own role (authenticated users)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also allow users to see their role via anon key (for initial signup)
-- This is safe because the policy only allows seeing your own role
CREATE POLICY "Users can view own roles anon"
ON public.user_roles
FOR SELECT
TO anon, authenticated
USING (auth.uid() = user_id);

