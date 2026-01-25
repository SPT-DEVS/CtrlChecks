// Chat Widget Embed Script
// For embedding chat widget on external websites

export interface ChatEmbedConfig {
  workflowId: string;
  apiKey?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  title?: string;
}

/**
 * Initialize chat widget on page
 */
export function initChatWidget(config: ChatEmbedConfig) {
  // This would be used in a standalone embed script
  // For now, it's a placeholder for the embed functionality
  
  console.log('Initializing chat widget with config:', config);
  
  // In production, this would:
  // 1. Create an iframe or inject React component
  // 2. Load the chat widget
  // 3. Handle communication between parent and widget
  
  return {
    destroy: () => {
      console.log('Destroying chat widget');
    },
  };
}

/**
 * Standalone embed script (for external websites)
 * Usage: <script src="https://your-domain.com/chat-embed.js"></script>
 */
if (typeof window !== 'undefined') {
  (window as any).CtrlChecksChat = {
    init: initChatWidget,
  };
}

