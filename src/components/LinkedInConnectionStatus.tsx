import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface LinkedInConnectionStatusProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  compact?: boolean;
}

export default function LinkedInConnectionStatus({ 
  onConnect, 
  onDisconnect,
  compact = false 
}: LinkedInConnectionStatusProps) {
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
        .from('linkedin_oauth_tokens' as any)
        .select('id, expires_at')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results gracefully

      // Handle 406 errors gracefully (RLS blocking when no tokens exist)
      if (error) {
        // 406 means "Not Acceptable" - usually means no rows exist or RLS blocked
        // Treat it as "not authenticated" rather than an error
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          setIsAuthenticated(false);
        } else {
          console.error('Error checking LinkedIn auth status:', error);
          setIsAuthenticated(false);
        }
      } else if (!data) {
        // No token exists
        setIsAuthenticated(false);
      } else {
        // Check if token is expired
        const tokenData = data as unknown as { id: string; expires_at?: string | null };
        const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
        const now = new Date();
        setIsAuthenticated(expiresAt ? expiresAt > now : true);
      }
    } catch (error) {
      console.error('Error checking LinkedIn auth status:', error);
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

  const handleLinkedInAuth = async () => {
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
      const redirectUrl = `${window.location.origin}/auth/linkedin/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            scope: 'openid profile email w_member_social w_organization_social',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (onConnect) {
        onConnect();
      }

      toast({
        title: 'Redirecting to LinkedIn...',
        description: 'Please authorize access to LinkedIn services',
      });
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Failed to initiate LinkedIn authentication',
        variant: 'destructive',
      });
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('linkedin_oauth_tokens' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsAuthenticated(false);
      
      if (onDisconnect) {
        onDisconnect();
      }
      
      toast({
        title: 'Disconnected',
        description: 'LinkedIn account disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect LinkedIn account',
        variant: 'destructive',
      });
    }
  };

  if (isCheckingAuth && !compact) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="hidden sm:inline">LinkedIn Connected</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLinkedInAuth}
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
              <span className="hidden sm:inline">Connect LinkedIn</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
