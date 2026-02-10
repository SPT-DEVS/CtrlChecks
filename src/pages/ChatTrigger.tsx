import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { GlassBlurLoader } from '@/components/ui/glass-blur-loader';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'workflow' | 'system';
  timestamp: Date;
}

export default function ChatTrigger() {
  const { workflowId, nodeId } = useParams<{ workflowId: string; nodeId: string }>();
  const [searchParams] = useSearchParams();
  // CRITICAL: Always use static sessionId format: workflowId_nodeId for consistent chat sessions
  // This allows AI agent responses to come back to the same chat UI
  // Ignore any sessionId from URL params - we MUST use the static format
  const sessionId = workflowId && nodeId ? `${workflowId}_${nodeId}` : '';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chatNode, setChatNode] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chat configuration from API
      const response = await fetch(
        `${ENDPOINTS.itemBackend}/api/chat-trigger/${workflowId}/${nodeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load chat' }));
        throw new Error(errorData.message || errorData.error || 'Failed to load chat configuration');
      }

      const data = await response.json();
      setChatNode(data.chatNode);

      // Add welcome message
      setMessages([{
        id: 'welcome',
        text: 'Welcome! You can now send messages to interact with the workflow.',
        sender: 'system',
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Chat config error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat configuration');
    } finally {
      setLoading(false);
    }
  }, [workflowId, nodeId]);

  const connectWebSocket = useCallback(async () => {
    // CRITICAL: Always use static sessionId format: workflowId_nodeId
    // This ensures consistency with backend and allows AI agent responses to come back
    if (!workflowId || !nodeId) {
      console.warn('[Chat] Missing workflowId or nodeId, cannot connect WebSocket', { workflowId, nodeId });
      return;
    }
    
    const chatSessionId = `${workflowId}_${nodeId}`;
    
    if (!chatSessionId) {
      console.warn('[Chat] No sessionId available, cannot connect WebSocket');
      return;
    }

    // First, check if WebSocket server is available
    try {
      const healthResponse = await fetch(`${ENDPOINTS.itemBackend}/api/chat/health`);
      const healthData = await healthResponse.json();
      console.log('[Chat] WebSocket server health:', healthData);
      console.log('[Chat] WebSocket details:', JSON.stringify(healthData.websocket, null, 2));
      
      if (!healthData.websocket?.initialized) {
        console.error('[Chat] WebSocket server is not initialized on backend');
        setError('WebSocket server is not available. Please check server logs.');
        return;
      }
    } catch (healthError) {
      console.warn('[Chat] Could not check WebSocket health (non-fatal):', healthError);
      // Continue anyway - might be CORS or network issue
    }

    // Determine WebSocket URL - use the same host as the API endpoint
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Extract host from ENDPOINTS.itemBackend, removing protocol and any path
    const apiUrl = new URL(ENDPOINTS.itemBackend);
    const wsUrl = `${wsProtocol}//${apiUrl.host}/ws/chat?sessionId=${encodeURIComponent(chatSessionId)}`;

    console.log(`[Chat] Connecting to WebSocket with sessionId: ${chatSessionId}`);
    console.log(`[Chat] WebSocket URL: ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Chat] WebSocket connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('[Chat] WebSocket message received:', data);
          
          if (data.type === 'chat' || data.type === 'workflow' || data.type === 'agent_response') {
            // Handle chat messages from workflow/AI agent
            const messageText = data.message || data.content || '';
            if (messageText) {
              setMessages(prev => [...prev, {
                id: `msg-${Date.now()}-${Math.random()}`,
                text: messageText,
                sender: 'workflow',
                timestamp: new Date(data.timestamp || Date.now()),
              }]);
              
              // Auto-scroll to bottom
              setTimeout(() => {
                scrollToBottom();
              }, 100);
            }
          } else if (data.type === 'system') {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${Math.random()}`,
              text: data.message,
              sender: 'system',
              timestamp: new Date(),
            }]);
          } else if (data.type === 'error') {
            setError(data.message);
          } else if (data.type === 'pong') {
            // Heartbeat response
          } else {
            // Log unknown message types for debugging
            console.log('[Chat] Unknown message type:', data.type, data);
          }
        } catch (err) {
          console.error('[Chat] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[Chat] WebSocket error:', error);
        console.error('[Chat] WebSocket readyState:', ws.readyState);
        console.error('[Chat] WebSocket URL attempted:', wsUrl);
        
        // Try to get more error details
        if (ws.readyState === WebSocket.CLOSED) {
          setError(`WebSocket connection failed. Please check if the server is running on ${apiUrl.host}`);
        } else {
          setError('Connection error. Please refresh the page.');
        }
        setConnected(false);
      };

      ws.onclose = (event) => {
        console.log('[Chat] WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        setConnected(false);
        
        // Only attempt to reconnect if we have workflowId and nodeId
        if (workflowId && nodeId) {
          // Attempt to reconnect after a delay (but not if it was a clean close with error code)
          if (event.code !== 1008) { // Don't reconnect if session not found
            setTimeout(() => {
              console.log('[Chat] Attempting to reconnect...');
              connectWebSocket();
            }, 3000);
          } else {
            console.warn('[Chat] Not reconnecting - session not found (code 1008)');
          }
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Chat] Error creating WebSocket:', err);
      setError('Failed to connect to chat server');
    }
  }, [sessionId]);

  useEffect(() => {
    loadChatConfig();
  }, [loadChatConfig]);

  useEffect(() => {
    // Always try to connect if we have workflowId and nodeId (sessionId will be generated)
    if (!loading && workflowId && nodeId) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [loading, workflowId, nodeId, connectWebSocket]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Try WebSocket first if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat',
          content: messageText,
        }));
        setSending(false);
        return;
      }

      // Fallback to HTTP API
      // Use static sessionId format for consistency (same as WebSocket)
      if (!workflowId || !nodeId) {
        setError('Missing workflow ID or node ID');
        setSending(false);
        return;
      }
      
      const chatSessionId = `${workflowId}_${nodeId}`;
      const response = await fetch(
        `${ENDPOINTS.itemBackend}/api/chat-trigger/${workflowId}/${nodeId}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: chatSessionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.message || errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('[Chat] Message sent successfully:', result);
    } catch (err) {
      console.error('Chat message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <GlassBlurLoader />
      </div>
    );
  }

  if (error && !chatNode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-md w-full bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-6 shadow-lg">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">Error</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">
                {chatNode?.label || 'Chat Interface'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {connected ? 'Connected (WebSocket)' : 'Using HTTP API'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.sender === 'system'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-sm text-destructive">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
