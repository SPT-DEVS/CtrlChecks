/**
 * PromptAnalysis Component
 * 
 * Displays the parsed intent analysis from the user prompt.
 * Shows ONLY processors (no models).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, Image as ImageIcon, Music } from 'lucide-react';

interface PromptAnalysisProps {
  analysis: {
    goal?: string;
    requestedProcessors?: Array<'text' | 'image' | 'audio'>;
    selectedProcessor?: string;
    selectedTools?: string[];
  } | null;
}

const processorIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
};

export default function PromptAnalysis({ analysis }: PromptAnalysisProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Prompt Analysis
          </CardTitle>
          <CardDescription>Analysis will appear here after you submit a prompt</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Prompt Analysis
        </CardTitle>
        <CardDescription>What you asked for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal */}
        {analysis.goal && (
          <div>
            <div className="text-sm font-semibold mb-2">Goal</div>
            <div className="text-sm text-muted-foreground">{analysis.goal}</div>
          </div>
        )}

        {/* Requested Processors */}
        {analysis.requestedProcessors && analysis.requestedProcessors.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Requested Processors</div>
            <div className="flex flex-wrap gap-2">
              {analysis.requestedProcessors.map((type, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {processorIcons[type]}
                  {type} Processor
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
