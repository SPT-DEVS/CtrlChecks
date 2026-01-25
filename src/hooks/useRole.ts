/**
 * React hook for role-based access control
 */

import { useEffect, useState } from 'react';
import { getUserRole, isAdmin, isModerator, canAccessAdminPortal } from '@/lib/roles';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UseRoleReturn {
  role: AppRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
}

export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isModeratorUser, setIsModeratorUser] = useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      try {
        const [userRole, adminCheck, moderatorCheck, adminAccess] = await Promise.all([
          getUserRole(),
          isAdmin(),
          isModerator(),
          canAccessAdminPortal(),
        ]);

        setRole(userRole);
        setIsAdminUser(adminCheck);
        setIsModeratorUser(moderatorCheck);
        setCanAccessAdmin(adminAccess);
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRole();
  }, []);

  return {
    role,
    isAdmin: isAdminUser,
    isModerator: isModeratorUser,
    canAccessAdmin,
    loading,
  };
}

