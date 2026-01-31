/**
 * Real-time Execution Visualizer
 * Enhanced UI component with WebSocket-based real-time updates
 * Features animated status indicators, color gradients, and execution timeline
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, Clock, Play, SkipForward } from 'lucide-react';

interface NodeUpdate {
  nodeId: string;
  status: 'idle' | 'pending' | 'running' | 'success' | 'error' | 'skipped';
  visual: {
    borderColor: string;
    icon: string;
    animation?: string;
    progress?: number;
    badges?: Array<{ label: string; value: string | number }>;
    glow?: boolean;
    pulse?: boolean;
  };
  timestamp: number;
  duration?: number;
  error?: string;
}

interface ExecutionSnapshot {
  executionId: string;
  status: string;
  progress: number;
  totalNodes: number;
  completedNodes: number;
  startTime: number;
  duration?: number;
  nodes?: NodeUpdate[];
}

interface RealtimeExecutionVisualizerProps {
  executionId: string;
  backendUrl?: string;
  onNodeUpdate?: (nodeId: string, status: string) => void;
}

export default function RealtimeExecutionVisualizer({
  executionId,
  backendUrl,
  onNodeUpdate,
}: RealtimeExecutionVisualizerProps) {
  const { nodes, updateNodeStatus } = useWorkflowStore();
  const [connected, setConnected] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionSnapshot | null>(null);
  const [nodeStates, setNodeStates] = useState<Map<string, NodeUpdate>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (backendUrl) {
      const url = new URL(backendUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}/ws/executions?executionId=${executionId}`;
    }
    // Default to localhost for development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.VITE_BACKEND_PORT || '3001';
    return `${protocol}//${host}:${port}/ws/executions?executionId=${executionId}`;
  }, [executionId, backendUrl]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('[RealtimeVisualizer] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[RealtimeVisualizer] WebSocket connected');
        setConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to execution updates
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          executionId,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('[RealtimeVisualizer] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[RealtimeVisualizer] WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        console.log('[RealtimeVisualizer] WebSocket closed');
        setConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[RealtimeVisualizer] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[RealtimeVisualizer] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[RealtimeVisualizer] Failed to create WebSocket:', error);
      setConnected(false);
    }
  }, [executionId, getWebSocketUrl]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'CONNECTED':
        console.log('[RealtimeVisualizer] Connection confirmed:', message.clientId);
        break;

      case 'EXECUTION_SNAPSHOT':
        setExecutionState(message.data);
        if (message.data.nodes) {
          const newNodeStates = new Map<string, NodeUpdate>();
          message.data.nodes.forEach((node: NodeUpdate) => {
            newNodeStates.set(node.nodeId, node);
            // Update workflow store
            updateNodeStatus(node.nodeId, node.status);
            // Callback
            onNodeUpdate?.(node.nodeId, node.status);
          });
          setNodeStates(newNodeStates);
        }
        break;

      case 'NODE_UPDATE':
        const nodeUpdate = message.data as NodeUpdate;
        setNodeStates(prev => {
          const updated = new Map(prev);
          updated.set(nodeUpdate.nodeId, nodeUpdate);
          return updated;
        });
        
        // Update workflow store
        updateNodeStatus(nodeUpdate.nodeId, nodeUpdate.status);
        
        // Callback
        onNodeUpdate?.(nodeUpdate.nodeId, nodeUpdate.status);
        break;

      case 'PONG':
        // Heartbeat response
        break;
    }
  }, [updateNodeStatus, onNodeUpdate]);

  // Setup WebSocket connection
  useEffect(() => {
    if (executionId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [executionId, connect]);

  // Send heartbeat
  useEffect(() => {
    if (!connected) return;

    const heartbeatInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [connected]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-yellow-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-300" />;
    }
  };

  // Get node visual state
  const getNodeVisualState = (nodeId: string) => {
    return nodeStates.get(nodeId) || {
      status: 'idle' as const,
      visual: {
        borderColor: '#9ca3af',
        icon: 'circle',
      },
      timestamp: 0,
    };
  };

  return (
    <div className="realtime-visualizer">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          "w-2 h-2 rounded-full",
          connected ? "bg-green-500 animate-pulse" : "bg-red-500"
        )} />
        <span className="text-sm text-muted-foreground">
          {connected ? 'Real-time updates active' : 'Connecting...'}
        </span>
        {executionState && (
          <span className="text-sm text-muted-foreground ml-auto">
            {executionState.progress}% complete ({executionState.completedNodes}/{executionState.totalNodes} nodes)
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {executionState && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${executionState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Node Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {nodes.map((node) => {
          const visualState = getNodeVisualState(node.id);
          const { visual, status } = visualState;

          return (
            <div
              key={node.id}
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-300",
                "bg-white dark:bg-gray-800",
                visual.glow && "shadow-lg shadow-blue-500/50",
                visual.pulse && "animate-pulse"
              )}
              style={{
                borderColor: visual.borderColor,
                boxShadow: visual.glow
                  ? `0 0 10px ${visual.borderColor}40`
                  : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-sm font-medium truncate">
                  {node.data.label}
                </span>
              </div>
              
              {visual.badges && visual.badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {visual.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      {badge.label}: {badge.value}
                    </span>
                  ))}
                </div>
              )}

              {visual.progress !== undefined && visual.progress > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${visual.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
