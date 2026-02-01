import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/stores/workflowStore';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';
import { validateAndFixWorkflow } from '@/lib/workflowValidation';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! I can help you edit this workflow. Try saying "Add a Slack node after success" or "Change the trigger to a schedule".',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { nodes, edges, setNodes, setEdges, workflowId } = useWorkflowStore();

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Clean unnecessary data from nodes/edges to reduce payload size
            // Ensure all config values are strings (required by backend)
            const currentWorkflow = {
                nodes: nodes.map(n => {
                    const cleanedNode: any = {
                        id: n.id,
                        type: n.type || n.data?.type,
                        position: n.position,
                        data: {
                            type: n.type || n.data?.type,
                            label: n.data?.label || n.type || 'Node',
                        }
                    };
                    
                    // Add config if it exists, ensuring all values are strings
                    if (n.data?.config) {
                        cleanedNode.config = {};
                        for (const [key, value] of Object.entries(n.data.config)) {
                            if (value !== null && value !== undefined) {
                                if (typeof value === 'object') {
                                    cleanedNode.config[key] = JSON.stringify(value);
                                } else {
                                    cleanedNode.config[key] = String(value);
                                }
                            }
                        }
                    }
                    
                    return cleanedNode;
                }),
                edges: edges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || undefined,
                    targetHandle: e.targetHandle || undefined,
                }))
            };

            // Validate the workflow structure before sending
            if (!Array.isArray(currentWorkflow.nodes) || currentWorkflow.nodes.length === 0) {
                throw new Error('Current workflow has no nodes. Please add at least one node before using AI edit.');
            }

            // Fetch execution history for debugging (last 3 failed executions)
            let executionHistory: any[] = [];
            let hasExecutionHistory = false;
            try {
                if (workflowId) {
                    const { data: executions } = await supabase
                        .from('executions')
                        .select('id, status, error, logs, output, started_at')
                        .eq('workflow_id', workflowId)
                        .eq('status', 'failed')
                        .order('started_at', { ascending: false })
                        .limit(3);
                    
                    if (executions && executions.length > 0) {
                        executionHistory = executions.map(exec => ({
                            id: exec.id,
                            status: exec.status,
                            error: exec.error,
                            logs: exec.logs,
                            output: exec.output,
                            started_at: exec.started_at,
                        }));
                        hasExecutionHistory = true;
                        console.log(`[AI Editor] Found ${executions.length} failed execution(s) for debugging context`);
                    }
                }
            } catch (execError) {
                console.warn('Failed to fetch execution history:', execError);
                // Continue without execution history
            }

            // Log request for debugging
            console.log('[AI Assistant] Sending edit request:', {
                promptLength: userMessage.content.trim().length,
                nodesCount: currentWorkflow.nodes.length,
                edgesCount: currentWorkflow.edges.length,
                executionHistoryCount: executionHistory.length,
            });

            const { data: sessionData } = await supabase.auth.getSession();
            
            // Add timeout to prevent indefinite hanging (120 seconds for AI generation)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds
            
            let response: Response;
            try {
                response = await fetch(`${ENDPOINTS.itemBackend}/api/generate-workflow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(sessionData?.session?.access_token
                            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                            : {}),
                    },
                    body: JSON.stringify({
                        prompt: userMessage.content.trim(),
                        mode: 'edit',
                        currentWorkflow: currentWorkflow,
                        executionHistory: executionHistory.length > 0 ? executionHistory : undefined,
                    }),
                    signal: controller.signal,
                });
                
                clearTimeout(timeoutId);
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. The AI generation is taking too long. Please try again with a simpler request.');
                }
                throw fetchError;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'AI edit failed' }));
                const errorDetails = error.error || error.message || 'Unknown error';
                throw new Error(`AI Edit Error: ${errorDetails}`);
            }

            const data = await response.json();

            // Handle both response formats: direct nodes/edges or nested in workflow object
            const workflowData = data.workflow || data;
            const responseNodes = workflowData.nodes || data.nodes;
            const responseEdges = workflowData.edges || data.edges;

            if (responseNodes && responseEdges && Array.isArray(responseNodes) && Array.isArray(responseEdges)) {
                // Normalize nodes to include label, category, icon, etc.
                const validated = validateAndFixWorkflow({ nodes: responseNodes, edges: responseEdges });
                
                setNodes(validated.nodes);
                setEdges(validated.edges);

                const explanation = data.explanation || data.documentation || `I've updated the workflow based on your request.`;
                const historyNote = hasExecutionHistory 
                    ? '\n\n💡 Used execution history to help debug and fix issues.' 
                    : '';
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: explanation + historyNote,
                    timestamp: new Date(),
                }]);
            } else {
                console.error('Invalid response format:', data);
                throw new Error(`Invalid response format. Expected nodes and edges, got: ${JSON.stringify(Object.keys(data))}`);
            }

        } catch (error: any) {
            console.error('AI Edit Error:', error);
            
            // Extract error message for better user feedback
            let errorMessage = 'Sorry, I encountered an error while processing your request.';
            if (error?.message) {
                errorMessage = `Error: ${error.message}`;
            } else if (error?.error) {
                errorMessage = `Error: ${error.error}`;
            } else if (typeof error === 'string') {
                errorMessage = `Error: ${error}`;
            }
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage + ' Please try again or check the console for details.',
                timestamp: new Date(),
            }]);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="border-l border-border bg-card h-full flex flex-col relative w-80 md:w-96 flex-shrink-0 transition-all duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-sm">AI Editor Assistant</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col gap-1 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-3 rounded-lg text-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none border border-border"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex flex-col gap-1 mr-auto items-start max-w-[85%]">
                                <div className="bg-muted text-foreground p-3 rounded-lg rounded-tl-none border border-border flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 animate-pulse text-primary" />
                                    <span className="text-xs">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background/50">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Describe your change..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
