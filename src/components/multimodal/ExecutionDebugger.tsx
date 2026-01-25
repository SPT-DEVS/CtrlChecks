import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface ExecutionDebuggerProps {
  logs: Array<{ timestamp: Date; level: string; message: string }>;
  pipeline?: any;
  executionEngine?: any;
}

export default function ExecutionDebugger({ logs, pipeline, executionEngine }: ExecutionDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Terminal className="mr-2 h-4 w-4" />
        Show Debug Info
      </Button>
    );
  }

  return (
    <Card className="mt-4 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Debug Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Pipeline Info */}
        <div>
          <div className="font-semibold mb-2">Pipeline Status:</div>
          <div className="space-y-1">
            <div>Steps: {pipeline?.steps?.length || 0}</div>
            <div>Processing Steps: {pipeline?.steps?.filter((s: any) => s.type === 'transformation').length || 0}</div>
            <div>Models: {executionEngine?.models?.length || 0}</div>
          </div>
        </div>

        {/* Execution Logs */}
        <div>
          <div className="font-semibold mb-2">Execution Logs:</div>
          <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No logs yet. Click Process to see execution logs.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs">
                    {log.level}
                  </Badge>
                  <span className="text-muted-foreground">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Model Info */}
        {executionEngine?.models && executionEngine.models.length > 0 && (
          <div>
            <div className="font-semibold mb-2">Selected Models:</div>
            <div className="space-y-1">
              {executionEngine.models.map((model: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {model.provider || 'unknown'}
                  </Badge>
                  <span className="font-mono text-xs">{model.name || 'Unknown model'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="pt-2 border-t">
          <div className="text-muted-foreground">
            💡 <strong>Tip:</strong> Open browser console (F12) to see detailed execution logs
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

