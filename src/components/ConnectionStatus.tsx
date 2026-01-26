/**
 * Connection Status Component
 * Displays backend connection status in the UI
 */

import { useState, useEffect } from 'react';
import { workflowAPI } from '../lib/api/workflowAPI';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export function ConnectionStatus() {
  const [backendStatus, setBackendStatus] = useState<ConnectionStatus>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    checkBackend();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);
  
  async function checkBackend() {
    try {
      const info = await workflowAPI.getBackendInfo();
      setBackendInfo(info);
      
      if (info.status === 'healthy' || info.status === 'degraded') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  }
  
  async function handleRefresh() {
    setIsRefreshing(true);
    await checkBackend();
    setIsRefreshing(false);
  }
  
  if (backendStatus === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Checking backend connection...</span>
        </div>
      </div>
    );
  }
  
  if (backendStatus === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-lg z-50 max-w-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Backend Disconnected</div>
            <div className="text-xs text-red-700 mb-2">
              Cannot reach backend server. Workflow execution may fail.
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs underline hover:no-underline flex items-center gap-1 disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </>
                )}
              </button>
              <span className="text-xs text-red-600">•</span>
              <a 
                href="http://localhost:3001/health" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                Check manually
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium mb-1">Backend Connected</div>
          <div className="text-xs text-green-700">
            {backendInfo?.environment || 'development'} • Port {backendInfo?.port || '3001'}
            {backendInfo?.ollama === 'connected' && (
              <span className="ml-2">• Ollama OK</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
