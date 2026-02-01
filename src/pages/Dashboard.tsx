import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, Play, FolderOpen, LayoutTemplate, History, Settings, MoreHorizontal, Copy, Trash2, Clock, Bot, Workflow, MessageSquare, Sparkles, Wrench, ArrowLeft, Sun, Moon, Activity } from "lucide-react";
import ConnectionsPanel from "@/components/ConnectionsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tables, Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { is406Error } from "@/lib/utils";

type Workflow = Tables<'workflows'> & {
  last_execution?: { started_at: string; status: string } | null;
  execution_count?: number;
  workflow_type?: 'chatbot' | 'agent' | 'automation';
};

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { canAccessAdmin } = useRole();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    executionsToday: 0,
    active: 0,
  });
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Suppress 406 errors from executions queries (expected when workflows have no executions)
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const shouldSuppress406Error = (args: any[]): boolean => {
      const errorString = args.map(arg => 
        typeof arg === 'string' ? arg : 
        arg?.toString?.() || JSON.stringify(arg)
      ).join(' ');
      
      // Only suppress 406 errors related to executions endpoint
      return (
        errorString.includes('406') &&
        (errorString.includes('executions') || 
         errorString.includes('/rest/v1/executions'))
      );
    };
    
    console.error = (...args: any[]) => {
      if (!shouldSuppress406Error(args)) {
        originalConsoleError.apply(console, args);
      }
    };
    
    console.warn = (...args: any[]) => {
      if (!shouldSuppress406Error(args)) {
        originalConsoleWarn.apply(console, args);
      }
    };
    
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const detectWorkflowType = (nodes: Json): 'chatbot' | 'agent' | 'automation' => {
    if (!Array.isArray(nodes)) return 'automation';
    
    const nodeTypes = nodes.map((n: any) => n?.data?.type || n?.type).filter(Boolean);
    
    const hasAINodes = nodeTypes.some((type: string) => 
      ['openai_gpt', 'anthropic_claude', 'google_gemini', 'memory'].includes(type)
    );
    
    const hasReasoning = nodeTypes.some((type: string) => 
      type.includes('reasoning') || type.includes('agent')
    );
    
    if (hasReasoning) return 'agent';
    if (hasAINodes && nodeTypes.includes('webhook')) return 'chatbot';
    if (hasAINodes) return 'agent';
    return 'automation';
  };

  const loadWorkflows = useCallback(async () => {
    try {
      let query = supabase
        .from('workflows')
        .select('*');

      // Filter by active status if filterActive is true
      if (filterActive) {
        query = query.eq('status', 'active');
      }

      const { data: workflowsData, error: workflowsError } = await query
        .order('updated_at', { ascending: false })
        .limit(6); // Show latest 6 workflows on dashboard

      if (workflowsError) throw workflowsError;

      const workflowsWithStats = await Promise.all(
        (workflowsData || []).map(async (workflow) => {
          try {
            // Use maybeSingle() instead of single() to handle workflows with no executions
            let lastExec = null;
            let count = 0;
            
            try {
              // Query latest execution for this workflow
              // NOTE: PostgREST returns 406 (Not Acceptable) when:
              // 1. Query is syntactically valid
              // 2. RLS policy is enabled
              // 3. No rows match the query (workflow has no executions yet)
              // This is expected behavior - 406 means "no visible rows" not "permission denied"
              // We handle this gracefully by treating 406 as "no executions yet"
              const { data, error: execError } = await supabase
                .from('executions')
                .select('started_at, status')
                .eq('workflow_id', workflow.id)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              // Handle errors gracefully
              if (execError) {
                if (is406Error(execError)) {
                  // 406 = No executions exist for this workflow (expected)
                  lastExec = null;
                } else if (execError.code === 'PGRST301' || execError.message?.includes('permission denied') || execError.message?.includes('row-level security')) {
                  // Permission/RLS error - log for debugging but don't break the UI
                  console.warn(`Permission error loading execution for workflow ${workflow.id}:`, execError.message);
                  lastExec = null;
                } else {
                  // Other errors - log for debugging
                  console.warn(`Error loading execution for workflow ${workflow.id}:`, {
                    code: execError.code,
                    message: execError.message,
                    details: execError.details,
                    hint: execError.hint
                  });
                  lastExec = null;
                }
              } else {
                lastExec = data || null;
              }
            } catch (execErr: any) {
              // Handle unexpected errors
              if (is406Error(execErr)) {
                // 406 is expected - suppress
                lastExec = null;
              } else {
                // Log other errors for debugging
                console.warn(`Unexpected error loading execution for workflow ${workflow.id}:`, {
                  message: execErr?.message,
                  code: execErr?.code,
                  stack: execErr?.stack
                });
                lastExec = null;
              }
            }

            try {
              // Count executions for this workflow
              // NOTE: 406 errors are expected when workflow has no executions
              // PostgREST returns 406 for empty result sets with RLS enabled
              const { count: execCount, error: countError } = await supabase
                .from('executions')
                .select('*', { count: 'exact', head: true })
                .eq('workflow_id', workflow.id);

              // Handle errors gracefully
              if (countError) {
                if (is406Error(countError)) {
                  // 406 = No executions exist (expected) - treat as 0
                  count = 0;
                } else if (countError.code === 'PGRST301' || countError.message?.includes('permission denied') || countError.message?.includes('row-level security')) {
                  // Permission/RLS error - log for debugging but don't break the UI
                  console.warn(`Permission error counting executions for workflow ${workflow.id}:`, countError.message);
                  count = 0;
                } else {
                  // Other errors - log for debugging
                  console.warn(`Error counting executions for workflow ${workflow.id}:`, {
                    code: countError.code,
                    message: countError.message,
                    details: countError.details,
                    hint: countError.hint
                  });
                  count = 0;
                }
              } else {
                count = execCount || 0;
              }
            } catch (countErr: any) {
              // Suppress 406 errors in catch block as well
              if (!is406Error(countErr)) {
                console.warn(`Error counting executions for workflow ${workflow.id}:`, countErr);
              }
            }

            return {
              ...workflow,
              last_execution: lastExec || null,
              execution_count: count || 0,
              workflow_type: detectWorkflowType(workflow.nodes),
            };
          } catch (error) {
            // If there's an error loading stats for a workflow, still return the workflow with defaults
            console.warn(`Error loading stats for workflow ${workflow.id}:`, error);
            return {
              ...workflow,
              last_execution: null,
              execution_count: 0,
              workflow_type: detectWorkflowType(workflow.nodes),
            };
          }
        })
      );

      setWorkflows(workflowsWithStats);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setWorkflowsLoading(false);
    }
  }, [filterActive]);

  const loadStats = useCallback(async () => {
    try {
      // Total workflows
      const { count: totalCount } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true });

      // Executions today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('executions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', today.toISOString());

      // Active workflows
      const { count: activeCount } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        total: totalCount || 0,
        executionsToday: todayCount || 0,
        active: activeCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadWorkflows();
      loadStats();
    }
  }, [user, loadWorkflows, loadStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'paused': return 'bg-warning/10 text-warning border-warning/20';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWorkflowTypeIcon = (type?: string) => {
    switch (type) {
      case 'chatbot': return <MessageSquare className="h-4 w-4" />;
      case 'agent': return <Bot className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const getWorkflowTypeLabel = (type?: string) => {
    switch (type) {
      case 'chatbot': return 'Chatbot';
      case 'agent': return 'AI Agent';
      default: return 'Automation';
    }
  };

  const duplicateWorkflow = async (workflow: Workflow) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
          status: 'draft',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Workflow duplicated successfully',
      });

      loadWorkflows();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate workflow',
        variant: 'destructive',
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });

      loadWorkflows();
      loadStats();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    }
  };


  if (loading) {
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
            <div className="flex h-9 w-9 items-center justify-center">
              <img src="/favicon.ico" alt="logo" className="h-full w-full" />
            </div>
            <span className="text-xl font-bold">CtrlChecks</span>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionsPanel />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/templates')}
              className="hidden sm:flex"
            >
              <LayoutTemplate className="mr-2 h-4 w-4" /> Templates
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/workflows')}
              className="hidden sm:flex"
            >
              <FolderOpen className="mr-2 h-4 w-4" /> Workflows
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/executions')}
              className="hidden sm:flex"
            >
              <History className="mr-2 h-4 w-4" /> Executions
            </Button>
            {canAccessAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="hidden sm:flex"
              >
                <Settings className="mr-2 h-4 w-4" /> Admin
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your workflows</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="gradient-primary text-primary-foreground" onClick={() => setShowCreateOptions(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card 
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => navigate('/workflows')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={() => navigate('/executions')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Executions Today</CardTitle>
              <Play className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executionsToday}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${filterActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => {
              setFilterActive(!filterActive);
              setWorkflowsLoading(true);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
              <Activity className={`h-4 w-4 ${filterActive ? 'text-primary' : 'text-success'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              {filterActive && (
                <p className="text-xs text-muted-foreground mt-1">Click to show all</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflows Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {filterActive ? 'Active Workflows' : 'Your Workflows'}
            </h2>
            {workflows.length > 0 && (
              <Button variant="outline" onClick={() => navigate('/workflows')}>
                View All
              </Button>
            )}
          </div>

          {workflowsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Zap className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  No workflows created yet. Start by creating your first AI agent or automation workflow.
                </p>
                <Button className="gradient-primary text-primary-foreground" onClick={() => setShowCreateOptions(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/workflow/${workflow.id}`)}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {workflow.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${workflow.id}`); }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateWorkflow(workflow); }}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteWorkflow(workflow.id); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {getWorkflowTypeIcon(workflow.workflow_type)}
                          {getWorkflowTypeLabel(workflow.workflow_type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {workflow.execution_count || 0} executions
                        </div>
                        {workflow.last_execution && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(workflow.last_execution.started_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Updated</span>
                        <span>{new Date(workflow.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Workflow Creation Options Overlay */}
      {showCreateOptions && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateOptions(false);
            }
          }}
        >
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          
          {/* Content */}
          <div className="relative z-10 w-full max-w-4xl px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => setShowCreateOptions(false)}
              className="mb-4"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold mb-1.5">Create New Workflow</h1>
              <p className="text-muted-foreground text-sm">
                Choose how you'd like to create your workflow
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Manual Creation Option */}
              <Card className="cursor-pointer transition-shadow border hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Create Workflow Manually</CardTitle>
                  <CardDescription className="text-sm mt-1.5">
                    Build your workflow step by step using our visual workflow builder. 
                    Drag and drop nodes, configure each step, and connect them together.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full gradient-primary text-primary-foreground"
                    onClick={() => {
                      setShowCreateOptions(false);
                      navigate('/workflow/new');
                    }}
                  >
                    Start Building
                  </Button>
                </CardContent>
              </Card>

              {/* AI Creation Option */}
              <Card className="cursor-pointer transition-shadow border hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Create Using AI</CardTitle>
                  <CardDescription className="text-sm mt-1.5">
                    Describe your workflow in natural language and let AI automatically 
                    generate the workflow structure for you. Perfect for quick prototyping.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full gradient-primary text-primary-foreground"
                    onClick={() => {
                      setShowCreateOptions(false);
                      navigate('/workflow/ai');
                    }}
                  >
                    Generate with AI
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
