import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp,
  Terminal, RefreshCw, Trash2, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Json } from '@/integrations/supabase/types';

interface Execution {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
  logs: Json | null;
  output: Json | null;
  input?: Json | null;
}

interface ExecutionConsoleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ExecutionConsole({ isExpanded, onToggle }: ExecutionConsoleProps) {
  const { workflowId, updateNodeStatus, resetWorkflow, resetAllNodeStatuses, nodes } = useWorkflowStore();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const loadExecutions = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('executions')
        .select('id, status, started_at, finished_at, duration_ms, error, logs, output, input')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        // Handle 406 errors gracefully (might be RLS or column issues)
        // 406 can occur when no rows exist and RLS prevents access
        const is406Error = error.code === 'PGRST116' ||
          error.message?.includes('406') ||
          (error as any).status === 406 ||
          (error as any).statusCode === 406;

        if (is406Error) {
          // Silently handle - this is expected when no executions exist yet
          setExecutions([]);
          return;
        }
        throw error;
      }
      setExecutions(data || []);
      if (data && data.length > 0 && !selectedExecution) {
        setSelectedExecution(data[0]);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
      // Set empty array on error to prevent UI issues
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId, selectedExecution]);

  useEffect(() => {
    if (workflowId && isExpanded) {
      loadExecutions();
    }
  }, [workflowId, isExpanded, loadExecutions]);

  const selectedExecutionRef = useRef(selectedExecution);
  useEffect(() => {
    selectedExecutionRef.current = selectedExecution;
  }, [selectedExecution]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!workflowId) return;

    const channel = supabase
      .channel(`executions-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
          filter: `workflow_id=eq.${workflowId}`
        },
        (payload) => {
          console.log('Realtime execution update:', payload);

          if (payload.eventType === 'INSERT') {
            const newExecution = payload.new as Execution;
            setExecutions(prev => [newExecution, ...prev.slice(0, 9)]);
            // Reset all node statuses when a new execution starts
            resetAllNodeStatuses();
            // Reset execution ID tracking to trigger status reset
            setLastExecutionId(null);
            // Auto-select the new execution
            setSelectedExecution(newExecution);
            // Auto-expand console if collapsed (triggered from parent)
          } else if (payload.eventType === 'UPDATE') {
            const updatedExecution = payload.new as Execution;
            setExecutions(prev =>
              prev.map(exec => exec.id === updatedExecution.id ? updatedExecution : exec)
            );
            // Always update selected execution if it's the one being updated
            if (selectedExecutionRef.current?.id === updatedExecution.id) {
              setSelectedExecution(updatedExecution);
            } else if (!selectedExecutionRef.current || updatedExecution.started_at > selectedExecutionRef.current.started_at) {
              // Auto-select if it's newer than current selection
              setSelectedExecution(updatedExecution);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId, resetAllNodeStatuses]);

  // Track the last execution ID to detect when we switch to a different execution
  const [lastExecutionId, setLastExecutionId] = useState<string | null>(null);

  // Sync execution status with canvas nodes
  useEffect(() => {
    const executionId = selectedExecution?.id;

    // Reset all node statuses when switching to a different execution
    if (executionId && executionId !== lastExecutionId) {
      resetAllNodeStatuses();
      setLastExecutionId(executionId);
    }

    if (!selectedExecution?.logs || !Array.isArray(selectedExecution.logs)) {
      return;
    }

    const logs = selectedExecution.logs as any[];

    logs.forEach(log => {
      if (log.nodeId && log.status) {
        // Map log status to node status
        // Log statuses: 'running', 'success', 'failed', 'pending', 'skipped'
        // Node statuses: 'idle', 'running', 'success', 'error'
        let nodeStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';

        switch (log.status) {
          case 'pending': nodeStatus = 'idle'; break; // Show as idle until running
          case 'running': nodeStatus = 'running'; break;
          case 'success': nodeStatus = 'success'; break;
          case 'failed': nodeStatus = 'error'; break;
          case 'skipped': nodeStatus = 'idle'; break; // Skipped nodes remain idle
          default: nodeStatus = 'idle'; break;
        }

        updateNodeStatus(log.nodeId, nodeStatus);
      }
    });
  }, [selectedExecution, updateNodeStatus, resetAllNodeStatuses, lastExecutionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 text-success" />;
      case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'running': return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatLogs = (logs: Json | null): string => {
    if (!logs) return 'No logs available';
    if (Array.isArray(logs)) {
      return logs.map((log: any, i: number) => {
        if (typeof log === 'object' && log !== null) {
          const nodeName = log.nodeName || log.nodeId || `Node ${i + 1}`;
          const status = log.status || 'unknown';
          const statusIcon = status === 'success' ? '✓' : status === 'failed' ? '✗' : status === 'running' ? '⟳' : '○';

          let logText = `\n${'='.repeat(60)}\n`;
          logText += `${statusIcon} [${i + 1}] ${nodeName} (${status})\n`;
          logText += `${'-'.repeat(60)}\n`;

          if (log.startedAt) {
            logText += `Started: ${new Date(log.startedAt).toLocaleTimeString()}\n`;
          }

          if (log.input !== undefined) {
            logText += `\n📥 INPUT:\n${JSON.stringify(log.input, null, 2)}\n`;
          }

          if (log.output !== undefined && log.output !== null) {
            logText += `\n📤 OUTPUT:\n${JSON.stringify(log.output, null, 2)}\n`;
          } else if (log.status === 'success') {
            logText += `\n📤 OUTPUT: (null or empty)\n`;
          }

          if (log.error) {
            logText += `\n❌ ERROR:\n${log.error}\n`;
          }

          if (log.finishedAt) {
            const duration = log.startedAt && log.finishedAt
              ? new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()
              : null;
            logText += `\nFinished: ${new Date(log.finishedAt).toLocaleTimeString()}`;
            if (duration !== null) {
              logText += ` (${duration}ms)`;
            }
            logText += '\n';
          }

          return logText;
        }
        return `[${i + 1}] ${JSON.stringify(log, null, 2)}`;
      }).join('\n');
    }
    return JSON.stringify(logs, null, 2);
  };

  return (
    <div className={cn(
      "border-t border-border bg-card transition-all duration-300 flex-shrink-0",
      isExpanded ? "h-96" : "h-10"
    )}>
      {/* Console Header */}
      <div
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Execution Console</span>
          {executions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {executions.length} runs
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={(e) => { e.stopPropagation(); loadExecutions(); }}
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Console Content */}
      {isExpanded && (
        <div className="h-[calc(100%-40px)] flex">
          {/* Execution List */}
          <div className="w-64 border-r border-border">
            <ScrollArea className="h-full">
              {!workflowId ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Save workflow to see executions
                </div>
              ) : executions.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No executions yet
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {executions.map((exec) => (
                    <div
                      key={exec.id}
                      className={cn(
                        "p-2 rounded-md cursor-pointer text-xs transition-colors",
                        selectedExecution?.id === exec.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedExecution(exec)}
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exec.status)}
                        <span className="font-mono text-xs">{exec.id.slice(0, 8)}...</span>
                        <Badge variant="outline" className={cn("text-xs px-1 py-0", getStatusColor(exec.status))}>
                          {exec.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-muted-foreground text-xs">
                        <span>{new Date(exec.started_at).toLocaleTimeString()}</span>
                        <span>{formatDuration(exec.duration_ms)}</span>
                      </div>
                      {exec.status === 'pending' && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          Waiting to start...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Execution Details */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {selectedExecution ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(selectedExecution.status)}>
                      {selectedExecution.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedExecution.started_at).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Duration: {formatDuration(selectedExecution.duration_ms)}
                    </span>
                  </div>

                  {/* Form URL Display - Show when workflow has form node */}
                  {(() => {
                    const formNode = nodes.find((node: any) => node.data?.type === 'form');
                    if (formNode && workflowId) {
                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                      const formUrl = `${window.location.origin}/form/${workflowId}/${formNode.id}`;
                      return (
                        <div className="p-3 rounded-md bg-primary/10 border border-primary/20 mb-4">
                          <div className="text-xs font-medium text-primary mb-2">📋 Form URL (Readonly)</div>
                          <div className="flex gap-2 items-center">
                            <code className="text-xs font-mono break-all flex-1 bg-background p-2 rounded bg-muted/50">
                              {formUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(formUrl);
                                toast({
                                  title: 'Form URL copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => window.open(formUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Share this URL to collect form submissions. Form Trigger blocks workflow execution until submission. Submissions will appear in the execution console.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {selectedExecution.error && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <div className="text-xs font-medium text-destructive mb-1">Error</div>
                      <pre className="text-xs text-destructive/80 whitespace-pre-wrap">
                        {selectedExecution.error}
                      </pre>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Input</div>
                    <pre className="p-3 rounded-md bg-muted/50 text-xs font-mono whitespace-pre-wrap border border-border">
                      {selectedExecution.input ? JSON.stringify(selectedExecution.input, null, 2) : 'No input data'}
                    </pre>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Execution Logs (Node-by-Node)</div>
                    <pre className="p-3 rounded-md bg-muted text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto">
                      {formatLogs(selectedExecution.logs)}
                    </pre>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Final Output</div>
                    <pre className="p-3 rounded-md bg-muted/50 text-xs font-mono whitespace-pre-wrap border border-border">
                      {selectedExecution.output ? JSON.stringify(selectedExecution.output, null, 2) : 'null (no output generated)'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Select an execution to view details
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
