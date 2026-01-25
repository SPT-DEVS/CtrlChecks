import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function GoogleConnectionStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    if (!user) {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('google_oauth_tokens' as any)
        .select('id, expires_at')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsAuthenticated(false);
      } else {
        // Check if token is expired
        const tokenData = data as unknown as { id: string; expires_at?: string | null };
        const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
        const now = new Date();
        setIsAuthenticated(expiresAt ? expiresAt > now : true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
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
  }, [user, checkAuthStatus]);

  const handleGoogleAuth = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/google/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/contacts email profile',
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Redirecting to Google...',
        description: 'Please authorize access to Google services',
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Failed to initiate Google authentication',
        variant: 'destructive',
      });
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('google_oauth_tokens' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsAuthenticated(false);
      toast({
        title: 'Disconnected',
        description: 'Google account disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google account',
        variant: 'destructive',
      });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Google Connected</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoogleAuth}
                disabled={isAuthenticating}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Connecting...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Connect Google</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isAuthenticated ? (
            <p>Google account is connected. Click to disconnect.</p>
          ) : (
            <p>Google account is not connected. Click to connect.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

