import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Mistral7BTestComponent from '@/components/model-testing/text-models/mistral-7b/TestComponent';

// Map of test paths to components
const testComponents: Record<string, React.ComponentType> = {
  'text-models/mistral-7b': Mistral7BTestComponent,
  // Add more test components as they are created
  // 'text-models/zephyr-7b': Zephyr7BTestComponent,
  // 'image-generation/stable-diffusion-xl': StableDiffusionXLTestComponent,
};

export default function ModelTestPage() {
  const { category, model } = useParams<{ category: string; model: string }>();
  const navigate = useNavigate();
  
  const testPath = category && model ? `${category}/${model}` : null;
  const TestComponent = testPath ? testComponents[testPath] : null;

  if (!testPath || !TestComponent) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/model-testing')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Test Not Found</h1>
        </div>
        <div className="text-muted-foreground">
          The test case "{testPath}" is not available yet. Please check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/model-testing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {model?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h1>
      </div>
      <TestComponent />
    </div>
  );
}

