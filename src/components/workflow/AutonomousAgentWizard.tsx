import { ENDPOINTS } from '@/config/endpoints';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    Bot, ArrowRight, AlertCircle,
    Settings2, CheckCircle2, Play, RefreshCw, Layers, Sparkles, Loader2, Check, Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowStore } from '@/stores/workflowStore';
import { motion, AnimatePresence } from 'framer-motion';
import { validateAndFixWorkflow } from '@/lib/workflowValidation';
import { useTheme } from '@/hooks/useTheme';

type WizardStep = 'idle' | 'analyzing' | 'questioning' | 'refining' | 'confirmation' | 'building' | 'complete';

interface AgentQuestion {
    id: string;
    text: string;
    options: string[];
}

interface AnalysisResult {
    summary: string;
    questions: AgentQuestion[];
    clarifiedPromptPreview: string;
    predictedStepCount: number;
}

interface RefinementResult {
    refinedPrompt: string;
    requirements: Array<{
        key: string;
        label: string;
        type: string;
        description: string;
    }>;
}

export function AutonomousAgentWizard() {
    const [step, setStep] = useState<WizardStep>('idle');
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [refinement, setRefinement] = useState<RefinementResult | null>(null);
    const [requirementsMode, setRequirementsMode] = useState<'ai' | 'manual'>('ai');
    const [requirementValues, setRequirementValues] = useState<Record<string, string>>({});
    const [buildingLogs, setBuildingLogs] = useState<string[]>([]);
    const [generatedWorkflowId, setGeneratedWorkflowId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);
    const { toast } = useToast();
    const { setNodes, setEdges } = useWorkflowStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Map backend phases to progress ranges
    const getProgressForPhase = (phase: string): number => {
        const phaseMap: Record<string, number> = {
            'understand': 15,      // 0-30% range
            'planning': 50,        // 30-70% range
            'construction': 80,    // 70-95% range
            'validation': 92,      // 95-99% range
            'verification': 97,    // 95-99% range
            'healing': 85,         // Recovery phase
            'learning': 98,        // Final cleanup
        };
        return phaseMap[phase] || 0;
    };

    // Map phases to user-friendly descriptions
    const getPhaseDescription = (phase: string): string => {
        const descriptions: Record<string, string> = {
            'understand': 'Analyzing user prompt',
            'planning': 'Designing workflow structure',
            'construction': 'Finalizing nodes and connections',
            'validation': 'Validating consistency',
            'verification': 'Running final checks',
            'healing': 'Resolving issues',
            'learning': 'Finalizing workflow',
        };
        return descriptions[phase] || 'Processing...';
    };

    const handleAnalyze = async () => {
        if (!prompt.trim()) return;
        setStep('analyzing');

        try {
            const response = await fetch(`${ENDPOINTS.itemBackend}/generate-workflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, mode: 'analyze' })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Analysis failed' }));
                throw new Error(error.error || error.message || 'Analysis failed');
            }

            const data = await response.json();
            setAnalysis(data);
            const initialAnswers: Record<string, string> = {};
            data.questions.forEach((q: AgentQuestion) => {
                if (q.options.length > 0) initialAnswers[q.id] = q.options[0];
            });
            setAnswers(initialAnswers);
            setStep('questioning');
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
            setStep('idle');
        }
    };

    const handleRefine = async () => {
        setStep('refining');
        const fa = analysis?.questions.map(q => ({
            question: q.text,
            answer: answers[q.id]
        })) || [];

        try {
            const response = await fetch(`${ENDPOINTS.itemBackend}/generate-workflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, mode: 'refine', answers: fa })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Refinement failed' }));
                throw new Error(error.error || error.message || 'Refinement failed');
            }

            const data = await response.json();
            setRefinement(data);
            setStep('confirmation');
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Refinement Failed', description: err.message, variant: 'destructive' });
            setStep('questioning');
        }
    };

    const handleBuild = async () => {
        setStep('building');
        setProgress(0);
        setIsComplete(false);
        setCurrentPhase('');
        setBuildingLogs(['Initializing Autonomous Agent...', 'Loading Node Library...', 'Synthesizing Requirements...']);

        // Fallback: Gradually increase progress if backend doesn't send updates
        let fallbackProgressInterval: NodeJS.Timeout | null = null;
        const startFallbackProgress = () => {
            fallbackProgressInterval = setInterval(() => {
                setProgress(prev => {
                    // Cap at 95% until completion
                    if (prev >= 95) return prev;
                    // Gradually increase, slower as we approach 95%
                    const increment = prev < 30 ? 2 : prev < 70 ? 1.5 : 0.5;
                    return Math.min(95, prev + increment);
                });
            }, 500);
        };

        const stopFallbackProgress = () => {
            if (fallbackProgressInterval) {
                clearInterval(fallbackProgressInterval);
                fallbackProgressInterval = null;
            }
        };

        try {
            const config = {
                ...requirementValues,
                ollamaBaseUrl: ENDPOINTS.itemBackend
            };

            // Get Supabase URL and session token
            const { data: { session } } = await supabase.auth.getSession();
            // Use streaming mode to get real-time progress
            const response = await fetch(`${ENDPOINTS.itemBackend}/generate-workflow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                    'x-stream-progress': 'true',
                },
                body: JSON.stringify({
                    prompt: refinement?.refinedPrompt,
                    mode: 'create',
                    config: config
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to generate workflow');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let finalData: any = null;

            // Start fallback progress if streaming doesn't provide updates
            startFallbackProgress();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        try {
                            const update = JSON.parse(line);

                            // Handle progress updates
                            if (update.current_phase) {
                                // Stop fallback progress when we get real updates
                                stopFallbackProgress();

                                setCurrentPhase(update.current_phase);

                                // Use backend progress_percentage if available, otherwise calculate from phase
                                let actualProgress = 0;
                                if (update.progress_percentage !== undefined) {
                                    actualProgress = Math.min(99, Math.max(0, update.progress_percentage));
                                } else {
                                    actualProgress = Math.min(99, getProgressForPhase(update.current_phase));
                                }

                                setProgress(prev => Math.max(prev, actualProgress));

                                const phaseDesc = getPhaseDescription(update.current_phase);
                                setBuildingLogs(prev => {
                                    if (prev.includes(phaseDesc)) return prev;
                                    return [...prev, phaseDesc];
                                });
                            }

                            // Handle completion
                            if (update.status === 'completed' || (update.nodes && update.edges)) {
                                // Stop fallback progress
                                stopFallbackProgress();

                                finalData = update;
                                setProgress(100);
                                setIsComplete(true);
                                setBuildingLogs(prev => [...prev, 'Workflow Generated Successfully!']);

                                // Normalize and save immediately
                                const { data: { user } } = await supabase.auth.getUser();
                                const normalized = validateAndFixWorkflow({ nodes: update.nodes, edges: update.edges });

                                const workflowData = {
                                    name: analysis?.summary.substring(0, 50) || 'AI Generated Workflow',
                                    nodes: normalized.nodes,
                                    edges: normalized.edges,
                                    user_id: user?.id,
                                    updated_at: new Date().toISOString(),
                                };

                                const { data: savedWorkflow, error: saveError } = await supabase
                                    .from('workflows')
                                    .insert(workflowData)
                                    .select()
                                    .single();

                                if (saveError) throw saveError;

                                setGeneratedWorkflowId(savedWorkflow.id);
                                setNodes(normalized.nodes);
                                setEdges(normalized.edges);

                                // Immediately show completion
                                setStep('complete');
                                return;
                            }

                            // Handle errors
                            if (update.status === 'error') {
                                throw new Error(update.error || 'Workflow generation failed');
                            }
                        } catch (parseErr) {
                            // Skip malformed JSON lines (might be partial data)
                            console.warn('Failed to parse progress update:', line);
                        }
                    }
                }
            }

            // If we didn't get completion via stream, check if we have final data
            // (Backend might send final workflow data without explicit completion status)
            if (!finalData) {
                // Fallback: If streaming didn't work, use regular invoke
                const response = await fetch(`${ENDPOINTS.itemBackend}/generate-workflow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || ''}`,
                    },
                    body: JSON.stringify({
                        prompt: refinement?.refinedPrompt,
                        mode: 'create',
                        config: requirementValues
                    })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ error: 'Failed to generate workflow' }));
                    throw new Error(error.error || error.message || 'Failed to generate workflow');
                }

                finalData = await response.json();

                // Show progress completion immediately
                setProgress(100);
                setIsComplete(true);
                setBuildingLogs(prev => [...prev, 'Workflow Generated Successfully!']);
            }

            // Save workflow to database
            if (finalData && finalData.nodes && finalData.edges) {
                const { data: { user } } = await supabase.auth.getUser();
                const normalized = validateAndFixWorkflow({ nodes: finalData.nodes, edges: finalData.edges });

                const workflowData = {
                    name: analysis?.summary.substring(0, 50) || 'AI Generated Workflow',
                    nodes: normalized.nodes,
                    edges: normalized.edges,
                    user_id: user?.id,
                    updated_at: new Date().toISOString(),
                };

                const { data: savedWorkflow, error: saveError } = await supabase
                    .from('workflows')
                    .insert(workflowData)
                    .select()
                    .single();

                if (saveError) throw saveError;

                setGeneratedWorkflowId(savedWorkflow.id);
                setNodes(normalized.nodes);
                setEdges(normalized.edges);
            }

            // Stop fallback progress and show completion when 100% is reached
            stopFallbackProgress();
            setProgress(100);
            setIsComplete(true);
            setStep('complete');

        } catch (err: any) {
            // Clean up fallback progress on error
            stopFallbackProgress();

            console.error(err);
            toast({ title: 'Build Failed', description: err.message, variant: 'destructive' });
            setStep('confirmation');
        }
    };

    const reset = () => {
        setStep('idle');
        setPrompt('');
        setAnalysis(null);
        setRefinement(null);
        setAnswers({});
        setBuildingLogs([]);
        setGeneratedWorkflowId(null);
        setProgress(0);
        setCurrentPhase('');
        setIsComplete(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-background text-foreground font-sans flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border bg-card flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Autonomous Workflow Agent
                        </h2>
                        <p className="text-xs text-muted-foreground">Multi-Agent System • v2.5</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    >
                        {theme === "light" ? (
                            <Moon className="h-5 w-5" />
                        ) : (
                            <Sun className="h-5 w-5" />
                        )}
                    </Button>
                    <Badge variant="outline" className="h-8 px-3">
                        {step === 'idle' ? 'Ready' : step === 'complete' ? 'Completed' : 'Processing'}
                    </Badge>
                    <Button variant="ghost" onClick={() => navigate('/workflows')}>Close</Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-background/50">
                <AnimatePresence mode="wait">

                    {/* STEP 1: IDLE */}
                    {step === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-6 max-w-2xl mx-auto mt-10"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">What would you like to automate?</h3>
                                <p className="text-muted-foreground text-lg">Describe your task in natural language. The agents will handle the rest.</p>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <Textarea
                                    placeholder="e.g. Post to Instagram every morning at 9 AM with a tech tip..."
                                    className="relative min-h-[150px] bg-card border-border resize-none p-6 text-lg focus-visible:ring-indigo-500 rounded-lg shadow-xl"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <Button
                                    className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                                    onClick={handleAnalyze}
                                    disabled={!prompt.trim()}
                                >
                                    Analyze Prompts <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                {['Social Media Automation', 'Data Syncing', 'Report Generation'].map((i) => (
                                    <div key={i} className="p-4 rounded-lg border border-border bg-card/30 hover:bg-muted/50 cursor-pointer transition-all hover:border-indigo-500/50 hover:scale-[1.02] text-center text-sm text-muted-foreground" onClick={() => setPrompt(`Create a workflow for ${i.toLowerCase()}`)}>
                                        {i}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: ANALYZING */}
                    {step === 'analyzing' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[50vh] gap-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full" />
                                <Loader2 className="h-16 w-16 text-indigo-400 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-medium">Analyzing Requirements...</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                    Decomposing your request into logical steps and identifying necessary integrations.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: QUESTIONING */}
                    {step === 'questioning' && analysis && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-6 max-w-3xl mx-auto pb-10"
                        >
                            <Card className="shadow-xl overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-indigo-400">
                                        <Layers className="h-5 w-5" /> Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-foreground leading-relaxed text-lg">{analysis.summary}</p>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-400">
                                    <AlertCircle className="h-5 w-5" />
                                    Clarifying Questions
                                </h3>
                                <div className="grid gap-4">
                                    {analysis.questions.map((q) => (
                                        <Card key={q.id} className="hover:border-border transition-colors">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">{q.text}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <RadioGroup
                                                    value={answers[q.id]}
                                                    onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                                                >
                                                    {q.options.map((opt) => (
                                                        <div key={opt} className={`group flex items-center space-x-2 border p-3 rounded-md transition-all cursor-pointer ${answers[q.id] === opt ? 'border-indigo-500 bg-indigo-500/10' : 'border-border hover:bg-muted'}`}>
                                                            <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="text-indigo-500" />
                                                            <Label htmlFor={`${q.id}-${opt}`} className="cursor-pointer flex-1 transition-colors">{opt}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleRefine} className="self-end bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 px-8 py-6 text-lg" size="lg">
                                Submit Answers <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 4: REFINING */}
                    {step === 'refining' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[50vh] gap-6"
                        >
                            <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                            <h3 className="text-xl font-medium">Refining Workflow Plan...</h3>
                        </motion.div>
                    )}

                    {/* STEP 5: CONFIRMATION */}
                    {step === 'confirmation' && refinement && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-6 max-w-5xl mx-auto pb-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-indigo-500/30 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-indigo-400">Final Execution Plan</CardTitle>
                                            <CardDescription>Based on your requirements</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-muted/40 p-6 rounded-md text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed border border-border">
                                                {refinement.refinedPrompt}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {refinement.requirements.length > 0 && (
                                        <Card className="border-amber-500/20 shadow-lg">
                                            <CardHeader>
                                                <CardTitle className="text-amber-400 flex items-center gap-2">
                                                    <Settings2 className="h-5 w-5" /> Logic Config
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <RadioGroup value={requirementsMode} onValueChange={(v: any) => setRequirementsMode(v)} className="flex flex-wrap gap-4 p-1">
                                                    <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all cursor-pointer ${requirementsMode === 'ai' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-muted/30 border-border'}`}>
                                                        <RadioGroupItem value="ai" id="mode-ai" className="text-indigo-500" />
                                                        <Label htmlFor="mode-ai" className="cursor-pointer font-medium">Let AI handle everything (Auto)</Label>
                                                    </div>
                                                    <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all cursor-pointer ${requirementsMode === 'manual' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-muted/30 border-border'}`}>
                                                        <RadioGroupItem value="manual" id="mode-manual" className="text-indigo-500" />
                                                        <Label htmlFor="mode-manual" className="cursor-pointer font-medium">I'll Configure (Manual)</Label>
                                                    </div>
                                                </RadioGroup>

                                                {requirementsMode === 'manual' && (
                                                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2">
                                                        {refinement.requirements.map(req => (
                                                            <div key={req.key} className="gap-2 grid">
                                                                <Label>{req.label}</Label>
                                                                <Input
                                                                    placeholder={req.description}
                                                                    className="h-10"
                                                                    value={requirementValues[req.key] || ''}
                                                                    onChange={(e) => setRequirementValues({ ...requirementValues, [req.key]: e.target.value })}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                <div className="space-y-6 h-fit sticky top-6">
                                    <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 backdrop-blur-sm">
                                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5" /> Ready to Build
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            The agent has all necessary information.
                                            {requirementsMode === 'ai' ? ' Credentials and URLs will be inferred or set to intelligent defaults.' : ' Using provided configuration.'}
                                        </p>
                                    </div>
                                    <Button onClick={handleBuild} className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]">
                                        <Play className="mr-2 h-5 w-5 fill-current" /> Start Building
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 6: BUILDING */}
                    {step === 'building' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[60vh] max-w-2xl mx-auto w-full gap-8"
                        >
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-foreground">Workflow Generation Progress</span>
                                        {currentPhase && (
                                            <span className="text-xs text-muted-foreground">{getPhaseDescription(currentPhase)}</span>
                                        )}
                                    </div>
                                    <span className="text-indigo-400 font-semibold">
                                        {isComplete ? '100%' : `${Math.min(99, progress)}%`}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${isComplete ? 100 : Math.min(99, progress)}%` }}
                                        transition={{ duration: 0.3, ease: "linear" }}
                                    />
                                </div>
                            </div>

                            <Card className="w-full bg-card/40 border-border font-mono text-xs h-80 overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-3 border-b border-border text-muted-foreground bg-muted/50 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                    </div>
                                    <span className="ml-2">System Logs</span>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-3">
                                        {buildingLogs.map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start gap-3 border-l-2 border-border pl-3 py-0.5"
                                            >
                                                <span className="text-muted-foreground shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                <span className={log.includes('Success') ? 'text-green-400' : 'text-foreground'}>{log}</span>
                                            </motion.div>
                                        ))}
                                        <div className="pl-3 animate-pulse text-indigo-400">_</div>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEP 7: COMPLETE */}
                    {step === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-[60vh] gap-8 text-center"
                        >
                            <div className="h-32 w-32 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                                <Check className="h-16 w-16 text-green-500 relative z-10" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-bold text-foreground mb-2">✅ Workflow Ready</h2>
                                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                                    Your autonomous agent has successfully built and validated the workflow.
                                </p>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <Button
                                    onClick={reset}
                                    className="bg-card border-2 border-border text-foreground hover:bg-muted hover:border-border/80 h-12 px-6 font-semibold transition-all shadow-lg"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Create Another
                                </Button>
                                <Button
                                    onClick={() => generatedWorkflowId && navigate(`/workflow/${generatedWorkflowId}`)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold shadow-xl shadow-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!generatedWorkflowId}
                                >
                                    View Workflow <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
