import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ENDPOINTS } from '@/config/endpoints';

interface AuthStatus {
  googleConnected: boolean;
  linkedinConnected: boolean;
}

interface WorkflowAuthContextType {
  authStatus: AuthStatus | null;
  isLoading: boolean;
  refreshAuthStatus: () => Promise<void>;
}

const WorkflowAuthContext = createContext<WorkflowAuthContextType | undefined>(undefined);

export function WorkflowAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      if (!user) {
        setAuthStatus({ googleConnected: false, linkedinConnected: false });
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          setAuthStatus({ googleConnected: false, linkedinConnected: false });
          setIsLoading(false);
          return;
        }

        // Use the configured backend endpoint
        const apiUrl = `${ENDPOINTS.itemBackend}/api/auth/status`;
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response && response.ok) {
            try {
              const data = await response.json();
              setAuthStatus({
                googleConnected: data.googleConnected || false,
                linkedinConnected: data.linkedinConnected || false,
              });
            } catch (parseError) {
              console.warn('Failed to parse auth status response:', parseError);
              setAuthStatus({ googleConnected: false, linkedinConnected: false });
            }
          } else {
            setAuthStatus({ googleConnected: false, linkedinConnected: false });
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Handle network errors gracefully (backend may be unavailable)
          if (fetchError.name === 'AbortError') {
            console.warn('Auth status check timed out (backend may be slow or unavailable)');
          } else {
            console.warn('Failed to fetch auth status (backend may be unavailable):', fetchError.message);
          }
          setAuthStatus({ googleConnected: false, linkedinConnected: false });
        }
      } catch (sessionError) {
        console.warn('Error getting session:', sessionError);
        setAuthStatus({ googleConnected: false, linkedinConnected: false });
      }
    } catch (error) {
      console.error('Unexpected error in checkAuthStatus:', error);
      setAuthStatus({ googleConnected: false, linkedinConnected: false });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAuthStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);
    
    // Refresh when window regains focus (e.g., after OAuth redirect)
    const handleFocus = () => {
      checkAuthStatus();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuthStatus]);

  return (
    <WorkflowAuthContext.Provider
      value={{
        authStatus,
        isLoading,
        refreshAuthStatus: checkAuthStatus,
      }}
    >
      {children}
    </WorkflowAuthContext.Provider>
  );
}

export function useWorkflowAuth() {
  const context = useContext(WorkflowAuthContext);
  if (context === undefined) {
    throw new Error('useWorkflowAuth must be used within a WorkflowAuthProvider');
  }
  return context;
}
