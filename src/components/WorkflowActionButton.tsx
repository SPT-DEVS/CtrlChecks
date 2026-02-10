import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWorkflowAuth } from '@/contexts/WorkflowAuthContext';
import { cn } from '@/lib/utils';

interface WorkflowActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  tooltip?: string;
}

/**
 * Global Workflow Action Button Component
 * 
 * Automatically disables when Google is not connected.
 * Shows tooltip and scrolls to auth notice when clicked while disabled.
 */
export function WorkflowActionButton({
  onClick,
  disabled: externalDisabled,
  children,
  variant = 'default',
  size = 'default',
  className,
  tooltip,
  ...props
}: WorkflowActionButtonProps) {
  const { authStatus, isLoading } = useWorkflowAuth();
  const googleConnected = authStatus?.googleConnected ?? false;
  const isDisabled = externalDisabled || isLoading || !googleConnected;

  const handleClick = () => {
    if (!googleConnected && !isLoading) {
      // Scroll to auth notice panel
      if (typeof window !== 'undefined' && (window as any).scrollToWorkflowAuthNotice) {
        (window as any).scrollToWorkflowAuthNotice();
      }
      return;
    }
    onClick?.();
  };

  const tooltipText = tooltip || (!googleConnected && !isLoading ? 'Connect Google to enable this' : undefined);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              {...props}
              variant={variant}
              size={size}
              className={className}
              onClick={handleClick}
              disabled={isDisabled}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        {tooltipText && (
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
