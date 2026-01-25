import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { 
  Search, Clock, CheckCircle, XCircle, Loader2, 
  ChevronRight, RefreshCw, Filter, Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Execution = Tables<'executions'> & {
  workflows?: { name: string } | null;
};

export default function Executions() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadExecutions();
    }
  }, [user]);

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('executions')
        .select('*, workflows(name)')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load executions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const retryExecution = async (execution: Execution) => {
    try {
      toast({ title: 'Retrying...', description: 'Starting execution' });
      
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/execute-workflow`, {
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

      loadExecutions();
    } catch (error) {
      console.error('Retry error:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry execution',
        variant: 'destructive',
      });
    }
  };

  const filteredExecutions = executions.filter((e) => {
    const matchesSearch = e.workflows?.name?.toLowerCase().includes(search.toLowerCase()) || 
                          e.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-muted text-muted-foreground';
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center">
                <img src="/favicon.ico" alt="logo" className="h-full w-full" />
              </div>
              <span className="text-xl font-bold">CtrlChecks</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Executions</h1>
            <p className="text-muted-foreground mt-1">View workflow execution history and logs</p>
          </div>
          <Button variant="outline" onClick={loadExecutions}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by workflow name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Executions List */}
        {filteredExecutions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Clock className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No executions yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Run a workflow to see execution history here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredExecutions.map((execution) => (
              <Card
                key={execution.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/execution/${execution.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="font-medium">
                          {execution.workflows?.name || 'Unknown Workflow'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {execution.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      
                      <div className="text-sm text-muted-foreground w-20 text-right">
                        {formatDuration(execution.duration_ms)}
                      </div>

                      <div className="text-sm text-muted-foreground w-40 text-right">
                        {new Date(execution.started_at).toLocaleString()}
                      </div>

                      {execution.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); retryExecution(execution); }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/workflow/${execution.workflow_id}`); 
                        }}
                        title="Edit workflow"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
