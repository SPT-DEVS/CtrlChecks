
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Mic,
    Volume2,
    Settings,
    PlayCircle,
    Upload,
    Loader2,
    CheckCircle2,
    XCircle,
    FileAudio
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { toast } from '@/hooks/use-toast';

import { ENDPOINTS } from '@/config/endpoints';

const PYTHON_BACKEND_URL = ENDPOINTS.itemBackend;
const USE_DIRECT_BACKEND = ENDPOINTS.useDirectBackend;

interface AudioProcessingResult {
    mode: 'transcribe' | 'text-to-speech';
    success: boolean;
    output?: string;
    error?: string;
    duration?: number;
}

interface AudioProcessingProps {
    selectedTools?: string[]; // Filter which tools to show (task names: transcribe, text_to_speech)
}

export default function AudioProcessing({ selectedTools }: AudioProcessingProps = {}) {
    // Set initial tab based on selected tools
    const getInitialTab = (): 'transcribe' | 'tts' => {
        if (selectedTools && selectedTools.length > 0) {
            if (selectedTools.includes('transcribe')) return 'transcribe';
            if (selectedTools.includes('text_to_speech')) return 'tts';
        }
        return 'transcribe';
    };
    const [activeTab, setActiveTab] = useState<'transcribe' | 'tts'>(getInitialTab());
    const [inputText, setInputText] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<AudioProcessingResult[]>([]);
    const [progress, setProgress] = useState(0);

    // TTS Settings
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(0.0);
    const [volume, setVolume] = useState(1.0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('audio/')) {
                setAudioFile(file);
            } else {
                toast({ title: "Invalid file", description: "Please upload an audio file", variant: "destructive" });
            }
        }
    };

    const processAudio = async (mode: 'transcribe' | 'text-to-speech') => {
        if (mode === 'transcribe' && !audioFile) {
            toast({ title: "No file", description: "Please upload an audio file", variant: "destructive" });
            return;
        }
        if (mode === 'text-to-speech' && !inputText.trim()) {
            toast({ title: "No text", description: "Please enter text to generate speech", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        setProgress(10);
        const startTime = Date.now();

        try {
            const payload: any = {
                task: mode === 'text-to-speech' ? 'text_to_speech' : mode
            };

            if (mode === 'transcribe' && audioFile) {
                // Convert to base64
                const base64Audio = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(audioFile);
                });
                payload.audio = base64Audio;
            } else {
                payload.input = inputText;
                payload.speed = speed;
                payload.pitch = pitch;
                payload.volume = volume;
            }

            setProgress(40);

            let data: any;

            if (USE_DIRECT_BACKEND) {
                try {
                    const apiUrl = `${PYTHON_BACKEND_URL}/process`;
                    console.log('[AudioProcessing] Calling backend:', apiUrl);

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const txt = await response.text();
                        throw new Error(txt || response.statusText);
                    }
                    data = await response.json();
                } catch (err: any) {
                    let errorMessage = err.message || 'Failed to connect to backend';
                    if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
                        errorMessage = `Cannot connect to Python backend at ${PYTHON_BACKEND_URL}. ` +
                            `Please ensure the backend is running. ` +
                            `Start it with: cd AI_Agent\\multimodal_backend && python main.py`;
                    }
                    throw new Error(errorMessage);
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
            }

            if (!data.success) throw new Error(data.error);

            setProgress(90);

            setResults(prev => [{
                mode,
                success: true,
                output: data.output,
                duration: Date.now() - startTime
            }, ...prev]);

            toast({ title: "Success", description: "Audio processed successfully" });

        } catch (e: any) {
            console.error(e);
            setResults(prev => [{
                mode,
                success: false,
                error: e.message || "Unknown error",
                duration: Date.now() - startTime
            }, ...prev]);
            toast({ title: "Error", description: e.message, variant: "destructive" });
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
                        <Volume2 className="h-5 w-5" />
                        Audio Processing Studio
                    </CardTitle>
                    {/* Only show tabs if multiple tools are available */}
                    {(!selectedTools || selectedTools.length > 1) && (
                        <div className="flex gap-2 text-sm">
                            {(!selectedTools || selectedTools.includes('transcribe')) && (
                                <Button variant={activeTab === 'transcribe' ? 'default' : 'ghost'} onClick={() => setActiveTab('transcribe')}>
                                    <Mic className="h-4 w-4 mr-2" /> Audio to Text
                                </Button>
                            )}
                            {(!selectedTools || selectedTools.includes('text_to_speech')) && (
                                <Button variant={activeTab === 'tts' ? 'default' : 'ghost'} onClick={() => setActiveTab('tts')}>
                                    <PlayCircle className="h-4 w-4 mr-2" /> Text to Audio
                                </Button>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Transcribe UI */}
                    {((!selectedTools || selectedTools.includes('transcribe')) && activeTab === 'transcribe') && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center"
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p>Click to upload Audio (WAV, MP3)</p>
                                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
                            </div>
                            {audioFile && (
                                <div className="flex items-center gap-2 bg-muted p-2 rounded">
                                    <FileAudio className="h-4 w-4" /> {audioFile.name}
                                </div>
                            )}
                            <Button onClick={() => processAudio('transcribe')} disabled={isProcessing || !audioFile} className="w-full">
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : "Transcribe"}
                            </Button>
                        </div>
                    )}

                    {/* TTS UI */}
                    {((!selectedTools || selectedTools.includes('text_to_speech')) && activeTab === 'tts') && (
                        <div className="space-y-4">
                            <Textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter text to speak..."
                                rows={4}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs">Speed: {speed}x</label>
                                    <input type="range" min="0.8" max="1.5" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs">Pitch: {pitch}</label>
                                    <input type="range" min="-3" max="3" step="1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs">Volume: {volume}x</label>
                                    <input type="range" min="0.5" max="1.5" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
                                </div>
                            </div>

                            <Button onClick={() => processAudio('text-to-speech')} disabled={isProcessing || !inputText.trim()} className="w-full">
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate Speech"}
                            </Button>
                        </div>
                    )}

                    {isProcessing && <Progress value={progress} />}
                </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
                {results.map((res, idx) => (
                    <Card key={idx} className={res.success ? 'border-green-500' : 'border-red-500'}>
                        <CardHeader className="py-2">
                            <div className="flex items-center gap-2">
                                {res.success ? <CheckCircle2 className="text-green-500 h-4 w-4" /> : <XCircle className="text-red-500 h-4 w-4" />}
                                <span className="font-semibold">{res.mode === 'transcribe' ? 'Transcription' : 'Generated Audio'}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="py-4">
                            {res.error ? <p className="text-red-500">{res.error}</p> : (
                                res.mode === 'transcribe' ? (
                                    <p className="whitespace-pre-wrap">{res.output}</p>
                                ) : (
                                    <audio controls src={res.output} className="w-full" />
                                )
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
