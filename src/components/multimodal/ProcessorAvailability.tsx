/**
 * ProcessorAvailability Component
 * 
 * Shows which processors are available vs not available
 * based on what the user asked for in their prompt.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileText, Image as ImageIcon, Music } from 'lucide-react';
import { PROCESSORS_REGISTRY, Processor } from '@/lib/tools-registry';

interface ProcessorAvailabilityProps {
  requestedProcessors: Array<'text' | 'image' | 'audio'>;
}

const processorIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
};

export default function ProcessorAvailability({ requestedProcessors }: ProcessorAvailabilityProps) {
  if (requestedProcessors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processor Availability</CardTitle>
          <CardDescription>Submit a prompt to see which processors are available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check availability for each requested processor
  const availability = requestedProcessors.map(type => {
    const processor = PROCESSORS_REGISTRY.find(p => p.type === type);
    return {
      type,
      name: processor?.name || `${type} Processor`,
      available: !!processor,
      processor: processor || null,
    };
  });

  const availableProcessors = availability.filter(a => a.available);
  const unavailableProcessors = availability.filter(a => !a.available);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processor Availability</CardTitle>
        <CardDescription>
          Processors requested vs available in Tools Registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Processors */}
        {availableProcessors.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Available ({availableProcessors.length})
            </div>
            <div className="space-y-2">
              {availableProcessors.map(({ type, name, processor }) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/20"
                >
                  <div className="flex items-center gap-2">
                    {processorIcons[type]}
                    <span className="font-medium">{name}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unavailable Processors */}
        {unavailableProcessors.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Not Available ({unavailableProcessors.length})
            </div>
            <div className="space-y-2">
              {unavailableProcessors.map(({ type, name }) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex items-center gap-2">
                    {processorIcons[type]}
                    <span className="font-medium">{name}</span>
                  </div>
                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                    Not Present
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

