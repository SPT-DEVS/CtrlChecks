import { X, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  guideType: 'api_key' | 'url' | 'credential' | 'token' | 'endpoint' | 'custom';
  customTitle?: string;
  customSteps?: string[];
  customUrl?: string;
  customExample?: string;
  securityWarning?: boolean;
}

// Guide data for different types
const guideData: Record<string, { title: string; steps: string[] }> = {
  api_key: {
    title: 'How to get API Key?',
    steps: [
      '1. Log in to your service provider\'s dashboard or developer portal',
      '2. Navigate to the "API Keys", "Developer Settings", or "Credentials" section',
      '3. Click "Create API Key" or "Generate New Key"',
      '4. Give your API key a descriptive name (e.g., "Workflow Automation")',
      '5. Select the permissions/scopes your workflow needs',
      '6. Copy the API key immediately - it may only be shown once',
      '7. Store it securely and paste it into the input field above',
      '8. Note: API keys are sensitive - never share them publicly or commit to version control'
    ]
  },
  url: {
    title: 'How to get URL?',
    steps: [
      '1. Identify the service or API you need to connect to',
      '2. Check the service\'s official documentation for the base URL or endpoint',
      '3. Common formats: https://api.service.com or https://service.com/api/v1',
      '4. For REST APIs, the URL typically includes: protocol (https://), domain, and path',
      '5. Some services provide URLs in their dashboard under "API Settings" or "Integration"',
      '6. For webhooks, use your server\'s public URL or a service like ngrok for local testing',
      '7. Ensure the URL includes the protocol (http:// or https://)',
      '8. Test the URL in a browser or API client to verify it\'s accessible'
    ]
  },
  credential: {
    title: 'How to get Credentials?',
    steps: [
      '1. Access your service provider\'s account settings or developer portal',
      '2. Look for "Security", "Authentication", or "Credentials" section',
      '3. Depending on the service, you may need:',
      '   - Username and Password',
      '   - OAuth tokens',
      '   - API keys',
      '   - Service account credentials',
      '4. Follow the service\'s specific authentication setup process',
      '5. For OAuth: Authorize the application and copy the access token',
      '6. For service accounts: Download the JSON key file or copy credentials',
      '7. Store credentials securely - use environment variables or secure vaults when possible',
      '8. Never commit credentials to version control or share them publicly'
    ]
  },
  token: {
    title: 'How to get Token?',
    steps: [
      '1. Log in to your service provider\'s platform',
      '2. Navigate to "Developer Settings", "API Tokens", or "Access Tokens"',
      '3. Click "Generate Token" or "Create New Token"',
      '4. Select the required permissions or scopes for your workflow',
      '5. Set an expiration time if available (or use long-lived tokens for automation)',
      '6. Copy the token immediately after generation',
      '7. For OAuth tokens: Complete the OAuth flow and copy the access token',
      '8. Paste the token into the input field - tokens are case-sensitive',
      '9. Note: Refresh tokens may be needed for long-running workflows'
    ]
  },
  endpoint: {
    title: 'How to get API Endpoint?',
    steps: [
      '1. Review the API documentation for the service you\'re integrating',
      '2. Look for the "Base URL" or "API Endpoint" in the documentation',
      '3. Common endpoint formats:',
      '   - REST: https://api.service.com/v1/resource',
      '   - GraphQL: https://api.service.com/graphql',
      '   - WebSocket: wss://api.service.com/ws',
      '4. Check the API version (v1, v2, etc.) - use the version your workflow needs',
      '5. Some services list endpoints in their developer dashboard',
      '6. For custom endpoints: Combine base URL + resource path',
      '7. Test the endpoint with a tool like Postman or curl to verify it works',
      '8. Ensure the endpoint supports the HTTP method (GET, POST, etc.) you need'
    ]
  },
  custom: {
    title: 'How to get this value?',
    steps: [
      '1. Check the service provider\'s official documentation',
      '2. Look for integration guides or API setup instructions',
      '3. Navigate to your account settings or developer portal',
      '4. Find the relevant section for this configuration',
      '5. Follow the step-by-step setup process provided by the service',
      '6. Copy the value and paste it into the input field',
      '7. Verify the value is correct by testing the connection',
      '8. Contact the service support if you need additional help'
    ]
  }
};

export function UserGuide({ isOpen, onClose, guideType, customTitle, customSteps, customUrl, customExample, securityWarning }: UserGuideProps) {
  if (!isOpen) return null;

  const guide = customSteps 
    ? { 
        title: customTitle || 'How to get this value?', 
        steps: customSteps,
        url: customUrl,
        example: customExample
      }
    : { ...guideData[guideType] || guideData.custom, url: undefined, example: undefined };
  
  // Determine if security warning should be shown
  const showSecurityWarning = securityWarning !== undefined 
    ? securityWarning 
    : (guideType === 'api_key' || guideType === 'token' || guideType === 'credential' || 
       customTitle?.toLowerCase().includes('api key') || 
       customTitle?.toLowerCase().includes('token') || 
       customTitle?.toLowerCase().includes('credential') || 
       customTitle?.toLowerCase().includes('secret') || 
       customTitle?.toLowerCase().includes('password'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Guide Container - Small size, positioned on right */}
      <Card className="relative w-[380px] h-[500px] mr-4 shadow-2xl border-border/60 pointer-events-auto animate-in slide-in-from-right duration-300">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">{guide.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 h-[calc(100%-80px)]">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {guide.url && (
                <div className="mb-3 p-2 bg-primary/10 rounded-md border border-primary/20">
                  <a 
                    href={guide.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    🔗 {guide.url}
                  </a>
                </div>
              )}
              {guide.steps.map((step, index) => {
                // Check if step is empty (used for spacing)
                if (!step.trim()) {
                  return <div key={index} className="h-2" />;
                }
                
                // Check if step starts with emoji or number (main step)
                const isMainStep = /^[0-9]️⃣|^[➡️•]/.test(step.trim());
                const isSubStep = step.trim().startsWith('•') || step.trim().startsWith('➡️');
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "text-sm leading-relaxed",
                      isMainStep ? "font-medium text-foreground mt-2" : "text-foreground/90",
                      isSubStep ? "ml-4" : ""
                    )}
                  >
                    {step}
                  </div>
                );
              })}
              {guide.example && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/40">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Example:</div>
                  <code className="text-xs font-mono text-foreground break-all">{guide.example}</code>
                </div>
              )}
              
              {/* Security Warning for sensitive fields */}
              {showSecurityWarning && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Security Warning
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                        Do not expose this value on frontend. Store it securely using environment variables or a secret manager. Never commit credentials to version control or share them publicly.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

