import { useWorkflowStore } from '@/stores/workflowStore';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getNodeDefinition, ConfigField } from './nodeTypes';
import { NODE_USAGE_GUIDES } from './nodeUsageGuides';
import { nodeSchemaService, NodeDefinition } from '@/services/nodeSchemaService';
import { convertNodeDefinitionToConfigFields, validateNodeInputsAgainstSchema } from '@/lib/schemaConverter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import NodeUsageCard from './NodeUsageCard';
import GoogleSheetsSettings from './GoogleSheetsSettings';
import FormNodeSettings from './FormNodeSettings';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { Copy, ExternalLink, Bot, Send, Loader2, Sparkles } from 'lucide-react';
import {
  Trash2, X, Play, Webhook, Clock, Globe, Brain, Gem, Link,
  GitBranch, GitMerge, Repeat, Timer, ShieldAlert, Code, Braces, Table,
  Type, Combine, Mail, MessageSquare, Database, Box, FileText, Heart,
  Filter, Variable, Hash, MessageCircle, DatabaseZap, FileOutput, HelpCircle,
  XCircle, Layers, Edit, Edit3, Tag, Code2, ListChecks, ArrowUpDown, List, Terminal,
  Calculator, Lock, Rss, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { validateAndFixWorkflow } from '@/lib/workflowValidation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDroppable } from '@dnd-kit/core';
import { useExpressionDropStore } from '@/stores/expressionDropStore';
import { resolveExpression, detectExpressionType } from '@/lib/expressionResolver';
import { InputGuideLink } from './InputGuideLink';
import ConditionBuilder, { ConditionRule } from './ConditionBuilder';

// Droppable field wrapper component - MUST be outside PropertiesPanel to avoid hook violations
interface DroppableFieldWrapperProps {
  fieldKey: string;
  children: React.ReactNode;
  className?: string;
  debugMode: boolean;
}

const DroppableFieldWrapper = ({ fieldKey, children, className, debugMode }: DroppableFieldWrapperProps) => {
  // Hook MUST be called unconditionally - use disabled prop instead of conditional call
  const { setNodeRef, isOver } = useDroppable({
    id: `field-${fieldKey}`,
    disabled: !debugMode,
  });

  if (!debugMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn("relative", className, isOver && "ring-2 ring-primary/50 rounded-md")}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-primary/10 rounded-md pointer-events-none z-10" />
      )}
    </div>
  );
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Play, Webhook, Clock, Globe, Brain, Sparkles, Gem, Link, GitBranch,
  GitMerge, Repeat, Timer, ShieldAlert, Code, Braces, Table, Type,
  Combine, Send, Mail, MessageSquare, Database, Box, FileText, Heart,
  Filter, Variable, Hash, MessageCircle, DatabaseZap, FileOutput,
  XCircle, Layers, Edit, Edit3, Tag, Code2, ListChecks, ArrowUpDown, List, Terminal,
  Calculator, Lock, Rss, Target
};

interface PropertiesPanelProps {
  onClose?: () => void;
  debugMode?: boolean;
  debugInputData?: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ViewMode = 'properties' | 'ai-editor';

export default function PropertiesPanel({ onClose, debugMode = false, debugInputData }: PropertiesPanelProps) {
  const { selectedNode, selectNode, updateNodeConfig, deleteSelectedNode, workflowId, nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const { toast } = useToast();
  const { pendingExpression, clearPendingExpression } = useExpressionDropStore();

  // View mode state - default to properties
  const [viewMode, setViewMode] = useState<ViewMode>('properties');

  // Resizable sidebar state
  const [width, setWidth] = useState(400); // Increased default width from 320px (w-80) to 400px
  const [isResizing, setIsResizing] = useState(false);

  // Help sidebar state
  const [selectedHelp, setSelectedHelp] = useState<{ title: string; steps: string[] } | null>(null);

  // Form workflow activation state
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [isSavingActivation, setIsSavingActivation] = useState(false);

  // ✅ SCHEMA-DRIVEN UI: Backend schema state
  const [backendSchema, setBackendSchema] = useState<NodeDefinition | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // AI Editor state
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I can help you edit this workflow. Try saying "Add a Slack node after success" or "Change the trigger to a schedule".',
      timestamp: new Date(),
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiScrollAreaRef = useRef<HTMLDivElement>(null);

  const loadWorkflowStatus = useCallback(async () => {
    if (!workflowId) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('status')
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      setIsWorkflowActive(data?.status === 'active');
    } catch (error) {
      console.error('Error loading workflow status:', error);
    }
  }, [workflowId]);

  // Load workflow status when form node is selected
  useEffect(() => {
    if (selectedNode?.data.type === 'form' && workflowId) {
      loadWorkflowStatus();
    }
  }, [selectedNode?.data.type, workflowId, loadWorkflowStatus]);

  // ✅ SCHEMA-DRIVEN UI: Fetch backend schema when node is selected
  useEffect(() => {
    if (!selectedNode) {
      setBackendSchema(null);
      setValidationErrors({});
      return;
    }

    const nodeType = selectedNode.data.type;
    setSchemaLoading(true);
    
    nodeSchemaService.fetchSchemaByType(nodeType)
      .then((schema) => {
        if (schema) {
          console.log(`[PropertiesPanel] ✅ Fetched backend schema for ${nodeType}:`, schema);
          setBackendSchema(schema);
          
          // Validate current inputs against schema
          const currentInputs = selectedNode.data.config || {};
          const validation = validateNodeInputsAgainstSchema(schema, currentInputs);
          
          if (!validation.valid) {
            const errorsMap: Record<string, string> = {};
            validation.errors.forEach(err => {
              errorsMap[err.field] = err.message;
            });
            setValidationErrors(errorsMap);
            console.log(`[PropertiesPanel] ⚠️ Validation errors for ${nodeType}:`, errorsMap);
          } else {
            setValidationErrors({});
            console.log(`[PropertiesPanel] ✅ Inputs valid for ${nodeType}`);
          }
        } else {
          console.log(`[PropertiesPanel] ℹ️ No backend schema for ${nodeType}, using legacy configFields`);
          setBackendSchema(null);
          setValidationErrors({});
        }
      })
      .catch((error) => {
        console.error(`[PropertiesPanel] ❌ Error fetching schema for ${nodeType}:`, error);
        setBackendSchema(null);
        setValidationErrors({});
      })
      .finally(() => {
        setSchemaLoading(false);
      });
  }, [selectedNode?.id, selectedNode?.data.type]);

  // ✅ SCHEMA-DRIVEN UI: Re-validate when config changes
  useEffect(() => {
    if (!selectedNode || !backendSchema) return;

    const currentInputs = selectedNode.data.config || {};
    const validation = validateNodeInputsAgainstSchema(backendSchema, currentInputs);
    
    if (!validation.valid) {
      const errorsMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorsMap[err.field] = err.message;
      });
      setValidationErrors(errorsMap);
    } else {
      setValidationErrors({});
    }
  }, [selectedNode?.data.config, backendSchema]);

  // Auto-scroll AI messages
  useEffect(() => {
    if (aiScrollAreaRef.current && viewMode === 'ai-editor') {
      const scrollContainer = aiScrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [aiMessages, viewMode]);

  // AI Editor send handler
  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const currentWorkflow = {
        nodes: nodes.map(n => {
          const cleanedNode: any = {
            id: n.id,
            type: n.type || n.data?.type,
            position: n.position,
            data: {
              type: n.type || n.data?.type,
              label: n.data?.label || n.type || 'Node',
            }
          };

          if (n.data?.config) {
            cleanedNode.config = {};
            for (const [key, value] of Object.entries(n.data.config)) {
              if (value !== null && value !== undefined) {
                if (typeof value === 'object') {
                  cleanedNode.config[key] = JSON.stringify(value);
                } else {
                  cleanedNode.config[key] = String(value);
                }
              }
            }
          }

          return cleanedNode;
        }),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || undefined,
          targetHandle: e.targetHandle || undefined,
        }))
      };

      if (!Array.isArray(currentWorkflow.nodes) || currentWorkflow.nodes.length === 0) {
        throw new Error('Current workflow has no nodes. Please add at least one node before using AI edit.');
      }

      let executionHistory: any[] = [];
      try {
        if (workflowId) {
          const { data: executions } = await supabase
            .from('executions')
            .select('id, status, error, logs, output, started_at')
            .eq('workflow_id', workflowId)
            .eq('status', 'failed')
            .order('started_at', { ascending: false })
            .limit(3);

          if (executions && executions.length > 0) {
            executionHistory = executions.map(exec => ({
              id: exec.id,
              status: exec.status,
              error: exec.error,
              logs: exec.logs,
              output: exec.output,
              started_at: exec.started_at,
            }));
          }
        }
      } catch (execError) {
        console.warn('Failed to fetch execution history:', execError);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      
      // Add timeout to prevent indefinite hanging (120 seconds for AI generation)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds
      
      let response: Response;
      try {
        response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionData?.session?.access_token
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt: userMessage.content.trim(),
            mode: 'edit',
            currentWorkflow: currentWorkflow,
            executionHistory: executionHistory.length > 0 ? executionHistory : undefined,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The AI generation is taking too long. Please try again with a simpler request.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'AI edit failed' }));
        throw new Error(`AI Edit Error: ${error.error || error.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Handle both response formats: direct nodes/edges or nested in workflow object
      const workflowData = data.workflow || data;
      const responseNodes = workflowData.nodes || data.nodes;
      const responseEdges = workflowData.edges || data.edges;

      if (responseNodes && responseEdges && Array.isArray(responseNodes) && Array.isArray(responseEdges)) {
        const validated = validateAndFixWorkflow({ nodes: responseNodes, edges: responseEdges });

        setNodes(validated.nodes);
        setEdges(validated.edges);

        const explanation = data.explanation || data.documentation || `I've updated the workflow based on your request.`;
        const historyNote = executionHistory.length > 0
          ? '\n\n💡 Used execution history to help debug and fix issues.'
          : '';

        setAiMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: explanation + historyNote,
          timestamp: new Date(),
        }]);
      } else {
        console.error('Invalid response format:', data);
        throw new Error(`Invalid response format. Expected nodes and edges, got: ${JSON.stringify(Object.keys(data))}`);
      }

    } catch (error: any) {
      console.error('AI Edit Error:', error);

      let errorMessage = 'Sorry, I encountered an error while processing your request.';
      if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      } else if (error?.error) {
        errorMessage = `Error: ${error.error}`;
      } else if (typeof error === 'string') {
        errorMessage = `Error: ${error}`;
      }

      setAiMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage + ' Please try again or check the console for details.',
        timestamp: new Date(),
      }]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleActivation = async (enabled: boolean) => {
    if (!workflowId) {
      toast({
        title: 'Error',
        description: 'Please save the workflow first',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingActivation(true);
    try {
      const { data, error } = await supabase
        .from("workflows")
        .update({
          status: enabled ? "active" : "draft"
        })
        .eq("id", workflowId)
        .select("status")
        .single();

      if (error) throw error;

      if (data && data.status === (enabled ? "active" : "draft")) {
        setIsWorkflowActive(enabled);
        toast({
          title: 'Success',
          description: enabled ? "Workflow activated successfully" : "Workflow deactivated",
        });

        if (enabled) {
          toast({
            title: 'Info',
            description: "Form is now active and waiting for submissions",
          });
        }
      } else {
        await loadWorkflowStatus();
        toast({
          title: 'Warning',
          description: "Status update may not have been saved. Please check and try again.",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error updating workflow status:", error);
      toast({
        title: 'Error',
        description: "Failed to update workflow status",
        variant: 'destructive',
      });
      await loadWorkflowStatus();
    } finally {
      setIsSavingActivation(false);
    }
  };

  // Resize handlers
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Calculate new width relative to window right edge
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        // Constraints: Min 300px, Max 800px (or window width - 100px)
        const constrainedWidth = Math.max(300, Math.min(newWidth, 800));
        setWidth(constrainedWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Effect to handle pending expression injection from drag & drop
  // MUST be before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (debugMode && pendingExpression && selectedNode) {
      const { fieldKey, expression } = pendingExpression;
      // Check if the field exists in the current node's config
      // ✅ SCHEMA-DRIVEN UI: Use backend schema if available
      const nodeDef = backendSchema 
        ? { configFields: convertNodeDefinitionToConfigFields(backendSchema) }
        : getNodeDefinition(selectedNode.data.type);
      const field = nodeDef?.configFields?.find(f => f.key === fieldKey);

      if (field) {
        updateNodeConfig(selectedNode.id, { [fieldKey]: expression });
        clearPendingExpression();
      }
    }
  }, [debugMode, pendingExpression, selectedNode, clearPendingExpression, updateNodeConfig]);

  // Render AI Editor view
  const renderAIEditor = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-3" ref={aiScrollAreaRef}>
        <div className="space-y-3">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1 max-w-[85%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "px-3 py-2 rounded-sm text-xs leading-relaxed",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground/90 border border-border/40"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isAiLoading && (
            <div className="flex flex-col gap-1 mr-auto items-start max-w-[85%]">
              <div className="bg-muted/60 text-foreground/70 px-3 py-2 rounded-sm border border-border/40 flex items-center gap-2">
                <Loader2 className="h-3 w-3 text-muted-foreground/60 animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border/40 bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Describe your change..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiSend()}
            disabled={isAiLoading}
            className="flex-1 h-8 text-xs border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
          />
          <Button
            size="icon"
            onClick={handleAiSend}
            disabled={isAiLoading || !aiInput.trim()}
            className="h-8 w-8"
          >
            {isAiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Selected node ID (may be undefined when no node is selected)
  const selectedNodeId = selectedNode?.id;

  // Config change handler – safe when no node is selected
  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNodeId) return;
      updateNodeConfig(selectedNodeId, { [key]: value });
    },
    [selectedNodeId, updateNodeConfig]
  );

  // Memoize available fields for condition builder – safe when no node is selected
  const availableFieldsForConditions = useMemo(() => {
    if (!selectedNodeId) return [];

    const fields: string[] = [];
    const prevNodes = nodes.filter(n => {
      const nodeEdges = edges.filter(e => e.target === selectedNodeId);
      return nodeEdges.some(e => e.source === n.id);
    });

    prevNodes.forEach(node => {
      if (node.data?.type === 'manual_trigger') {
        fields.push('input.age', 'input.name', 'input.email');
      }
      // Add more field extraction logic as needed
    });

    return fields;
  }, [nodes, edges, selectedNodeId]);

  // Stop event propagation to prevent ReactFlow from stealing focus
  const handleInputMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Render empty state (no node selected) - show toggle buttons and appropriate view
  if (!selectedNode) {
    return (
      <div
        className="relative bg-background h-full flex flex-col transition-all duration-150 relative border-l border-border/60"
        style={{ width: width, flexShrink: 0 }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-border transition-colors duration-150 z-40"
          onMouseDown={startResizing}
        />

        {/* Header with Professional Segmented Toggle */}
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="justify-start flex-1"
            >
              <ToggleGroupItem
                value="properties"
                aria-label="Node Properties"
                className={cn(
                  "h-7 px-3 text-xs font-medium border-0",
                  "data-[state=on]:bg-muted/60 data-[state=on]:text-foreground",
                  "data-[state=off]:text-muted-foreground/70",
                  "hover:bg-muted/40 transition-colors duration-150",
                  "rounded-sm"
                )}
              >
                Properties
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ai-editor"
                aria-label="AI Editor"
                className={cn(
                  "h-7 px-3 text-xs font-medium border-0",
                  "data-[state=on]:bg-muted/60 data-[state=on]:text-foreground",
                  "data-[state=off]:text-muted-foreground/70",
                  "hover:bg-muted/40 transition-colors duration-150",
                  "rounded-sm"
                )}
              >
                AI Editor
              </ToggleGroupItem>
            </ToggleGroup>
            {onClose && (
              <button
                onClick={onClose}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded-sm flex-shrink-0",
                  "text-muted-foreground/60 hover:text-foreground/80",
                  "hover:bg-muted/40 transition-colors duration-150"
                )}
                title="Close panel"
                aria-label="Close panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {viewMode === 'properties' ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground/70">
              <HelpCircle className="h-7 w-7 mx-auto mb-3 opacity-40" />
              <p className="text-xs font-medium text-foreground/70">No node selected</p>
              <p className="text-xs mt-1.5 text-muted-foreground/60">
                Click on a node to view its properties
              </p>
            </div>
          </div>
        ) : (
          renderAIEditor()
        )}
      </div>
    );
  }

  // Safety check: ensure node has proper data structure
  if (!selectedNode.data || !selectedNode.data.type) {
    console.warn('[PropertiesPanel] Node missing data or type:', selectedNode);
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Invalid Node</p>
          <p className="text-xs mt-1">This node has missing data. Please reload the workflow.</p>
        </div>
      </div>
    );
  }

  // ✅ SCHEMA-DRIVEN UI: Use backend schema if available, fallback to legacy
  const legacyNodeDefinition = getNodeDefinition(selectedNode.data.type);
  const IconComponent = iconMap[selectedNode.data.icon || 'Box'] || Box;

  // Convert backend schema to configFields if available
  const schemaConfigFields = backendSchema 
    ? convertNodeDefinitionToConfigFields(backendSchema)
    : null;

  // Use schema-based configFields if available, otherwise use legacy
  const nodeDefinition = backendSchema && schemaConfigFields
    ? {
        ...legacyNodeDefinition,
        configFields: schemaConfigFields,
        // Mark as schema-driven for logging
        _schemaDriven: true,
      }
    : legacyNodeDefinition;

  // Log schema-driven status
  if (backendSchema && schemaConfigFields) {
    console.log(`[PropertiesPanel] 🎯 Rendering ${selectedNode.data.type} from backend schema (${schemaConfigFields.length} fields)`);
  }


  // Get operation-specific helpText for Instagram node
  const getInstagramOperationHelpText = (operation: string): string => {
    const operationGuides: Record<string, string> = {
      'create_image_post': 'How to get Operation:\n1) Select "Create Image Post" from the dropdown menu\n2) This operation publishes a single image to your Instagram Business account feed\n3) Required fields: Access Token, Instagram Business Account ID, and Image URL\n4) Optional field: Caption (text with hashtags, mentions, and emojis - up to 2,200 characters)\n5) Image requirements: Must be HTTPS URL, JPG or PNG format, minimum 320px width, maximum 1080px width\n6) Upload your image to a public hosting service (AWS S3, Cloudinary, etc.) and copy the direct URL\n7) After successful posting, you will receive a Media ID in the response for tracking and management\n8) The post will be published to your connected Instagram Business account feed',
      
      'create_video_post': 'How to get Operation:\n1) Select "Create Video Post (Reels)" from the dropdown menu\n2) This operation publishes a video or Reel to your Instagram Business account\n3) Required fields: Access Token, Instagram Business Account ID, and Video URL\n4) Optional field: Caption (text with hashtags, mentions, and emojis - up to 2,200 characters)\n5) Video requirements: Must be HTTPS URL, MP4 format, maximum 100MB file size\n6) For Reels: Video must be 3-60 seconds in duration\n7) Upload your video to a public hosting service and copy the direct URL\n8) After successful posting, you will receive a Media ID in the response for tracking',
      
      'create_carousel_post': 'How to get Operation:\n1) Select "Create Carousel Post" from the dropdown menu\n2) This operation publishes multiple images in a swipeable carousel format\n3) Required fields: Access Token, Instagram Business Account ID, and Carousel Image URLs (JSON array)\n4) Optional field: Caption (text with hashtags, mentions, and emojis - up to 2,200 characters)\n5) Image requirements: 2-10 images, all must have the same aspect ratio, HTTPS URLs, JPG or PNG format\n6) Format: JSON array like ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]\n7) Upload all images to public hosting and create a JSON array of the URLs\n8) After successful posting, you will receive a Media ID in the response for tracking',
      
      'get_media': 'How to get Operation:\n1) Select "Get Media" from the dropdown menu\n2) This operation retrieves a list of media posts from your Instagram Business account\n3) Required fields: Access Token and Instagram Business Account ID\n4) Optional field: Limit (maximum 100 items, default is 25)\n5) The operation returns an array of media objects with IDs, captions, timestamps, and permalinks\n6) Use this to list all your posts, get Media IDs for other operations, or track your content\n7) Each media object includes: id, caption, timestamp, permalink, media_type, and thumbnail_url\n8) Use the returned Media IDs for operations like Get Comments or Get Insights',
      
      'get_comments': 'How to get Operation:\n1) Select "Get Comments" from the dropdown menu\n2) This operation retrieves comments from a specific media post on your Instagram account\n3) Required fields: Access Token, Instagram Business Account ID, and Media ID\n4) Optional field: Limit (maximum 100 items, default is 25)\n5) Get the Media ID from a previous "Get Media" operation or from the API response when creating a post\n6) The operation returns an array of comment objects with IDs, text, timestamps, and user information\n7) Each comment includes: id, text, timestamp, username, and reply_count\n8) Use the returned Comment IDs for operations like Reply to Comment',
      
      'reply_comment': 'How to get Operation:\n1) Select "Reply to Comment" from the dropdown menu\n2) This operation replies to a specific comment on one of your media posts\n3) Required fields: Access Token, Instagram Business Account ID, Comment ID, and Comment Text\n4) Get the Comment ID from a previous "Get Comments" operation\n5) Comment Text: Write your reply message (supports text, hashtags, mentions, and emojis)\n6) The reply will appear as a response to the original comment on your Instagram post\n7) After successful reply, you will receive a reply comment ID in the response\n8) Use this to engage with your audience and respond to comments on your posts',
      
      'get_insights': 'How to get Operation:\n1) Select "Get Insights" from the dropdown menu\n2) This operation retrieves analytics data for a specific media post on your Instagram account\n3) Required fields: Access Token, Instagram Business Account ID, Media ID, and Insight Metric\n4) Get the Media ID from a previous "Get Media" operation or from the API response when creating a post\n5) Select Insight Metric: Reach (unique accounts reached), Impressions (total views), or Engagement (likes, comments, saves)\n6) The operation returns insight data with metrics, values, and breakdowns\n7) Use this to track performance, analyze engagement, and measure post success\n8) Insights help you understand how your content is performing and optimize your strategy'
    };
    
    return operationGuides[operation] || operationGuides['create_image_post'];
  };

  // Parse helpText to extract title and steps
  const parseHelpText = (helpText: string): { title: string; steps: string[] } | null => {
    if (!helpText || !helpText.startsWith('How to get')) {
      return null;
    }

    // Extract title (everything before the colon)
    const colonIndex = helpText.indexOf(':');
    if (colonIndex === -1) return null;

    const title = helpText.substring(0, colonIndex).trim();
    const content = helpText.substring(colonIndex + 1).trim();

    // Extract steps (numbered items like "1) ... 2) ...")
    const steps: string[] = [];

    // Split by numbered steps pattern: "1) ", "2) ", etc.
    const stepParts = content.split(/(?=\d+\)\s)/);

    for (const part of stepParts) {
      const stepMatch = part.match(/^\d+\)\s*(.+?)(?=\s*\d+\)|$)/s);
      if (stepMatch) {
        const stepText = stepMatch[1].trim();
        if (stepText.length > 0) {
          steps.push(stepText);
        }
      } else {
        // If no match, try to extract any remaining text
        const cleaned = part.replace(/^\d+\)\s*/, '').trim();
        if (cleaned.length > 0) {
          steps.push(cleaned);
        }
      }
    }

    // If still no steps found, try alternative parsing
    if (steps.length === 0) {
      // Try splitting by "Method 1", "Method 2", etc. or by periods
      const alternativeSteps = content
        .split(/(?=Method \d+:|Step \d+:|^\d+\.)/)
        .filter(s => s.trim().length > 0)
        .map(s => s.replace(/^(Method \d+:|Step \d+:|\d+\.)\s*/, '').trim())
        .filter(s => s.length > 0);

      if (alternativeSteps.length > 0) {
        steps.push(...alternativeSteps);
      } else {
        // Last resort: split by periods and filter
        const periodSteps = content
          .split(/\.(?=\s)/)
          .map(s => s.trim())
          .filter(s => s.length > 10); // Filter out very short fragments

        if (periodSteps.length > 0) {
          steps.push(...periodSteps);
        }
      }
    }

    return steps.length > 0 ? { title, steps } : null;
  };

  const renderField = (field: ConfigField) => {
    const value = (selectedNode.data.config || {})[field.key] ?? field.defaultValue ?? '';

    // Check if value is an expression and resolve it in debug mode
    const isExpression = typeof value === 'string' && value.startsWith('{{$json.');
    const resolvedValue = debugMode && isExpression && debugInputData
      ? resolveExpression(value as string, debugInputData)
      : value;
    const resolvedType = debugMode && isExpression && debugInputData
      ? detectExpressionType(value as string, debugInputData)
      : typeof value;

    switch (field.type) {
      case 'text':
      case 'cron':
        return (
          <DroppableFieldWrapper fieldKey={field.key} debugMode={debugMode}>
            <div className="relative">
              <Input
                id={field.key}
                value={value as string}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-8 text-xs border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
                onMouseDown={handleInputMouseDown}
                onFocus={(e) => e.stopPropagation()}
              />
              {debugMode && isExpression && (
                <div className="absolute top-0 right-0 bottom-0 flex items-center pr-2 text-xs text-muted-foreground/70 bg-muted/20 rounded-r-md pointer-events-none">
                  <span className="font-mono text-[10px]">{String(resolvedValue)} ({resolvedType})</span>
                </div>
              )}
            </div>
          </DroppableFieldWrapper>
        );

      case 'time':
        return (
          <DroppableFieldWrapper fieldKey={field.key} debugMode={debugMode}>
            <Input
              id={field.key}
              type="time"
              value={value as string}
              onChange={(e) => handleConfigChange(field.key, e.target.value)}
              placeholder={field.placeholder || '09:00'}
              className="h-8 text-xs border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
              onMouseDown={handleInputMouseDown}
              onFocus={(e) => e.stopPropagation()}
            />
          </DroppableFieldWrapper>
        );

      case 'textarea':
      case 'json':
        return (
          <DroppableFieldWrapper fieldKey={field.key} debugMode={debugMode}>
            <div className="relative">
              <Textarea
                id={field.key}
                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="min-h-[100px] font-mono text-xs border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
                onMouseDown={handleInputMouseDown}
                onFocus={(e) => e.stopPropagation()}
              />
              {debugMode && isExpression && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground/70 bg-muted/20 px-2 py-1 rounded pointer-events-none max-w-[200px]">
                  <div className="font-mono text-[10px] whitespace-pre-wrap break-words">
                    {String(resolvedValue)} ({resolvedType})
                  </div>
                </div>
              )}
            </div>
          </DroppableFieldWrapper>
        );

      case 'number':
        return (
          <DroppableFieldWrapper fieldKey={field.key} debugMode={debugMode}>
            <div className="relative">
              <Input
                id={field.key}
                type="number"
                value={value as number}
                onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value))}
                placeholder={field.placeholder}
                className="h-8 text-xs border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
                onMouseDown={handleInputMouseDown}
                onFocus={(e) => e.stopPropagation()}
              />
              {debugMode && isExpression && (
                <div className="absolute top-0 right-0 bottom-0 flex items-center pr-2 text-xs text-muted-foreground/70 bg-muted/20 rounded-r-md pointer-events-none">
                  <span className="font-mono text-[10px]">{String(resolvedValue)} ({resolvedType})</span>
                </div>
              )}
            </div>
          </DroppableFieldWrapper>
        );

      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={(val) => handleConfigChange(field.key, val)}
          >
            <SelectTrigger
              id={field.key}
              className="h-8 text-xs border-border/60 focus:ring-1 focus:ring-ring/50"
            >
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <Switch
            id={field.key}
            checked={value as boolean}
            onCheckedChange={(checked) => handleConfigChange(field.key, checked)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative bg-background h-full flex flex-col transition-all duration-150 border-l border-border/60"
      style={{ width: width, flexShrink: 0 }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize transition-colors duration-150 z-40",
          isResizing ? 'bg-border' : 'hover:bg-border'
        )}
        onMouseDown={startResizing}
      />

      {/* Header with Professional Segmented Toggle */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="justify-start flex-1"
        >
          <ToggleGroupItem
            value="properties"
            aria-label="Node Properties"
            className={cn(
              "h-7 px-3 text-xs font-medium border-0",
              "data-[state=on]:bg-muted/60 data-[state=on]:text-foreground",
              "data-[state=off]:text-muted-foreground/70",
              "hover:bg-muted/40 transition-colors duration-150",
              "rounded-sm"
            )}
          >
            Properties
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ai-editor"
            aria-label="AI Editor"
            className={cn(
              "h-7 px-3 text-xs font-medium border-0",
              "data-[state=on]:bg-muted/60 data-[state=on]:text-foreground",
              "data-[state=off]:text-muted-foreground/70",
              "hover:bg-muted/40 transition-colors duration-150",
              "rounded-sm"
            )}
          >
            AI Editor
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-1">
          {viewMode === 'properties' && (
            <button
              onClick={() => selectNode(null)}
              className="h-6 w-6 flex items-center justify-center rounded-sm hover:bg-muted/50 transition-colors duration-150"
              title="Deselect node"
              aria-label="Deselect node"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground/70" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "h-6 w-6 flex items-center justify-center rounded-sm flex-shrink-0",
                "text-muted-foreground/60 hover:text-foreground/80",
                "hover:bg-muted/40 transition-colors duration-150"
              )}
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {viewMode === 'properties' ? (
        <>
          <ScrollArea className="flex-1">
            <div className="px-4 py-4 space-y-5">
              {/* Usage Guide Card - For All Nodes */}
              {NODE_USAGE_GUIDES[selectedNode.data.type] && (
                <div className="mb-1">
                  <NodeUsageCard
                    guide={NODE_USAGE_GUIDES[selectedNode.data.type]}
                    nodeLabel={selectedNode.data.label}
                  />
                </div>
              )}

              {/* Node Info */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground/70">Type</Label>
                  <p className="text-xs font-medium text-foreground/90 mt-1">{selectedNode.data.label || selectedNode.data.type || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground/70">Description</Label>
                  <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">{nodeDefinition?.description || 'No description available'}</p>
                </div>
              </div>

              {/* Config Fields */}
              {nodeDefinition && (
                <>
                  {/* Form Settings for Form Nodes - Show prominently at the top */}
                  {selectedNode.data.type === 'form' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-medium uppercase text-muted-foreground/70 tracking-wide">
                        Form Settings
                      </h3>

                      {/* Activation Toggle */}
                      <div className="flex items-center justify-between p-3 border border-border/40 rounded-sm bg-muted/20">
                        <div className="space-y-0.5 flex-1">
                          <Label htmlFor="form-activation" className="text-xs font-medium text-foreground/90">
                            Activate Workflow
                          </Label>
                          <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                            {isWorkflowActive
                              ? "Workflow is active and waiting for form submissions"
                              : "Activate to start accepting form submissions"}
                          </p>
                        </div>
                        <Switch
                          id="form-activation"
                          checked={isWorkflowActive}
                          onCheckedChange={handleToggleActivation}
                          disabled={isSavingActivation || !workflowId}
                          className="ml-3"
                        />
                      </div>

                      {/* Form URL Display */}
                      <div className="space-y-3 p-3 bg-muted/30 rounded-sm border border-border/40">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-medium text-foreground/90">Form URL</Label>
                            {!workflowId && (
                              <span className="text-xs text-muted-foreground/70 font-medium">
                                (Save workflow first)
                              </span>
                            )}
                          </div>
                          {workflowId ? (
                            <>
                              <div className="flex gap-2 items-center">
                                <div className="flex-1 min-w-0 p-2 border border-border/40 rounded-sm bg-background">
                                  <code className="text-xs font-mono break-all whitespace-normal text-foreground/80">
                                    {`${window.location.origin}/form/${workflowId}/${selectedNode.id}`}
                                  </code>
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 border-border/60 hover:bg-muted/60"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/form/${workflowId}/${selectedNode.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast({
                                      title: 'Copied!',
                                      description: 'Form URL copied to clipboard',
                                    });
                                  }}
                                  title="Copy form URL"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 border-border/60 hover:bg-muted/60"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/form/${workflowId}/${selectedNode.id}`;
                                    window.open(url, '_blank');
                                  }}
                                  title="Open form in new tab"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                                Share this URL with users to collect form submissions. Submissions will automatically trigger your workflow.
                              </p>
                              <div className="p-2.5 bg-muted/40 border border-border/40 rounded-sm">
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                  <strong className="font-medium">Note:</strong> The workflow must be saved and active for the form to work. Users can access this URL directly in their browser to fill out and submit the form.
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="p-2.5 bg-muted/40 border border-border/40 rounded-sm text-xs text-muted-foreground/80">
                              <strong className="font-medium">Save Required:</strong> Please save the workflow first to generate the form link.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat URL Display - Show when chat trigger node is selected */}
                  {selectedNode.data.type === 'chat_trigger' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-medium uppercase text-muted-foreground/70 tracking-wide">
                        Chat Settings
                      </h3>
                      <div className="space-y-3 p-3 bg-muted/30 rounded-sm border border-border/40">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-medium text-foreground/90">Chat URL</Label>
                            {!workflowId && (
                              <span className="text-xs text-muted-foreground/70 font-medium">
                                (Save workflow first)
                              </span>
                            )}
                          </div>
                          {workflowId ? (
                            <>
                              <div className="flex gap-2 items-center">
                                <div className="flex-1 min-w-0 p-2 border border-border/40 rounded-sm bg-background">
                                  <code className="text-xs font-mono break-all whitespace-normal text-foreground/80">
                                    {`${window.location.origin}/chat/${workflowId}/${selectedNode.id}`}
                                  </code>
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 border-border/60 hover:bg-muted/60"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/chat/${workflowId}/${selectedNode.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast({
                                      title: 'Copied!',
                                      description: 'Chat URL copied to clipboard',
                                    });
                                  }}
                                  title="Copy chat URL"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 border-border/60 hover:bg-muted/60"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/chat/${workflowId}/${selectedNode.id}`;
                                    window.open(url, '_blank');
                                  }}
                                  title="Open chat in new tab"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                                Share this URL to open the chat interface. Each message will trigger a new workflow execution (like webhook). Messages will appear in the execution console.
                              </p>
                              <div className="p-2.5 bg-muted/40 border border-border/40 rounded-sm">
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                  <strong className="font-medium">Note:</strong> The workflow must be saved and active for the chat to work. Each message creates a new workflow execution from the start.
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="p-2.5 bg-muted/40 border border-border/40 rounded-sm text-xs text-muted-foreground/80">
                              <strong className="font-medium">Save Required:</strong> Please save the workflow first to generate the chat link.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Node Settings */}
                  {selectedNode.data.type === 'form' ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-medium uppercase text-muted-foreground/70 tracking-wide">
                        Form Configuration
                      </h3>
                      <FormNodeSettings
                        config={{
                          formTitle: (selectedNode.data.config?.formTitle as string) || 'Form Submission',
                          formDescription: (selectedNode.data.config?.formDescription as string) || '',
                          fields: Array.isArray(selectedNode.data.config?.fields)
                            ? (selectedNode.data.config.fields as any[])
                            : [],
                          submitButtonText: (selectedNode.data.config?.submitButtonText as string) || 'Submit',
                          successMessage: (selectedNode.data.config?.successMessage as string) || 'Thank you for your submission!',
                          redirectUrl: (selectedNode.data.config?.redirectUrl as string) || '',
                        }}
                        onConfigChange={(newConfig) => {
                          updateNodeConfig(selectedNode.id, newConfig as any);
                        }}
                      />
                    </div>
                  ) : selectedNode.data.type !== 'form' && (
                    <>
                      {/* Custom Google Sheets Settings */}
                      {selectedNode.data.type === 'google_sheets' ? (
                        <div className="space-y-4">
                          <h3 className="text-xs font-medium uppercase text-muted-foreground/70 tracking-wide">
                            Configuration
                          </h3>
                          <GoogleSheetsSettings
                            config={selectedNode.data.config}
                            onConfigChange={(newConfig) => {
                              updateNodeConfig(selectedNode.id, newConfig);
                            }}
                          />
                        </div>
                      ) : (nodeDefinition.configFields && nodeDefinition.configFields.length > 0) ? (
                        <div className="space-y-4">
                          <h3 className="text-xs font-medium uppercase text-muted-foreground/70 tracking-wide">
                            Configuration
                          </h3>
                          {nodeDefinition.configFields.map((field) => {
                            // Get dynamic helpText for Instagram operation field
                            let effectiveHelpText = field.helpText;
                            if (selectedNode.data.type === 'instagram' && field.key === 'operation') {
                              const operationValue = (selectedNode.data.config || {})[field.key] ?? field.defaultValue ?? 'create_image_post';
                              effectiveHelpText = getInstagramOperationHelpText(String(operationValue));
                            }
                            
                            const helpInfo = effectiveHelpText ? parseHelpText(effectiveHelpText) : null;
                            const hasHelpLink = helpInfo !== null;
                            const hasDescription = effectiveHelpText && !hasHelpLink;

                            // ✅ SCHEMA-DRIVEN UI: Get validation error for this field
                            const fieldError = validationErrors[field.key];

                            return (
                              <div key={field.key} className="space-y-2">
                                {/* Top - Heading */}
                                {/* ✅ ACCESSIBILITY FIX: Only use htmlFor when there's a single input field */}
                                {selectedNode.data.type === 'if_else' && field.key === 'conditions' ? (
                                  <Label className="text-xs font-medium text-foreground/90 flex items-center gap-1">
                                    {field.label}
                                    {field.required && <span className="text-destructive/80">*</span>}
                                    {/* ✅ SCHEMA-DRIVEN UI: Show schema-driven indicator */}
                                    {backendSchema && (
                                      <span className="ml-1 text-[10px] text-muted-foreground/50" title="Rendered from backend schema">
                                        🎯
                                      </span>
                                    )}
                                  </Label>
                                ) : (
                                  <Label htmlFor={field.key} className="text-xs font-medium text-foreground/90 flex items-center gap-1">
                                    {field.label}
                                    {field.required && <span className="text-destructive/80">*</span>}
                                    {/* ✅ SCHEMA-DRIVEN UI: Show schema-driven indicator */}
                                    {backendSchema && (
                                      <span className="ml-1 text-[10px] text-muted-foreground/50" title="Rendered from backend schema">
                                        🎯
                                      </span>
                                    )}
                                  </Label>
                                )}

                                {/* ✅ SCHEMA-DRIVEN UI: Show validation error inline */}
                                {fieldError && (
                                  <p className="text-xs text-destructive/80 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {fieldError}
                                  </p>
                                )}

                                {/* Next - Description (if exists and not a help link) */}
                                {hasDescription && (
                                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{effectiveHelpText}</p>
                                )}

                                {/* Next - Input Field */}
                                {/* Special handling for If/Else conditions */}
                                {selectedNode.data.type === 'if_else' && field.key === 'conditions' ? (
                                  <ConditionBuilder
                                    key={`condition-builder-${selectedNode.id}-${field.key}`}
                                    value={(selectedNode.data.config || {})[field.key]}
                                    onChange={(conditions: ConditionRule[]) => {
                                      handleConfigChange(field.key, conditions);
                                    }}
                                    availableFields={availableFieldsForConditions}
                                  />
                                ) : (
                                  renderField(field)
                                )}

                                {/* Last - User Manual Link at Right Side End */}
                                {/* MANDATORY: Show guide link for ALL input fields (per requirements) */}
                                {(['text', 'textarea', 'json', 'number', 'select', 'time', 'cron'].includes(field.type)) && (
                                  <div className="flex justify-end">
                                    {hasHelpLink ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedHelp(helpInfo)}
                                        className="text-xs text-muted-foreground/70 hover:text-foreground/80 cursor-pointer flex items-center gap-1 transition-colors duration-150"
                                      >
                                        <HelpCircle className="h-3 w-3" />
                                        How to get {field.label}?
                                      </button>
                                    ) : (
                                      <InputGuideLink
                                        fieldKey={field.key}
                                        fieldLabel={field.label}
                                        fieldType={field.type}
                                        nodeType={selectedNode.data.type}
                                        placeholder={field.placeholder}
                                        helpText={effectiveHelpText}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="px-4 py-3 border-t border-border/40 space-y-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                deleteSelectedNode();
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Node
            </Button>
            <p className="text-xs text-center text-muted-foreground/60">
              Press <kbd className="px-1 py-0.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded border border-border/40">Del</kbd> or <kbd className="px-1 py-0.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded border border-border/40">Backspace</kbd> to delete
            </p>
          </div>
        </>
      ) : (
        renderAIEditor()
      )}

      {/* Help Sidebar */}
      <Sheet open={!!selectedHelp} onOpenChange={(open) => !open && setSelectedHelp(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedHelp?.title || 'Help'}</SheetTitle>
            <SheetDescription>
              Follow these steps to get the required information.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedHelp?.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
