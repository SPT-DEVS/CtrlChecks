import { useState, useEffect, useCallback } from 'react';
import { Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWorkflowStore } from '@/stores/workflowStore';

interface AgentSettingsProps {
  workflowId: string | null;
}

export default function AgentSettings({ workflowId }: AgentSettingsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    goal: '',
    maxIterations: 10,
    reasoningModel: 'gpt-4o',
    actionModel: 'gpt-4o',
    memoryEnabled: true,
    temperature: 0.3,
  });
  const [workflowType, setWorkflowType] = useState<'automation' | 'chatbot' | 'agent'>('automation');

  const loadConfig = useCallback(async () => {
    if (!workflowId) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('workflow_type, agent_config')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      if (data) {
        const workflowData = data as any;
        setWorkflowType(workflowData.workflow_type || 'automation');
        if (workflowData.agent_config) {
          setConfig({
            goal: workflowData.agent_config.goal || '',
            maxIterations: workflowData.agent_config.maxIterations || 10,
            reasoningModel: workflowData.agent_config.reasoningModel || 'gpt-4o',
            actionModel: workflowData.agent_config.actionModel || 'gpt-4o',
            memoryEnabled: workflowData.agent_config.memoryEnabled !== false,
            temperature: workflowData.agent_config.temperature || 0.3,
          });
        }
      }
    } catch (error) {
      console.error('Error loading agent config:', error);
    }
  }, [workflowId]);

  useEffect(() => {
    if (workflowId && open) {
      loadConfig();
    }
  }, [workflowId, open, loadConfig]);

  const saveConfig = async () => {
    if (!workflowId) {
      toast({
        title: 'Error',
        description: 'Please save the workflow first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          workflow_type: workflowType,
          agent_config: config,
        } as any)
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Agent configuration saved successfully',
      });

      setOpen(false);
    } catch (error) {
      console.error('Error saving agent config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save agent configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="mr-2 h-4 w-4" />
          Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Configuration</DialogTitle>
          <DialogDescription>
            Configure AI agent settings for this workflow. Set the goal and reasoning parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Workflow Type */}
          <div className="space-y-2">
            <Label>Workflow Type</Label>
            <div className="flex gap-2">
              <Button
                variant={workflowType === 'automation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkflowType('automation')}
              >
                Automation
              </Button>
              <Button
                variant={workflowType === 'chatbot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkflowType('chatbot')}
              >
                Chatbot
              </Button>
              <Button
                variant={workflowType === 'agent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkflowType('agent')}
              >
                AI Agent
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {workflowType === 'agent' && 'Agent workflows use reasoning to plan and execute actions step-by-step.'}
              {workflowType === 'chatbot' && 'Chatbot workflows are conversational and maintain memory.'}
              {workflowType === 'automation' && 'Automation workflows execute nodes in sequence.'}
            </p>
          </div>

          {workflowType === 'agent' && (
            <>
              {/* Goal */}
              <div className="space-y-2">
                <Label htmlFor="goal">Agent Goal *</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Process all pending orders and send confirmation emails"
                  value={config.goal}
                  onChange={(e) => setConfig({ ...config, goal: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Define what the agent should accomplish. Be specific and clear.
                </p>
              </div>

              {/* Max Iterations */}
              <div className="space-y-2">
                <Label htmlFor="maxIterations">Max Iterations</Label>
                <Input
                  id="maxIterations"
                  type="number"
                  min={1}
                  max={50}
                  value={config.maxIterations}
                  onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) || 10 })}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of reasoning-action cycles the agent can perform.
                </p>
              </div>

              {/* Reasoning Model */}
              <div className="space-y-2">
                <Label htmlFor="reasoningModel">Reasoning Model</Label>
                <select
                  id="reasoningModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={config.reasoningModel}
                  onChange={(e) => setConfig({ ...config, reasoningModel: e.target.value })}
                >
                  <optgroup label="OpenAI">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </optgroup>
                  <optgroup label="Anthropic Claude">
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </optgroup>
                  <optgroup label="Google Gemini">
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </optgroup>
                </select>
                <p className="text-sm text-muted-foreground">
                  Model used for reasoning and decision-making. GPT-4o or Gemini 2.5 Pro recommended for best results.
                </p>
              </div>

              {/* Action Model */}
              <div className="space-y-2">
                <Label htmlFor="actionModel">Action Model</Label>
                <select
                  id="actionModel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={config.actionModel}
                  onChange={(e) => setConfig({ ...config, actionModel: e.target.value })}
                >
                  <optgroup label="OpenAI">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </optgroup>
                  <optgroup label="Anthropic Claude">
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </optgroup>
                  <optgroup label="Google Gemini">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </optgroup>
                </select>
                <p className="text-sm text-muted-foreground">
                  Model used for executing actions. Can be different from reasoning model. Gemini Flash is fast and cost-effective.
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.3 })}
                />
                <p className="text-sm text-muted-foreground">
                  Lower values (0.1-0.3) for more focused reasoning. Higher values (0.7-1.0) for more creative thinking.
                </p>
              </div>

              {/* Memory Enabled */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="memoryEnabled">Enable Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow agent to remember previous reasoning steps and actions
                  </p>
                </div>
                <Switch
                  id="memoryEnabled"
                  checked={config.memoryEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, memoryEnabled: checked })}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={loading || (workflowType === 'agent' && !config.goal)}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

