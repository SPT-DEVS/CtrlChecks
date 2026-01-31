import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Loader2, 
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import ExecutionLogBlock from '@/components/workflow/ExecutionLogBlock';

type Execution = Tables<'executions'> & {
  workflows?: { name: string } | null;
};

interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export default function ExecutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      loadExecution(id);
    }
  }, [id, user]);

  const loadExecution = async (executionId: string) => {
    try {
      const { data, error } = await supabase
        .from('executions')
        .select('*, workflows(name)')
        .eq('id', executionId)
        .single();

      if (error) throw error;
      setExecution(data);
    } catch (error) {
      console.error('Error loading execution:', error);
      toast({
        title: 'Error',
        description: 'Failed to load execution details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const retryExecution = async () => {
    if (!execution) return;
    
    try {
      toast({ title: 'Retrying...', description: 'Starting execution' });
      
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/api/execute-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ workflowId: execution.workflow_id, input: execution.input }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Execution failed' }));
        throw new Error(error.error || error.message || 'Execution failed');
      }

      const data = await response.json();

      toast({
        title: data.status === 'success' ? 'Success' : 'Failed',
        description: data.status === 'success' ? 'Workflow executed successfully' : 'Workflow execution failed',
        variant: data.status === 'success' ? 'default' : 'destructive',
      });

      // Navigate to new execution
      if (data.executionId) {
        navigate(`/execution/${data.executionId}`);
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry execution',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !execution) return null;

  const logs = (execution.logs as unknown as ExecutionLog[]) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/executions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center">
                <img src="/favicon.ico" alt="logo" className="h-full w-full" />
              </div>
              <div>
                <span className="text-lg font-bold">{execution.workflows?.name || 'Execution'}</span>
                <div className="text-xs text-muted-foreground font-mono">{execution.id.slice(0, 8)}...</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(execution.status)}>
              {execution.status}
            </Badge>
            {execution.status === 'failed' && (
              <Button size="sm" onClick={retryExecution}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                <span className="font-semibold capitalize">{execution.status}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatDuration(execution.duration_ms)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{new Date(execution.started_at).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trigger</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{execution.trigger}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {execution.error && (
          <Card className="mb-8 border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-destructive whitespace-pre-wrap font-mono bg-destructive/10 p-3 rounded">
                {execution.error}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No execution logs available</p>
            ) : (
              <div className="space-y-0">
                {logs.map((log, index) => (
                  <ExecutionLogBlock
                    key={log.nodeId || index}
                    log={{
                      nodeId: log.nodeId || `node-${index}`,
                      nodeName: log.nodeName || log.nodeId || `Node ${index + 1}`,
                      nodeType: (log as any).nodeType,
                      status: log.status || 'unknown',
                      startedAt: log.startedAt || new Date().toISOString(),
                      finishedAt: log.finishedAt,
                      input: log.input,
                      output: log.output,
                      error: log.error,
                    }}
                    index={index}
                    totalNodes={logs.length}
                    isLast={index === logs.length - 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input/Output */}
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Input</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-60">
                {JSON.stringify(execution.input, null, 2) || 'null'}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-60">
                {JSON.stringify(execution.output, null, 2) || 'null'}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
