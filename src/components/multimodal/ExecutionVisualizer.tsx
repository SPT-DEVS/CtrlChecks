/**
 * ExecutionVisualizer Component
 * 
 * Shows real-time backend execution logs and status updates.
 * Displays:
 * - Step-by-step execution logs
 * - Model responses
 * - Performance metrics
 * - Execution timeline
 */

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2, Info, AlertTriangle, Clock } from 'lucide-react';

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  stepId?: string;
  stepName?: string;
  metadata?: Record<string, any>;
}

interface ExecutionVisualizerProps {
  logs: ExecutionLog[];
  isExecuting?: boolean;
  executionTime?: number;
  onClear?: () => void;
}

const logIcons: Record<ExecutionLog['level'], React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
};

const logColors: Record<ExecutionLog['level'], string> = {
  info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
};

export default function ExecutionVisualizer({
  logs,
  isExecuting = false,
  executionTime,
  onClear,
}: ExecutionVisualizerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isExecuting ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              Execution Logs
            </CardTitle>
            <CardDescription>
              Real-time backend execution status
            </CardDescription>
          </div>
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        {executionTime !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {executionTime.toFixed(2)}s
            </Badge>
            <Badge variant="outline">{logs.length} log{logs.length !== 1 ? 's' : ''}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {isExecuting ? 'Waiting for logs...' : 'No execution logs yet'}
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-3 text-sm ${logColors[log.level]}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{logIcons[log.level]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.stepName && (
                          <Badge variant="outline" className="text-xs">
                            {log.stepName}
                          </Badge>
                        )}
                      </div>
                      <div className="font-medium">{log.message}</div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="text-xs bg-background/50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </ScrollArea>

        {/* Performance Summary */}
        {logs.length > 0 && !isExecuting && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-semibold mb-2">Performance Summary</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Total Steps</div>
                <div className="font-semibold">
                  {new Set(logs.map(l => l.stepId).filter(Boolean)).size}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Success</div>
                <div className="font-semibold text-green-600">
                  {logs.filter(l => l.level === 'success').length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Errors</div>
                <div className="font-semibold text-red-600">
                  {logs.filter(l => l.level === 'error').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

