import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface WorkflowVisualizationProps {
  pipeline: any;
}

export default function WorkflowVisualization({ pipeline }: WorkflowVisualizationProps) {
  if (!pipeline || !pipeline.steps) {
    return null;
  }

  const getStepIcon = (step: any) => {
    if (step.type === 'input') {
      return '📥';
    } else if (step.type === 'transformation') {
      return '🧠';
    } else if (step.type === 'output') {
      return '🎨';
    }
    return '⚙️';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your AI Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {pipeline.steps.map((step: any, index: number) => (
            <div key={index} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-2xl border-2 border-primary/20">
                  {getStepIcon(step)}
                </div>
                <span className="text-xs text-center max-w-[80px] truncate">
                  {step.description || step.type}
                </span>
              </div>
              {index < pipeline.steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

