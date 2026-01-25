import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  output?: string;
  duration?: number;
  isFallback?: boolean;
}

export default function ModelTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [customInput, setCustomInput] = useState('');

  const runTest = async (testName: string, input: string, expectedType: string = 'text') => {
    const startTime = Date.now();
    
    try {
      // Create a simple pipeline for testing
      const pipeline = {
        steps: [
          {
            type: 'input',
            description: 'User input'
          },
          {
            type: 'transformation',
            description: expectedType === 'summarize' ? 'summarize' : 
                        expectedType === 'extract' ? 'extract' :
                        expectedType === 'translate' ? 'translate' :
                        expectedType === 'analyze' ? 'analyze' : 'process',
            model: {
              name: 'mistralai/Mistral-7B-Instruct-v0.2',
              provider: 'huggingface'
            }
          },
          {
            type: 'output',
            description: 'Output result'
          }
        ]
      };

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
          models: [{
            name: 'mistralai/Mistral-7B-Instruct-v0.2',
            provider: 'huggingface'
          }]
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        return {
          testName,
          success: false,
          error: error.error || error.message || 'Request failed',
          duration
        };
      }

      const data = await response.json();

      if (data && data.success) {
        const isFallback = data.isFallback || 
                          data.output?.startsWith('Processed:') ||
                          data.output?.startsWith('[AI Processing]');
        
        return {
          testName,
          success: !isFallback,
          output: data.output,
          duration,
          isFallback,
          error: isFallback ? 'Model returned fallback response' : undefined
        };
      }

      return {
        testName,
        success: false,
        error: data?.error || 'Unknown error',
        duration
      };
    } catch (error: any) {
      return {
        testName,
        success: false,
        error: error.message || 'Test failed',
        duration: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: TestResult[] = [];

    // Test 1: Basic Q&A
    testResults.push(await runTest(
      'Basic Q&A',
      'What is artificial intelligence? Provide a brief explanation.',
      'process'
    ));

    // Test 2: Summarization
    testResults.push(await runTest(
      'Text Summarization',
      'Artificial intelligence (AI) is transforming the way we work and live. Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions. Natural language processing enables computers to understand and generate human language. Computer vision allows machines to interpret visual information. These technologies are being applied across industries from healthcare to finance to transportation.',
      'summarize'
    ));

    // Test 3: Information Extraction
    testResults.push(await runTest(
      'Information Extraction',
      'Meeting Details: Date: March 15, 2024, Time: 2:00 PM, Location: Conference Room A, Attendees: John Smith, Jane Doe, Bob Johnson, Topic: Q1 Product Launch Planning',
      'extract'
    ));

    // Test 4: Translation
    testResults.push(await runTest(
      'Translation',
      'Bonjour, comment allez-vous? Je m\'appelle Marie.',
      'translate'
    ));

    // Test 5: Analysis
    testResults.push(await runTest(
      'Data Analysis',
      'Sales Report Q1 2024: January: $50,000, February: $65,000, March: $80,000, Total: $195,000. Analyze the trend.',
      'analyze'
    ));

    setResults(testResults);
    setIsRunning(false);

    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;

    toast({
      title: passed === total ? 'All Tests Passed!' : 'Tests Completed',
      description: `${passed}/${total} tests passed successfully`,
      variant: passed === total ? 'default' : 'destructive'
    });
  };

  const runCustomTest = async () => {
    if (!customInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some text to test',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    const result = await runTest('Custom Test', customInput, 'process');
    setResults([result]);
    setIsRunning(false);

    toast({
      title: result.success ? 'Test Passed!' : 'Test Failed',
      description: result.success ? 'Model processed your input successfully' : result.error,
      variant: result.success ? 'default' : 'destructive'
    });
  };

  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const fallbackCount = results.filter(r => r.isFallback).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Model Testing & Debugging</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
        </div>

        {/* Custom Test */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter custom text to test model response..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            rows={3}
            disabled={isRunning}
          />
          <Button 
            onClick={runCustomTest} 
            disabled={isRunning || !customInput.trim()}
            variant="outline"
            className="w-full"
          >
            Test Custom Input
          </Button>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium">Test Results</div>
                  <div className="text-xs text-muted-foreground">
                    {passedCount}/{totalCount} passed
                    {fallbackCount > 0 && ` • ${fallbackCount} using fallback`}
                  </div>
                </div>
              </div>
              <Badge variant={passedCount === totalCount ? 'default' : 'destructive'}>
                {passedCount === totalCount ? 'All Passed' : 'Issues Found'}
              </Badge>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-2">
              {results.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{result.testName}</span>
                        {result.isFallback && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Fallback
                          </Badge>
                        )}
                      </div>
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                    
                    {result.error && (
                      <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                        Error: {result.error}
                      </div>
                    )}
                    
                    {result.output && (
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Output:</div>
                        <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                          {result.output.length > 300 
                            ? `${result.output.substring(0, 300)}...` 
                            : result.output}
                        </div>
                      </div>
                    )}

                    {result.isFallback && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ Model may not be working. Check Supabase function logs and API key configuration.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {results.length > 0 && (fallbackCount > 0 || passedCount < totalCount) && (
          <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-2">Recommendations:</div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Verify HUGGINGFACE_API_KEY is set in Supabase secrets</li>
                    <li>• Check API key has sufficient credits/quota</li>
                    <li>• Review Supabase function logs for detailed errors</li>
                    <li>• Ensure models are available on HuggingFace</li>
                    <li>• Test API key directly with HuggingFace API</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

