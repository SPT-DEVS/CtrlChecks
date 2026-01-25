/**
 * Admin Route Guard
 * Protects admin routes from unauthorized access
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { canAccessAdmin, loading } = useRole();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for role check to complete
    if (!loading) {
      setIsChecking(false);
      if (!canAccessAdmin) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [canAccessAdmin, loading, navigate]);

  // Show loading while checking
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not admin, don't render (redirect will happen)
  if (!canAccessAdmin) {
    return null;
  }

  return <>{children}</>;
}

