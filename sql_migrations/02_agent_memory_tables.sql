-- ============================================
-- CtrlChecks AI - Agent & Memory System
-- Migration: Add Agent and Memory Tables
-- ============================================
-- This migration adds support for:
-- 1. Memory sessions and messages (Redis + pgvector hybrid)
-- 2. Agent executions with reasoning tracking
-- 3. Enhanced workflow types (automation, chatbot, agent)
-- ============================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Memory Sessions Table
-- ============================================
-- Stores active memory sessions for workflows
CREATE TABLE public.memory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, session_id)
);

-- Index for fast session lookup
CREATE INDEX memory_sessions_workflow_idx ON public.memory_sessions(workflow_id);
CREATE INDEX memory_sessions_session_idx ON public.memory_sessions(session_id);
CREATE INDEX memory_sessions_user_idx ON public.memory_sessions(user_id);

-- ============================================
-- Memory Messages Table
-- ============================================
-- Stores conversation messages with optional vector embeddings
-- Short-term: Redis (fast, TTL-based)
-- Long-term: PostgreSQL + pgvector (semantic search)
CREATE TABLE public.memory_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (session_id) REFERENCES public.memory_sessions(session_id) ON DELETE CASCADE
);

-- Indexes for memory messages
CREATE INDEX memory_messages_session_idx ON public.memory_messages(session_id);
CREATE INDEX memory_messages_workflow_idx ON public.memory_messages(workflow_id);
CREATE INDEX memory_messages_created_idx ON public.memory_messages(created_at DESC);

-- Vector similarity search index (for semantic search)
-- Using ivfflat for fast approximate nearest neighbor search
CREATE INDEX memory_messages_embedding_idx ON public.memory_messages 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Full-text search index for content
CREATE INDEX memory_messages_content_fts_idx ON public.memory_messages 
USING gin(to_tsvector('english', content));

-- ============================================
-- Agent Executions Table
-- ============================================
-- Tracks agent execution state, reasoning steps, and actions
CREATE TABLE public.agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'stopped')) DEFAULT 'running',
  reasoning_steps JSONB DEFAULT '[]',
  actions_taken JSONB DEFAULT '[]',
  current_state JSONB,
  final_output JSONB,
  goal TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error TEXT,
  iteration_count INTEGER DEFAULT 0,
  max_iterations INTEGER DEFAULT 10
);

-- Indexes for agent executions
CREATE INDEX agent_executions_workflow_idx ON public.agent_executions(workflow_id);
CREATE INDEX agent_executions_session_idx ON public.agent_executions(session_id);
CREATE INDEX agent_executions_status_idx ON public.agent_executions(status);
CREATE INDEX agent_executions_started_idx ON public.agent_executions(started_at DESC);

-- ============================================
-- Update Workflows Table
-- ============================================
-- Add workflow type and configuration columns
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS workflow_type TEXT DEFAULT 'automation' 
  CHECK (workflow_type IN ('automation', 'chatbot', 'agent'));

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS memory_config JSONB DEFAULT '{"type": "hybrid", "ttl": 3600, "maxMessages": 100}';

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{"maxIterations": 10, "reasoningModel": "gpt-4o", "actionModel": "gpt-4o"}';

-- Index for workflow type
CREATE INDEX workflows_type_idx ON public.workflows(workflow_type);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;

-- Memory Sessions Policies
CREATE POLICY "Users can view their own memory sessions"
  ON public.memory_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory sessions"
  ON public.memory_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory sessions"
  ON public.memory_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory sessions"
  ON public.memory_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Memory Messages Policies
CREATE POLICY "Users can view their own memory messages"
  ON public.memory_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_sessions
      WHERE memory_sessions.session_id = memory_messages.session_id
      AND memory_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own memory messages"
  ON public.memory_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memory_sessions
      WHERE memory_sessions.session_id = memory_messages.session_id
      AND memory_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own memory messages"
  ON public.memory_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_sessions
      WHERE memory_sessions.session_id = memory_messages.session_id
      AND memory_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own memory messages"
  ON public.memory_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_sessions
      WHERE memory_sessions.session_id = memory_messages.session_id
      AND memory_sessions.user_id = auth.uid()
    )
  );

-- Agent Executions Policies
CREATE POLICY "Users can view their own agent executions"
  ON public.agent_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = agent_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own agent executions"
  ON public.agent_executions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = agent_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own agent executions"
  ON public.agent_executions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflows
      WHERE workflows.id = agent_executions.workflow_id
      AND workflows.user_id = auth.uid()
    )
  );

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for memory_sessions updated_at
CREATE TRIGGER update_memory_sessions_updated_at
  BEFORE UPDATE ON public.memory_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE public.memory_sessions IS 'Stores active memory sessions for workflows. Each session maintains conversation context.';
COMMENT ON TABLE public.memory_messages IS 'Stores conversation messages with optional vector embeddings for semantic search. Hybrid storage: Redis (short-term) + PostgreSQL (long-term).';
COMMENT ON TABLE public.agent_executions IS 'Tracks agent execution state, reasoning steps, and actions taken during agent workflows.';
COMMENT ON COLUMN public.workflows.workflow_type IS 'Type of workflow: automation (standard), chatbot (conversational), or agent (reasoning-based).';
COMMENT ON COLUMN public.workflows.memory_config IS 'Memory configuration: type (hybrid/redis/vector), TTL, maxMessages.';
COMMENT ON COLUMN public.workflows.agent_config IS 'Agent configuration: maxIterations, reasoningModel, actionModel.';

