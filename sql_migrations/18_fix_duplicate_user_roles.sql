-- Fix duplicate user_roles entries
-- This migration removes duplicate role entries, keeping only the highest priority role per user
-- Priority: admin > moderator > user

-- First, create a function to get role priority
CREATE OR REPLACE FUNCTION public.get_role_priority(_role app_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _role
    WHEN 'admin' THEN 3
    WHEN 'moderator' THEN 2
    WHEN 'user' THEN 1
    ELSE 0
  END;
$$;

-- Delete duplicate roles, keeping only the highest priority one for each user
-- This uses a CTE to identify which roles to keep and which to delete
WITH ranked_roles AS (
  SELECT 
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY get_role_priority(role) DESC, created_at DESC
    ) as rn
  FROM public.user_roles
),
roles_to_delete AS (
  SELECT id
  FROM ranked_roles
  WHERE rn > 1
)
DELETE FROM public.user_roles
WHERE id IN (SELECT id FROM roles_to_delete);

-- Drop the temporary function
DROP FUNCTION IF EXISTS public.get_role_priority(app_role);

-- Add a comment explaining the constraint
COMMENT ON TABLE public.user_roles IS 'User roles table. Each user should have only one role (highest priority). Priority: admin > moderator > user';
