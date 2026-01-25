import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    MessageSquare,
    FileText,
    Languages,
    HelpCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    Upload,
    BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker - use jsdelivr CDN (works reliably with Vite)
// For pdfjs-dist 5.x, use the .mjs worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { ENDPOINTS } from '@/config/endpoints';

const PYTHON_BACKEND_URL = ENDPOINTS.itemBackend;
const USE_DIRECT_BACKEND = ENDPOINTS.useDirectBackend;

interface TextProcessingResult {
    mode: 'chat' | 'summarize' | 'translate' | 'qa';
    success: boolean;
    output?: string;
    error?: string;
    duration?: number;
}

interface TextProcessingProps {
    selectedTools?: string[]; // Filter which tools to show (task names: chat, summarize, translate, qa, etc.)
}

export default function TextProcessing({ selectedTools }: TextProcessingProps = {}) {
    const [inputText, setInputText] = useState('');
    const [question, setQuestion] = useState('');
    const [targetLang, setTargetLang] = useState('Spanish');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<TextProcessingResult[]>([]);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

        try {
            let extractedText = '';

            // Handle PDF files
            if (fileExtension === '.pdf' || file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const numPages = pdf.numPages;
                const textPages: string[] = [];

                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    textPages.push(pageText);
                }

                extractedText = textPages.join('\n\n');
            }
            // Handle Word documents (.docx)
            else if (fileExtension === '.docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedText = result.value;
            }
            // Handle legacy Word documents (.doc) - show error
            else if (fileExtension === '.doc' || file.type === 'application/msword') {
                toast({
                    title: 'Legacy Word format',
                    description: '.doc files are not supported. Please convert to .docx or PDF format.',
                    variant: 'destructive'
                });
                return;
            }
            // Handle text files (including .md, .txt, and all other text formats)
            else {
                const textExtensions = [
                    '.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.css',
                    '.js', '.ts', '.jsx', '.tsx', '.py', '.log', '.ini', '.conf',
                    '.yml', '.yaml', '.rtf', '.sh', '.bat', '.cmd', '.ps1', '.env',
                    '.sql', '.toml', '.properties', '.config'
                ];

                const textMimeTypes = [
                    'text/', 'application/json', 'application/xml', 'application/x-yaml',
                    'application/rtf'
                ];

                const isTextFile = textExtensions.includes(fileExtension) ||
                    textMimeTypes.some(type => file.type.startsWith(type)) ||
                    file.type === '';

                if (isTextFile) {
                    extractedText = await file.text();
                } else {
                    toast({
                        title: 'Unsupported file type',
                        description: 'Please upload a text file, PDF, or Word document (.txt, .md, .pdf, .docx, etc.)',
                        variant: 'destructive'
                    });
                    return;
                }
            }

            if (extractedText.trim()) {
                setInputText(extractedText);
                toast({
                    title: 'File loaded',
                    description: `Successfully loaded ${file.name} (${extractedText.length} characters)`,
                });
            } else {
                toast({
                    title: 'Empty file',
                    description: 'The file appears to be empty or could not extract text.',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('Error processing file:', error);
            toast({
                title: 'Error reading file',
                description: error.message || 'Could not read the file. Please try a different file.',
                variant: 'destructive'
            });
        }
    };

    const processText = async (mode: 'chat' | 'summarize' | 'translate' | 'qa') => {
        if (!inputText.trim()) {
            toast({
                title: 'No text provided',
                description: 'Please enter some text to process',
                variant: 'destructive'
            });
            return;
        }

        if (mode === 'qa' && !question.trim()) {
            toast({
                title: 'Question required',
                description: 'Please ask a question about the text',
                variant: 'destructive'
            });
            return;
        }

        const startTime = Date.now();
        setIsProcessing(true);
        setProgress(0);

        try {
            setProgress(20);

            const payload: any = {
                task: mode,
                input: inputText
            };

            if (mode === 'translate') {
                payload.target_language = targetLang;
            } else if (mode === 'qa') {
                payload.question = question;
                payload.context = inputText; // Use input text as context
            }

            setProgress(40);

            let data: any;
            let error: any = null;

            if (USE_DIRECT_BACKEND) {
                try {
                    // Ensure URL is properly constructed
                    const apiUrl = `${PYTHON_BACKEND_URL}/process`;
                    console.log('[TextProcessing] Calling backend:', apiUrl);

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
                        throw new Error(`Backend error ${response.status}: ${responseText || 'Unknown error'}`);
                    }

                    if (!responseText) {
                        throw new Error('Backend returned empty response');
                    }

                    data = JSON.parse(responseText);

                    if (!data.success) {
                        error = { message: data.error || 'Backend processing failed' };
                    }

                } catch (err: any) {
                    console.error('[TextProcessing] Direct backend error', err);

                    // Provide helpful error messages
                    let errorMessage = err.message || 'Failed to connect to backend';

                    if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
                        errorMessage = `Cannot connect to Python backend at ${PYTHON_BACKEND_URL}. ` +
                            `Please ensure the backend is running. ` +
                            `Start it with: cd AI_Agent\\multimodal_backend && python main.py`;
                    } else if (err.message?.includes('JSON')) {
                        errorMessage = `Backend returned invalid response: ${err.message}`;
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

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Unknown error');
            }

            const result: TextProcessingResult = {
                mode,
                success: true,
                output: data.output,
                duration: Date.now() - startTime
            };

            setResults(prev => [result, ...prev]);
            toast({ title: 'Success', description: 'Text processed successfully' });
            setProgress(100);

        } catch (err: any) {
            console.error('Processing error:', err);
            setResults(prev => [{
                mode,
                success: false,
                error: err.message,
                duration: Date.now() - startTime
            }, ...prev]);

            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive'
            });
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
                        <BookOpen className="h-5 w-5" />
                        Text Processing Studio
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Input Area */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Input Text / Context</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Load File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.log,.ini,.conf,.yml,.yaml,.rtf,.sh,.bat,.cmd,.ps1,.env"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <Textarea
                            placeholder="Enter text to process here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                            disabled={isProcessing}
                        />
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Chat */}
                        {(!selectedTools || selectedTools.includes('chat')) && (
                            <Button
                                onClick={() => processText('chat')}
                                disabled={isProcessing || !inputText.trim()}
                                variant="outline"
                                className="flex flex-col h-auto py-4"
                            >
                                <MessageSquare className="h-5 w-5 mb-2" />
                                <span>Chat / Generate</span>
                                <span className="text-xs text-muted-foreground">Continue the text</span>
                            </Button>
                        )}

                        {/* Summarize */}
                        {(!selectedTools || selectedTools.includes('summarize')) && (
                            <Button
                                onClick={() => processText('summarize')}
                                disabled={isProcessing || !inputText.trim()}
                                variant="outline"
                                className="flex flex-col h-auto py-4"
                            >
                                <FileText className="h-5 w-5 mb-2" />
                                <span>Summarize</span>
                                <span className="text-xs text-muted-foreground">Shorten content</span>
                            </Button>
                        )}

                        {/* Translate */}
                        {(!selectedTools || selectedTools.includes('translate')) && (
                            <div className="flex flex-col gap-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    disabled={isProcessing}
                                >
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Tamil">Tamil</option>
                                    <option value="Telugu">Telugu</option>
                                    <option value="Kannada">Kannada</option>
                                    <option value="Malayalam">Malayalam</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Portuguese">Portuguese</option>
                                </select>
                                <Button
                                    onClick={() => processText('translate')}
                                    disabled={isProcessing || !inputText.trim()}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Languages className="h-4 w-4 mr-2" />
                                    Translate
                                </Button>
                            </div>
                        )}

                        {/* QA */}
                        {(!selectedTools || selectedTools.includes('qa')) && (
                            <div className="flex flex-col gap-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Ask a question..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    disabled={isProcessing}
                                />
                                <Button
                                    onClick={() => processText('qa')}
                                    disabled={isProcessing || !inputText.trim() || !question.trim()}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <HelpCircle className="h-4 w-4 mr-2" />
                                    Ask Question
                                </Button>
                            </div>
                        )}

                    </div>

                    {/* Progress */}
                    {isProcessing && (
                        <div className="space-y-2">
                            <Progress value={progress} />
                            <p className="text-xs text-center text-muted-foreground">Processing...</p>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    {results.map((result, idx) => (
                        <Card key={idx} className={result.success ? 'border-green-500' : 'border-red-500'}>
                            <CardHeader className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {result.success ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-500 h-5 w-5" />}
                                        <span className="font-semibold capitalize">{result.mode} Result</span>
                                    </div>
                                    {result.duration && <Badge variant="outline">{result.duration}ms</Badge>}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {result.error ? (
                                    <p className="text-red-500 text-sm">{result.error}</p>
                                ) : (
                                    <Textarea readOnly value={result.output} className="bg-muted" rows={4} />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
