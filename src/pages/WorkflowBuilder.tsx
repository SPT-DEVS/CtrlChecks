import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useWorkflowStore, WorkflowNode } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeTypeDefinition } from '@/components/workflow/nodeTypes';
import WorkflowHeader from '@/components/workflow/WorkflowHeader';
import NodeLibrary from '@/components/workflow/NodeLibrary';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import PropertiesPanel from '@/components/workflow/PropertiesPanel';
import ExecutionConsole from '@/components/workflow/ExecutionConsole';
import DebugPanel from '@/components/workflow/debug/DebugPanel';
import { useDebugStore } from '@/stores/debugStore';
import { Edge } from '@xyflow/react';
import { Json } from '@/integrations/supabase/types';
import { validateAndFixWorkflow } from '@/lib/workflowValidation';

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const { debugNodeId } = useDebugStore();
  const hasAutoRun = useRef(false); // Track if we've already auto-run for this workflow load
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setWorkflowId,
    setWorkflowName,
    setIsDirty,
    resetWorkflow,
    resetAllNodeStatuses,
  } = useWorkflowStore();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  const loadWorkflow = useCallback(async (workflowId: string) => {
    setIsLoading(true);
    try {
      // CRITICAL: Reset state first to prevent stale data
      resetWorkflow();
      // Reset auto-run flag when loading a new workflow
      hasAutoRun.current = false;
      
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      if (data) {
        setWorkflowId(data.id);
        setWorkflowName(data.name);

        // Normalize nodes to ensure they have label, category, icon, etc.
        // This will regenerate all IDs to ensure uniqueness
        const normalized = validateAndFixWorkflow({
          nodes: data.nodes || [],
          edges: data.edges || []
        });

        // CRITICAL: Set nodes and edges atomically to prevent partial state
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        setIsDirty(false);
        
        toast({
          title: 'Workflow loaded',
          description: `Successfully loaded "${data.name}"`,
        });
        
        return true; // Return success indicator
      }
      return false;
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive',
      });
      // Reset on error to prevent corrupted state
      resetWorkflow();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setWorkflowId, setWorkflowName, setNodes, setEdges, setIsDirty, resetWorkflow]);

  // Load workflow if editing - only reset for new workflows
  // CRITICAL: This effect must run whenever the route ID changes
  useEffect(() => {
    if (!user) return; // Wait for auth
    
    // Reset auto-run flag when workflow ID changes
    hasAutoRun.current = false;
    
    if (id && id !== 'new') {
      // Check if we're already loading this workflow to prevent duplicate loads
      const currentWorkflowId = useWorkflowStore.getState().workflowId;
      if (currentWorkflowId !== id) {
        loadWorkflow(id);
      }
    } else if (id === 'new') {
      resetWorkflow();
    }
  }, [id, user, loadWorkflow, resetWorkflow]);

  // Auto-run workflow if autoRun parameter is present (for AI-generated workflows)
  // Note: This useEffect is moved after handleRun definition to avoid initialization order issues

  const handleSave = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const workflowData = {
        name: useWorkflowStore.getState().workflowName,
        nodes: nodes as unknown as Json,
        edges: edges as unknown as Json,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const workflowId = useWorkflowStore.getState().workflowId;

      if (workflowId) {
        const { error } = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', workflowId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workflows')
          .insert(workflowData)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setWorkflowId(data.id);
          navigate(`/workflow/${data.id}`, { replace: true });
        }
      }

      setIsDirty(false);
      toast({
        title: 'Saved',
        description: 'Workflow saved successfully',
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, user, navigate, setWorkflowId, setIsDirty]);

  const handleImportWorkflow = useCallback((workflowData: { name?: string; nodes?: unknown[]; edges?: unknown[] }) => {
    try {
      // Validate workflow structure
      if (!workflowData.nodes || !workflowData.edges) {
        throw new Error('Invalid workflow format: missing nodes or edges');
      }

      // CRITICAL: Reset state first to prevent stale data
      resetWorkflow();

      // Set workflow name
      if (workflowData.name) {
        setWorkflowName(workflowData.name);
      }

      // CRITICAL: Normalize and regenerate IDs to ensure uniqueness
      // This prevents duplicate ID collisions when importing workflows
      const normalized = validateAndFixWorkflow({
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || []
      });

      // Set nodes and edges atomically
      setNodes(normalized.nodes);
      setEdges(normalized.edges);
      setIsDirty(true);

      toast({
        title: 'Success',
        description: 'Workflow imported successfully',
      });
    } catch (error) {
      console.error('Error importing workflow:', error);
      toast({
        title: 'Error',
        description: `Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      // Reset on error to prevent corrupted state
      resetWorkflow();
    }
  }, [setWorkflowName, setNodes, setEdges, setIsDirty, resetWorkflow]);

  const handleRun = useCallback(async (autoSave = false) => {
    const workflowId = useWorkflowStore.getState().workflowId;

    if (nodes.length === 0) {
      toast({
        title: 'No nodes',
        description: 'Add some nodes to your workflow before running',
        variant: 'destructive',
      });
      return;
    }

    // Auto-save if needed and requested
    if (autoSave && (!workflowId || useWorkflowStore.getState().isDirty)) {
      if (!user) return;
      
      try {
        setIsSaving(true);
        const workflowData = {
          name: useWorkflowStore.getState().workflowName,
          nodes: nodes as unknown as Json,
          edges: edges as unknown as Json,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };

        let savedWorkflowId = workflowId;

        if (savedWorkflowId) {
          const { error } = await supabase
            .from('workflows')
            .update(workflowData)
            .eq('id', savedWorkflowId);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('workflows')
            .insert(workflowData)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            savedWorkflowId = data.id;
            setWorkflowId(data.id);
            navigate(`/workflow/${data.id}`, { replace: true });
          }
        }

        setIsDirty(false);
      } catch (error) {
        console.error('Error auto-saving workflow:', error);
        toast({
          title: 'Error',
          description: 'Failed to save workflow before running',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      } finally {
        setIsSaving(false);
      }
    }

    const finalWorkflowId = useWorkflowStore.getState().workflowId;
    if (!finalWorkflowId) {
      toast({
        title: 'Save required',
        description: 'Please save your workflow before running',
        variant: 'destructive',
      });
      return;
    }

    // Verify workflow exists in database before execution
    try {
      const { data: workflowCheck, error: checkError } = await supabase
        .from('workflows')
        .select('id, name, status')
        .eq('id', finalWorkflowId)
        .single();

      if (checkError || !workflowCheck) {
        console.error('[execute-workflow] Workflow not found in database:', checkError);
        toast({
          title: 'Workflow not found',
          description: 'The workflow may not be saved yet. Please save your workflow and try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('[execute-workflow] Workflow verified in database:', { id: workflowCheck.id, name: workflowCheck.name });
    } catch (verifyError) {
      console.error('[execute-workflow] Error verifying workflow:', verifyError);
      toast({
        title: 'Verification error',
        description: 'Could not verify workflow. Please try saving again.',
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Prevent manual execution when schedule is active
    const { workflowScheduler } = await import('@/lib/workflowScheduler');
    if (workflowScheduler.isScheduled(finalWorkflowId)) {
      toast({
        title: 'Schedule is active',
        description: 'Manual Run is disabled when a schedule is active. The workflow is running automatically.',
        variant: 'default',
      });
      return;
    }

    // Check if workflow has a form trigger node
    const formNode = nodes.find((node: any) => node.data?.type === 'form');
    const testInput: any = {};

    if (formNode) {
      // For Form Trigger nodes, check if workflow is active
      try {
        const { data: workflowData, error: workflowError } = await supabase
          .from('workflows')
          .select('status')
          .eq('id', finalWorkflowId)
          .single();

        if (workflowError) {
          console.error('Error checking workflow status:', workflowError);
          toast({
            title: 'Error',
            description: 'Failed to check workflow status. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        if (!workflowData) {
          console.error('Workflow data not found');
          toast({
            title: 'Error',
            description: 'Workflow not found',
            variant: 'destructive',
          });
          return;
        }

        const isActive = workflowData.status === 'active';
        console.log('Workflow status check:', { workflowId: finalWorkflowId, status: workflowData.status, isActive });
        const formUrl = `${window.location.origin}/form/${finalWorkflowId}/${formNode.id}`;

        if (!isActive) {
          // Workflow is not active - show activation message
          toast({
            title: 'Form Trigger Detected',
            description: `Form Trigger is a blocking trigger. Activate the workflow to start waiting for form submissions. Form URL: ${formUrl}`,
            duration: 10000,
          });

          // Expand console to show form URL
          if (!consoleExpanded) {
            setConsoleExpanded(true);
          }

          // Don't execute workflow manually - Form Trigger must wait for submission
          // User should activate workflow instead, which will put execution in WAITING state
          return;
        } else {
          // Workflow is active - create a waiting execution
          toast({
            title: 'Form Trigger Active',
            description: 'Workflow is active and waiting for form submissions. Creating waiting execution...',
          });

          // Expand console to show the waiting execution
          if (!consoleExpanded) {
            setConsoleExpanded(true);
          }

          // For active form triggers, call execute-workflow which will handle creating the waiting execution
          // The execute-workflow function detects form triggers and sets status to 'waiting'
          setIsRunning(true);
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const response = await fetch(`${ENDPOINTS.itemBackend}/api/execute-workflow`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(sessionData?.session?.access_token
                  ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                  : {}),
              },
              body: JSON.stringify({
                workflowId: finalWorkflowId,
                input: {},
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Failed to start workflow' }));
              const errorMessage = errorData.error || errorData.message || 'Failed to start workflow';
              const errorDetails = errorData.details ? ` Details: ${errorData.details}` : '';
              console.error('[execute-workflow] Error response:', errorData);
              throw new Error(`${errorMessage}${errorDetails}`);
            }

            toast({
              title: 'Waiting for Form Submission',
              description: `Workflow is now active and waiting for form submissions. Form URL: ${formUrl}`,
              duration: 8000,
            });
          } catch (error) {
            console.error('Error invoking execute-workflow:', error);
            toast({
              title: 'Error',
              description: `Failed to start workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: 'destructive',
            });
          } finally {
            setIsRunning(false);
          }

          return;
        }
      } catch (error) {
        console.error('Error checking workflow status:', error);
        toast({
          title: 'Error',
          description: 'Failed to check workflow status',
          variant: 'destructive',
        });
        return;
      }
    }

    // Reset all node statuses to 'idle' before starting new execution
    resetAllNodeStatuses();

    setIsRunning(true);
    // Expand console to show logs
    if (!consoleExpanded) {
      setConsoleExpanded(true);
    }

    toast({
      title: 'Running workflow',
      description: 'Execution started...',
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/api/execute-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          workflowId: finalWorkflowId,
          input: {
            ...testInput,
            _trigger: 'manual',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Execution failed' }));
        const errorMessage = errorData.error || errorData.message || 'Execution failed';
        const errorDetails = errorData.details ? ` Details: ${errorData.details}` : '';
        console.error('[execute-workflow] Error response:', errorData);
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();

      // Force refresh execution console to show new execution immediately
      // The realtime subscription will handle updates, but we trigger a refresh for immediate feedback
      setTimeout(() => {
        // Trigger a refresh by dispatching a custom event that ExecutionConsole can listen to
        window.dispatchEvent(new CustomEvent('workflow-execution-started', { 
          detail: { executionId: data.executionId, workflowId: finalWorkflowId } 
        }));
      }, 500);

      toast({
        title: data.status === 'success' ? 'Execution complete' : data.status === 'waiting' ? 'Waiting for form submission' : 'Execution failed',
        description: data.status === 'success'
          ? `Completed in ${data.durationMs}ms`
          : data.status === 'waiting'
          ? `Workflow paused at form node. Form URL: ${data.formUrl || 'N/A'}`
          : data.error || 'Unknown error',
        variant: data.status === 'success' ? 'default' : data.status === 'waiting' ? 'default' : 'destructive',
        duration: data.status === 'waiting' ? 10000 : 5000,
      });

      // Don't navigate away - logs will show in console
      // The ExecutionConsole component will auto-update via realtime subscription
    } catch (error) {
      console.error('Execution error:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [nodes, consoleExpanded, resetAllNodeStatuses]);

  // Auto-run workflow if autoRun parameter is present (for AI-generated workflows)
  // Moved here after handleRun is defined to avoid initialization order issues
  useEffect(() => {
    // Only run if:
    // 1. User is authenticated
    // 2. Workflow is loaded (not loading, has nodes)
    // 3. autoRun parameter is present
    // 4. We haven't already auto-run for this workflow
    if (!user || isLoading || nodes.length === 0) return;
    
    const autoRunParam = searchParams.get('autoRun');
    const currentWorkflowId = useWorkflowStore.getState().workflowId;
    
    if (autoRunParam === 'true' && currentWorkflowId === id && !hasAutoRun.current) {
      hasAutoRun.current = true;
      // Remove the autoRun parameter from URL to prevent re-running on refresh
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('autoRun');
      setSearchParams(newSearchParams, { replace: true });
      
      // Small delay to ensure workflow state is fully set
      setTimeout(() => {
        handleRun(false);
      }, 500);
    }
  }, [user, isLoading, nodes.length, searchParams, setSearchParams, id, handleRun]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeTypeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <WorkflowHeader
        onSave={handleSave}
        onRun={handleRun}
        isSaving={isSaving}
        isRunning={isRunning}
        onImport={handleImportWorkflow}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Node Library */}
          {nodeLibraryOpen ? (
            <div className="relative w-72 overflow-hidden border-r border-border/60">
              <NodeLibrary
                onDragStart={onDragStart}
                onClose={() => setNodeLibraryOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setNodeLibraryOpen(true)}
              className={cn(
                "w-8 flex items-center justify-center border-r border-border/60",
                "hover:bg-muted/30 transition-colors duration-150",
                "group"
              )}
              title="Open Node Library"
              aria-label="Open Node Library"
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/60 transition-colors duration-150" />
            </button>
          )}

          {/* Central Canvas Area */}
          <div className="flex-1 relative w-full h-full" style={{ minWidth: 0, minHeight: 0 }}>
            <WorkflowCanvas />
          </div>

          {/* Right Panel - Properties */}
          {propertiesPanelOpen ? (
            <div className="relative overflow-hidden border-l border-border/60">
              <PropertiesPanel
                onClose={() => setPropertiesPanelOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setPropertiesPanelOpen(true)}
              className={cn(
                "w-8 flex items-center justify-center border-l border-border/60",
                "hover:bg-muted/30 transition-colors duration-150",
                "group"
              )}
              title="Open Properties Panel"
              aria-label="Open Properties Panel"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/60 transition-colors duration-150" />
            </button>
          )}
        </div>
        <ExecutionConsole
          isExpanded={consoleExpanded}
          onToggle={() => setConsoleExpanded(!consoleExpanded)}
        />
      </div>

      {/* Debug Panel Overlay */}
      {debugNodeId && <DebugPanel />}
    </div>
  );
}
