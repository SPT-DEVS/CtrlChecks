
/**
 * Centralized configuration for API endpoints.
 * Strictly uses environment variables - no fallbacks in production.
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const getEnvVar = (key: string, required: boolean = false, devDefault?: string): string => {
    const value = import.meta.env[key];
    
    if (!value) {
        if (required && !isDevelopment) {
            throw new Error(`❌ Required environment variable ${key} is missing. Please set it in your .env file.`);
        }
        
        if (isDevelopment && devDefault) {
            console.warn(`⚠️  Environment variable ${key} is missing. Using development default: ${devDefault}`);
            return devDefault;
        }
        
        if (required) {
            console.error(`❌ Required environment variable ${key} is missing`);
        } else {
            console.warn(`⚠️  Environment variable ${key} is missing`);
        }
        
        return '';
    }
    
    return value;
};

const ensureProtocol = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `http://${url}`;
};

export const ENDPOINTS = {
    // Chichu Chatbot & Worker Service
    // REQUIRED: VITE_API_URL must be set in production
    // Development fallback: http://localhost:3001
    itemBackend: ensureProtocol(
        getEnvVar('VITE_API_URL', !isDevelopment, 'http://localhost:3001')
    ),

    // Text/Image/Audio Processors - FastAPI Service
    // REQUIRED: VITE_PYTHON_BACKEND_URL must be set in production
    // Development fallback: http://localhost:8000
    processorBackend: ensureProtocol(
        getEnvVar('VITE_PYTHON_BACKEND_URL', !isDevelopment, 'http://localhost:8000')
    ),

    // Ollama URL (optional)
    // Development fallback: http://localhost:11434
    ollamaBase: ensureProtocol(
        getEnvVar('VITE_OLLAMA_BASE_URL', false, 'http://localhost:11434')
    ),

    // Backend access mode
    useDirectBackend: import.meta.env.VITE_USE_DIRECT_BACKEND === 'true' || isDevelopment || !import.meta.env.VITE_SUPABASE_URL
};

// Log configuration on load for easier debugging (only in development)
if (isDevelopment) {
    console.log('🔍 Environment Debug:', {
        DEV: import.meta.env.DEV,
        MODE: import.meta.env.MODE,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        isDevelopment
    });
    console.log('App Configuration:', ENDPOINTS);
}
