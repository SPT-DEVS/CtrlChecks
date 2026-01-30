import { getCredentials, LinkedInCredentials } from './credentials';

/**
 * Get credentials for a specific node type from user profile
 * This is used by workflow nodes to automatically use stored credentials
 */
export async function getNodeCredentials(nodeType: 'linkedin' | 'google'): Promise<any> {
  try {
    const credentials = await getCredentials(nodeType);
    return credentials;
  } catch (error) {
    console.error(`Error getting ${nodeType} credentials:`, error);
    return null;
  }
}

/**
 * Check if credentials are available for a node type
 */
export async function hasNodeCredentials(nodeType: 'linkedin' | 'google'): Promise<boolean> {
  const credentials = await getNodeCredentials(nodeType);
  return !!credentials;
}

/**
 * Get LinkedIn credentials with validation
 */
export async function getLinkedInCredentials(): Promise<LinkedInCredentials | null> {
  const credentials = await getNodeCredentials('linkedin');
  if (!credentials) {
    return null;
  }

  // Validate credentials structure
  if (!credentials.accessToken || !credentials.accountType) {
    return null;
  }

  return credentials as LinkedInCredentials;
}
