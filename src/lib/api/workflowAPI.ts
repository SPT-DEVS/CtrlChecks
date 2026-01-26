/**
 * Workflow API Client
 * Handles workflow execution and backend communication
 */

import { api, testConnection } from './client';
import { supabase } from '@/integrations/supabase/client';

export const workflowAPI = {
  async executeWorkflow(workflowId: string, triggerData: any = {}) {
    // First check backend connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error(
        'Backend server is not reachable. ' +
        'Please ensure the backend is running on http://localhost:3001. ' +
        'Start it with: cd worker && npm run dev'
      );
    }
    
    try {
      console.log(`🚀 Executing workflow ${workflowId}...`);
      
      // Get auth token if available
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
      
      const response = await api.post('/api/execute-workflow', {
        workflowId,
        triggerData,
        input: triggerData,
        _trigger: 'manual',
        _user_id: sessionData?.session?.user?.id || 'anonymous',
        _workflow_id: workflowId,
        executed_at: new Date().toISOString()
      }, headers);
      
      console.log(`✅ Workflow ${workflowId} executed successfully`);
      return response;
      
    } catch (error: any) {
      console.error(`❌ Failed to execute workflow ${workflowId}:`, error);
      
      // Enhanced error messages
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error(
          'Cannot connect to backend API. ' +
          'Make sure: \n' +
          '1. Backend server is running (npm run dev in worker folder)\n' +
          '2. Backend is accessible at http://localhost:3001\n' +
          '3. No firewall is blocking port 3001\n' +
          '4. Check browser console for CORS errors'
        );
      }
      
      throw error;
    }
  },
  
  async testBackendConnection() {
    try {
      const response = await api.get('/api/test-connection');
      console.log('✅ Backend test connection:', response);
      return response;
    } catch (error) {
      console.error('❌ Backend test connection failed:', error);
      return null;
    }
  },
  
  async getBackendInfo() {
    try {
      const response = await api.get('/health');
      return response;
    } catch (error: any) {
      return {
        status: 'unreachable',
        error: error.message || 'Unknown error',
        suggestion: 'Start backend server: cd worker && npm run dev'
      };
    }
  }
};
