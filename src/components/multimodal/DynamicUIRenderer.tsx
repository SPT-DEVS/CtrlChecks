import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';
import ExecutionDebugger from './ExecutionDebugger';

interface DynamicUIRendererProps {
  template: any;
  pipeline?: any;
  executionEngine?: any;
}

export default function DynamicUIRenderer({ template, pipeline, executionEngine }: DynamicUIRendererProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [outputValues, setOutputValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [debugLogs, setDebugLogs] = useState<Array<{ timestamp: Date; level: string; message: string }>>([]);

  const addDebugLog = (level: string, message: string) => {
    setDebugLogs(prev => [...prev, {
      timestamp: new Date(),
      level,
      message
    }]);
    console.log(`[${level}] ${message}`);
  };
  if (!template || !template.sections) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          UI template will be rendered here
        </CardContent>
      </Card>
    );
  }

  const handleProcess = async () => {
    if (!pipeline || !executionEngine) {
      toast({
        title: 'Error',
        description: 'Pipeline not ready. Please rebuild your agent.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setDebugLogs([]);
    addDebugLog('INFO', 'Starting processing...');

    try {
      // Collect input values from all input fields
      const allInputValues = Object.values(inputValues).filter(v => v && String(v).trim());
      
      if (allInputValues.length === 0) {
        toast({
          title: 'No Input',
          description: 'Please enter some text in the input field',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      // Get the first non-empty input value
      const inputText = String(allInputValues[0]).trim();
      addDebugLog('INFO', `Input: "${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}"`);
      addDebugLog('INFO', `Pipeline steps: ${pipeline?.steps?.length || 0}`);
      addDebugLog('INFO', `Models available: ${executionEngine?.models?.length || 0}`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);
      
      // Call a processing function
      addDebugLog('INFO', 'Calling execution function...');
      let result: string;
      try {
        result = await processMultimodalInput(inputText, pipeline, executionEngine);
        addDebugLog('SUCCESS', `Result received: "${result.substring(0, 50)}${result.length > 50 ? '...' : ''}"`);
      } catch (error: any) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        const errorMessage = error.message || 'Processing failed';
        addDebugLog('ERROR', `Processing failed: ${errorMessage}`);
        toast({
          title: 'Processing Failed',
          description: errorMessage,
          variant: 'destructive'
        });
        return; // Stop execution - don't show fake output
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Set output - find the first output component and set its value
      const outputSectionIndex = template.sections.findIndex((s: any) => s.type === 'output_section');
      if (outputSectionIndex >= 0) {
        const outputKey = `output_${outputSectionIndex}_0`;
        setOutputValues((prev) => ({
          ...prev,
          [outputKey]: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }));
      } else {
        // Fallback: set a generic output
        setOutputValues((prev) => ({
          ...prev,
          output: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }));
      }

      console.log('🎉 Processing completed! Result:', result);
      
      toast({
        title: 'Success',
        description: `Processing completed! Check output below. ${result.length > 50 ? 'Result: ' + result.substring(0, 50) + '...' : 'Result: ' + result}`
      });

    } catch (error: any) {
      console.error('❌ Processing error in handleProcess:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to process input. Check browser console (F12) for details.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const processMultimodalInput = async (input: string, pipeline: any, engine: any): Promise<string> => {
    try {
      console.log('📡 Calling execute-multimodal-agent...');
      console.log('Request payload:', {
        input: input.substring(0, 100),
        pipelineSteps: pipeline?.steps?.length,
        modelsCount: engine?.models?.length
      });
      
      // Call the execution endpoint
      const startTime = Date.now();
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/execute-multimodal-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          input: input,
          pipeline: pipeline,
          models: engine?.models || []
        }),
      });
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        console.log(`📥 Response received in ${duration}ms:`, { error });
        console.error('❌ Function error:', error);
        addDebugLog('ERROR', `Function error: ${error.error || error.message || 'Unknown error'}`);
        throw new Error(error.error || error.message || 'Request failed');
      }

      const data = await response.json();
      console.log(`📥 Response received in ${duration}ms:`, { data });

      if (data && data.success) {
        console.log('✅ Processing successful!');
        console.log('📤 Output:', data.output);
        console.log('🔍 Diagnostic:', data.diagnostic);
        
        addDebugLog('SUCCESS', `✅ AI model processed in ${duration}ms!`);
        
        return data.output || input;
      } else {
        console.error('❌ Processing failed:', data?.error);
        addDebugLog('ERROR', `Processing failed: ${data?.error || 'Unknown error'}`);
        throw new Error(data?.error || 'Processing failed');
      }
    } catch (error: any) {
      console.error('❌ Processing error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      const errorMessage = error.message || 'Unknown error occurred';
      addDebugLog('ERROR', `Error: ${errorMessage}`);
      
      // Show error to user instead of fake fallback
      toast({
        title: 'Processing Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Throw error to stop execution - no fake output
      throw new Error(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {template.sections.map((section: any, index: number) => {
        if (section.type === 'input_section') {
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title || 'Input'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.components?.map((component: any, compIdx: number) => {
                  if (component.type === 'file_upload') {
                    return (
                      <div key={compIdx} className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">File Upload Area</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepts: {component.accept?.join(', ') || 'All files'}
                        </p>
                      </div>
                    );
                  } else if (component.type === 'textarea') {
                    const inputKey = `input_${index}_${compIdx}`;
                    const textareaId = `dynamic-textarea-${index}-${compIdx}`;
                    return (
                      <Textarea
                        key={compIdx}
                        id={textareaId}
                        name={textareaId}
                        placeholder={component.placeholder || 'Enter your text here...'}
                        rows={component.rows || 5}
                        value={inputValues[inputKey] || ''}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [inputKey]: e.target.value }))}
                        disabled={isProcessing}
                      />
                    );
                  } else if (component.type === 'image_upload') {
                    // For image generation, we need a text prompt input
                    const inputKey = `input_${index}_${compIdx}_prompt`;
                    const hasTextInput = section.components?.some((c: any) => c.type === 'textarea');
                    
                    return (
                      <div key={compIdx} className="space-y-4">
                        {/* Always show textarea for prompts (e.g., image generation) */}
                        {!hasTextInput && (
                          <Textarea
                            id={`dynamic-image-prompt-${index}-${compIdx}`}
                            name={`dynamic-image-prompt-${index}-${compIdx}`}
                            placeholder="Enter your prompt or description here... (e.g., 'a futuristic city')"
                            rows={4}
                            value={inputValues[inputKey] || ''}
                            onChange={(e) => setInputValues(prev => ({ ...prev, [inputKey]: e.target.value }))}
                            disabled={isProcessing}
                          />
                        )}
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <p className="text-sm text-muted-foreground">Image Upload Area (Optional)</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Accepts: {component.accept?.join(', ') || '.jpg, .jpeg, .png, .gif'}
                          </p>
                        </div>
                      </div>
                    );
                  } else if (component.type === 'audio_upload') {
                    // For audio tasks, we might also need a text prompt
                    const inputKey = `input_${index}_${compIdx}_prompt`;
                    const hasTextInput = section.components?.some((c: any) => c.type === 'textarea');
                    
                    return (
                      <div key={compIdx} className="space-y-4">
                        {!hasTextInput && (
                          <Textarea
                            placeholder="Enter your prompt or description here..."
                            rows={4}
                            value={inputValues[inputKey] || ''}
                            onChange={(e) => setInputValues(prev => ({ ...prev, [inputKey]: e.target.value }))}
                            disabled={isProcessing}
                          />
                        )}
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <p className="text-sm text-muted-foreground">Audio Upload Area</p>
                        </div>
                      </div>
                    );
                  } else if (component.type === 'code_editor') {
                    // Render code editor as textarea for input
                    const inputKey = `input_${index}_${compIdx}`;
                    return (
                      <Textarea
                        key={compIdx}
                        placeholder={component.placeholder || 'Enter your code here...'}
                        rows={component.rows || 10}
                        value={inputValues[inputKey] || ''}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [inputKey]: e.target.value }))}
                        disabled={isProcessing}
                        className="font-mono text-sm"
                      />
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>
          );
        }

        if (section.type === 'control_section') {
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  {section.components?.map((component: any, compIdx: number) => {
                    if (component.id === 'process_button') {
                      return (
                        <Button
                          key={compIdx}
                          variant={component.variant || 'default'}
                          size={component.size || 'default'}
                          onClick={handleProcess}
                          disabled={isProcessing || !pipeline}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            component.label
                          )}
                        </Button>
                      );
                    }
                    return (
                      <Button
                        key={compIdx}
                        variant={component.variant || 'default'}
                        size={component.size || 'default'}
                        disabled={isProcessing}
                      >
                        {component.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        }

        if (section.type === 'output_section') {
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title || 'Output'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.components?.map((component: any, compIdx: number) => {
                  if (component.type === 'text_display') {
                    const outputKey = `output_${index}_${compIdx}`;
                    return (
                      <Textarea
                        key={compIdx}
                        placeholder="Output will appear here..."
                        rows={6}
                        readOnly={!component.editable}
                        value={outputValues[outputKey] || ''}
                        onChange={component.editable ? (e) => setOutputValues(prev => ({ ...prev, [outputKey]: e.target.value })) : undefined}
                        className="font-mono text-sm"
                      />
                    );
                  } else if (component.type === 'image_display') {
                    return (
                      <div key={compIdx} className="border border-border rounded-lg p-8 text-center bg-muted/30">
                        <p className="text-sm text-muted-foreground">Generated image will appear here</p>
                      </div>
                    );
                  } else if (component.type === 'code_editor') {
                    return (
                      <div key={compIdx} className="border border-border rounded-lg p-4 bg-muted/30">
                        <pre className="text-sm font-mono">
                          <code>// Generated code will appear here</code>
                        </pre>
                      </div>
                    );
                  } else if (component.type === 'audio_player') {
                    return (
                      <div key={compIdx} className="border border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">Audio player will appear here</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>
          );
        }

        if (section.type === 'status_section') {
          return (
            <Card key={index}>
              <CardContent className="p-4 space-y-2">
                {section.components?.map((component: any, compIdx: number) => {
                  if (component.type === 'progress') {
                    return (
                      <div key={compIdx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{component.label || 'Processing Status'}</span>
                          <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>
          );
        }

        return null;
      })}

      {/* Debug Information */}
      <ExecutionDebugger 
        logs={debugLogs} 
        pipeline={pipeline}
        executionEngine={executionEngine}
      />
    </div>
  );
}


