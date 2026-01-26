/**
 * Robust API Client for Frontend-Backend Communication
 * Handles connection testing, error recovery, and CORS issues
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:3001';

class APIClient {
  private baseUrl: string;
  private timeout: number = 30000; // 30 seconds
  
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
      console.log(`➡️  API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}: ${errorText}`);
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${url} - Success`);
      return data;
      
    } catch (error: any) {
      console.error(`💥 Fetch failed for ${url}:`, error);
      
      // Check if backend is reachable
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('🔌 Network Error - Check:');
        console.error('   1. Is backend server running?');
        console.error('   2. Is the URL correct?');
        console.error('   3. Are there CORS issues?');
        console.error(`   Backend URL: ${this.baseUrl}`);
        
        // Try to ping backend
        await this.checkBackendHealth();
      }
      
      throw error;
    }
  }
  
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend health check:', health);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
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
  console.log('🔌 Testing backend connection...');
  
  try {
    const isHealthy = await api.checkBackendHealth();
    
    if (isHealthy) {
      console.log('✅ Backend connection established');
      return true;
    } else {
      console.warn('⚠️  Backend may not be running or reachable');
      console.warn('   Run backend: cd worker && npm run dev');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to backend:', error);
    return false;
  }
}
