/**
 * DebugPanel Component
 * 
 * Shows error handling, retry options, and fix suggestions.
 * Displays:
 * - Error source (auth / model / tool / payload)
 * - Retry options
 * - Fix suggestions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type ErrorSource = 'auth' | 'model' | 'tool' | 'payload' | 'network' | 'unknown';

export interface DebugError {
  id: string;
  timestamp: Date;
  source: ErrorSource;
  stepId?: string;
  stepName?: string;
  message: string;
  details?: string;
  suggestions?: string[];
  retryable?: boolean;
}

interface DebugPanelProps {
  errors: DebugError[];
  onRetry?: (errorId: string) => void;
  onRetryAll?: () => void;
  onDismiss?: (errorId: string) => void;
}

const errorSourceColors: Record<ErrorSource, string> = {
  auth: 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-300 border-red-300 dark:border-red-800',
  model: 'bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  tool: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
  payload: 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  network: 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-300 border-gray-300 dark:border-gray-800',
};

const errorSourceIcons: Record<ErrorSource, React.ReactNode> = {
  auth: <XCircle className="h-4 w-4" />,
  model: <AlertTriangle className="h-4 w-4" />,
  tool: <AlertCircle className="h-4 w-4" />,
  payload: <AlertCircle className="h-4 w-4" />,
  network: <AlertCircle className="h-4 w-4" />,
  unknown: <AlertCircle className="h-4 w-4" />,
};

export default function DebugPanel({
  errors,
  onRetry,
  onRetryAll,
  onDismiss,
}: DebugPanelProps) {
  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Debug Panel
          </CardTitle>
          <CardDescription>No errors detected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const retryableErrors = errors.filter(e => e.retryable !== false);
  const hasRetryableErrors = retryableErrors.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Debug Panel
            </CardTitle>
            <CardDescription>
              {errors.length} error{errors.length !== 1 ? 's' : ''} detected
            </CardDescription>
          </div>
          {hasRetryableErrors && onRetryAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {errors.map((error) => (
          <Alert key={error.id} variant="destructive" className="border-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2 mb-2">
                  <Badge className={errorSourceColors[error.source]}>
                    {errorSourceIcons[error.source]}
                    <span className="ml-1 capitalize">{error.source}</span>
                  </Badge>
                  {error.stepName && (
                    <Badge variant="outline">{error.stepName}</Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <div className="font-semibold">{error.message}</div>
                  {error.details && (
                    <div className="text-sm opacity-90">{error.details}</div>
                  )}

                  {/* Suggestions */}
                  {error.suggestions && error.suggestions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold mb-1">Suggestions:</div>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {error.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {error.retryable !== false && onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(error.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(error.id)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

