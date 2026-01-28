import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';
import testConfig from './test-config.json';

interface TestResult {
  testId: string;
  testName: string;
  success: boolean;
  error?: string;
  output?: string;
  expectedOutput?: string;
  duration?: number;
  isFallback?: boolean;
  keywordsMatched?: number;
  rawResponse?: any;
}

export default function Mistral7BTestComponent() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState<TestResult | null>(null);

  const checkKeywords = (output: string, expectedKeywords: string[]): number => {
    const outputLower = output.toLowerCase();
    return expectedKeywords.filter(keyword => 
      outputLower.includes(keyword.toLowerCase())
    ).length;
  };

  const runTest = async (testCase: typeof testConfig.testCases[0]): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const pipeline = {
        steps: [
          { type: 'input', description: 'User input' },
          {
            type: 'transformation',
            description: 'process',
            model: {
              name: testConfig.model.name,
              provider: testConfig.model.provider
            }
          },
          { type: 'output', description: 'Output result' }
        ]
      };

      // Multimodal functionality has been removed
      // Using AI chat endpoint instead for text generation
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          message: testCase.input,
          model: testConfig.model.name,
          system: 'You are a helpful assistant.',
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        const errorMessage = error.error || error.message || 'Unknown error';
        const detailedError = errorMessage.includes('HUGGINGFACE_API_KEY') 
          ? `${errorMessage}\n\n💡 Solution: Set HUGGINGFACE_API_KEY in the backend environment.`
          : errorMessage;
        
        return {
          testId: testCase.id,
          testName: testCase.name,
          success: false,
          error: detailedError,
          duration,
          expectedOutput: testCase.expectedOutput
        };
      }

      const data = await response.json();
      // Handle AI chat endpoint response format
      const output = data.response || data.content || data.output || data.message || '';
      if (data && (data.success || output)) {
        const isFallback = data.isFallback || 
                          output.startsWith('Processed:') ||
                          output.startsWith('[AI Processing]') ||
                          output.length < 20 ||
                          (output.toLowerCase().includes('error') && output.length < 100);
        
        const keywordsMatched = checkKeywords(output, testCase.expectedKeywords || []);
        const success = !isFallback && duration < testCase.maxDuration && keywordsMatched > 0;

        return {
          testId: testCase.id,
          testName: testCase.name,
          success,
          output: output,
          expectedOutput: testCase.expectedOutput,
          duration,
          isFallback,
          keywordsMatched,
          rawResponse: data,
          error: isFallback ? `Model returned fallback response. Output: "${output.substring(0, 100)}${output.length > 100 ? '...' : ''}". Check API key configuration and Supabase function logs.` : 
                 duration >= testCase.maxDuration ? 'Test exceeded maximum duration' :
                 keywordsMatched === 0 ? 'Output does not match expected keywords' : undefined
        };
      }

      return {
        testId: testCase.id,
        testName: testCase.name,
        success: false,
        error: data?.error || 'Unknown error',
        duration,
        expectedOutput: testCase.expectedOutput
      };
    } catch (error: any) {
      return {
        testId: testCase.id,
        testName: testCase.name,
        success: false,
        error: error.message || 'Test failed',
        duration: Date.now() - startTime,
        expectedOutput: testCase.expectedOutput
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: TestResult[] = [];
    
    for (const testCase of testConfig.testCases) {
      const result = await runTest(testCase);
      testResults.push(result);
      setResults([...testResults]);
    }
    
    setIsRunning(false);
    
    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;
    
    toast({
      title: passed === total ? 'All Tests Passed!' : 'Tests Completed',
      description: `${passed}/${total} tests passed successfully`,
      variant: passed === total ? 'default' : 'destructive'
    });
  };

  const runSingleTest = async (testCase: typeof testConfig.testCases[0]) => {
    setIsRunning(true);
    const result = await runTest(testCase);
    setResults([result]);
    setIsRunning(false);
    
    toast({
      title: result.success ? 'Test Passed!' : 'Test Failed',
      description: result.success ? 'Model processed successfully' : result.error,
      variant: result.success ? 'default' : 'destructive'
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
    const customTestCase = {
      id: 'custom',
      name: 'Custom Test',
      input: customInput,
      expectedOutput: 'Custom output',
      expectedKeywords: [],
      maxDuration: 15000
    };
    
    const result = await runTest(customTestCase);
    setCustomResult(result);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Mistral-7B-Instruct Testing</span>
            <Badge variant="outline">{testConfig.model.provider}</Badge>
          </CardTitle>
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
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          {/* Individual Test Cases */}
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Test Cases:</div>
            {testConfig.testCases.map((testCase) => (
              <Card key={testCase.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{testCase.name}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runSingleTest(testCase)}
                      disabled={isRunning}
                    >
                      Run Test
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    <div className="font-medium">Input:</div>
                    <div className="bg-muted p-2 rounded mt-1 font-mono">
                      {testCase.input.substring(0, 100)}
                      {testCase.input.length > 100 ? '...' : ''}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium">Expected:</div>
                    <div className="mt-1">{testCase.expectedOutput}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Test */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Test:</div>
            <Textarea
              placeholder="Enter custom text to test..."
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
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
              <div>
                <div className="text-sm font-medium">Summary</div>
                <div className="text-xs text-muted-foreground">
                  {passedCount}/{totalCount} passed
                  {fallbackCount > 0 && ` • ${fallbackCount} using fallback`}
                </div>
              </div>
              <Badge variant={passedCount === totalCount ? 'default' : 'destructive'}>
                {passedCount === totalCount ? 'All Passed' : 'Issues Found'}
              </Badge>
            </div>

            <div className="space-y-3">
              {results.map((result) => (
                <Card key={result.testId} className="border-l-4 border-l-primary">
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
                        {result.keywordsMatched !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {result.keywordsMatched}/{testConfig.testCases.find(t => t.id === result.testId)?.expectedKeywords.length || 0} keywords
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
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="font-medium mb-1">Output:</div>
                        <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                          {result.output.length > 300 
                            ? `${result.output.substring(0, 300)}...` 
                            : result.output}
                        </div>
                      </div>
                    )}

                    {result.expectedOutput && (
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Expected:</div>
                        <div className="text-xs">{result.expectedOutput}</div>
                      </div>
                    )}

                    {result.isFallback && (
                      <div className="mt-2 space-y-2">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                          <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            ⚠️ Fallback Response Detected
                          </div>
                          <div className="text-yellow-700 dark:text-yellow-300 space-y-1">
                            <div>Possible causes:</div>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              <li>HUGGINGFACE_API_KEY not set in Supabase secrets</li>
                              <li>API key has insufficient quota</li>
                              <li>Model endpoint is not accessible</li>
                              <li>Network/connectivity issues</li>
                            </ul>
                            <div className="mt-2">
                              <strong>Next steps:</strong>
                              <ol className="list-decimal list-inside ml-2 space-y-1 mt-1">
                                <li>Check backend environment variables</li>
                                <li>Verify HUGGINGFACE_API_KEY is set correctly</li>
                                <li>Check Supabase function logs for detailed errors</li>
                                <li>Verify API key has sufficient quota at huggingface.co</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                        {result.rawResponse && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Show raw response data
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40 text-[10px]">
                              {JSON.stringify(result.rawResponse, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Test Result */}
      {customResult && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {customResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Custom Test</span>
            </div>
            {customResult.output && (
              <div className="bg-muted p-3 rounded text-sm font-mono max-h-48 overflow-y-auto">
                {customResult.output}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

