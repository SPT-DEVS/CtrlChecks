/**
 * Connection Status Component
 * Displays backend connection status in the UI
 */

import { useState, useEffect } from 'react';
import { workflowAPI } from '@/lib/api/workflowAPI';

// Connection status component - currently disabled (returns null)
// Keeping the component structure for potential future use

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
      // Silently handle errors - client.ts handles logging
      setBackendStatus('disconnected');
    }
  }
  
  async function handleRefresh() {
    setIsRefreshing(true);
    await checkBackend();
    setIsRefreshing(false);
  }
  
  // Don't show any status cards
  return null;
}
