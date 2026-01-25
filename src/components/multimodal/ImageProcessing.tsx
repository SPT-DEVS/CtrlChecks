import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Palette,
  Loader2,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';

import { ENDPOINTS } from '@/config/endpoints';

const PYTHON_BACKEND_URL = ENDPOINTS.itemBackend;
const USE_DIRECT_BACKEND = ENDPOINTS.useDirectBackend;

interface ImageProcessingResult {
  mode: 'short-note' | 'story' | 'image-prompt' | 'text-to-image';
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  imageUrl?: string; // For text-to-image results
}

interface ImageProcessingProps {
  selectedTools?: string[]; // Filter which tools to show (task names: image_caption, story, image_prompt, text_to_image)
}

export default function ImageProcessing({ selectedTools }: ImageProcessingProps = {}) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sentenceCount, setSentenceCount] = useState(5);
  const [textPrompt, setTextPrompt] = useState('');
  const [steps, setSteps] = useState(2);
  const [guidanceScale, setGuidanceScale] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImageProcessingResult[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setResults([]);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImage = async (mode: 'short-note' | 'story' | 'image-prompt' | 'text-to-image'): Promise<ImageProcessingResult> => {
    // For text-to-image, we don't need an uploaded image
    if (mode !== 'text-to-image' && !selectedImage) {
      toast({
        title: 'No image selected',
        description: 'Please upload an image first',
        variant: 'destructive'
      });
      return {
        mode,
        success: false,
        error: 'No image selected'
      };
    }

    // For text-to-image, we need a prompt
    if (mode === 'text-to-image' && !textPrompt.trim()) {
      toast({
        title: 'No prompt entered',
        description: 'Please enter a text prompt for image generation',
        variant: 'destructive'
      });
      return {
        mode,
        success: false,
        error: 'No prompt entered'
      };
    }

    const startTime = Date.now();
    setIsProcessing(true);
    setProgress(0);

    try {
      let base64Image: string | undefined;

      // For image-based tasks, convert image to base64
      if (mode !== 'text-to-image') {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Send as data URL (Python backend handles both data URL and plain base64)
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage!);
        });
      }

      setProgress(30);

      // Map mode to task (matching Python backend)
      let task: string;
      let payload: any;

      if (mode === 'short-note') {
        task = 'image_caption';
        payload = {
          task: task,
          image: base64Image,
        };
      } else if (mode === 'story') {
        task = 'story'; // Python backend handles BLIP + FLAN-T5 internally
        payload = {
          task: task,
          image: base64Image,
          sentence_count: sentenceCount
        };
      } else if (mode === 'image-prompt') {
        task = 'image_prompt'; // Python backend handles BLIP + enhancement internally
        payload = {
          task: task,
          image: base64Image,
        };
      } else if (mode === 'text-to-image') {
        task = 'text_to_image';
        payload = {
          task: task,
          input: textPrompt,
          steps: steps,
          guidance_scale: guidanceScale
        };
      } else {
        throw new Error('Invalid mode');
      }

      setProgress(50);

      let data: any;
      let error: any = null;

      if (USE_DIRECT_BACKEND) {
        // LOCAL DEVELOPMENT: Call Python backend directly
        const apiUrl = `${PYTHON_BACKEND_URL}/process`;
        console.log('🔧 Local dev mode: Calling Python backend directly at', apiUrl);

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();

          if (!response.ok) {
            throw new Error(`Python backend error (${response.status}): ${responseText || 'Unknown error'}`);
          }

          if (!responseText) {
            throw new Error('Backend returned empty response');
          }

          data = JSON.parse(responseText);

          if (!data.success) {
            error = { message: data.error || 'Unknown error from Python backend' };
          }
        } catch (fetchError: any) {
          console.error('❌ Direct backend call error:', fetchError);

          let errorMessage = fetchError.message || 'Failed to connect to Python backend';

          if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
            errorMessage = `Cannot connect to Python backend at ${PYTHON_BACKEND_URL}. ` +
              `Please ensure the backend is running. ` +
              `Start it with: cd AI_Agent\\multimodal_backend && python main.py`;
          }

          error = { message: errorMessage };
        }
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(`${ENDPOINTS.itemBackend}/execute-multimodal-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionData?.session?.access_token
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || error.message || 'Request failed');
        }

        data = await response.json();
        error = result.error;
      }

      setProgress(90);

      if (error) {
        console.error('❌ Processing error:', error);
        const errorMessage = error.message || 'Failed to process image';
        throw new Error(errorMessage);
      }

      if (data && data.success) {
        setProgress(100);
        const duration = Date.now() - startTime;

        const result: ImageProcessingResult = {
          mode,
          success: true,
          output: data.output,
          duration,
          // For text-to-image, output is a base64 image data URL
          imageUrl: mode === 'text-to-image' ? data.output : undefined
        };

        setResults(prev => [...prev, result]);

        const modeNames: Record<string, string> = {
          'short-note': 'Short note',
          'story': 'Story',
          'image-prompt': 'Prompt',
          'text-to-image': 'Image'
        };

        toast({
          title: 'Success',
          description: `${modeNames[mode] || 'Result'} generated successfully`,
        });

        return result;
      } else {
        console.error('❌ Function returned error:', data);
        const errorMessage = data?.error || data?.details || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Image processing error:', error);
      const duration = Date.now() - startTime;
      const errorMessage = error.message || error.toString() || 'Failed to process image';

      const result: ImageProcessingResult = {
        mode,
        success: false,
        error: errorMessage,
        duration
      };

      setResults(prev => [...prev, result]);

      toast({
        title: 'Processing Failed',
        description: errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage,
        variant: 'destructive'
      });

      return result;
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Processing Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Image</label>
            {!imagePreview ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: JPG, JPEG, PNG
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Sentence Count Slider (for Story mode) */}
          {selectedImage && (selectedTools?.includes('story') || selectedTools?.includes('image_prompt') || !selectedTools) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Number of sentences (for Story & Prompt): {sentenceCount}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={sentenceCount}
                onChange={(e) => setSentenceCount(Number(e.target.value))}
                className="w-full"
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Text-to-Image Input */}
          {(!selectedTools || selectedTools.includes('text_to_image')) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Prompt (for Text-to-Image)</label>
              <Textarea
                placeholder="Enter a prompt to generate an image (e.g., 'A cyberpunk city at night')"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={3}
                disabled={isProcessing}
              />
              {textPrompt && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Steps (1-4): {steps}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Guidance Scale (0.0-1.5): {guidanceScale.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.1"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(Number(e.target.value))}
                      className="w-full"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {selectedImage && (
              <>
                {(!selectedTools || selectedTools.includes('image_caption')) && (
                  <Button
                    onClick={() => processImage('short-note')}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Short Note</span>
                    <span className="text-xs text-muted-foreground">One sentence caption</span>
                  </Button>
                )}

                {(!selectedTools || selectedTools.includes('story')) && (
                  <Button
                    onClick={() => processImage('story')}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Story Description</span>
                    <span className="text-xs text-muted-foreground">Detailed multi-sentence</span>
                  </Button>
                )}

                {(!selectedTools || selectedTools.includes('image_prompt')) && (
                  <Button
                    onClick={() => processImage('image-prompt')}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Palette className="h-5 w-5" />
                    <span>Image to Prompt</span>
                    <span className="text-xs text-muted-foreground">Stable Diffusion prompt</span>
                  </Button>
                )}
              </>
            )}

            {(!selectedTools || selectedTools.includes('text_to_image')) && (
              <Button
                onClick={() => processImage('text-to-image')}
                disabled={isProcessing || !textPrompt.trim()}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <ImageIcon className="h-5 w-5" />
                <span>Text to Image</span>
                <span className="text-xs text-muted-foreground">Generate image from text</span>
              </Button>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Processing image...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>
                      {result.mode === 'short-note' && '📝 Short Note'}
                      {result.mode === 'story' && '📖 Story Description'}
                      {result.mode === 'image-prompt' && '🎨 Image to Prompt'}
                      {result.mode === 'text-to-image' && '🎨 Text to Image'}
                    </span>
                  </div>
                  {result.duration && (
                    <Badge variant="outline" className="text-xs">
                      {result.duration}ms
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                    Error: {result.error}
                  </div>
                )}
                {result.imageUrl && (
                  <div className="space-y-2 flex justify-center">
                    <img
                      src={result.imageUrl}
                      alt="Generated image"
                      className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-lg border border-border"
                    />
                  </div>
                )}
                {result.output && !result.imageUrl && (
                  <div className="space-y-2">
                    {result.mode === 'image-prompt' ? (
                      <div className="bg-muted p-3 rounded font-mono text-sm">
                        {result.output}
                      </div>
                    ) : (
                      <Textarea
                        value={result.output}
                        readOnly
                        rows={result.mode === 'story' ? 8 : 3}
                        className="font-mono text-sm"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

