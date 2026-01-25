-- ============================================
-- CTRLCHECKS AI - COMPLETE DATABASE SETUP
-- ============================================
-- This file contains all database schema, migrations, and security policies
-- Run this in Supabase SQL Editor to set up the complete database
-- 
-- IMPORTANT: Run this file FIRST before any other setup files
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================
-- These enums define the allowed values for various fields

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.execution_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
CREATE TYPE public.execution_trigger AS ENUM ('manual', 'webhook', 'schedule');
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- ============================================
-- STEP 2: CREATE CORE TABLES
-- ============================================

-- Profiles table: Stores user profile information
-- Linked to Supabase Auth users via user_id
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table: Stores role assignments (admin, moderator, user)
-- Separate from profiles for security and flexibility
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Teams table: For team collaboration (future feature)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members table: Links users to teams with roles
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Team invitations table: Manages team invitations
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- Workflows table: Stores user-created workflows
-- nodes and edges are stored as JSONB for flexibility
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Workflow nodes (triggers, actions, etc.)
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Connections between nodes
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,  -- Canvas viewport state
  status workflow_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  webhook_url TEXT UNIQUE,  -- Unique webhook URL for triggering workflows
  cron_expression TEXT,  -- For scheduled workflows
  source TEXT CHECK (source IN ('template', 'custom')) DEFAULT 'custom',  -- Whether workflow came from template
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,  -- If copied from template
  template_version INTEGER,  -- Version of template when copied
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow versions table: Version history for workflows
CREATE TABLE public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  viewport JSONB,
  comment TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version)
);

-- Executions table: Stores workflow execution records
-- Tracks status, logs, input/output for each execution
CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,  -- For conversation history tracking
  status execution_status NOT NULL DEFAULT 'pending',
  trigger execution_trigger NOT NULL DEFAULT 'manual',
  input JSONB,  -- Input data for the workflow
  output JSONB,  -- Final output from workflow
  error TEXT,  -- Error message if execution failed
  logs JSONB DEFAULT '[]'::jsonb,  -- Execution logs (node-by-node)
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER  -- Execution duration in milliseconds
);

-- Templates table: Global workflow templates (admin-managed)
-- Users can copy templates to create their own workflows
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- e.g., "AI Chatbots", "Data Processing"
  nodes JSONB NOT NULL,  -- Template workflow nodes
  edges JSONB NOT NULL,  -- Template workflow edges
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_setup_time INTEGER DEFAULT 5,  -- Minutes
  tags TEXT[] DEFAULT '{}',
  preview_image TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,  -- Featured templates shown first
  is_active BOOLEAN NOT NULL DEFAULT true,  -- Active templates visible to users
  use_count INTEGER NOT NULL DEFAULT 0,  -- How many times template was copied
  version INTEGER NOT NULL DEFAULT 1,  -- Auto-increments on update
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API keys table: For programmatic access (future feature)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,  -- Hashed API key
  key_prefix TEXT NOT NULL,  -- First few characters for display
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table: User notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- RLS ensures users can only access their own data

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Function to handle new user signup
-- Automatically creates profile and assigns 'user' role
-- Can read role from signup metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Create profile from auth user data
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Get role from metadata (if provided during signup), default to 'user'
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to increment template version on update
CREATE OR REPLACE FUNCTION public.increment_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment version if nodes or edges changed
  IF (OLD.nodes IS DISTINCT FROM NEW.nodes) OR (OLD.edges IS DISTINCT FROM NEW.edges) THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Function to update template updated_at
CREATE OR REPLACE FUNCTION public.update_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Function to add team owner as member when team is created
CREATE OR REPLACE FUNCTION public.add_owner_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

-- Trigger: Create profile and role when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on team changes
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on workflow changes
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Add owner to team when team is created
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_to_team();

-- Trigger: Auto-increment template version on workflow changes
DROP TRIGGER IF EXISTS template_version_trigger ON public.templates;
CREATE TRIGGER template_version_trigger
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_template_version();

-- Trigger: Update template updated_at
DROP TRIGGER IF EXISTS template_updated_at_trigger ON public.templates;
CREATE TRIGGER template_updated_at_trigger
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_updated_at();

-- ============================================
-- STEP 6: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles policies: Users can view all, update own
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies: Users can view own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Teams policies: Team members can view, admins can manage
DROP POLICY IF EXISTS "Team members can view team" ON public.teams;
CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT TO authenticated 
  USING (public.is_team_member(auth.uid(), id) OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Team admins can update team" ON public.teams;
CREATE POLICY "Team admins can update team" ON public.teams
  FOR UPDATE TO authenticated 
  USING (public.is_team_admin(auth.uid(), id));

DROP POLICY IF EXISTS "Team owner can delete team" ON public.teams;
CREATE POLICY "Team owner can delete team" ON public.teams
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Team members policies
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT TO authenticated 
  USING (public.is_team_member(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
CREATE POLICY "Team admins can add members" ON public.team_members
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_team_admin(auth.uid(), team_id));

-- Workflows policies: Users can manage own workflows, admins can create any
DROP POLICY IF EXISTS "Users can view own workflows" ON public.workflows;
CREATE POLICY "Users can view own workflows" ON public.workflows
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
    OR is_public = true
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users and admins can create workflows" ON public.workflows;
CREATE POLICY "Users and admins can create workflows" ON public.workflows
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can update own workflows" ON public.workflows;
CREATE POLICY "Users can update own workflows" ON public.workflows
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid() 
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can delete own workflows" ON public.workflows;
CREATE POLICY "Users can delete own workflows" ON public.workflows
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Executions policies: Users can view/manage own executions
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions;
CREATE POLICY "Users can view own executions" ON public.executions
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workflows w 
      WHERE w.id = workflow_id 
      AND (w.user_id = auth.uid() OR public.is_team_member(auth.uid(), w.team_id))
    )
  );

DROP POLICY IF EXISTS "Users can create executions" ON public.executions;
CREATE POLICY "Users can create executions" ON public.executions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own executions" ON public.executions;
CREATE POLICY "Users can update own executions" ON public.executions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Templates policies: Users read-only, admins full access
DROP POLICY IF EXISTS "Users can view active templates" ON public.templates;
CREATE POLICY "Users can view active templates" ON public.templates
  FOR SELECT TO authenticated 
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all templates" ON public.templates;
CREATE POLICY "Admins can view all templates" ON public.templates
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create templates" ON public.templates;
CREATE POLICY "Admins can create templates" ON public.templates
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;
CREATE POLICY "Admins can update templates" ON public.templates
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;
CREATE POLICY "Admins can delete templates" ON public.templates
  FOR DELETE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- API keys policies: Users manage own keys
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create API keys" ON public.api_keys;
CREATE POLICY "Users can create API keys" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications policies: Users manage own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: ENABLE REALTIME
-- ============================================
-- Enable real-time subscriptions for live updates

ALTER PUBLICATION supabase_realtime ADD TABLE public.executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Run ADMIN_SETUP.sql to create an admin user
-- 2. Run SAMPLE_DATA.sql to insert template workflows
-- ============================================

