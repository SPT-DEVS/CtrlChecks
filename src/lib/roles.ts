/**
 * Role-based access control utilities
 * Provides functions to check user roles and permissions
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserRole {
  userId: string;
  role: AppRole;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: AppRole): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return false;
    }

    const { data, error } = await supabase
      .rpc('has_role', {
        _user_id: user.id,
        _role: role
      });

    if (error) {
      // Don't log RPC errors if function doesn't exist yet (migration not applied)
      if (error.code !== '42883') {
        console.error('Error checking role:', error);
      }
      return false;
    }

    return data === true;
  } catch (error) {
    // Silently fail if role checking isn't available yet
    console.warn('Role check failed (migration may not be applied):', error);
    return false;
  }
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if current user is a moderator
 */
export async function isModerator(): Promise<boolean> {
  return hasRole('moderator');
}

/**
 * Get current user's role
 * Returns the highest priority role if user has multiple roles
 * Priority: admin > moderator > user
 */
export async function getUserRole(): Promise<AppRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Handle 406 errors gracefully (RLS policy may not be set up yet)
    if (error) {
      // 406 = Not Acceptable (usually RLS blocking access)
      // PGRST116 = PostgREST error code for 406
      const is406Error = error.code === 'PGRST116' || 
                        error.message?.includes('406') ||
                        (error as any).status === 406;
      
      if (is406Error) {
        console.warn('user_roles 406 error (RLS policy may need to be applied):', error);
        return null;
      }
      
      console.error('Error getting user role:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // If user has multiple roles, return the highest priority one
    // Priority: admin > moderator > user
    const rolePriority: Record<AppRole, number> = {
      admin: 3,
      moderator: 2,
      user: 1,
    };

    // Sort by priority (highest first) and return the first one
    const sortedRoles = data
      .map(item => item.role)
      .sort((a, b) => rolePriority[b] - rolePriority[a]);

    return sortedRoles[0] || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Require admin role - throws error if not admin
 * Use in API routes or protected components
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Admin access required');
  }
}

/**
 * Check if user can access admin portal
 */
export async function canAccessAdminPortal(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'moderator';
}

/**
 * Permission matrix helper
 */
export const Permissions = {
  // Template permissions
  templates: {
    view: async () => true, // All authenticated users can view active templates
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  
  // Workflow permissions
  workflows: {
    viewOwn: async () => true, // Users can view their own workflows
    viewAll: isAdmin, // Admins can view all workflows
    create: async () => true, // All users can create workflows
    updateOwn: async () => true, // Users can update their own workflows
    updateAll: isAdmin, // Admins can update any workflow
    deleteOwn: async () => true, // Users can delete their own workflows
    deleteAll: isAdmin, // Admins can delete any workflow
  },
  
  // Admin portal access
  adminPortal: canAccessAdminPortal,
};

