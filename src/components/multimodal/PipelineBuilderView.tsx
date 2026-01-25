/**
 * PipelineBuilderView Component
 * 
 * Shows the pipeline steps with:
 * - Selected Tool
 * - Selected Model
 * - Input/Output schema
 * - Status indicators (building, running, error, success)
 * - Interactive controls (change model, re-run, disable/enable)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Play, RefreshCw, Settings, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { PROCESSORS_REGISTRY, getToolByTask } from '@/lib/tools-registry';

export type StepStatus = 'pending' | 'building' | 'running' | 'success' | 'error' | 'disabled';

export interface PipelineStep {
  id: string;
  stepNumber: number;
  type: 'input' | 'transformation' | 'output';
  description: string;
  toolId?: string;
  toolName?: string;
  task?: string;
  modelName?: string;
  modelProvider?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  status: StepStatus;
  error?: string;
  result?: any;
  executionTime?: number;
}

interface PipelineBuilderViewProps {
  steps: PipelineStep[];
  onStepModelChange?: (stepId: string, modelName: string) => void;
  onStepRerun?: (stepId: string) => void;
  onStepToggle?: (stepId: string, enabled: boolean) => void;
  onStepEdit?: (stepId: string) => void;
}

const statusIcons: Record<StepStatus, React.ReactNode> = {
  pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  building: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  disabled: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
};

const statusColors: Record<StepStatus, string> = {
  pending: 'border-muted-foreground/30',
  building: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  running: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  success: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  error: 'border-red-500 bg-red-50 dark:bg-red-950/20',
  disabled: 'border-muted-foreground/30 opacity-50',
};

export default function PipelineBuilderView({
  steps,
  onStepModelChange,
  onStepRerun,
  onStepToggle,
  onStepEdit,
}: PipelineBuilderViewProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getAvailableModels = (task?: string): Array<{ name: string; provider: string }> => {
    if (!task) return [];
    const toolInfo = getToolByTask(task);
    if (!toolInfo) return [];
    
    // Return empty for now - models would come from backend configuration
    // This is a placeholder for future model selection
    return [];
  };

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Steps</CardTitle>
          <CardDescription>Pipeline will be built after prompt analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Steps</CardTitle>
        <CardDescription>{steps.length} step{steps.length !== 1 ? 's' : ''} in pipeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          const status = step.status;
          const availableModels = getAvailableModels(step.task);

          return (
            <div
              key={step.id}
              className={`border rounded-lg p-4 transition-colors ${statusColors[status]}`}
            >
              {/* Step Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleStep(step.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      {statusIcons[status]}
                      <Badge variant="outline">Step {step.stepNumber}</Badge>
                      <span className="font-semibold">{step.description}</span>
                    </div>
                  </div>

                  {/* Step Metadata - Always Visible */}
                  <div className="mt-2 ml-9 flex flex-wrap gap-2 items-center">
                    {step.toolName && (
                      <Badge variant="secondary">{step.toolName}</Badge>
                    )}
                    {step.task && (
                      <Badge variant="outline">{step.task}</Badge>
                    )}
                    {step.modelName && (
                      <Badge variant="outline" className="gap-1">
                        <span className="text-xs">{step.modelName}</span>
                      </Badge>
                    )}
                    {step.executionTime && (
                      <span className="text-xs text-muted-foreground">
                        {step.executionTime.toFixed(2)}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Actions */}
                <div className="flex items-center gap-2">
                  {step.status !== 'disabled' && (
                    <>
                      {onStepModelChange && availableModels.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Model
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {availableModels.map((model, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={() => onStepModelChange(step.id, model.name)}
                              >
                                {model.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {onStepRerun && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStepRerun(step.id)}
                          disabled={status === 'running' || status === 'building'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {onStepToggle && (
                    <Switch
                      checked={step.status !== 'disabled'}
                      onCheckedChange={(checked) => onStepToggle(step.id, checked)}
                    />
                  )}
                </div>
              </div>

              {/* Step Details - Expandable */}
              {isExpanded && (
                <div className="mt-4 ml-9 space-y-3 pt-3 border-t">
                  {/* Input Schema */}
                  {step.inputSchema && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Input Schema</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(step.inputSchema, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Output Schema */}
                  {step.outputSchema && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Output Schema</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(step.outputSchema, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Message */}
                  {step.error && (
                    <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded text-sm text-red-800 dark:text-red-300">
                      <strong>Error:</strong> {step.error}
                    </div>
                  )}

                  {/* Result Preview */}
                  {step.result && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Result Preview</div>
                      <div className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                        {typeof step.result === 'string' 
                          ? step.result.substring(0, 200) + (step.result.length > 200 ? '...' : '')
                          : JSON.stringify(step.result, null, 2).substring(0, 200)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

