/**
 * Prompt Analyzer
 * 
 * Uses HuggingFace API to analyze user prompts and extract:
 * - Selected processor
 * - Selected tools within that processor
 */

const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "your_huggingface_api_key_here";
const HUGGINGFACE_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";

export interface PromptAnalysisResult {
  selectedProcessor: 'text_processor' | 'image_processor' | 'audio_processor';
  selectedTools: string[]; // Tool task names
  goal: string;
}

/**
 * Analyze prompt using HuggingFace API
 */
export async function analyzePrompt(prompt: string): Promise<PromptAnalysisResult> {
  const analysisPrompt = `Analyze this user request and determine:
1. Which processor to use: text_processor, image_processor, or audio_processor (choose only ONE)
2. Which specific tools/tasks from that processor (list task names)

Available processors and tools:
- text_processor: chat, summarize, translate, extract, sentiment, generate, qa
- image_processor: image_caption, story, image_prompt, text_to_image
- audio_processor: transcribe, text_to_speech

USER REQUEST: "${prompt}"

Respond with ONLY valid JSON in this format:
{
  "processor": "text_processor" | "image_processor" | "audio_processor",
  "tools": ["tool1", "tool2"],
  "reasoning": "brief explanation"
}

Important rules:
- Select ONLY ONE processor (the primary one needed)
- For "text to image" or "generate image", use image_processor with text_to_image tool
- For "analyze image" or "caption image", use image_processor with image_caption tool
- Select only the tools mentioned or implied in the request
- Return ONLY JSON, no markdown or extra text`;

  try {
    const response = await fetch(HUGGINGFACE_ROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract text from response (OpenAI-compatible format)
    let responseText = '';
    if (data.choices && data.choices[0]?.message?.content) {
      responseText = data.choices[0].message.content;
    } else if (typeof data === 'string') {
      responseText = data;
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize processor name
    let processor = parsed.processor || parsed.processor_id;
    if (processor === 'text_processor' || processor === 'text') {
      processor = 'text_processor';
    } else if (processor === 'image_processor' || processor === 'image') {
      processor = 'image_processor';
    } else if (processor === 'audio_processor' || processor === 'audio') {
      processor = 'audio_processor';
    }

    return {
      selectedProcessor: processor,
      selectedTools: Array.isArray(parsed.tools) ? parsed.tools : [],
      goal: prompt.substring(0, 100),
    };
  } catch (error) {
    console.error('Prompt analysis error:', error);
    // Fallback to simple keyword matching
    return fallbackAnalysis(prompt);
  }
}

/**
 * Fallback analysis using keyword matching
 */
function fallbackAnalysis(prompt: string): PromptAnalysisResult {
  const lowerPrompt = prompt.toLowerCase();

  // Check for text-to-image first (special case)
  if (
    lowerPrompt.includes('text to image') ||
    lowerPrompt.includes('generate image') ||
    lowerPrompt.includes('create image') ||
    (lowerPrompt.includes('image') && (lowerPrompt.includes('generate') || lowerPrompt.includes('create')))
  ) {
    return {
      selectedProcessor: 'image_processor',
      selectedTools: ['text_to_image'],
      goal: prompt.substring(0, 100),
    };
  }

  // Check for image analysis / analyzer
  if (
    lowerPrompt.includes('image analyzer') ||
    lowerPrompt.includes('analyze image') ||
    lowerPrompt.includes('image analysis') ||
    lowerPrompt.includes('caption') ||
    lowerPrompt.includes('detect')
  ) {
    return {
      selectedProcessor: 'image_processor',
      selectedTools: ['image_caption'],
      goal: prompt.substring(0, 100),
    };
  }

  // Check for general image (but not text-to-image)
  if (
    (lowerPrompt.includes('image') || lowerPrompt.includes('photo') || lowerPrompt.includes('picture')) &&
    !lowerPrompt.includes('generate') &&
    !lowerPrompt.includes('create') &&
    !lowerPrompt.includes('text to image')
  ) {
    return {
      selectedProcessor: 'image_processor',
      selectedTools: ['image_caption'],
      goal: prompt.substring(0, 100),
    };
  }

  // Check for audio
  if (
    lowerPrompt.includes('audio') ||
    lowerPrompt.includes('speech') ||
    lowerPrompt.includes('voice') ||
    lowerPrompt.includes('transcribe')
  ) {
    return {
      selectedProcessor: 'audio_processor',
      selectedTools: lowerPrompt.includes('text to speech') || lowerPrompt.includes('speak') 
        ? ['text_to_speech'] 
        : ['transcribe'],
      goal: prompt.substring(0, 100),
    };
  }

  // Default to text processor
  const textTools: string[] = [];
  if (lowerPrompt.includes('summarize')) textTools.push('summarize');
  if (lowerPrompt.includes('translate')) textTools.push('translate');
  if (lowerPrompt.includes('chat') || lowerPrompt.includes('conversation')) textTools.push('chat');
  if (lowerPrompt.includes('question') || lowerPrompt.includes('qa')) textTools.push('qa');
  if (lowerPrompt.includes('sentiment')) textTools.push('sentiment');
  if (textTools.length === 0) textTools.push('chat'); // Default tool

  return {
    selectedProcessor: 'text_processor',
    selectedTools: textTools,
    goal: prompt.substring(0, 100),
  };
}
