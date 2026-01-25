-- Migration: Update signup trigger to handle role from metadata
-- This allows role to be set during signup via user metadata

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that reads role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Get role from metadata, default to 'user' if not provided or invalid
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'user'::app_role
  );
  
  -- Validate role is valid enum value
  IF user_role NOT IN ('admin', 'moderator', 'user') THEN
    user_role := 'user'::app_role;
  END IF;
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

