/**
 * Template Editor
 * Allows admins to edit template nodes and edges using the workflow builder
 */

import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useWorkflowStore, WorkflowNode } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NodeTypeDefinition } from '@/components/workflow/nodeTypes';
import NodeLibrary from '@/components/workflow/NodeLibrary';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import PropertiesPanel from '@/components/workflow/PropertiesPanel';
import ExecutionConsole from '@/components/workflow/ExecutionConsole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { Edge } from '@xyflow/react';
import { Json } from '@/integrations/supabase/types';
import { updateTemplate } from '@/lib/api/admin';
import { validateAndFixWorkflow } from '@/lib/workflowValidation';

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setWorkflowName,
    setIsDirty,
    resetWorkflow,
  } = useWorkflowStore();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  // Load template
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      if (data) {
        setTemplateData(data);
        setWorkflowName(data.name);
        
        // CRITICAL: Normalize and regenerate IDs to ensure uniqueness
        const normalized = validateAndFixWorkflow({
          nodes: (data.nodes as unknown as WorkflowNode[]) || [],
          edges: (data.edges as unknown as Edge[]) || []
        });
        
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive',
      });
    }
  }, [setNodes, setEdges, setWorkflowName, setIsDirty, toast]);

  // Load template
  useEffect(() => {
    if (id && user) {
      loadTemplate(id);
    } else if (!id) {
      resetWorkflow();
    }
  }, [id, user, loadTemplate, resetWorkflow]);

  const handleSave = useCallback(async () => {
    if (!user || !templateData) return;

    setIsSaving(true);
    try {
      await updateTemplate(templateData.id, {
        nodes: nodes as unknown as Json,
        edges: edges as unknown as Json,
      });

      setIsDirty(false);
      toast({
        title: 'Saved',
        description: 'Template workflow saved successfully',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, user, templateData, setIsDirty, toast]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeTypeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{templateData?.name || 'Template Editor'}</span>
            <Badge variant="secondary">Template</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-border overflow-y-auto">
          <NodeLibrary onDragStart={onDragStart} />
        </div>
        <div className="flex-1 relative w-full h-full" style={{ minWidth: 0, minHeight: 0 }}>
          <WorkflowCanvas />
        </div>
        <div className="w-80 border-l border-border overflow-y-auto">
          <PropertiesPanel />
        </div>
      </div>
      <ExecutionConsole isExpanded={consoleExpanded} onToggle={() => setConsoleExpanded(!consoleExpanded)} />
    </div>
  );
}

