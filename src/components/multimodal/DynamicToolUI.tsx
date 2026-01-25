/**
 * DynamicToolUI Component
 * 
 * Renders UI for specific tools within a selected processor.
 * Only shows the tools that were selected from the prompt analysis.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PROCESSORS_REGISTRY, getProcessorById } from '@/lib/tools-registry';
import TextProcessing from '@/components/multimodal/TextProcessing';
import ImageProcessing from '@/components/multimodal/ImageProcessing';
import AudioProcessing from '@/components/multimodal/AudioProcessing';

interface DynamicToolUIProps {
  processorId: string;
  selectedTools: string[]; // Tool task names
}

export default function DynamicToolUI({ processorId, selectedTools }: DynamicToolUIProps) {
  const processor = getProcessorById(processorId);

  if (!processor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processor Not Found</CardTitle>
          <CardDescription>The selected processor is not available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (selectedTools.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{processor.name}</CardTitle>
          <CardDescription>No specific tools selected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filter tools to only show selected ones
  const selectedToolObjects = processor.tools.filter(tool => 
    selectedTools.includes(tool.task)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{processor.name}</CardTitle>
        <CardDescription>
          Selected tools: {selectedToolObjects.map(t => t.name).join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Render the processor UI component with filtered tools */}
        {processor.type === 'text' && <TextProcessing selectedTools={selectedTools} />}
        {processor.type === 'image' && <ImageProcessing selectedTools={selectedTools} />}
        {processor.type === 'audio' && <AudioProcessing selectedTools={selectedTools} />}
      </CardContent>
    </Card>
  );
}

