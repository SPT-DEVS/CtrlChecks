import { ReactNode, useRef } from 'react';
import { useWorkflowAuth } from '@/contexts/WorkflowAuthContext';
import { WorkflowAuthNotice } from './WorkflowAuthNotice';

interface WorkflowAuthGateProps {
  children: ReactNode;
  className?: string;
}

/**
 * Global Workflow Auth Gate Component
 * 
 * Wraps pages that have workflow creation/run actions.
 * Shows auth notice panel when Google is not connected.
 * Provides scroll target for disabled buttons.
 */
export function WorkflowAuthGate({ children, className }: WorkflowAuthGateProps) {
  const { authStatus, isLoading } = useWorkflowAuth();
  const noticeRef = useRef<HTMLDivElement>(null);

  // Expose scroll function globally via window for button handlers
  if (typeof window !== 'undefined') {
    (window as any).scrollToWorkflowAuthNotice = () => {
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  return (
    <div className={className}>
      {/* Auth Notice Panel - shown when Google is not connected */}
      <div ref={noticeRef}>
        <WorkflowAuthNotice />
      </div>
      {children}
    </div>
  );
}
