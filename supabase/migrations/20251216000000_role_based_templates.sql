-- Migration: Role-Based Templates System
-- Adds versioning, active status, and workflow template tracking

-- Add new columns to templates table
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS estimated_setup_time INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add template tracking to workflows table
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('template', 'custom')) DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_version INTEGER;

-- Create index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.templates(is_active, category);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON public.workflows(template_id, source);

-- Update RLS policies for templates (read-only for users, full access for admins)
DROP POLICY IF EXISTS "Anyone can view templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can create templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;

-- Users can only view active templates
CREATE POLICY "Users can view active templates" ON public.templates
  FOR SELECT TO authenticated 
  USING (is_active = true);

-- Admins can view all templates
CREATE POLICY "Admins can view all templates" ON public.templates
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create templates
CREATE POLICY "Admins can create templates" ON public.templates
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update templates
CREATE POLICY "Admins can update templates" ON public.templates
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete templates
CREATE POLICY "Admins can delete templates" ON public.templates
  FOR DELETE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to increment template version on update
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

-- Create trigger to auto-increment version
DROP TRIGGER IF EXISTS template_version_trigger ON public.templates;
CREATE TRIGGER template_version_trigger
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_template_version();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS template_updated_at_trigger ON public.templates;
CREATE TRIGGER template_updated_at_trigger
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_updated_at();

-- Create function to get template metadata (for users)
CREATE OR REPLACE FUNCTION public.get_template_metadata(_template_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  estimated_setup_time INTEGER,
  tags TEXT[],
  version INTEGER,
  is_featured BOOLEAN,
  use_count INTEGER,
  preview_image TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.description,
    t.category,
    t.difficulty,
    t.estimated_setup_time,
    t.tags,
    t.version,
    t.is_featured,
    t.use_count,
    t.preview_image
  FROM public.templates t
  WHERE t.id = _template_id
    AND (t.is_active = true OR public.has_role(auth.uid(), 'admin'));
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_template_metadata(UUID) TO authenticated;

