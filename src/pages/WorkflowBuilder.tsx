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

        // CRITICAL: Validate edges before setting
        const validEdges = normalized.edges.filter(edge => {
          const sourceExists = normalized.nodes.some(n => n.id === edge.source);
          const targetExists = normalized.nodes.some(n => n.id === edge.target);
          
          if (!sourceExists || !targetExists) {
            console.warn(`[EdgeValidation] Removing invalid edge on load: ${edge.source}->${edge.target}`);
            return false;
          }
          return true;
        });

        console.log(`[EdgeDebug] Loaded ${validEdges.length} valid edges from ${normalized.edges.length} total edges`);
        console.log(`[EdgeDebug] Loaded ${normalized.nodes.length} nodes`);

        // CRITICAL: Set nodes and edges atomically to prevent partial state
        setNodes(normalized.nodes);
        setEdges(validEdges);
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
      // Validate edges before saving
      const validEdges = edges.filter(edge => {
        const sourceExists = nodes.some(n => n.id === edge.source);
        const targetExists = nodes.some(n => n.id === edge.target);
        
        if (!sourceExists || !targetExists) {
          console.warn(`[EdgeValidation] Removing invalid edge on save: ${edge.source}->${edge.target}`);
          return false;
        }
        return true;
      });

      console.log(`[EdgeDebug] Saving ${validEdges.length} valid edges (from ${edges.length} total)`);

      // ✅ CRITICAL: Normalize graph before saving
      // - Deduplicate edges
      // - Normalize node configs (e.g., If/Else condition -> conditions)
      // - Remove invalid edges
      const { normalizeWorkflowGraph } = await import('@/lib/graphNormalizer');
      const normalized = normalizeWorkflowGraph(nodes, validEdges);
      
      if (normalized.warnings.length > 0) {
        console.warn('[WorkflowBuilder] Graph normalization warnings:', normalized.warnings);
      }
      if (normalized.errors.length > 0) {
        console.error('[WorkflowBuilder] Graph normalization errors:', normalized.errors);
        throw new Error(`Graph validation failed: ${normalized.errors.join(', ')}`);
      }

      // ✅ CRITICAL: Validate workflow topology before saving
      const { validateWorkflowGraph } = await import('@/lib/workflowGraphValidator');
      const validation = validateWorkflowGraph(normalized.nodes, normalized.edges);
      
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ');
        console.error('[WorkflowBuilder] Workflow validation failed:', validation.errors);
        toast({
          title: 'Validation Failed',
          description: errorMessages,
          variant: 'destructive',
        });
        throw new Error(`Workflow validation failed: ${errorMessages}`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('[WorkflowBuilder] Workflow validation warnings:', validation.warnings);
      }

      const workflowData = {
        name: useWorkflowStore.getState().workflowName,
        nodes: normalized.nodes as unknown as Json,
        edges: normalized.edges as unknown as Json, // Normalized edges (deduplicated, validated)
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const workflowId = useWorkflowStore.getState().workflowId;

      let savedWorkflowId = workflowId;
      
      // ✅ CRITICAL: If workflow has nodes and edges, set status to 'active'
      // Don't set phase here - let attach-inputs endpoint handle phase transitions
      // This prevents phase conflicts when attach-inputs is called after save
      const hasNodes = nodes.length > 0;
      const hasEdges = validEdges.length > 0;
      const isReady = hasNodes && (hasEdges || nodes.length === 1); // Single node workflows don't need edges
      
      if (isReady) {
        // Set status to 'active' (valid enum value) - phase will be set by attach-inputs
        (workflowData as any).status = 'active';
        // Don't set phase - let attach-inputs handle it based on workflow state
      }
      
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

      // ✅ CRITICAL: After saving, automatically attach inputs and set status to ready_for_execution
      if (savedWorkflowId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          
          // Extract inputs from current nodes
          const inputsToAttach: Record<string, Record<string, any>> = {};
          
          nodes.forEach((node: any) => {
            const nodeConfig = node.data?.config || {};
            const nodeInputs: Record<string, any> = {};
            
            // Extract all non-empty config values as inputs
            Object.keys(nodeConfig).forEach((key) => {
              const value = nodeConfig[key];
              // Skip empty values, credentials, and internal fields
              if (value !== undefined && value !== null && value !== '' && 
                  !key.startsWith('_') && 
                  !key.includes('credential') && 
                  !key.includes('oauth')) {
                nodeInputs[key] = value;
              }
            });
            
            // Only add node if it has inputs
            if (Object.keys(nodeInputs).length > 0) {
              inputsToAttach[node.id] = nodeInputs;
            }
          });
          
          // Attach inputs if any exist
          if (Object.keys(inputsToAttach).length > 0) {
            console.log('[handleSave] Auto-attaching inputs after save:', inputsToAttach);
            
            const attachInputsResponse = await fetch(`${ENDPOINTS.itemBackend}/api/workflows/${savedWorkflowId}/attach-inputs`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(sessionData?.session?.access_token
                  ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                  : {}),
              },
              body: JSON.stringify({
                inputs: inputsToAttach,
              }),
            });
            
            if (attachInputsResponse.ok) {
              console.log('[handleSave] ✅ Inputs attached successfully');
              
              // Check if credentials are required
              const attachResult = await attachInputsResponse.json();
              
              // If no credentials required, status should already be ready_for_execution
              // If credentials required, status will be configuring_credentials
              // Either way, workflow is ready to run (credentials can be attached later)
            } else {
              const attachError = await attachInputsResponse.json().catch(() => ({ error: 'Failed to attach inputs' }));
              
              // If error is phase locking (already configured), that's fine
              if (attachError.code === 'PHASE_LOCKED' || 
                  attachError.code === 'INVALID_PHASE' ||
                  (attachError.currentPhase && ['ready_for_execution', 'executing'].includes(attachError.currentPhase))) {
                console.log('[handleSave] Workflow already configured, skipping input attachment');
              } else {
                console.warn('[handleSave] Failed to auto-attach inputs (non-fatal):', attachError);
              }
            }
          } else {
            // No inputs to attach, but we can still set status to ready_for_execution if no credentials needed
            console.log('[handleSave] No inputs to attach, checking if workflow can be set to ready');
            
            // Try to set status directly to ready_for_execution
            const { data: sessionData } = await supabase.auth.getSession();
            const checkCredsResponse = await fetch(`${ENDPOINTS.itemBackend}/api/workflows/${savedWorkflowId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(sessionData?.session?.access_token
                  ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                  : {}),
              },
            });
            
            if (checkCredsResponse.ok) {
              const workflowData = await checkCredsResponse.json();
              // If workflow has no credential requirements, we could set it to ready_for_execution
              // But for now, let execute-workflow handle the status update
            }
          }
        } catch (attachError) {
          console.warn('[handleSave] Error auto-attaching inputs (non-fatal):', attachError);
          // Continue - workflow is saved, inputs can be attached later
        }
      }

      setIsDirty(false);
      toast({
        title: 'Saved',
        description: 'Workflow saved and configured successfully',
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
        
        // ✅ CRITICAL: Use /api/save-workflow endpoint instead of direct Supabase update
        // This ensures cache invalidation and graph hash logging happen
        const { normalizeWorkflowGraph } = await import('@/lib/graphNormalizer');
        const normalized = normalizeWorkflowGraph(nodes, edges);
        
        const { data: sessionData } = await supabase.auth.getSession();
        const saveResponse = await fetch(`${ENDPOINTS.itemBackend}/api/save-workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionData?.session?.access_token
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            workflowId: workflowId || undefined,
            name: useWorkflowStore.getState().workflowName,
            nodes: normalized.nodes,
            edges: normalized.edges,
            user_id: user.id,
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json().catch(() => ({ error: 'Save failed' }));
          throw new Error(errorData.error || errorData.message || 'Failed to save workflow');
        }

        const saveResult = await saveResponse.json();
        const savedWorkflowId = saveResult.workflowId || workflowId;

        if (!savedWorkflowId) {
          throw new Error('Failed to get workflow ID after save');
        }

        // Update workflow ID in store if it's a new workflow
        if (!workflowId && savedWorkflowId) {
          setWorkflowId(savedWorkflowId);
          navigate(`/workflow/${savedWorkflowId}`, { replace: true });
        }

        setIsDirty(false);
        console.log(`[handleRun] ✅ Auto-saved workflow via /api/save-workflow - ID: ${savedWorkflowId}`);
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

    // ✅ CRITICAL: Validate workflow before running
    // This provides immediate feedback and prevents invalid workflows from being sent to backend
    try {
      const { normalizeWorkflowGraph } = await import('@/lib/graphNormalizer');
      const { validateWorkflowGraph } = await import('@/lib/workflowGraphValidator');
      
      const normalized = normalizeWorkflowGraph(nodes, edges);
      if (normalized.errors.length > 0) {
        toast({
          title: 'Validation Failed',
          description: `Graph normalization errors: ${normalized.errors.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      const validation = validateWorkflowGraph(normalized.nodes, normalized.edges);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join('; ');
        toast({
          title: 'Validation Failed',
          description: `Workflow validation failed: ${errorMessages}`,
          variant: 'destructive',
        });
        return;
      }
    } catch (validationError: any) {
      console.error('[WorkflowBuilder] Validation error:', validationError);
      toast({
        title: 'Validation Error',
        description: validationError?.message || 'Failed to validate workflow',
        variant: 'destructive',
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
              const errorCode = errorData.code || 'UNKNOWN_ERROR';
              const errorDetails = errorData.details ? JSON.stringify(errorData.details, null, 2) : '';
              const errorHint = errorData.hint || '';
              
              // ✅ CRITICAL: Log full error details for debugging
              console.error('[execute-workflow] ❌ Error response:', {
                status: response.status,
                code: errorCode,
                error: errorMessage,
                message: errorData.message,
                phase: errorData.phase,
                persistedStatus: errorData.persistedStatus,
                details: errorData.details,
                hint: errorHint,
                fullError: errorData
              });
              
              // Build detailed error message
              let detailedMessage = errorMessage;
              if (errorData.phase) {
                detailedMessage += `\n\nCurrent Status: ${errorData.phase}`;
              }
              if (errorData.details) {
                if (errorData.details.missingInputsCount > 0) {
                  detailedMessage += `\n\nMissing Inputs: ${errorData.details.missingInputsCount}`;
                }
                if (errorData.details.missingCredentialsCount > 0) {
                  detailedMessage += `\n\nMissing Credentials: ${errorData.details.missingCredentialsCount}`;
                }
              }
              if (errorHint) {
                detailedMessage += `\n\n💡 ${errorHint}`;
              }
              
              throw new Error(detailedMessage);
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

    // ✅ CRITICAL: Auto-attach inputs from current workflow state before executing
    // This ensures workflow status moves from "draft" to "ready_for_execution"
    // NOTE: This operates on a CLONE of the graph - does not mutate React state
    // ✅ RUNTIME SAFETY: Auto-attach never mutates the original graph
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // ✅ CRITICAL: Deep clone graph before any operations
      // This ensures auto-attach never mutates the original React state
      const clonedNodes = JSON.parse(JSON.stringify(nodes));
      const clonedEdges = JSON.parse(JSON.stringify(edges));
      
      // ✅ CRITICAL: Normalize graph before extracting inputs (ensures consistent format)
      const { normalizeWorkflowGraph } = await import('@/lib/graphNormalizer');
      const normalized = normalizeWorkflowGraph(clonedNodes, clonedEdges);
      
      // Extract inputs from normalized nodes (clone, not original)
      const inputsToAttach: Record<string, Record<string, any>> = {};
      
      normalized.nodes.forEach((node: any) => {
        const nodeConfig = node.data?.config || {};
        const nodeInputs: Record<string, any> = {};
        
        // ✅ CRITICAL: Handle If/Else conditions array format
        if (node.data?.type === 'if_else' && nodeConfig.conditions) {
          // If/Else: save conditions array as-is (already normalized)
          if (Array.isArray(nodeConfig.conditions) && nodeConfig.conditions.length > 0) {
            nodeInputs.conditions = nodeConfig.conditions;
          }
        } else {
          // Other nodes: extract all non-empty config values as inputs
          Object.keys(nodeConfig).forEach((key) => {
            const value = nodeConfig[key];
            // Skip empty values, credentials, and internal fields
            if (value !== undefined && value !== null && value !== '' && 
                !key.startsWith('_') && 
                !key.includes('credential') && 
                !key.includes('oauth')) {
              nodeInputs[key] = value;
            }
          });
        }
        
        // Only add node if it has inputs
        if (Object.keys(nodeInputs).length > 0) {
          inputsToAttach[node.id] = nodeInputs;
        }
      });
      
      console.log('[execute-workflow] ✅ Auto-attach operating on cloned graph (immutable)');
      
      // Attach inputs if any exist
      if (Object.keys(inputsToAttach).length > 0) {
        console.log('[execute-workflow] Auto-attaching inputs before execution:', inputsToAttach);
        
        const attachInputsResponse = await fetch(`${ENDPOINTS.itemBackend}/api/workflows/${finalWorkflowId}/attach-inputs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionData?.session?.access_token
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            inputs: inputsToAttach,
          }),
        });
        
        if (!attachInputsResponse.ok) {
          const attachError = await attachInputsResponse.json().catch(() => ({ error: 'Failed to attach inputs' }));
          
          // ✅ CRITICAL: Check if error is due to phase locking (workflow already configured)
          // If workflow is already in ready_for_execution, skip attach and proceed to execution
          if (attachError.code === 'PHASE_LOCKED' || 
              attachError.code === 'INVALID_PHASE' ||
              (attachError.currentPhase && ['ready_for_execution', 'executing'].includes(attachError.currentPhase))) {
            console.log('[execute-workflow] Workflow already configured, skipping input attachment:', attachError.currentPhase);
            // Continue to execution - workflow is already ready
          } else {
            console.warn('[execute-workflow] Failed to auto-attach inputs:', attachError);
            // Continue anyway - execution endpoint will show the actual error
          }
        } else {
          console.log('[execute-workflow] ✅ Inputs attached successfully');
        }
      } else {
        console.log('[execute-workflow] No inputs to attach (workflow may not require inputs)');
      }
    } catch (attachError) {
      console.warn('[execute-workflow] Error auto-attaching inputs (non-fatal):', attachError);
      // Continue anyway - execution endpoint will show the actual error
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
        const errorCode = errorData.code || 'UNKNOWN_ERROR';
        const errorDetails = errorData.details ? JSON.stringify(errorData.details, null, 2) : '';
        const errorHint = errorData.hint || '';
        
        // ✅ CRITICAL: Log full error details for debugging
        console.error('[execute-workflow] ❌ Error response:', {
          status: response.status,
          code: errorCode,
          error: errorMessage,
          message: errorData.message,
          phase: errorData.phase,
          persistedStatus: errorData.persistedStatus,
          details: errorData.details,
          hint: errorHint,
          fullError: errorData
        });
        
        // Build detailed error message
        let detailedMessage = errorMessage;
        if (errorData.phase) {
          detailedMessage += `\n\nCurrent Status: ${errorData.phase}`;
        }
        if (errorData.details) {
          if (errorData.details.missingInputsCount > 0) {
            detailedMessage += `\n\nMissing Inputs: ${errorData.details.missingInputsCount}`;
          }
          if (errorData.details.missingCredentialsCount > 0) {
            detailedMessage += `\n\nMissing Credentials: ${errorData.details.missingCredentialsCount}`;
          }
          if (errorData.details.requiredCredentialsCount > 0) {
            detailedMessage += `\n\nRequired Credentials: ${errorData.details.requiredCredentialsCount}`;
          }
        }
        if (errorHint) {
          detailedMessage += `\n\n💡 ${errorHint}`;
        }
        
        throw new Error(detailedMessage);
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
      
      // ✅ CRITICAL: Show actual error message from backend
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : 'Failed to execute workflow';
      
      // Extract error details if available
      let errorTitle = 'Error';
      let errorDescription = errorMessage;
      
      // Try to parse structured error if it's a string
      if (typeof errorMessage === 'string') {
        // Check if it contains error code
        if (errorMessage.includes('EXECUTION_NOT_READY')) {
          errorTitle = 'Workflow Not Ready';
          errorDescription = errorMessage.split('\n\n')[0]; // First line only for toast
        } else if (errorMessage.includes('EXECUTION_MISSING_INPUTS')) {
          errorTitle = 'Missing Inputs';
          errorDescription = errorMessage.split('\n\n')[0];
        } else if (errorMessage.includes('EXECUTION_MISSING_CREDENTIALS')) {
          errorTitle = 'Missing Credentials';
          errorDescription = errorMessage.split('\n\n')[0];
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 10000, // Show longer for detailed errors
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
