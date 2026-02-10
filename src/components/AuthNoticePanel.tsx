import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuthStatus {
  googleConnected: boolean;
  linkedinConnected: boolean;
}

interface AuthNoticePanelProps {
  onConnectGoogle?: () => void;
  onConnectLinkedIn?: () => void;
  onAuthStatusChange?: (status: AuthStatus) => void;
  className?: string;
}

export function AuthNoticePanel({ 
  onConnectGoogle, 
  onConnectLinkedIn,
  onAuthStatusChange,
  className 
}: AuthNoticePanelProps) {
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAuthStatus({ googleConnected: false, linkedinConnected: false });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const status = {
          googleConnected: data.googleConnected || false,
          linkedinConnected: data.linkedinConnected || false,
        };
        setAuthStatus(status);
        onAuthStatusChange?.(status);
      } else {
        // Default to not connected on error
        const status = { googleConnected: false, linkedinConnected: false };
        setAuthStatus(status);
        onAuthStatusChange?.(status);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus({ googleConnected: false, linkedinConnected: false });
    } finally {
      setIsLoading(false);
    }
  };

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
  }, []);

  const handleGoogleConnect = async () => {
    if (onConnectGoogle) {
      onConnectGoogle();
      return;
    }

    setIsConnecting(true);
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

      if (error) throw error;

      toast({
        title: 'Redirecting to Google...',
        description: 'Please authorize access to Google services',
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect Google account',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLinkedInConnect = async () => {
    if (onConnectLinkedIn) {
      onConnectLinkedIn();
      return;
    }

    setIsConnecting(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/linkedin/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast({
        title: 'Redirecting to LinkedIn...',
        description: 'Please authorize access to LinkedIn services',
      });
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect LinkedIn account',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Don't show panel if Google is connected
  if (isLoading || !authStatus || authStatus.googleConnected) {
    return null;
  }

  return (
    <Card 
      ref={panelRef}
      className={cn(
        "border-primary/20 bg-primary/5 mb-6 transition-all duration-300 animate-in slide-in-from-top-2",
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">Connect Google to Get Started</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To create and run workflows, you need to connect your Google account.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                className="gradient-primary text-primary-foreground"
              >
                {isConnecting ? 'Connecting...' : 'Connect Google'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleLinkedInConnect}
                disabled={isConnecting}
                size="sm"
              >
                Connect LinkedIn
              </Button>
              <span className="text-xs text-muted-foreground">
                LinkedIn is optional and can be added later.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
