import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CheckCircle, AlertCircle, Plug, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ConnectionsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);

  const checkConnections = useCallback(async () => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    try {
      // Check Google connection
      const { data: googleData } = await supabase
        .from('google_oauth_tokens' as any)
        .select('id, expires_at')
        .eq('user_id', user.id)
        .single();

      if (googleData) {
        const expiresAt = googleData.expires_at ? new Date(googleData.expires_at) : null;
        const now = new Date();
        setGoogleConnected(expiresAt ? expiresAt > now : true);
      } else {
        setGoogleConnected(false);
      }

      // Check LinkedIn connection
      const { data: linkedInData, error: linkedInError } = await supabase
        .from('linkedin_oauth_tokens' as any)
        .select('id, expires_at')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() to handle empty results gracefully

      // Handle 406 errors gracefully (RLS blocking when no tokens exist)
      if (linkedInError && linkedInError.code !== 'PGRST116' && !linkedInError.message?.includes('406')) {
        console.error('Error checking LinkedIn connection:', linkedInError);
        setLinkedInConnected(false);
      } else if (linkedInData) {
        const expiresAt = linkedInData.expires_at ? new Date(linkedInData.expires_at) : null;
        const now = new Date();
        setLinkedInConnected(expiresAt ? expiresAt > now : true);
      } else {
        setLinkedInConnected(false);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
      setGoogleConnected(false);
      setLinkedInConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnections();
  }, [checkConnections]);

  useEffect(() => {
    // Refresh when panel opens
    if (open) {
      checkConnections();
    }
  }, [open, checkConnections]);

  const handleGoogleConnect = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setIsGoogleConnecting(true);

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

      setOpen(false);
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
      setIsGoogleConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('google_oauth_tokens' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setGoogleConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Google account disconnected successfully',
      });
      checkConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google account',
        variant: 'destructive',
      });
    }
  };

  const handleLinkedInConnect = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setIsLinkedInConnecting(true);

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

      if (error) throw error;

      setOpen(false);
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
      setIsLinkedInConnecting(false);
    }
  };

  const handleLinkedInDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('linkedin_oauth_tokens' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setLinkedInConnected(false);
      toast({
        title: 'Disconnected',
        description: 'LinkedIn account disconnected successfully',
      });
      checkConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect LinkedIn account',
        variant: 'destructive',
      });
    }
  };

  const totalConnected = (googleConnected ? 1 : 0) + (linkedInConnected ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plug className="h-4 w-4" />
          <span className="hidden sm:inline">Connections</span>
          {totalConnected > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {totalConnected}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Integrations</h4>
            <p className="text-sm text-muted-foreground">
              Connect your accounts to use in workflows
            </p>
          </div>

          <div className="space-y-3">
            {/* Google Connection */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.54 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Google</div>
                  <div className="text-xs text-muted-foreground">
                    {isChecking ? 'Checking...' : googleConnected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isChecking ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : googleConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGoogleDisconnect}
                      disabled={isGoogleConnecting}
                      className="h-8"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGoogleConnect}
                      disabled={isGoogleConnecting}
                      className="h-8"
                    >
                      {isGoogleConnecting ? (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* LinkedIn Connection */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .771 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium">LinkedIn</div>
                  <div className="text-xs text-muted-foreground">
                    {isChecking ? 'Checking...' : linkedInConnected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isChecking ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : linkedInConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLinkedInDisconnect}
                      disabled={isLinkedInConnecting}
                      className="h-8"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleLinkedInConnect}
                      disabled={isLinkedInConnecting}
                      className="h-8"
                    >
                      {isLinkedInConnecting ? (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
