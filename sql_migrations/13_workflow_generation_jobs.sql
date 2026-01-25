-- ============================================
-- Workflow Generation Jobs Table
-- ============================================
-- Stores async workflow generation jobs processed by worker service
-- Backend creates job, worker processes it, frontend polls status

CREATE TABLE IF NOT EXISTS public.workflow_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job status
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  
  -- Input data
  prompt TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('create', 'edit')) DEFAULT 'create',
  current_workflow JSONB, -- For edit mode
  execution_history JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Output data
  workflow_result JSONB, -- Final workflow JSON (strict schema)
  error_message TEXT,
  error_details JSONB,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_phase TEXT CHECK (current_phase IN ('analyze', 'node_selection', 'workflow_generation', 'node_configuration', 'validation')),
  progress_logs JSONB DEFAULT '[]'::jsonb, -- Array of progress updates
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Worker info
  worker_id TEXT, -- Identifier for worker instance
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Observability
  observability JSONB DEFAULT '{}'::jsonb -- Model load time, inference time, token usage, etc.
);

-- Indexes for efficient querying (create only if they don't exist)
CREATE INDEX IF NOT EXISTS workflow_generation_jobs_user_idx ON public.workflow_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS workflow_generation_jobs_status_idx ON public.workflow_generation_jobs(status);
CREATE INDEX IF NOT EXISTS workflow_generation_jobs_created_idx ON public.workflow_generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_generation_jobs_pending_idx ON public.workflow_generation_jobs(status, created_at) WHERE status = 'pending';

-- Composite index for polling
CREATE INDEX IF NOT EXISTS workflow_generation_jobs_user_status_idx ON public.workflow_generation_jobs(user_id, status, created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE public.workflow_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.workflow_generation_jobs;
CREATE POLICY "Users can view their own jobs"
  ON public.workflow_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own jobs
DROP POLICY IF EXISTS "Users can create their own jobs" ON public.workflow_generation_jobs;
CREATE POLICY "Users can create their own jobs"
  ON public.workflow_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for worker service)
DROP POLICY IF EXISTS "Service role can manage all jobs" ON public.workflow_generation_jobs;
CREATE POLICY "Service role can manage all jobs"
  ON public.workflow_generation_jobs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update job status and progress
CREATE OR REPLACE FUNCTION public.update_job_status(
  job_id UUID,
  new_status TEXT,
  progress_pct INTEGER DEFAULT NULL,
  current_phase TEXT DEFAULT NULL,
  error_msg TEXT DEFAULT NULL,
  workflow_result JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_generation_jobs
  SET 
    status = new_status,
    progress_percentage = COALESCE(progress_pct, progress_percentage),
    current_phase = COALESCE(current_phase, workflow_generation_jobs.current_phase),
    error_message = COALESCE(error_msg, error_message),
    workflow_result = COALESCE(workflow_result, workflow_result),
    finished_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN now() ELSE finished_at END,
    duration_ms = CASE 
      WHEN new_status IN ('completed', 'failed', 'cancelled') AND started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (now() - started_at)) * 1000
      ELSE duration_ms
    END
  WHERE id = job_id;
END;
$$;

-- Function to mark job as started
CREATE OR REPLACE FUNCTION public.start_job(job_id UUID, worker_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_generation_jobs
  SET 
    status = 'processing',
    started_at = now(),
    worker_id = worker_id_param
  WHERE id = job_id AND status = 'pending';
END;
$$;

-- Function to add progress log
CREATE OR REPLACE FUNCTION public.add_job_progress_log(
  job_id UUID,
  log_message TEXT,
  progress_pct INTEGER DEFAULT NULL,
  phase TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_generation_jobs
  SET 
    progress_logs = progress_logs || jsonb_build_object(
      'timestamp', now(),
      'message', log_message,
      'progress', COALESCE(progress_pct, progress_percentage),
      'phase', COALESCE(phase, current_phase)
    ),
    progress_percentage = COALESCE(progress_pct, progress_percentage),
    current_phase = COALESCE(phase, current_phase)
  WHERE id = job_id;
END;
$$;

-- ============================================
-- Cleanup: Delete old completed/failed jobs (older than 7 days)
-- ============================================

-- This can be run as a scheduled job
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.workflow_generation_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND finished_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
