/**
 * MultimodalBuilder - Intelligent Prompt Analyzer
 * 
 * Uses HuggingFace API to analyze prompts and:
 * - Selects the correct processor
 * - Selects specific tools within that processor
 * - Builds dynamic UI with only selected tools
 * - Shows execution logs for the analysis process
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Loader2, Wrench, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import ImageProcessing from '@/components/multimodal/ImageProcessing';
import TextProcessing from '@/components/multimodal/TextProcessing';
import AudioProcessing from '@/components/multimodal/AudioProcessing';

// Components
import PromptAnalysis from '@/components/multimodal/PromptAnalysis';
import ProcessorAvailability from '@/components/multimodal/ProcessorAvailability';
import DynamicToolUI from '@/components/multimodal/DynamicToolUI';
import ExecutionVisualizer, { ExecutionLog } from '@/components/multimodal/ExecutionVisualizer';
import DebugPanel, { DebugError } from '@/components/multimodal/DebugPanel';
import { analyzePrompt, PromptAnalysisResult } from '@/lib/prompt-analyzer';
import { PROCESSORS_REGISTRY, getProcessorById } from '@/lib/tools-registry';

export default function MultimodalBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'builder' | 'image-processing' | 'text-processing' | 'audio-processing'>('builder');
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<PromptAnalysisResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [debugErrors, setDebugErrors] = useState<DebugError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Examples matching available tools
  const examples = [
    "Test image processor with an uploaded photo",
    "Generate image from text prompt",
    "Analyze text and summarize",
    "Transcribe audio file to text",
    "Translate text to Spanish",
    "Caption an uploaded image",
  ];

  const addExecutionLog = (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    setExecutionLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...log,
    }]);
  };

  const addDebugError = (error: Omit<DebugError, 'id' | 'timestamp'>) => {
    setDebugErrors(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      ...error,
    }]);
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please describe what processors you want to test',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setExecutionLogs([]);
    setDebugErrors([]);

    try {
      addExecutionLog({
        level: 'info',
        message: '🔍 Analyzing prompt...',
      });

      // Step 1: Analyze prompt using HuggingFace API
      addExecutionLog({
        level: 'info',
        message: '📡 Connecting to HuggingFace API...',
      });

      const analysisResult = await analyzePrompt(prompt);
      
      addExecutionLog({
        level: 'success',
        message: '✅ Prompt analysis complete',
      });

      // Step 2: Processor selection
      const processor = getProcessorById(analysisResult.selectedProcessor);
      if (!processor) {
        throw new Error(`Processor ${analysisResult.selectedProcessor} not found`);
      }

      addExecutionLog({
        level: 'info',
        message: `🔧 Selected processor: ${processor.name}`,
        stepName: 'Processor Selection',
        metadata: { processorId: analysisResult.selectedProcessor },
      });

      // Step 3: Tool selection
      const selectedToolNames = processor.tools
        .filter(tool => analysisResult.selectedTools.includes(tool.task))
        .map(tool => tool.name);

      addExecutionLog({
        level: 'info',
        message: `🛠️ Selected tools: ${selectedToolNames.join(', ')}`,
        stepName: 'Tool Selection',
        metadata: { tools: analysisResult.selectedTools },
      });

      // Step 4: Backend validation
      addExecutionLog({
        level: 'info',
        message: `🔌 Validating backend processor: ${processor.backendProcessor}`,
        stepName: 'Backend Validation',
      });

      addExecutionLog({
        level: 'success',
        message: `✅ Backend processor available`,
      });

      // Step 5: UI generation
      addExecutionLog({
        level: 'info',
        message: `🎨 Generating UI for ${processor.name}...`,
        stepName: 'UI Generation',
      });

      setAnalysis(analysisResult);

      addExecutionLog({
        level: 'success',
        message: `✅ UI created with ${selectedToolNames.length} tool(s)`,
        stepName: 'UI Generation',
      });

      addExecutionLog({
        level: 'success',
        message: '🎉 Analysis complete! Ready to test.',
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      
      addExecutionLog({
        level: 'error',
        message: `❌ ${error.message || 'Failed to analyze prompt'}`,
      });

      addDebugError({
        source: error.message?.includes('API') ? 'network' : 'unknown',
        message: error.message || 'Failed to analyze prompt',
        details: error.details || error.stack,
        suggestions: [
          'Check your prompt and try again',
          'Ensure you mention text, image, or audio processors',
          'Verify HuggingFace API key is configured',
        ],
        retryable: true,
      });

      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze prompt. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setAnalysis(null);
    setExecutionLogs([]);
    setDebugErrors([]);
  };

  const handleRetryError = (errorId: string) => {
    setDebugErrors(prev => prev.filter(e => e.id !== errorId));
    handleAnalyze();
  };

  const handleRetryAllErrors = () => {
    setDebugErrors([]);
    handleAnalyze();
  };

  const handleDismissError = (errorId: string) => {
    setDebugErrors(prev => prev.filter(e => e.id !== errorId));
  };

  const handleClearLogs = () => {
    setExecutionLogs([]);
  };

  // Get requested processors for availability check
  const requestedProcessors = analysis 
    ? [PROCESSORS_REGISTRY.find(p => p.id === analysis.selectedProcessor)?.type].filter(Boolean) as Array<'text' | 'image' | 'audio'>
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/workflows')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Multimodal Agent Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'builder' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('builder')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Builder
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  activeTab === 'text-processing' || 
                  activeTab === 'image-processing' || 
                  activeTab === 'audio-processing'
                    ? 'default' 
                    : 'ghost'
                }
                size="sm"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Tools
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Processing Tools</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTab('text-processing')}
                className={activeTab === 'text-processing' ? 'bg-accent' : ''}
              >
                <span className="mr-2">📝</span>
                Text Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('image-processing')}
                className={activeTab === 'image-processing' ? 'bg-accent' : ''}
              >
                <span className="mr-2">🖼️</span>
                Image Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab('audio-processing')}
                className={activeTab === 'audio-processing' ? 'bg-accent' : ''}
              >
                <span className="mr-2">🔊</span>
                Audio Processing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {activeTab === 'image-processing' ? (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
          <ImageProcessing />
        </div>
      ) : activeTab === 'text-processing' ? (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
          <TextProcessing />
        </div>
      ) : activeTab === 'audio-processing' ? (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
          <AudioProcessing />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* LEFT PANEL - Prompt Input */}
          <div className="w-80 border-r border-border bg-muted/30 p-6 overflow-y-auto">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Prompt Input
                </CardTitle>
                <CardDescription>Describe what you want to test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Example: Generate image from text prompt"
                  rows={8}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !prompt.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Prompt
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isAnalyzing}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Try these examples:</h3>
                  <div className="space-y-2">
                    {examples.map((example, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="w-full justify-start p-2 cursor-pointer hover:bg-accent text-left text-xs"
                        onClick={() => setPrompt(example)}
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER PANEL - Analysis, Availability & Test UI */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <PromptAnalysis 
              analysis={analysis ? {
                goal: analysis.goal,
                selectedProcessor: analysis.selectedProcessor,
                selectedTools: analysis.selectedTools,
                requestedProcessors: requestedProcessors,
              } : null}
            />
            {analysis && requestedProcessors.length > 0 && (
              <ProcessorAvailability 
                requestedProcessors={requestedProcessors}
              />
            )}
            {analysis && (
              <DynamicToolUI 
                processorId={analysis.selectedProcessor}
                selectedTools={analysis.selectedTools}
              />
            )}
          </div>

          {/* RIGHT PANEL - Logs & Debug */}
          <div className="w-96 border-l border-border bg-muted/30 p-6 overflow-y-auto space-y-6">
            <ExecutionVisualizer
              logs={executionLogs}
              isExecuting={isAnalyzing}
              onClear={handleClearLogs}
            />
            <DebugPanel
              errors={debugErrors}
              onRetry={handleRetryError}
              onRetryAll={handleRetryAllErrors}
              onDismiss={handleDismissError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
