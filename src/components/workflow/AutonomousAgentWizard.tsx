import { ENDPOINTS } from '@/config/endpoints';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
    Bot, ArrowRight, AlertCircle,
    Settings2, CheckCircle2, Play, RefreshCw, Layers, Sparkles, Loader2, Check, Sun, Moon, Brain
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
import { InputGuideLink } from './InputGuideLink';
import { GlassBlurLoader } from '@/components/ui/glass-blur-loader';

type WizardStep = 'idle' | 'analyzing' | 'questioning' | 'refining' | 'confirmation' | 'credentials' | 'building' | 'complete';

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
    systemPrompt?: string;
    requirements?: {
        urls?: string[];
        apis?: string[];
        credentials?: string[];
        schedules?: string[];
        platforms?: string[];
    } | Array<{
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
    const [requiredCredentials, setRequiredCredentials] = useState<string[]>([]);
    const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
    const [showCredentialStep, setShowCredentialStep] = useState(false);
    const [buildingLogs, setBuildingLogs] = useState<string[]>([]);
    const [generatedWorkflowId, setGeneratedWorkflowId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);
    const [buildStartTime, setBuildStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [cognitiveTextIndex, setCognitiveTextIndex] = useState(0);
    const [circleTextIndex, setCircleTextIndex] = useState(0);
    const { toast } = useToast();
    const { setNodes, setEdges } = useWorkflowStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    
    // Refs for auto-scrolling
    const step1Ref = useRef<HTMLDivElement>(null);
    const step2Ref = useRef<HTMLDivElement>(null);
    const step3Ref = useRef<HTMLDivElement>(null);
    const step4Ref = useRef<HTMLDivElement>(null);

    // Debug: Log when requiredCredentials changes
    useEffect(() => {
        console.log('🔑 [Frontend] requiredCredentials state changed:', requiredCredentials);
        console.log('📊 [Frontend] Current step:', step);
        console.log('📋 [Frontend] Has refinement:', !!refinement);
        if (step === 'confirmation' && refinement) {
            console.log('✅ [Frontend] Should show credentials step:', requiredCredentials.length > 0);
        }
    }, [requiredCredentials, step, refinement]);
    
    // Debug: Log when workflow ID is set
    useEffect(() => {
        if (generatedWorkflowId) {
            console.log('✅ Workflow ID set:', generatedWorkflowId);
        } else {
            console.log('⚠️ Workflow ID is null');
        }
    }, [generatedWorkflowId]);

    // Immediate scroll function for instant scrolling on submit
    const scrollImmediately = (stepRef: React.RefObject<HTMLDivElement>, fallbackScroll: number = 500) => {
        // Try to scroll to ref first, but also scroll by amount as immediate action
        // This ensures scrolling happens even if ref isn't ready
        window.scrollBy({ top: fallbackScroll, behavior: 'smooth' });
        
        // Also try to scroll to ref if available (for more precise positioning)
        requestAnimationFrame(() => {
            if (stepRef.current) {
                stepRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start', 
                    inline: 'nearest' 
                });
            }
        });
    };

    // Auto-scroll functionality with improved reliability (for delayed scrolling)
    const scrollToStep = (stepRef: React.RefObject<HTMLDivElement>, delay: number = 500) => {
        setTimeout(() => {
            if (stepRef.current) {
                // Use requestAnimationFrame for smoother scrolling
                requestAnimationFrame(() => {
                    stepRef.current?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start', 
                        inline: 'nearest' 
                    });
                });
            }
        }, delay);
    };

    // Auto-scroll to step 2 after analysis completes (Step 1 -> Step 2)
    useEffect(() => {
        if (step === 'questioning' && analysis) {
            // Wait for content to render, then scroll
            scrollToStep(step2Ref, 800);
        }
    }, [step, analysis]);

    // Auto-scroll to step 3 when refinement completes with systemPrompt (Step 2 -> Step 3)
    useEffect(() => {
        if (step === 'confirmation' && refinement?.systemPrompt) {
            // If requirements are not yet ready, scroll to step 3
            if (!refinement.requirements) {
                scrollToStep(step3Ref, 600);
            }
        }
    }, [step, refinement?.systemPrompt, refinement?.requirements]);

    // Auto-scroll to step 4 when requirements are ready (Step 3 -> Step 4)
    useEffect(() => {
        if (step === 'confirmation' && refinement?.requirements) {
            scrollToStep(step4Ref, 800);
        }
    }, [step, refinement?.requirements]);

    // Timer for building step
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (step === 'building' && buildStartTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - buildStartTime) / 1000));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [step, buildStartTime]);

    // Cognitive progress text rotation (every 1.5s)
    const cognitiveTexts = [
        'Initializing cognitive engine…',
        'Mapping workflow paths…',
        'Optimizing decision nodes…',
        'Finalizing intelligence layer…',
        'Synthesizing requirements…',
        'Building node connections…',
        'Validating workflow structure…',
    ];

    useEffect(() => {
        if (step === 'building' && !isComplete) {
            const interval = setInterval(() => {
                setCognitiveTextIndex((prev) => (prev + 1) % cognitiveTexts.length);
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [step, isComplete]);

    // Circle loader text rotation (every 1.2s)
    const circleTexts = ['Thinking', 'Analyzing', 'Building', 'Optimizing'];
    
    useEffect(() => {
        if (step === 'building' && !isComplete) {
            const interval = setInterval(() => {
                setCircleTextIndex((prev) => (prev + 1) % circleTexts.length);
            }, 1200);
            return () => clearInterval(interval);
        }
    }, [step, isComplete]);

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
        // Scroll immediately BEFORE state change - no waiting
        scrollImmediately(step2Ref);
        setStep('analyzing');

        try {
            const response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
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
            // Ensure step 2 is visible after questions load
            scrollToStep(step2Ref, 300);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
            setStep('idle');
        }
    };

    // Normalize credential names to avoid duplicates (e.g., SLACK_TOKEN vs SLACK_BOT_TOKEN)
    const normalizeCredentialName = (name: string): string => {
        const upper = name.toUpperCase();
        // Normalize Slack token variations to SLACK_BOT_TOKEN
        if (upper.includes('SLACK') && upper.includes('TOKEN') && !upper.includes('WEBHOOK')) {
            return 'SLACK_BOT_TOKEN';
        }
        // Normalize Slack webhook variations
        if (upper.includes('SLACK') && upper.includes('WEBHOOK')) {
            return 'SLACK_WEBHOOK_URL';
        }
        return upper;
    };
    
    // Identify required credentials from requirements and answers
    const identifyRequiredCredentials = (requirements: any, answers: Record<string, string>): string[] => {
        const credentials: string[] = [];
        
        // Extract selected services from answers
        const answerValues = Object.values(answers).map(v => String(v).toLowerCase());
        const answerTexts = Object.values(answers).join(' ').toLowerCase();
        const promptText = prompt.toLowerCase();
        
        console.log('🔍 [Frontend] Identifying credentials:', { 
            promptText: promptText.substring(0, 100), 
            answerValues, 
            answerTexts: answerTexts.substring(0, 200) 
        });
        
        // Check if AI Agent/LLM functionality is needed
        // Check both prompt and answers for AI-related keywords
        const hasAIFunctionality = 
            promptText.includes('ai agent') ||
            promptText.includes('ai assistant') ||
            promptText.includes('chatbot') ||
            promptText.includes('chat bot') ||
            promptText.includes('llm') ||
            promptText.includes('language model') ||
            promptText.includes('generate') ||
            promptText.includes('analyze') ||
            promptText.includes('summarize') ||
            promptText.includes('classify') ||
            promptText.includes('sentiment') ||
            promptText.includes('intent') ||
            promptText.includes('natural language') ||
            promptText.includes('nlp') ||
            promptText.includes('text analysis') ||
            promptText.includes('content generation') ||
            promptText.includes('ai-powered') ||
            promptText.includes('ai powered') ||
            promptText.includes('using ai') ||
            promptText.includes('with ai') ||
            promptText.includes('ai model') ||
            answerTexts.includes('ai agent') ||
            answerTexts.includes('ai assistant') ||
            answerTexts.includes('chatbot') ||
            answerTexts.includes('ai-generated') ||
            answerTexts.includes('ai generated') ||
            answerTexts.includes('ai-generated content') ||
            answerTexts.includes('ai content') ||
            answerValues.some(v => v.includes('ai-generated') || v.includes('ai generated'));
        
        console.log('🤖 [Frontend] AI Functionality detected:', hasAIFunctionality);
        
        // Check for AI providers in answers
        if (answerValues.some(v => v.includes('openai') || v.includes('gpt'))) {
            credentials.push('OPENAI_API_KEY');
            console.log('✅ [Frontend] Added OPENAI_API_KEY');
        } else if (answerValues.some(v => v.includes('claude') || v.includes('anthropic'))) {
            credentials.push('ANTHROPIC_API_KEY');
            console.log('✅ [Frontend] Added ANTHROPIC_API_KEY');
        } else if (answerValues.some(v => v.includes('gemini'))) {
            // Only ask for Gemini API Key if explicitly mentioned (not for Google Sheets/Gmail)
            credentials.push('GEMINI_API_KEY');
            console.log('✅ [Frontend] Added GEMINI_API_KEY (from provider selection)');
        } else if (hasAIFunctionality) {
            // If AI functionality is detected but no specific provider selected, default to Gemini
            // Only if AI functionality is actually needed (not just Google Sheets/Gmail)
            credentials.push('GEMINI_API_KEY');
            console.log('✅ [Frontend] Added GEMINI_API_KEY (default for AI functionality)');
        }
        
        // Check for output channels
        if (answerValues.some(v => v.includes('slack'))) {
            // Only ask for Slack Bot Token (not redundant SLACK_TOKEN or SLACK_WEBHOOK_URL)
            // Check if normalized version already exists
            const slackTokenNormalized = normalizeCredentialName('SLACK_BOT_TOKEN');
            if (!credentials.some(c => normalizeCredentialName(c) === slackTokenNormalized)) {
                credentials.push('SLACK_BOT_TOKEN');
            }
        } else if (answerValues.some(v => v.includes('discord'))) {
            if (!credentials.includes('DISCORD_WEBHOOK_URL')) {
                credentials.push('DISCORD_WEBHOOK_URL');
            }
        } else if (answerValues.some(v => v.includes('email') || v.includes('smtp'))) {
            // Only ask for SMTP if not using Gmail (Gmail uses pre-connected OAuth)
            if (!answerValues.some(v => v.includes('gmail'))) {
                if (!credentials.includes('SMTP_HOST')) credentials.push('SMTP_HOST');
                if (!credentials.includes('SMTP_USERNAME')) credentials.push('SMTP_USERNAME');
                if (!credentials.includes('SMTP_PASSWORD')) credentials.push('SMTP_PASSWORD');
            }
            // For Gmail, sender account is selected from connected accounts (handled in UI)
        }
        
        // Google services (Sheets, Gmail, Drive) are pre-connected via OAuth
        // Do NOT ask for Google OAuth credentials - they are already configured
        // Only check for Gemini API Key if AI functionality is actually needed
        
        // Check requirements for credential hints
        if (requirements.credentials && Array.isArray(requirements.credentials)) {
            requirements.credentials.forEach((cred: any) => {
                const credName = typeof cred === 'string' ? cred : (cred.name || cred.type || '');
                if (credName) {
                    const normalized = normalizeCredentialName(credName);
                    // Check if normalized version already exists
                    if (!credentials.includes(normalized) && 
                        !credentials.some(c => normalizeCredentialName(c) === normalized)) {
                        credentials.push(normalized);
                    }
                }
            });
        }
        
        // Check APIs for credential requirements
        if (requirements.apis && Array.isArray(requirements.apis)) {
            requirements.apis.forEach((api: any) => {
                const apiName = typeof api === 'string' ? api : (api.name || api.endpoint || '');
                const apiLower = apiName.toLowerCase();
                if (apiLower.includes('openai') || apiLower.includes('gpt')) {
                    if (!credentials.includes('OPENAI_API_KEY')) credentials.push('OPENAI_API_KEY');
                } else if (apiLower.includes('claude') || apiLower.includes('anthropic')) {
                    if (!credentials.includes('ANTHROPIC_API_KEY')) credentials.push('ANTHROPIC_API_KEY');
                } else if (apiLower.includes('gemini')) {
                    // Only ask for Gemini API Key if explicitly mentioned (not for Google Sheets/Gmail)
                    if (!credentials.includes('GEMINI_API_KEY')) credentials.push('GEMINI_API_KEY');
                }
                // Google Sheets/Gmail APIs don't require Gemini API Key - they use OAuth
            });
        }
        
        // Final deduplication with normalization
        const normalizedCreds = new Map<string, string>();
        credentials.forEach(cred => {
            const normalized = normalizeCredentialName(cred);
            if (!normalizedCreds.has(normalized)) {
                normalizedCreds.set(normalized, cred);
            }
        });
        
        const finalCredentials = Array.from(normalizedCreds.values());
        console.log('🎯 [Frontend] Final identified credentials (deduplicated):', finalCredentials);
        return finalCredentials;
    };

    const handleRefine = async () => {
        // Scroll immediately BEFORE state change - no waiting
        scrollImmediately(step3Ref);
        setStep('refining');
        const fa = analysis?.questions.map(q => ({
            question: q.text,
            answer: answers[q.id]
        })) || [];

        try {
            const response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
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
            
            // Identify required credentials from requirements and answers
            // Use credentials from backend if provided, otherwise identify from requirements
            let detectedCredentials: string[] = [];
            
            if (data.requiredCredentials && Array.isArray(data.requiredCredentials) && data.requiredCredentials.length > 0) {
                // Backend has already identified credentials - normalize them
                detectedCredentials = data.requiredCredentials.map((cred: string) => normalizeCredentialName(cred));
                console.log('🔑 Backend identified required credentials:', detectedCredentials);
            } else if (data.requirements) {
                // Fallback: identify from requirements (frontend detection)
                detectedCredentials = identifyRequiredCredentials(data.requirements, answers);
                console.log('🔑 Frontend identified required credentials:', detectedCredentials);
                console.log('📋 Requirements:', data.requirements);
                console.log('💬 Answers:', answers);
            }
            
            // Final deduplication with normalization
            const normalizedCreds = new Map<string, string>();
            detectedCredentials.forEach((cred: string) => {
                const normalized = normalizeCredentialName(cred);
                if (!normalizedCreds.has(normalized)) {
                    normalizedCreds.set(normalized, normalized); // Use normalized name
                }
            });
            
            const uniqueCredentials = Array.from(normalizedCreds.values());
            setRequiredCredentials(uniqueCredentials);
            console.log('✅ Set requiredCredentials to (deduplicated & normalized):', uniqueCredentials);
            
            setStep('confirmation');
            // Ensure step 3 is visible after refinement loads
            scrollToStep(step3Ref, 300);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Refinement Failed', description: err.message, variant: 'destructive' });
            setStep('questioning');
        }
    };

    const handleBuild = async () => {
        // Scroll to top before transitioning to building page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setStep('building');
        setProgress(0);
        setIsComplete(false);
        setCurrentPhase('');
        setBuildStartTime(Date.now());
        setElapsedTime(0);
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
            // Normalize credential values to ensure uppercase keys are included
            const normalizedCredentials: Record<string, string> = {};
            Object.entries(credentialValues).forEach(([key, value]) => {
                // Keep original key
                normalizedCredentials[key] = value;
                // Also add uppercase version if it's a credential key
                if (requiredCredentials.some(cred => cred === key || key.toLowerCase() === cred.toLowerCase())) {
                    const upperKey = key.toUpperCase();
                    if (!normalizedCredentials[upperKey]) {
                        normalizedCredentials[upperKey] = value;
                    }
                }
            });
            
            // Build config with requirement values, credentials, and requirements metadata for AI auto-fill
            const config = {
                ...requirementValues,
                ...normalizedCredentials, // Include collected credentials with normalized keys
                ollamaBaseUrl: ENDPOINTS.itemBackend,
                // Pass requirements metadata so backend can intelligently fill fields
                requirements: refinement?.requirements || {},
                requirementsMode: 'manual', // Always manual - user provides credentials directly
                // Include all requirement values
                urls: refinement.requirements?.urls || [],
                apis: refinement.requirements?.apis || [],
                credentials: refinement.requirements?.credentials || [],
                schedules: refinement.requirements?.schedules || [],
                platforms: refinement.requirements?.platforms || [],
            };

            // Get Supabase URL and session token
            const { data: { session } } = await supabase.auth.getSession();
            // Use streaming mode to get real-time progress
            const response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
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
            let workflowSaved = false; // Track if workflow has been saved

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
                            console.log('Received update:', update);
                            
                            // Log structure for debugging
                            if (update.success || update.workflow) {
                                console.log('Completion detected - Structure:', {
                                    hasDirectNodes: !!update.nodes,
                                    hasDirectEdges: !!update.edges,
                                    hasWorkflowNodes: !!update.workflow?.nodes,
                                    hasWorkflowEdges: !!update.workflow?.edges,
                                    success: update.success,
                                    status: update.status
                                });
                            }

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

                            // Handle completion - check multiple possible completion indicators
                            // Support both direct structure (update.nodes) and nested structure (update.workflow.nodes)
                            const nodes = update.nodes || update.workflow?.nodes;
                            const edges = update.edges || update.workflow?.edges;
                            const hasNodes = nodes && Array.isArray(nodes) && nodes.length > 0;
                            const hasEdges = edges && Array.isArray(edges);
                            const isCompleted = update.status === 'completed' || update.status === 'success' || update.success === true || (hasNodes && hasEdges);
                            
                            // Check for required credentials BEFORE completion
                            // CRITICAL: Only check on first update, not after credentials have been provided
                            // This prevents refresh loop where workflow keeps asking for credentials
                            if (update.requiredCredentials && 
                                Array.isArray(update.requiredCredentials) && 
                                update.requiredCredentials.length > 0 && 
                                step === 'building' && 
                                !showCredentialStep && 
                                Object.keys(credentialValues).length === 0) {
                                
                                const missingCreds = update.requiredCredentials.filter((cred: string) => {
                                    // Check if credential is provided in config
                                    const credLower = cred.toLowerCase();
                                    const normalizedCred = cred.replace(/_/g, '').toLowerCase();
                                    
                                    // Check in config (normalized credentials)
                                    const inConfig = Object.keys(config).some(key => {
                                        const keyLower = key.toLowerCase();
                                        return keyLower === credLower || 
                                               keyLower === normalizedCred ||
                                               keyLower.includes(normalizedCred.replace(/api|key|token/gi, ''));
                                    });
                                    
                                    return !inConfig;
                                });
                                
                                // Only show credentials step if we have missing creds AND haven't shown it before
                                if (missingCreds.length > 0) {
                                    // Deduplicate credentials before setting
                                    const uniqueMissingCreds = [...new Set(missingCreds)];
                                    setRequiredCredentials(uniqueMissingCreds);
                                    setShowCredentialStep(true);
                                    setStep('credentials'); // New step for credential collection
                                    stopFallbackProgress();
                                    setBuildingLogs(prev => [...prev, `⚠️ ${missingCreds.length} credential(s) required`]);
                                    return; // Don't complete yet, wait for credentials
                                }
                            }
                            // If credentials were already provided or step is not 'building', continue with workflow generation
                            
                            if (isCompleted) {
                                // Stop fallback progress
                                stopFallbackProgress();

                                // Store the full update, but extract nodes/edges for processing
                                finalData = update;
                                // Ensure nodes/edges are at top level for consistency
                                if (update.workflow && !update.nodes) {
                                    finalData.nodes = update.workflow.nodes;
                                    finalData.edges = update.workflow.edges;
                                }
                                
                                setProgress(100);
                                setIsComplete(true);
                                setBuildingLogs(prev => [...prev, 'Workflow Generated Successfully!']);

                                // Normalize and save immediately
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    const workflowNodes = nodes || [];
                                    const workflowEdges = edges || [];
                                    const normalized = validateAndFixWorkflow({ nodes: workflowNodes, edges: workflowEdges });

                                    const workflowData = {
                                        name: (analysis?.summary && typeof analysis.summary === 'string') 
                                            ? analysis.summary.substring(0, 50) 
                                            : 'AI Generated Workflow',
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

                                    if (saveError) {
                                        console.error('Error saving workflow in streaming:', saveError);
                                        throw saveError;
                                    }

                                    if (savedWorkflow?.id) {
                                        setGeneratedWorkflowId(savedWorkflow.id);
                                        setNodes(normalized.nodes);
                                        setEdges(normalized.edges);
                                        workflowSaved = true;
                                        console.log('Workflow saved successfully with ID:', savedWorkflow.id);
                                    } else {
                                        console.error('Workflow saved but no ID returned');
                                        throw new Error('Failed to get workflow ID after save');
                                    }
                                } catch (saveErr: any) {
                                    console.error('Error saving workflow in streaming completion:', saveErr);
                                    toast({
                                        title: 'Warning',
                                        description: 'Workflow generated but failed to save. Error: ' + (saveErr.message || 'Unknown error'),
                                        variant: 'destructive',
                                    });
                                    // Don't return early if save failed - let it try again in the fallback section
                                    // But still show completion
                                }

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
                const response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
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

            // Save workflow to database (if not already saved in streaming completion)
            // Support both direct structure (finalData.nodes) and nested structure (finalData.workflow.nodes)
            const workflowNodes = finalData?.nodes || finalData?.workflow?.nodes;
            const workflowEdges = finalData?.edges || finalData?.workflow?.edges;
            
            if (finalData && workflowNodes && workflowEdges && !workflowSaved) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const normalized = validateAndFixWorkflow({ nodes: workflowNodes, edges: workflowEdges });

                    const workflowData = {
                        name: (analysis?.summary && typeof analysis.summary === 'string') 
                            ? analysis.summary.substring(0, 50) 
                            : 'AI Generated Workflow',
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

                    if (saveError) {
                        console.error('Error saving workflow:', saveError);
                        throw saveError;
                    }

                    if (savedWorkflow?.id) {
                        setGeneratedWorkflowId(savedWorkflow.id);
                        setNodes(normalized.nodes);
                        setEdges(normalized.edges);
                        workflowSaved = true;
                        console.log('Workflow saved successfully in fallback with ID:', savedWorkflow.id);
                    } else {
                        console.error('Workflow saved but no ID returned');
                        throw new Error('Failed to get workflow ID after save');
                    }
                } catch (saveErr: any) {
                    console.error('Error in workflow save:', saveErr);
                    toast({
                        title: 'Warning',
                        description: 'Workflow generated but failed to save. Error: ' + (saveErr.message || 'Unknown error'),
                        variant: 'destructive',
                    });
                }
            } else if (!workflowSaved && !generatedWorkflowId) {
                // If we have finalData but no nodes/edges, log it for debugging
                console.warn('Workflow completed but missing nodes/edges:', finalData);
                console.warn('Available keys:', Object.keys(finalData || {}));
                if (finalData?.workflow) {
                    console.warn('Workflow object keys:', Object.keys(finalData.workflow));
                }
                toast({
                    title: 'Warning',
                    description: 'Workflow generation completed but data structure is incomplete. Check console for details.',
                    variant: 'destructive',
                });
            }

            // Stop fallback progress and show completion when 100% is reached
            stopFallbackProgress();
            setProgress(100);
            setIsComplete(true);
            
            // Only set to complete if we have a saved workflow, otherwise stay in building
            if (workflowSaved && generatedWorkflowId) {
                setStep('complete');
            } else if (finalData && (finalData.nodes || finalData.workflow?.nodes)) {
                // We have workflow data, try to save it one more time
                const workflowNodes = finalData.nodes || finalData.workflow?.nodes;
                const workflowEdges = finalData.edges || finalData.workflow?.edges;
                
                if (workflowNodes && workflowEdges && !workflowSaved) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const normalized = validateAndFixWorkflow({ nodes: workflowNodes, edges: workflowEdges });

                        const workflowData = {
                            name: (analysis?.summary && typeof analysis.summary === 'string') 
                                ? analysis.summary.substring(0, 50) 
                                : 'AI Generated Workflow',
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

                        if (!saveError && savedWorkflow?.id) {
                            setGeneratedWorkflowId(savedWorkflow.id);
                            setNodes(normalized.nodes);
                            setEdges(normalized.edges);
                            setStep('complete');
                        } else {
                            console.error('Final save attempt failed:', saveError);
                            setStep('complete'); // Still show completion even if save failed
                        }
                    } catch (finalSaveErr) {
                        console.error('Final save error:', finalSaveErr);
                        setStep('complete'); // Still show completion
                    }
                } else {
                    setStep('complete');
                }
            } else {
                // No workflow data, something went wrong
                console.error('No workflow data available for completion');
                setStep('complete'); // Still show completion screen
            }

        } catch (err: any) {
            // Clean up fallback progress on error
            stopFallbackProgress();

            console.error('Workflow generation error:', err);
            
            // Don't go back to confirmation if we're already past that step
            // Instead, show error but stay on current step or go to a safe state
            if (step === 'building' || step === 'credentials') {
                toast({ 
                    title: 'Build Failed', 
                    description: err.message || 'Failed to generate workflow. Please try again.', 
                    variant: 'destructive' 
                });
                // Go back to confirmation step so user can retry
                setStep('confirmation');
            } else {
                toast({ 
                    title: 'Error', 
                    description: err.message || 'An error occurred. Please try again.', 
                    variant: 'destructive' 
                });
            }
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
        setBuildStartTime(null);
        setElapsedTime(0);
        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                {/* Steps 1-4: Single page view */}
                {step !== 'building' && step !== 'complete' && (
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                    {/* STEP 1: User Prompt */}
                    <div ref={step1Ref} className="scroll-mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-6"
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) {
                                            e.preventDefault();
                                            handleAnalyze();
                                        }
                                    }}
                                />
                                <Button
                                    className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                                    onClick={handleAnalyze}
                                    disabled={!prompt.trim() || step === 'analyzing'}
                                >
                                    {step === 'analyzing' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Analyze Prompts <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                                {prompt.trim() && step !== 'analyzing' && (
                                    <p className="absolute bottom-2 left-4 text-xs text-muted-foreground">
                                        Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Ctrl/Cmd + Enter</kbd> to analyze
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                {['Social Media Automation', 'Data Syncing', 'Report Generation'].map((i) => (
                                    <div key={i} className="p-4 rounded-lg border border-border bg-card/30 hover:bg-muted/50 cursor-pointer transition-all hover:border-indigo-500/50 hover:scale-[1.02] text-center text-sm text-muted-foreground" onClick={() => setPrompt(`Create a workflow for ${i.toLowerCase()}`)}>
                                        {i}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Loading state for analyzing */}
                    {step === 'analyzing' && (
                        <GlassBlurLoader 
                            text="Analyzing Requirements..."
                            description="Decomposing your request into logical steps and identifying necessary integrations."
                        />
                    )}

                    {/* STEP 2: Questions */}
                    {step !== 'idle' && analysis && (
                        <div ref={step2Ref} className="scroll-mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-6"
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
                                                    {q.options.map((opt, index) => {
                                                        const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
                                                        const optionId = `${q.id}-opt-${index}`;
                                                        const isSelected = answers[q.id] === opt;
                                                        
                                                        return (
                                                            <div 
                                                                key={optionId}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setAnswers(prev => ({ ...prev, [q.id]: opt }));
                                                                }}
                                                                className={`group flex items-start space-x-3 border-2 p-4 rounded-lg transition-all cursor-pointer ${
                                                                    isSelected 
                                                                        ? 'border-indigo-500 bg-indigo-500/10 shadow-md' 
                                                                        : 'border-border hover:bg-muted hover:border-indigo-300'
                                                                }`}
                                                            >
                                                                <RadioGroupItem 
                                                                    value={opt} 
                                                                    id={optionId} 
                                                                    className="text-indigo-500 mt-0.5" 
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <Label 
                                                                        htmlFor={optionId} 
                                                                        className="cursor-pointer flex items-start gap-2 w-full"
                                                                    >
                                                                        <span className="font-semibold text-indigo-500 shrink-0">{optionLabel}.</span>
                                                                        <span className="flex-1">{opt}</span>
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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
                    </div>
                    )}

                    {/* Loading state for refining */}
                    {step === 'refining' && (
                        <GlassBlurLoader 
                            text="Refining Workflow Plan..."
                            description="Processing your answers and generating the final workflow structure."
                        />
                    )}

                    {/* STEP 3: Final Prompt */}
                    {step !== 'idle' && step !== 'analyzing' && refinement && refinement.systemPrompt && (
                        <div ref={step3Ref} className="scroll-mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-green-500/30 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-green-400 flex items-center gap-2">
                                            <Sparkles className="h-5 w-5" /> Final Prompt
                                        </CardTitle>
                                        <CardDescription>System prompt in 20-30 words</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-green-500/10 p-4 rounded-md text-foreground leading-relaxed border border-green-500/20">
                                            {refinement.systemPrompt}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}

                    {/* STEP 4: Required Credentials */}
                    {step === 'confirmation' && refinement && requiredCredentials.length > 0 && (
                        <div ref={step4Ref} className="scroll-mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-amber-500/30 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-amber-400 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" /> Required Credentials
                                        </CardTitle>
                                        <CardDescription>
                                            The workflow requires these credentials to be configured. Please provide them to continue building your workflow.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[...new Set(requiredCredentials)].map((cred, i) => {
                                            const credKey = cred.toLowerCase().replace(/_/g, '_');
                                            const credLabel = cred.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                            const isPassword = cred.toLowerCase().includes('key') || 
                                                             cred.toLowerCase().includes('token') || 
                                                             cred.toLowerCase().includes('password') ||
                                                             cred.toLowerCase().includes('secret');
                                            
                                            // Determine field type for guide
                                            let fieldType = 'credential';
                                            if (cred.toLowerCase().includes('webhook') && cred.toLowerCase().includes('url')) {
                                                fieldType = 'webhook_url';
                                            } else if (cred.toLowerCase().includes('url')) {
                                                fieldType = 'url';
                                            } else if (cred.toLowerCase().includes('oauth') || cred.toLowerCase().includes('client')) {
                                                fieldType = 'oauth';
                                            } else if (cred.toLowerCase().includes('smtp')) {
                                                fieldType = 'smtp';
                                            }
                                            
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <Label htmlFor={`required-cred-${i}`} className="text-sm font-medium">
                                                        {credLabel}
                                                        <span className="text-red-400 ml-1">*</span>
                                                    </Label>
                                                    <Input
                                                        id={`required-cred-${i}`}
                                                        type={isPassword ? 'password' : 'text'}
                                                        placeholder={`Enter ${credLabel}`}
                                                        className="w-full"
                                                        value={credentialValues[credKey] || credentialValues[cred] || ''}
                                                        onChange={(e) => setCredentialValues({
                                                            ...credentialValues,
                                                            [credKey]: e.target.value,
                                                            [cred]: e.target.value, // Also set with original key
                                                        })}
                                                    />
                                                    <div className="flex justify-end">
                                                        <InputGuideLink
                                                            fieldKey={credKey}
                                                            fieldLabel={credLabel}
                                                            fieldType={fieldType}
                                                            placeholder={credLabel}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                onClick={async () => {
                                                    // Validate all credentials are filled
                                                    const allFilled = requiredCredentials.every(cred => {
                                                        const credKey = cred.toLowerCase().replace(/_/g, '_');
                                                        return credentialValues[credKey] || credentialValues[cred];
                                                    });
                                                    
                                                    if (!allFilled) {
                                                        toast({
                                                            title: 'Missing Credentials',
                                                            description: 'Please fill in all required credentials.',
                                                            variant: 'destructive',
                                                        });
                                                        return;
                                                    }
                                                    
                                                    // Start building workflow
                                                    await handleBuild();
                                                }}
                                                className="flex-1"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Start Building Workflow
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    // Skip credentials, use environment variables
                                                    await handleBuild();
                                                }}
                                            >
                                                Use Environment Variables
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}

                    {/* STEP 4.5: Credential Collection (if required during building) */}
                    {step === 'credentials' && requiredCredentials.length > 0 && (
                        <div className="scroll-mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-amber-500/30 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-amber-400 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" /> Required Credentials
                                        </CardTitle>
                                        <CardDescription>
                                            The workflow requires these credentials to be configured. Please provide them to continue.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[...new Set(requiredCredentials)].map((cred, i) => {
                                            const credKey = cred.toLowerCase().replace(/_/g, '_');
                                            const credLabel = cred.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                            const isPassword = cred.toLowerCase().includes('key') || 
                                                             cred.toLowerCase().includes('token') || 
                                                             cred.toLowerCase().includes('password') ||
                                                             cred.toLowerCase().includes('secret');
                                            
                                            // Determine field type for guide
                                            let fieldType = 'credential';
                                            if (cred.toLowerCase().includes('slack') && 
                                                (cred.toLowerCase().includes('bot_token') || cred.toLowerCase().includes('bot token'))) {
                                                fieldType = 'token'; // Set to 'token' to trigger proper guide generation
                                            } else if (cred.toLowerCase().includes('webhook') && cred.toLowerCase().includes('url')) {
                                                fieldType = 'webhook_url';
                                            } else if (cred.toLowerCase().includes('url')) {
                                                fieldType = 'url';
                                            } else if (cred.toLowerCase().includes('oauth') || cred.toLowerCase().includes('client')) {
                                                fieldType = 'oauth';
                                            } else if (cred.toLowerCase().includes('smtp')) {
                                                fieldType = 'smtp';
                                            } else if (cred.toLowerCase().includes('token')) {
                                                fieldType = 'token';
                                            }
                                            
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <Label htmlFor={`required-cred-${i}`} className="text-sm font-medium">
                                                        {credLabel}
                                                        <span className="text-red-400 ml-1">*</span>
                                                    </Label>
                                                    <Input
                                                        id={`required-cred-${i}`}
                                                        type={isPassword ? 'password' : 'text'}
                                                        placeholder={`Enter ${credLabel}`}
                                                        className="w-full"
                                                        value={credentialValues[credKey] || credentialValues[cred] || ''}
                                                        onChange={(e) => setCredentialValues({
                                                            ...credentialValues,
                                                            [credKey]: e.target.value,
                                                            [cred]: e.target.value, // Also set with original key
                                                        })}
                                                    />
                                                    <div className="flex justify-end">
                                                        <InputGuideLink
                                                            fieldKey={credKey}
                                                            fieldLabel={credLabel}
                                                            fieldType={fieldType}
                                                            placeholder={credLabel}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                onClick={async () => {
                                                    // Validate all credentials are filled
                                                    const allFilled = requiredCredentials.every(cred => {
                                                        const credKey = cred.toLowerCase().replace(/_/g, '_');
                                                        return credentialValues[credKey] || credentialValues[cred];
                                                    });
                                                    
                                                    if (!allFilled) {
                                                        toast({
                                                            title: 'Missing Credentials',
                                                            description: 'Please fill in all required credentials.',
                                                            variant: 'destructive',
                                                        });
                                                        return;
                                                    }
                                                    
                                                    // Start building workflow with credentials
                                                    await handleBuild();
                                                }}
                                                className="flex-1"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Start Building Workflow
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    // Skip credentials, use environment variables
                                                    await handleBuild();
                                                }}
                                            >
                                                Use Environment Variables
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}

                    {/* Ready to Build Section - Only show when no credentials needed or all provided */}
                    {step === 'confirmation' && refinement && requiredCredentials.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center pt-8"
                        >
                            <div className="max-w-md w-full space-y-6">
                                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 backdrop-blur-sm">
                                    <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" /> Ready to Build
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                        The agent has all necessary information to build your workflow.
                                    </p>
                                </div>
                                <Button onClick={handleBuild} className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]">
                                    <Play className="mr-2 h-5 w-5 fill-current" /> Start Building Workflow
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
                )}

                {/* Separate page for building and complete steps */}
                <AnimatePresence mode="wait">
                    {/* STEP 5+: BUILDING */}
                    {step === 'building' && (
                        <motion.div
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] w-screen h-screen p-4 sm:p-6 md:p-8 overflow-hidden flex flex-col"
                            style={{ 
                                background: 'linear-gradient(180deg, #0B0F1A 0%, #111827 100%)',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                            }}
                        >
                            {/* Full Screen Loading Container - Fit to window */}
                            <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 py-4 flex flex-col items-center justify-center flex-1 overflow-y-auto min-h-0">
                                {/* Status / Intelligence Area (Top) */}
                                <div className="text-center space-y-4 sm:space-y-5 md:space-y-6">
                                    {/* Circle Loader with Variable Speed */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="relative inline-block mx-auto"
                                    >
                                        {/* Outer Glow - Pulses every 1.2s */}
                                        <motion.div
                                            className="absolute inset-0 rounded-full -z-10"
                                            style={{ 
                                                background: 'radial-gradient(circle, rgba(124, 124, 255, 0.3) 0%, transparent 70%)',
                                                filter: 'blur(40px)',
                                                width: '140px',
                                                height: '140px',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                            animate={{ 
                                                scale: [1, 1.3, 1],
                                                opacity: [0.3, 0.6, 0.3]
                                            }}
                                            transition={{ 
                                                repeat: Infinity, 
                                                duration: 1.2,
                                                ease: "easeInOut"
                                            }}
                                        />
                                        
                                        {/* Circle Loader Container */}
                                        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                                            {/* Inner Ring - Slow, smooth rotation */}
                                            <motion.div
                                                className="absolute inset-0 rounded-full border-2"
                                                style={{ 
                                                    borderColor: 'rgba(124, 124, 255, 0.4)',
                                                    borderTopColor: 'rgba(124, 124, 255, 0.8)'
                                                }}
                                                animate={{ rotate: 360 }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 8 + Math.random() * 2, // Variable speed (8-10s)
                                                    ease: "linear"
                                                }}
                                            />
                                            
                                            {/* Outer Ring - Faster, counter-rotation */}
                                            <motion.div
                                                className="absolute inset-2 rounded-full border-2"
                                                style={{ 
                                                    borderColor: 'rgba(34, 211, 238, 0.3)',
                                                    borderRightColor: 'rgba(34, 211, 238, 0.7)'
                                                }}
                                                animate={{ rotate: -360 }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 5 + Math.random() * 1.5, // Variable speed (5-6.5s)
                                                    ease: "linear"
                                                }}
                                            />
                                            
                                            {/* Micro Text Inside Circle */}
                                            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                                                <motion.div
                                                    key={circleTextIndex}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="text-xs sm:text-sm font-medium mb-1"
                                                    style={{ color: '#7C7CFF' }}
                                                >
                                                    {circleTexts[circleTextIndex]}
                                                </motion.div>
                                                <motion.div
                                                    animate={{ 
                                                        scale: [1, 1.05, 1],
                                                        rotate: [0, 2, -2, 0]
                                                    }}
                                                    transition={{ 
                                                        repeat: Infinity, 
                                                        duration: 2.5,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <Brain className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#7C7CFF' }} />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    
                                    {/* Title and Cognitive Progress Text */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <h2 
                                            className="text-2xl sm:text-3xl md:text-4xl font-semibold"
                                            style={{ 
                                                color: '#E5E7EB',
                                                letterSpacing: '-0.02em'
                                            }}
                                        >
                                            Building Your Workflow
                                        </h2>
                                        
                                        {/* Cognitive Progress Loading Text */}
                                        <motion.div
                                            key={cognitiveTextIndex}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.4 }}
                                            className="text-base sm:text-lg"
                                            style={{ color: '#9CA3AF' }}
                                        >
                                            {cognitiveTexts[cognitiveTextIndex]}
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Primary Action / Progress (Center) */}
                                <div className="w-full space-y-4 sm:space-y-5">
                                    <div className="flex justify-between items-center">
                                        <span 
                                            className="text-sm font-medium"
                                            style={{ color: '#E5E7EB' }}
                                        >
                                            Progress
                                        </span>
                                        <div className="flex items-center gap-4">
                                            {buildStartTime && (
                                                <div className="flex items-center gap-2">
                                                    <motion.div
                                                        animate={{ rotate: [0, 360] }}
                                                        transition={{ 
                                                            repeat: Infinity, 
                                                            duration: 2,
                                                            ease: "linear"
                                                        }}
                                                        style={{ color: '#EC4899' }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </motion.div>
                                                    <span 
                                                        className="text-sm"
                                                        style={{ color: '#9CA3AF' }}
                                                    >
                                                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                                    </span>
                                                </div>
                                            )}
                                            <span 
                                                className="text-xl font-semibold"
                                                style={{ color: '#7C7CFF' }}
                                            >
                                                {isComplete ? '100%' : `${Math.min(99, progress)}%`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Momentum Bar - Flowing Gradient with Soft Glow Head */}
                                    <div 
                                        className="relative h-3 w-full rounded-full overflow-hidden"
                                        style={{ 
                                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                            border: '1px solid rgba(107, 114, 128, 0.2)'
                                        }}
                                    >
                                        <motion.div
                                            className="h-full relative overflow-hidden"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${isComplete ? 100 : Math.min(99, progress)}%` }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            style={{
                                                background: 'linear-gradient(90deg, #7C7CFF 0%, #22D3EE 50%, #EC4899 100%)',
                                                backgroundSize: '200% 100%'
                                            }}
                                        >
                                            {/* Flowing gradient animation */}
                                            <motion.div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                                    backgroundSize: '200% 100%'
                                                }}
                                                animate={{ 
                                                    backgroundPosition: ['0% 0%', '200% 0%']
                                                }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 2,
                                                    ease: "linear"
                                                }}
                                            />
                                            
                                            {/* Soft Glow Head (Energy Moving) */}
                                            <motion.div
                                                className="absolute right-0 top-0 bottom-0 w-8"
                                                style={{
                                                    background: 'radial-gradient(circle at right center, rgba(236, 72, 153, 0.6) 0%, transparent 70%)',
                                                    filter: 'blur(8px)'
                                                }}
                                                animate={{ 
                                                    opacity: [0.4, 0.8, 0.4],
                                                    scale: [1, 1.2, 1]
                                                }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 1.5,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                            
                                            {/* Micro Spark Particles */}
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute top-1/2 w-1.5 h-1.5 rounded-full"
                                                    style={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                        left: `${(progress / 100) * 100 - (i * 5)}%`,
                                                        filter: 'blur(2px)'
                                                    }}
                                                    animate={{ 
                                                        y: [-2, 2, -2],
                                                        opacity: [0, 1, 0],
                                                        scale: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{ 
                                                        repeat: Infinity, 
                                                        duration: 1.5,
                                                        delay: i * 0.3,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </motion.div>
                                        
                                        {/* Progress Milestone Indicators */}
                                        {[25, 50, 75, 100].map((milestone) => (
                                            <div
                                                key={milestone}
                                                className="absolute top-0 bottom-0 w-px"
                                                style={{ 
                                                    left: `${milestone}%`,
                                                    backgroundColor: progress >= milestone ? 'rgba(124, 124, 255, 0.3)' : 'rgba(107, 114, 128, 0.1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Progress Copy */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center"
                                    >
                                        <span 
                                            className="text-sm"
                                            style={{ color: '#6B7280' }}
                                        >
                                            {progress < 30 
                                                ? `${Math.min(99, progress)}% complete · system warming up`
                                                : progress < 70
                                                ? `${Math.min(99, progress)}% complete · building nodes`
                                                : progress < 95
                                                ? `${Math.min(99, progress)}% complete · finalizing`
                                                : `${Math.min(99, progress)}% complete · almost done`
                                            }
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Logs or Details (Bottom, Subdued) */}
                                <div 
                                    className="w-full overflow-hidden flex flex-col rounded-lg border max-h-[300px] sm:max-h-[350px]"
                                    style={{ 
                                        backgroundColor: 'rgba(17, 24, 39, 0.6)',
                                        borderColor: 'rgba(107, 114, 128, 0.2)',
                                        backdropFilter: 'blur(12px)',
                                        fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Courier New", monospace'
                                    }}
                                >
                                    {/* Logs Header */}
                                    <div 
                                        className="p-4 border-b flex items-center gap-3"
                                        style={{ 
                                            borderColor: 'rgba(107, 114, 128, 0.2)',
                                            backgroundColor: 'rgba(17, 24, 39, 0.4)'
                                        }}
                                    >
                                        {/* Window Controls */}
                                        <div className="flex gap-1.5">
                                            <motion.div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: '#EF4444' }}
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            />
                                            <motion.div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: '#F59E0B' }}
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            />
                                            <motion.div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: '#10B981' }}
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            />
                                        </div>
                                        
                                        <span 
                                            className="ml-2 font-semibold text-sm"
                                            style={{ color: '#E5E7EB' }}
                                        >
                                            System Logs
                                        </span>
                                        
                                        {/* Live Indicator */}
                                        <div className="ml-auto flex items-center gap-2">
                                            <motion.div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: '#7C7CFF' }}
                                                animate={{ 
                                                    scale: [1, 1.5, 1], 
                                                    opacity: [1, 0.5, 1] 
                                                }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 1,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                            <span 
                                                className="text-xs font-medium"
                                                style={{ color: '#9CA3AF' }}
                                            >
                                                Live
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Logs Content */}
                                    <ScrollArea className="flex-1 p-3 sm:p-4" style={{ maxHeight: '250px', minHeight: '200px' }}>
                                        <div className="space-y-1.5">
                                            {buildingLogs.map((log, i) => {
                                                const isSuccess = log.includes('Success') || log.includes('Successfully');
                                                const isError = log.includes('Error') || log.includes('Failed');
                                                const isMilestone = isSuccess || log.includes('loaded') || log.includes('complete');
                                                
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                                        transition={{ delay: i * 0.03, duration: 0.25 }}
                                                        className="flex items-start gap-3 pl-4 py-2 rounded-r-md transition-all group cursor-default"
                                                        style={{
                                                            borderLeft: `3px solid ${isSuccess ? 'rgba(16, 185, 129, 0.4)' : isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(124, 124, 255, 0.3)'}`,
                                                            backgroundColor: 'rgba(17, 24, 39, 0)'
                                                        }}
                                                        whileHover={{ 
                                                            backgroundColor: 'rgba(17, 24, 39, 0.5)',
                                                            x: 2
                                                        }}
                                                        onHoverStart={() => {
                                                            if (isMilestone) {
                                                                // Micro-reward: subtle pulse on hover for milestones
                                                            }
                                                        }}
                                                    >
                                                        {/* Timestamp */}
                                                        <motion.span 
                                                            className="shrink-0 text-[10px] font-medium"
                                                            style={{ color: '#6B7280' }}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: i * 0.03 + 0.1 }}
                                                        >
                                                            [{new Date().toLocaleTimeString()}]
                                                        </motion.span>
                                                        
                                                        {/* Log Message */}
                                                        <div className="flex-1 flex items-center gap-2">
                                                            {isMilestone && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ 
                                                                        type: "spring",
                                                                        stiffness: 500,
                                                                        delay: i * 0.03 + 0.2
                                                                    }}
                                                                >
                                                                    <Check className="h-3 w-3" style={{ color: '#10B981' }} />
                                                                </motion.div>
                                                            )}
                                                            <span 
                                                                className={`text-xs ${
                                                                    isSuccess 
                                                                        ? 'font-semibold' 
                                                                        : isError 
                                                                        ? 'font-medium' 
                                                                        : 'font-normal'
                                                                }`}
                                                                style={{ 
                                                                    color: isSuccess 
                                                                        ? '#10B981' 
                                                                        : isError 
                                                                        ? '#EF4444' 
                                                                        : '#E5E7EB'
                                                                }}
                                                            >
                                                                {log}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            
                                            {/* Processing Indicator */}
                                            {!isComplete && (
                                                <motion.div 
                                                    className="pl-4 flex items-center gap-2 py-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: [1, 0.6, 1] }}
                                                    transition={{ 
                                                        repeat: Infinity, 
                                                        duration: 1.5,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <Loader2 
                                                        className="h-3 w-3 animate-spin" 
                                                        style={{ color: '#7C7CFF' }}
                                                    />
                                                    <span 
                                                        className="text-xs font-medium"
                                                        style={{ color: '#9CA3AF' }}
                                                    >
                                                        Processing workflow generation...
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FINAL STEP: COMPLETE */}
                    {step === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center w-screen h-screen gap-8 text-center px-6 overflow-y-auto"
                        >
                            <div className="h-32 w-32 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                                <Check className="h-16 w-16 text-green-500 relative z-10" />
                            </div>
                            <div className="space-y-4">
                                <motion.h2 
                                    className="text-4xl font-bold text-foreground mb-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    ✅ Workflow Ready
                                </motion.h2>
                                <motion.p 
                                    className="text-muted-foreground max-w-md mx-auto text-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Your autonomous agent has successfully generated your workflow. All steps are complete and your workflow is ready to use.
                                </motion.p>
                                {buildStartTime && (
                                    <motion.p 
                                        className="text-sm text-muted-foreground"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        Completed in {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                    </motion.p>
                                )}
                            </div>
                            <div className="flex gap-4 mt-4">
                                <Button
                                    onClick={reset}
                                    className="bg-card border-2 border-border text-foreground hover:bg-muted hover:border-border/80 h-12 px-6 font-semibold transition-all shadow-lg"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Create Another
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (generatedWorkflowId) {
                                            console.log('Navigating to workflow:', generatedWorkflowId);
                                            // Use replace to prevent back button issues and ensure clean navigation
                                            // Add autoRun query parameter to automatically start the workflow
                                            navigate(`/workflow/${generatedWorkflowId}?autoRun=true`, { replace: false });
                                        } else {
                                            console.error('Cannot navigate: generatedWorkflowId is null');
                                            toast({
                                                title: 'Error',
                                                description: 'Workflow ID not available. Please try creating the workflow again.',
                                                variant: 'destructive',
                                            });
                                        }
                                    }}
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
