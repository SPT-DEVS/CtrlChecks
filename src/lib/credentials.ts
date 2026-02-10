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
 * Supports: 'linkedin', 'google', and any other service (e.g., 'slack', 'smtp', etc.)
 */
export async function saveCredentials(
  service: 'linkedin' | 'google' | string,
  credentials: LinkedInCredentials | GoogleCredentials | Record<string, any>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_credentials')
    .upsert({
      user_id: user.id,
      service: service.toLowerCase(),
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
 * Save workflow credentials (e.g., Slack webhook, SMTP, etc.)
 * This is called when user provides credentials during workflow creation
 */
export async function saveWorkflowCredential(
  credentialName: string,
  credentialValue: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Normalize credential name to service name
  // e.g., 'SLACK_WEBHOOK_URL' -> 'slack'
  const service = credentialName.toLowerCase()
    .replace(/_webhook_url$/, '')
    .replace(/_token$/, '')
    .replace(/_api_key$/, '')
    .replace(/_url$/, '')
    .split('_')[0]; // Get first part (e.g., 'slack' from 'slack_webhook_url')

  // Get existing credentials for this service
  const { data: existing } = await supabase
    .from('user_credentials')
    .select('credentials')
    .eq('user_id', user.id)
    .eq('service', service)
    .single();

  // Merge with existing credentials
  const existingCreds = existing?.credentials || {};
  const updatedCreds = {
    ...existingCreds,
    [credentialName.toLowerCase()]: credentialValue,
  };

  const { error } = await supabase
    .from('user_credentials')
    .upsert({
      user_id: user.id,
      service: service,
      credentials: updatedCreds,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,service'
    });

  if (error) {
    console.error('Error saving workflow credential:', error);
    throw new Error(`Failed to save ${credentialName}: ${error.message}`);
  }

  console.log(`✅ Saved credential ${credentialName} for service ${service}`);
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
