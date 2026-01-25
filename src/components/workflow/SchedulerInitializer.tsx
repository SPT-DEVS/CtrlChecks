import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { workflowScheduler } from '@/lib/workflowScheduler';

/**
 * Component that initializes workflow schedulers on app load
 * Should be placed in a component that renders after authentication
 */
export default function SchedulerInitializer() {
  const { user, loading } = useAuth();

  useEffect(() => {
    let mounted = true;

    // Only initialize if user is authenticated
    if (!loading && user && mounted) {
      // Add a small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        if (mounted) {
          workflowScheduler.initializeAll().catch((error) => {
            console.error('Failed to initialize schedulers:', error);
          });
        }
      }, 500); // 500ms delay to avoid race conditions

      return () => {
        mounted = false;
        clearTimeout(timer);
        if (!user) {
          workflowScheduler.stopAll();
        }
      };
    }

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (!user) {
        workflowScheduler.stopAll();
      }
    };
  }, [user, loading]);

  return null; // This component doesn't render anything
}

