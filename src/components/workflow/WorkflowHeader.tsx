import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Settings, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkflowStore } from '@/stores/workflowStore';
import WebhookSettings from './WebhookSettings';
import ScheduleSettings from './ScheduleSettings';
import ConnectionsPanel from '@/components/ConnectionsPanel';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { workflowScheduler } from '@/lib/workflowScheduler';

interface WorkflowHeaderProps {
  onSave: () => void;
  onRun: (autoSave?: boolean) => void;
  isSaving?: boolean;
  isRunning?: boolean;
  onImport?: (data: any) => void;
}

export default function WorkflowHeader({
  onSave,
  onRun,
  isSaving,
  isRunning,
  onImport
}: WorkflowHeaderProps) {
  const navigate = useNavigate();
  const { workflowId, workflowName, setWorkflowName, isDirty, nodes, edges } = useWorkflowStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if schedule is active on mount and when workflowId changes
  useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      setIsScheduleActive(workflowScheduler.isScheduled(workflowId));
    } else {
      setIsScheduleActive(false);
    }
  }, [workflowId]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const workflowData = JSON.parse(text);
        if (onImport) {
          onImport(workflowData);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to import workflow: ${error instanceof Error ? error.message : 'Invalid JSON file'}`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportClick = async () => {
    if (nodes.length === 0) {
      toast({
        title: 'No workflow to export',
        description: 'Add some nodes to your workflow before exporting',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Prepare base workflow data from store
      const exportData: any = {
        name: workflowName || 'Untitled Workflow',
        nodes: nodes.map(node => {
          // Remove execution status and other runtime data for clean export
          const { executionStatus, ...cleanData } = node.data;
          return {
            ...node,
            data: cleanData,
          };
        }),
        edges: edges.map(edge => {
          // Remove style properties that are runtime-specific
          const { style, ...cleanEdge } = edge;
          return cleanEdge;
        }),
      };

      // If workflow is saved, fetch additional metadata from database
      if (workflowId) {
        try {
          const { data, error } = await supabase
            .from('workflows')
            .select('description, viewport, cron_expression, workflow_type, agent_config, memory_config')
            .eq('id', workflowId)
            .single();

          const workflowData = data as any;

          if (!error && workflowData) {
            // Add shareable metadata (exclude user-specific data)
            if (workflowData.description) {
              exportData.description = workflowData.description;
            }
            if (workflowData.viewport) {
              exportData.viewport = workflowData.viewport;
            }
            if (workflowData.cron_expression) {
              exportData.cron_expression = workflowData.cron_expression;
            }
            if (workflowData.workflow_type) {
              exportData.workflow_type = workflowData.workflow_type;
            }
            if (workflowData.agent_config) {
              exportData.agent_config = workflowData.agent_config;
            }
            if (workflowData.memory_config) {
              exportData.memory_config = workflowData.memory_config;
            }
          }
        } catch (error) {
          console.warn('Could not fetch additional workflow metadata:', error);
          // Continue with export even if metadata fetch fails
        }
      }

      // Add export metadata
      exportData.exported_at = new Date().toISOString();
      exportData.version = '1.0';

      // Create JSON blob and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize filename: remove special characters and replace spaces with underscores
      const sanitizedName = (workflowName || 'workflow')
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      link.download = `${sanitizedName}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Workflow exported as JSON file',
      });
    } catch (error) {
      console.error('Error exporting workflow:', error);
      toast({
        title: 'Export failed',
        description: `Failed to export workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/workflows')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="h-8 w-64"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-lg font-semibold hover:text-primary transition-colors"
            >
              {workflowName}
            </button>
          )}
          {isDirty && (
            <Badge variant="secondary" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ConnectionsPanel />
        <ScheduleSettings workflowId={workflowId} onScheduleChange={setIsScheduleActive} />
        <WebhookSettings workflowId={workflowId} />

        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {isDirty && (
          <WorkflowActionButton
            size="sm"
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => onRun(true)}
            disabled={isRunning || isSaving || isScheduleActive}
            tooltip={isScheduleActive ? 'Manual Run is disabled when schedule is active' : 'Save and run workflow'}
          >
            <Save className="mr-2 h-4 w-4" />
            <Play className="mr-2 h-4 w-4" />
            Save & Run
          </WorkflowActionButton>
        )}

        <WorkflowActionButton
          size="sm"
          className="gradient-primary text-primary-foreground"
          onClick={() => onRun(false)}
          disabled={isRunning || isScheduleActive}
          tooltip={isScheduleActive ? 'Manual Run is disabled when schedule is active' : undefined}
        >
          <Play className="mr-2 h-4 w-4" />
          {isRunning ? 'Running...' : isScheduleActive ? 'Scheduled' : 'Run'}
        </WorkflowActionButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportClick} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export as JSON'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Workflow Settings</DropdownMenuItem>
            <DropdownMenuItem>Version History</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete Workflow</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  );
}