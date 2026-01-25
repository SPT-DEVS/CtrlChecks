
/**
 * centralized configuration for API endpoints.
 * strictly uses environment variables.
 */

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = import.meta.env[key];
    if (!value && !defaultValue) {
        console.warn(`Environment variable ${key} is missing`);
    }
    return value || defaultValue || '';
};

const ensureProtocol = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `http://${url}`;
};

export const ENDPOINTS = {
    // The main backend URL (FastAPI)
    itemBackend: ensureProtocol(getEnvVar('VITE_PYTHON_BACKEND_URL', 'http://localhost:8000')),

    // Ollama URL (often proxies through the backend or is same as backend)
    ollamaBase: ensureProtocol(getEnvVar('VITE_OLLAMA_BASE_URL', getEnvVar('VITE_PYTHON_BACKEND_URL', 'http://localhost:11434'))),

    // Backend access mode
    useDirectBackend: import.meta.env.VITE_USE_DIRECT_BACKEND === 'true' || import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL
};

// Log configuration on load for easier debugging
console.log('App Configuration:', ENDPOINTS);
