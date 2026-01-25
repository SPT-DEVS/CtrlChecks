/**
 * Tools Registry
 * 
 * Defines available processors and their specific tools/tasks.
 * Used for prompt analysis and dynamic UI generation.
 */

export interface ProcessorTool {
  id: string;
  name: string;
  description: string;
  task: string; // Backend task name
}

export interface Processor {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio';
  description: string;
  backendProcessor: 'text_processor' | 'image_processor' | 'audio_processor';
  tools: ProcessorTool[];
}

/**
 * Available Processors Registry with their tools
 */
export const PROCESSORS_REGISTRY: Processor[] = [
  {
    id: 'text_processor',
    name: 'Text Processor',
    type: 'text',
    description: 'Processes text for various NLP tasks',
    backendProcessor: 'text_processor',
    tools: [
      { id: 'chat', name: 'Chat', description: 'Chat/conversation with AI', task: 'chat' },
      { id: 'summarize', name: 'Summarize', description: 'Summarize text content', task: 'summarize' },
      { id: 'translate', name: 'Translate', description: 'Translate text to another language', task: 'translate' },
      { id: 'extract', name: 'Extract', description: 'Extract key information from text', task: 'extract' },
      { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze sentiment of text', task: 'sentiment' },
      { id: 'generate', name: 'Generate Text', description: 'Generate text content', task: 'generate' },
      { id: 'qa', name: 'Question Answering', description: 'Answer questions about text', task: 'qa' },
    ],
  },
  {
    id: 'image_processor',
    name: 'Image Processor',
    type: 'image',
    description: 'Processes images for captioning, analysis, and generation',
    backendProcessor: 'image_processor',
    tools: [
      { id: 'image_caption', name: 'Image Caption', description: 'Generate image caption', task: 'image_caption' },
      { id: 'story', name: 'Story Generation', description: 'Generate detailed story from image', task: 'story' },
      { id: 'image_prompt', name: 'Image Prompt', description: 'Generate Stable Diffusion prompt from image', task: 'image_prompt' },
      { id: 'text_to_image', name: 'Text to Image', description: 'Generate image from text prompt', task: 'text_to_image' },
    ],
  },
  {
    id: 'audio_processor',
    name: 'Audio Processor',
    type: 'audio',
    description: 'Processes audio for transcription and speech synthesis',
    backendProcessor: 'audio_processor',
    tools: [
      { id: 'transcribe', name: 'Transcribe', description: 'Transcribe audio to text', task: 'transcribe' },
      { id: 'text_to_speech', name: 'Text to Speech', description: 'Convert text to speech', task: 'text_to_speech' },
    ],
  },
];

/**
 * Get processor by ID
 */
export function getProcessorById(id: string): Processor | undefined {
  return PROCESSORS_REGISTRY.find(proc => proc.id === id);
}

/**
 * Get processor by type
 */
export function getProcessorByType(type: 'text' | 'image' | 'audio'): Processor | undefined {
  return PROCESSORS_REGISTRY.find(proc => proc.type === type);
}

/**
 * Get all processors
 */
export function getAllProcessors(): Processor[] {
  return PROCESSORS_REGISTRY;
}

/**
 * Get tool by task name
 */
export function getToolByTask(task: string): { processor: Processor; tool: ProcessorTool } | undefined {
  for (const processor of PROCESSORS_REGISTRY) {
    const tool = processor.tools.find(t => t.task === task);
    if (tool) {
      return { processor, tool };
    }
  }
  return undefined;
}

/**
 * Check if processor is available
 */
export function isProcessorAvailable(processorId: string): boolean {
  return PROCESSORS_REGISTRY.some(proc => proc.id === processorId);
}
