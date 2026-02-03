import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { UserGuide } from './UserGuide';
import { cn } from '@/lib/utils';
import { getNodeGuide, hasNodeGuide } from './nodeGuides';
import { generateFieldGuide } from './guideGenerator';

// Detect guide type from field key or label
function detectGuideType(key: string, label: string, type?: string): 'api_key' | 'url' | 'credential' | 'token' | 'endpoint' | 'custom' {
  const lowerKey = key.toLowerCase();
  const lowerLabel = label.toLowerCase();
  const combined = `${lowerKey} ${lowerLabel}`;

  // Check for specific services first (before generic types)
  if ((combined.includes('slack') && combined.includes('bot token')) || 
      (combined.includes('slack') && combined.includes('bot_token'))) {
    return 'custom'; // Use custom to trigger generateFieldGuide which has specific Slack guide
  }
  
  if (combined.includes('api key') || combined.includes('apikey') || combined.includes('api_key')) {
    return 'api_key';
  }
  if (combined.includes('url') || combined.includes('endpoint') || combined.includes('base url') || combined.includes('server url')) {
    return 'url';
  }
  if (combined.includes('token') || combined.includes('bearer') || combined.includes('access token')) {
    return 'token';
  }
  if (combined.includes('endpoint') || combined.includes('api endpoint')) {
    return 'endpoint';
  }
  if (combined.includes('credential') || combined.includes('password') || combined.includes('secret') || combined.includes('auth')) {
    return 'credential';
  }
  
  return 'custom';
}

// Generate guide question text
function getGuideQuestion(key: string, label: string): string {
  const lowerKey = key.toLowerCase();
  const lowerLabel = label.toLowerCase();
  const combined = `${lowerKey} ${lowerLabel}`;

  if (combined.includes('api key') || combined.includes('apikey')) {
    return 'How to get API key?';
  }
  if (combined.includes('url') || combined.includes('endpoint')) {
    return 'How to get URL?';
  }
  if (combined.includes('token')) {
    return 'How to get Token?';
  }
  if (combined.includes('credential') || combined.includes('password') || combined.includes('secret')) {
    return 'How to get Credentials?';
  }
  
  return 'How to get this value?';
}

interface InputGuideLinkProps {
  fieldKey: string;
  fieldLabel: string;
  fieldType?: string;
  nodeType?: string;
  className?: string;
  placeholder?: string;
  helpText?: string; // Add helpText prop to use field's helpText if available
}

export function InputGuideLink({ fieldKey, fieldLabel, fieldType, nodeType, className, placeholder, helpText }: InputGuideLinkProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // Try to get node-specific guide first
  const nodeGuide = nodeType ? getNodeGuide(nodeType, fieldKey) : null;
  
  // Check if helpText contains step-by-step instructions (starts with "How to get" or has numbered steps)
  const hasHelpTextSteps = helpText && (
    helpText.toLowerCase().includes('how to get') || 
    helpText.includes('Step 1') || 
    helpText.includes('1)') ||
    helpText.includes('1.') ||
    /\d+\)/.test(helpText) || // Matches "1)", "2)", etc.
    /Step \d+/.test(helpText) // Matches "Step 1", "Step 2", etc.
  );
  
  // Parse helpText into guide if it contains steps
  const helpTextGuide = hasHelpTextSteps ? parseHelpTextToGuide(helpText, fieldLabel) : null;
  
  // Generate field guide if no node-specific guide or helpText guide exists
  // ALWAYS generate guide for Slack Bot Token to ensure correct guide is shown
  const isSlackBotToken = (fieldLabel.toLowerCase().includes('slack') && 
                           (fieldLabel.toLowerCase().includes('bot token') || 
                            fieldLabel.toLowerCase().includes('bot_token'))) ||
                          (fieldKey.toLowerCase().includes('slack') && 
                           (fieldKey.toLowerCase().includes('bot_token') || 
                            fieldKey.toLowerCase().includes('bottoken')));
  
  const generatedGuide = !nodeGuide && !helpTextGuide ? generateFieldGuide(
    nodeType || '',
    fieldKey,
    fieldLabel,
    fieldType || 'text',
    placeholder || fieldLabel // Use fieldLabel as fallback if placeholder not available
  ) : null;
  
  // Fallback to generic guide type detection
  const guideType = detectGuideType(fieldKey, fieldLabel, fieldType);
  const guideQuestion = nodeGuide 
    ? `How to get ${fieldLabel}?` 
    : helpTextGuide?.title || generatedGuide?.title || getGuideQuestion(fieldKey, fieldLabel);
  
  // Determine which guide to use (priority: nodeGuide > helpTextGuide > generatedGuide)
  const activeGuide = nodeGuide || helpTextGuide || generatedGuide;

  // Always show guide link (per requirements: ALL fields must have guides)
  // If no node-specific guide exists, we'll use generic guide based on field type

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsGuideOpen(true);
        }}
        className={cn(
          "text-xs text-muted-foreground/70 hover:text-primary transition-colors flex items-center gap-1 mt-1 ml-auto",
          className
        )}
        style={{ marginLeft: 'auto' }}
      >
        <HelpCircle className="h-3 w-3" />
        <span>{guideQuestion}</span>
      </button>
      
      <UserGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        guideType={activeGuide ? 'custom' : guideType}
        customTitle={activeGuide?.title}
        customSteps={activeGuide?.steps}
        customUrl={activeGuide?.url}
        customExample={activeGuide?.example}
        securityWarning={activeGuide?.securityWarning}
      />
    </>
  );
}

// Parse helpText into guide format
function parseHelpTextToGuide(helpText: string, fieldLabel: string): { title: string; steps: string[]; url?: string; example?: string; securityWarning?: boolean } | null {
  if (!helpText) return null;
  
  // Check if helpText starts with "How to get"
  const titleMatch = helpText.match(/^How to get ([^:]+)/i);
  const title = titleMatch ? `How to get ${titleMatch[1]}?` : `How to get ${fieldLabel}?`;
  
  // Extract steps (numbered with 1), 2), etc. or Step 1, Step 2, etc.)
  const steps: string[] = [];
  
  // First try: Split by numbered steps pattern "1)", "2)", etc.
  if (helpText.includes(')')) {
    const stepParts = helpText.split(/(?=\d+\))/);
    for (const part of stepParts) {
      // Match pattern: "1) Text content"
      const stepMatch = part.match(/^(\d+)\)\s*(.+?)(?=\s*\d+\)|$)/s);
      if (stepMatch) {
        const stepNum = stepMatch[1];
        const stepText = stepMatch[2].trim();
        if (stepText && stepText.length > 0) {
          steps.push(`Step ${stepNum}: ${stepText}`);
        }
      }
    }
  }
  
  // Second try: Match "Step 1", "Step 2" format
  if (steps.length === 0 && helpText.includes('Step')) {
    const stepPattern = /Step\s+(\d+)[:\s]*([^\n]+?)(?=\s*Step\s+\d+|\s*$)/gi;
    let match;
    while ((match = stepPattern.exec(helpText)) !== null) {
      const stepNum = match[1];
      const stepText = match[2].trim();
      if (stepText && stepText.length > 0) {
        steps.push(`Step ${stepNum}: ${stepText}`);
      }
    }
  }
  
  // Third try: Match "1.", "2." format
  if (steps.length === 0 && helpText.match(/\d+\./)) {
    const stepPattern = /(\d+)\.\s*([^\n]+?)(?=\s*\d+\.|\s*$)/g;
    let match;
    while ((match = stepPattern.exec(helpText)) !== null) {
      const stepNum = match[1];
      const stepText = match[2].trim();
      if (stepText && stepText.length > 0) {
        steps.push(`Step ${stepNum}: ${stepText}`);
      }
    }
  }
  
  // Last resort: Split by newlines and number them
  if (steps.length === 0) {
    const lines = helpText.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.toLowerCase().startsWith('how to get') &&
             !trimmed.toLowerCase().startsWith('example') &&
             !trimmed.toLowerCase().startsWith('note');
    });
    lines.forEach((line, index) => {
      if (line.trim()) {
        steps.push(`Step ${index + 1}: ${line.trim()}`);
      }
    });
  }
  
  // If no numbered steps found, split by newlines and format
  if (steps.length === 0) {
    const lines = helpText.split('\n').filter(line => line.trim());
    lines.forEach((line, index) => {
      if (line.trim() && !line.toLowerCase().startsWith('how to get')) {
        steps.push(`Step ${index + 1}: ${line.trim()}`);
      }
    });
  }
  
  // Extract example if present
  const exampleMatch = helpText.match(/Example[:\s]+([^\n]+)/i);
  const example = exampleMatch ? exampleMatch[1].trim() : undefined;
  
  // Extract URL if present
  const urlMatch = helpText.match(/https?:\/\/[^\s]+/);
  const url = urlMatch ? urlMatch[0] : undefined;
  
  // Check for security warning
  const securityWarning = helpText.toLowerCase().includes('secure') || 
                         helpText.toLowerCase().includes('secret') ||
                         helpText.toLowerCase().includes('token') ||
                         helpText.toLowerCase().includes('key');
  
  if (steps.length === 0) return null;
  
  return {
    title,
    steps,
    url,
    example,
    securityWarning
  };
}

// Helper to determine if we should show generic guide
// MANDATORY: Show guide for ALL input fields (per requirements)
function shouldShowGenericGuide(fieldKey: string, fieldLabel: string): boolean {
  // Always show guide for all fields - zero confusion requirement
  return true;
}

