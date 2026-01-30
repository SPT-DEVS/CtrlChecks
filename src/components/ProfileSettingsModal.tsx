import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Linkedin, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { saveCredentials, getCredentials, removeCredentials, testLinkedInConnection } from '@/lib/credentials';
import { updateLinkedInNodes } from '@/lib/nodeConfiguration';

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LinkedInCredentials {
  accessToken: string;
  accountType: 'profile' | 'organization';
  organizationId?: string;
  expiresAt?: string;
}

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // LinkedIn form state
  const [accessToken, setAccessToken] = useState('');
  const [accountType, setAccountType] = useState<'profile' | 'organization'>('profile');
  const [organizationId, setOrganizationId] = useState('');

  // Load existing credentials
  useEffect(() => {
    if (open && user) {
      loadCredentials();
    }
  }, [open, user]);

  const loadCredentials = async () => {
    if (!user) return;

    try {
      const linkedInCreds = await getCredentials('linkedin');
      if (linkedInCreds) {
        setLinkedInConnected(true);
        setAccessToken(linkedInCreds.accessToken || '');
        setAccountType(linkedInCreds.accountType || 'profile');
        setOrganizationId(linkedInCreds.organizationId || '');
      } else {
        setLinkedInConnected(false);
      }

      const googleCreds = await getCredentials('google');
      setGoogleConnected(!!googleCreds);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!accessToken.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a LinkedIn Access Token',
        variant: 'destructive',
      });
      return;
    }

    if (accountType === 'organization' && !organizationId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter Organization ID for company pages',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTestingConnection(true);

    try {
      // Test the connection first
      const isValid = await testLinkedInConnection(accessToken);
      
      if (!isValid) {
        toast({
          title: 'Connection Failed',
          description: 'Invalid LinkedIn Access Token. Please check your token and try again.',
          variant: 'destructive',
        });
        setTestingConnection(false);
        setLoading(false);
        return;
      }

      // Save credentials
      const credentials: LinkedInCredentials = {
        accessToken: accessToken.trim(),
        accountType,
        organizationId: accountType === 'organization' ? organizationId.trim() : undefined,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
      };

      await saveCredentials('linkedin', credentials);
      
      // Update all LinkedIn nodes with new credentials
      await updateLinkedInNodes(credentials);
      
      setLinkedInConnected(true);
      toast({
        title: 'Success',
        description: 'LinkedIn connected successfully! All LinkedIn nodes have been updated.',
      });
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      toast({
        title: 'Error',
        description: `Failed to connect LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setTestingConnection(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    setLoading(true);
    try {
      await removeCredentials('linkedin');
      setLinkedInConnected(false);
      setAccessToken('');
      setOrganizationId('');
      toast({
        title: 'Disconnected',
        description: 'LinkedIn has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting LinkedIn:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect LinkedIn',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    // Use existing Google OAuth flow
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly email profile',
          },
        },
      });

      if (error) throw error;

      // Store Google connection status
      await saveCredentials('google', { connected: true });
      setGoogleConnected(true);
      toast({
        title: 'Redirecting...',
        description: 'Please complete Google authentication in the popup window.',
      });
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate Google connection',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectGoogle = async () => {
    setLoading(true);
    try {
      await removeCredentials('google');
      setGoogleConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Google has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    window.location.href = '/';
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your profile information and integration credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{userName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={userName}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* LinkedIn Integration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0077b5]" />
              <h3 className="font-semibold">LinkedIn Integration</h3>
            </div>

            {linkedInConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">LinkedIn Connected</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Account Type: <span className="font-medium">{accountType === 'organization' ? 'Company Page' : 'Personal Profile'}</span></p>
                  {accountType === 'organization' && organizationId && (
                    <p>Organization ID: <span className="font-mono text-xs">{organizationId}</span></p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnectLinkedIn}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Disconnect LinkedIn
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken">LinkedIn Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Paste your LinkedIn Access Token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      How to get Access Token?
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={accountType}
                    onValueChange={(value: 'profile' | 'organization') => setAccountType(value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="accountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profile">Personal Profile</SelectItem>
                      <SelectItem value="organization">Company Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {accountType === 'organization' && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationId">Organization ID (URN)</Label>
                    <Input
                      id="organizationId"
                      placeholder="urn:li:organization:123456"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: urn:li:organization:123456
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleConnectLinkedIn}
                  disabled={loading || testingConnection}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>Testing Connection...</>
                  ) : (
                    <>
                      <Linkedin className="mr-2 h-4 w-4" />
                      Connect LinkedIn
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Google Integration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <h3 className="font-semibold">Google Integration</h3>
            </div>

            {googleConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Google Connected</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Disconnect Google
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleConnectGoogle}
                disabled={loading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Google Account
              </Button>
            )}
          </div>

          <Separator />

          {/* Sign Out Button */}
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={loading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
