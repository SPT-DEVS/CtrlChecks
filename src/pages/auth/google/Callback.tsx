import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Avoid double-execution in React Strict Mode
    if (processedRef.current) return;

    let authSubscription: { unsubscribe: () => void } | null = null;
    let timeoutId: NodeJS.Timeout;

    const processSession = async (session: Session | null) => {
      if (!session) return false;

      // Prevent multiple processings for the same session if possible
      if (processedRef.current) return true;
      processedRef.current = true;

      try {
        setStatus('tokens found. Saving...');

        // Extract tokens
        const { provider_token, provider_refresh_token } = session;

        if (!provider_token) {
          console.warn('No provider_token in session. Is this a Google OAuth session?');
          // If we are already signed in but just re-connected, maybe we need to check if the tokens were updated anyway?
          // But usually provider_token is present in the session object immediately after OAuth sign-in.
          throw new Error('Google access token not found in session.');
        }

        console.log('Got Google tokens. Saving to database...');

        // Upsert into google_oauth_tokens table
        const { error: dbError } = await supabase
          .from('google_oauth_tokens' as any)
          .upsert({
            user_id: session.user.id,
            access_token: provider_token,
            refresh_token: provider_refresh_token || null,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // Approx 1 hour default
            token_type: 'Bearer',
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/contacts',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (dbError) throw dbError;

        toast({
          title: 'Success',
          description: 'Google connected successfully!',
        });

        // Check if we should return to a specific page (e.g., workflow wizard)
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        
        if (returnTo) {
          // Return to the page that initiated OAuth
          navigate(returnTo);
        } else {
          // Default redirect
          navigate('/workflows');
        }
        return true;

      } catch (err) {
        console.error('Error in Google callback processing:', err);
        setError(err instanceof Error ? err.message : 'Failed to save Google connection');
        toast({
          title: 'Connection Failed',
          description: err instanceof Error ? err.message : 'Failed to save connection',
          variant: 'destructive',
        });
        // Still redirect after a bit so they aren't stuck
        setTimeout(() => navigate('/workflows'), 3000);
        return true;
      }
    };

    const setupAuthListener = async () => {
      // 1. Check if we already have a session (e.g. if exchange happened very fast)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const success = await processSession(session);
        if (success) return;
      }

      // 2. Setup listener for the EVENTUAL sign in (PKCE flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log(`Auth Callback Event: ${event}`);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await processSession(session);
          }
        }
      );
      authSubscription = subscription;

      // 3. Set a timeout just in case it hangs forever
      timeoutId = setTimeout(() => {
        if (!processedRef.current) {
          setError('Authentication timed out. Please try again.');
          processedRef.current = true; // Stop listening
        }
      }, 10000); // 10 seconds timeout
    };

    setupAuthListener();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-destructive font-semibold">Connection Failed</div>
        <p className="text-muted-foreground">{error}</p>
        <div className="bg-muted p-4 rounded text-xs font-mono text-left max-w-lg overflow-auto">
          <p>Debug Info:</p>
          <p>URL: {window.location.href}</p>
          <p>Status: {status}</p>
        </div>
        <Button onClick={() => navigate('/workflows')} variant="outline">
          Return to Workflows
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{status}</p>
      <p className="text-xs text-muted-foreground max-w-md text-center">
        Waiting for Google to complete the handshake...
      </p>
    </div>
  );
}

import { Button } from '@/components/ui/button';
