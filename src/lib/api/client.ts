/**
 * Robust API Client for Frontend-Backend Communication
 * Handles connection testing, error recovery, and CORS issues
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:3001';

class APIClient {
  private baseUrl: string;
  private timeout: number = 30000; // 30 seconds
  private lastConnectionState: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  private healthCheckInProgress: boolean = false;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
    
    // Validate URL
    if (!this.baseUrl.startsWith('http')) {
      console.error(`❌ Invalid API URL: ${this.baseUrl}. Must start with http:// or https://`);
      this.baseUrl = 'http://localhost:3001'; // Fallback
    }
    
    console.log(`🌐 API Client initialized with base URL: ${this.baseUrl}`);
  }
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const isHealthCheck = endpoint === '/health' || endpoint === '/api/test-connection';
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include' as RequestCredentials, // Include cookies for CORS
    };
    
    try {
      // Only log non-health-check requests to reduce console noise
      if (!isHealthCheck) {
        console.log(`➡️  API Request: ${options.method || 'GET'} ${url}`);
      }
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        // Only log errors for non-health-check requests
        if (!isHealthCheck) {
          console.error(`❌ API Error ${response.status}: ${errorText}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update connection state and log only on state change
      if (isHealthCheck && this.lastConnectionState !== 'connected') {
        this.lastConnectionState = 'connected';
        console.log('✅ Backend connection established');
      }
      
      // Only log success for non-health-check requests
      if (!isHealthCheck) {
        console.log(`✅ API Response: ${options.method || 'GET'} ${url} - Success`);
      }
      
      return data;
      
    } catch (error: any) {
      // Only log errors for non-health-check requests, or when connection state changes
      const isConnectionError = error.message?.includes('Failed to fetch') || 
                                error.message?.includes('NetworkError') ||
                                error.message?.includes('ERR_CONNECTION_REFUSED');
      
      if (!isHealthCheck) {
        console.error(`💥 Fetch failed for ${url}:`, error);
        
        if (isConnectionError) {
          console.error('🔌 Network Error - Check:');
          console.error('   1. Is backend server running?');
          console.error('   2. Is the URL correct?');
          console.error('   3. Are there CORS issues?');
          console.error(`   Backend URL: ${this.baseUrl}`);
          
          // Try to ping backend
          await this.checkBackendHealth();
        }
      } else if (isConnectionError && this.lastConnectionState !== 'disconnected') {
        // Only log health check errors when state changes from connected to disconnected
        this.lastConnectionState = 'disconnected';
        console.warn('⚠️  Backend is not reachable. Health checks will continue silently.');
        console.warn('   To start backend: cd worker && npm run dev');
      }
      
      throw error;
    }
  }
  
  async checkBackendHealth(): Promise<boolean> {
    // Prevent multiple simultaneous health checks
    if (this.healthCheckInProgress) {
      return false;
    }
    
    this.healthCheckInProgress = true;
    
    try {
      // Try /health first
      let response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const health = await response.json();
        // Only log when connection state changes
        if (this.lastConnectionState !== 'connected') {
          console.log('✅ Backend health check passed');
          this.lastConnectionState = 'connected';
        }
        return true;
      }
      
      // If /health fails, try /api/test-connection
      response = await fetch(`${this.baseUrl}/api/test-connection`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        if (this.lastConnectionState !== 'connected') {
          console.log('✅ Backend test connection successful');
          this.lastConnectionState = 'connected';
        }
        return true;
      }
      
      // Update state only if it changed
      if (this.lastConnectionState !== 'disconnected') {
        this.lastConnectionState = 'disconnected';
      }
      
      return false;
    } catch (error: any) {
      // Only log when connection state changes from connected to disconnected
      const wasConnected = this.lastConnectionState === 'connected';
      this.lastConnectionState = 'disconnected';
      
      if (wasConnected) {
        // Connection was lost - log the error
        console.warn('⚠️  Backend connection lost');
        console.warn(`   URL: ${this.baseUrl}/health`);
        
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('ERR_CONNECTION_REFUSED') ||
            error.message?.includes('NetworkError')) {
          console.warn('   💡 To reconnect: cd worker && npm run dev');
        }
      }
      // If already disconnected, don't spam the console
      
      return false;
    } finally {
      this.healthCheckInProgress = false;
    }
  }
  
  // Convenience methods
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  async post(endpoint: string, data: any, customHeaders?: Record<string, string>) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders,
    });
  }
  
  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
  
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const api = new APIClient();

// Test connection on app startup
export async function testConnection(): Promise<boolean> {
  // Only log on initial connection test, not on every check
  const isHealthy = await api.checkBackendHealth();
  
  if (!isHealthy) {
    // Only log once on startup if backend is not available
    console.warn('⚠️  Backend is not reachable. Some features may be unavailable.');
    console.warn('   To start backend: cd worker && npm run dev');
  }
  
  return isHealthy;
}
