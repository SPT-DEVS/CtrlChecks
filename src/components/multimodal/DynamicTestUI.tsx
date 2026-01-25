/**
 * DynamicTestUI Component
 * 
 * Renders test UIs for processors that the user requested.
 * Only shows processors that were requested in the prompt.
 * Uses the same UI components as the Tools section.
 */

import TextProcessing from '@/components/multimodal/TextProcessing';
import ImageProcessing from '@/components/multimodal/ImageProcessing';
import AudioProcessing from '@/components/multimodal/AudioProcessing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PROCESSORS_REGISTRY } from '@/lib/tools-registry';

interface DynamicTestUIProps {
  requestedProcessors: Array<'text' | 'image' | 'audio'>;
}

export default function DynamicTestUI({ requestedProcessors }: DynamicTestUIProps) {
  if (requestedProcessors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Processors</CardTitle>
          <CardDescription>Submit a prompt to test processors</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get available processors only
  const availableProcessors = requestedProcessors
    .map(type => PROCESSORS_REGISTRY.find(p => p.type === type))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (availableProcessors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Processors</CardTitle>
          <CardDescription>No available processors found for your request</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {availableProcessors.map(processor => (
        <Card key={processor.id}>
          <CardHeader>
            <CardTitle>{processor.name}</CardTitle>
            <CardDescription>{processor.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {processor.type === 'text' && <TextProcessing />}
            {processor.type === 'image' && <ImageProcessing />}
            {processor.type === 'audio' && <AudioProcessing />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

