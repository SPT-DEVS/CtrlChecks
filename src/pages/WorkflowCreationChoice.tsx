import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Wrench, ArrowLeft, Zap } from 'lucide-react';

export default function WorkflowCreationChoice() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
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

        <div className="grid md:grid-cols-3 gap-4">
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
                onClick={() => navigate('/workflow/new')}
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
                onClick={() => navigate('/workflow/ai')}
              >
                Generate with AI
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

