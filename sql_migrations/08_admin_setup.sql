-- ============================================
-- ADMIN USER SETUP
-- ============================================
-- This script helps you set up an admin user
-- Run this AFTER creating a user account through the signup page
-- ============================================

-- ============================================
-- METHOD 1: Find User by Email (Recommended)
-- ============================================
-- Step 1: Find your user ID by email
-- Replace 'your-email@example.com' with YOUR actual email address

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS TO YOUR EMAIL

-- Step 2: Insert admin role for your user
-- Replace 'your-email@example.com' with YOUR actual email
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

-- Step 3: Verify admin role was added
SELECT 
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at as role_created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
ORDER BY ur.created_at DESC;

-- ============================================
-- METHOD 2: Using User ID Directly
-- ============================================
-- If you already know your UUID from Step 1, use this instead:

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('paste-your-uuid-here', 'admin'::app_role)
-- ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

-- ============================================
-- METHOD 3: View All Users and Roles
-- ============================================
-- Use this to see all users and their current roles

SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  COALESCE(
    (SELECT string_agg(ur.role::text, ', ') 
     FROM public.user_roles ur 
     WHERE ur.user_id = u.id),
    'no role'
  ) as roles
FROM auth.users u
ORDER BY u.created_at DESC;

-- ============================================
-- METHOD 4: Set Admin Role for Latest User
-- ============================================
-- Use this if you just created your account and it's the most recent

INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
)
ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify you have admin access:

SELECT 
  ur.user_id,
  u.email,
  ur.role,
  CASE 
    WHEN public.has_role(ur.user_id, 'admin') THEN '✅ Admin access confirmed'
    ELSE '❌ Admin access NOT confirmed'
  END as status
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If admin role is not working:
-- 1. Make sure you signed up first (create account via signup page)
-- 2. Check that the email matches exactly (case-sensitive)
-- 3. Verify the role was inserted: SELECT * FROM user_roles WHERE role = 'admin';
-- 4. Try logging out and back in
-- 5. Check browser console for any errors

-- ============================================
-- REMOVE ADMIN ROLE (if needed)
-- ============================================
-- To remove admin role from a user:

-- DELETE FROM public.user_roles 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
--   AND role = 'admin';

