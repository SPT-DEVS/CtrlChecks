import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  Eye, 
  Music, 
  Code, 
  TestTube,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  testCases: TestCase[];
}

interface TestCase {
  id: string;
  name: string;
  path: string;
  status?: 'passed' | 'failed' | 'not-tested';
}

const testCategories: TestCategory[] = [
  {
    id: 'text-models',
    name: 'Text Models',
    description: 'Test text processing models (Q&A, Summarization, Translation)',
    icon: <FileText className="h-6 w-6" />,
    color: 'text-blue-600',
    testCases: [
      { id: 'mistral-7b', name: 'Mistral-7B-Instruct', path: '/model-testing/text-models/mistral-7b' },
      { id: 'zephyr-7b', name: 'Zephyr-7B-Beta', path: '/model-testing/text-models/zephyr-7b' },
      { id: 'llama-70b', name: 'Llama-3-70B (Groq)', path: '/model-testing/text-models/llama-70b-groq' },
    ]
  },
  {
    id: 'image-generation',
    name: 'Image Generation',
    description: 'Test text-to-image generation models',
    icon: <Image className="h-6 w-6" />,
    color: 'text-purple-600',
    testCases: [
      { id: 'sd-xl', name: 'Stable Diffusion XL', path: '/model-testing/image-generation/stable-diffusion-xl' },
      { id: 'sd-v1-5', name: 'Stable Diffusion v1.5', path: '/model-testing/image-generation/stable-diffusion-v1-5' },
    ]
  },
  {
    id: 'image-understanding',
    name: 'Image Understanding',
    description: 'Test image-to-text models (Captioning, VQA)',
    icon: <Eye className="h-6 w-6" />,
    color: 'text-green-600',
    testCases: [
      { id: 'blip-caption', name: 'BLIP Image Captioning', path: '/model-testing/image-understanding/blip-captioning' },
      { id: 'blip-vqa', name: 'BLIP Visual Q&A', path: '/model-testing/image-understanding/blip-vqa' },
    ]
  },
  {
    id: 'audio-processing',
    name: 'Audio Processing',
    description: 'Test speech-to-text and text-to-speech models',
    icon: <Music className="h-6 w-6" />,
    color: 'text-orange-600',
    testCases: [
      { id: 'whisper', name: 'Whisper STT', path: '/model-testing/audio-processing/whisper-stt' },
      { id: 'bark', name: 'Bark TTS', path: '/model-testing/audio-processing/bark-tts' },
    ]
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Test code generation models',
    icon: <Code className="h-6 w-6" />,
    color: 'text-indigo-600',
    testCases: [
      { id: 'codellama', name: 'CodeLlama-7B', path: '/model-testing/code-generation/codellama-7b' },
      { id: 'deepseek', name: 'DeepSeek Coder', path: '/model-testing/code-generation/deepseek-coder' },
    ]
  },
];

export default function TestDashboard() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Model Testing Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing suite for all AI models in the application
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {testCategories.reduce((acc, cat) => acc + cat.testCases.length, 0)} Test Cases
        </Badge>
      </div>

      {/* Environment Check */}
      <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-sm">
              <div className="font-medium mb-1">Environment Variables Required:</div>
              <div className="text-muted-foreground space-y-1">
                <div>• HUGGINGFACE_API_KEY (Required for most models)</div>
                <div>• REPLICATE_API_TOKEN (Required for image generation)</div>
                <div>• GROQ_API_KEY (Required for Llama-70B)</div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                These should be set in your backend environment.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testCategories.map((category) => (
          <Card 
            key={category.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCategory(
              selectedCategory === category.id ? null : category.id
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={category.color}>{category.icon}</span>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {category.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {category.testCases.length} tests
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    );
                  }}
                >
                  {selectedCategory === category.id ? 'Hide' : 'Show'} Tests
                  <ArrowRight className={`ml-2 h-4 w-4 transition-transform ${
                    selectedCategory === category.id ? 'rotate-90' : ''
                  }`} />
                </Button>
              </div>

              {/* Test Cases List */}
              {selectedCategory === category.id && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  {category.testCases.map((testCase) => (
                    <div
                      key={testCase.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(testCase.path);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {testCase.status === 'passed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {testCase.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{testCase.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/model-testing/text-models/mistral-7b')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Start with Mistral-7B (Recommended)
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('/Debugging/01-Setup-Configuration/API_KEYS_SETUP_GUIDE.md', '_blank')}
            >
              <FileText className="mr-2 h-4 w-4" />
              API Keys Setup Guide
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('/Debugging/05-Testing-Debugging/MULTIMODAL_MODELS_DEBUG_GUIDE.md', '_blank')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Debugging Guide
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/multimodal')}
            >
              <TestTube className="mr-2 h-4 w-4" />
              Multimodal Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

