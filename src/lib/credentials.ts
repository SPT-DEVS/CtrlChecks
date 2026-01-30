import { supabase } from '@/integrations/supabase/client';

export interface LinkedInCredentials {
  accessToken: string;
  accountType: 'profile' | 'organization';
  organizationId?: string;
  expiresAt?: string;
}

export interface GoogleCredentials {
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

/**
 * Save credentials to Supabase user_credentials table
 */
export async function saveCredentials(
  service: 'linkedin' | 'google',
  credentials: LinkedInCredentials | GoogleCredentials
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_credentials')
    .upsert({
      user_id: user.id,
      service,
      credentials: credentials as any,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,service'
    });

  if (error) {
    console.error('Error saving credentials:', error);
    throw new Error(`Failed to save ${service} credentials: ${error.message}`);
  }
}

/**
 * Get credentials from Supabase
 */
export async function getCredentials(
  service: 'linkedin' | 'google'
): Promise<LinkedInCredentials | GoogleCredentials | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_credentials')
    .select('credentials')
    .eq('user_id', user.id)
    .eq('service', service)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No credentials found
      return null;
    }
    console.error('Error getting credentials:', error);
    return null;
  }

  return data?.credentials as LinkedInCredentials | GoogleCredentials | null;
}

/**
 * Remove credentials from Supabase
 */
export async function removeCredentials(service: 'linkedin' | 'google'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_credentials')
    .delete()
    .eq('user_id', user.id)
    .eq('service', service);

  if (error) {
    console.error('Error removing credentials:', error);
    throw new Error(`Failed to remove ${service} credentials: ${error.message}`);
  }
}

/**
 * Test LinkedIn connection with access token
 */
export async function testLinkedInConnection(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('LinkedIn connection test failed:', error);
    return false;
  }
}
