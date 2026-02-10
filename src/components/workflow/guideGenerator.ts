// Comprehensive Guide Generator for All Input Field Types
// This ensures every input field has a contextual guide

import { NodeGuide } from './nodeGuides';

export interface FieldGuide {
  title: string;
  steps: string[];
  url?: string;
  example?: string;
  securityWarning?: boolean;
}

/**
 * Generate a guide for any field type based on field metadata
 */
export function generateFieldGuide(
  nodeType: string,
  fieldKey: string,
  fieldLabel: string,
  fieldType: string,
  placeholder?: string
): FieldGuide {
  // ✅ PRODUCTION: Null-safe string operations
  const normalizedKey = fieldKey?.toLowerCase?.() ?? "";
  const normalizedLabel = fieldLabel?.toLowerCase?.() ?? "";
  const normalizedPlaceholder = (placeholder?.toLowerCase?.() ?? "").toLowerCase();
  const lowerKey = normalizedKey;
  const lowerLabel = normalizedLabel;
  const lowerPlaceholder = normalizedPlaceholder;
  const combined = `${lowerKey} ${lowerLabel} ${lowerPlaceholder}`;
  
  // CRITICAL: Check for Slack Bot Token FIRST (before any other checks)
  // This ensures the specific Slack guide is used instead of generic token guide
  if ((lowerLabel.includes('slack') && (lowerLabel.includes('bot token') || lowerLabel.includes('bot_token'))) ||
      (lowerKey.includes('slack') && (lowerKey.includes('bot_token') || lowerKey.includes('bottoken'))) ||
      (combined.includes('slack') && (combined.includes('bot token') || combined.includes('bot_token')))) {
    return {
      title: 'How to get Slack Bot Token?',
      url: 'https://api.slack.com/apps',
      steps: [
        'Step 1: Go to https://api.slack.com/apps',
        'Step 2: Sign in with your Slack workspace account',
        'Step 3: Click "Create New App" button (or select an existing app)',
        'Step 4: Choose "From scratch" option',
        'Step 5: Enter an app name (e.g., "Workflow Bot") and select your workspace',
        'Step 6: Click "Create App"',
        'Step 7: In the left sidebar, click "OAuth & Permissions"',
        'Step 8: Scroll down to "Scopes" section → "Bot Token Scopes"',
        'Step 9: Click "Add an OAuth Scope" and add required scopes:',
        '   • chat:write (to send messages)',
        '   • channels:read (to read channel info)',
        '   • channels:history (to read message history, if needed)',
        'Step 10: Scroll up to the top of the page',
        'Step 11: Click "Install to Workspace" button',
        'Step 12: Review permissions and click "Allow" to authorize',
        'Step 13: After installation, you\'ll see "Bot User OAuth Token"',
        'Step 14: Click "Copy" next to the token (starts with xoxb-)',
        'Step 15: Paste the token into the input field above',
        '',
        'Token format:',
        'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
        '',
        '⚠️ Security Warning:',
        '• Keep your Bot Token secret - never share it publicly',
        '• If exposed, regenerate it immediately in Slack app settings',
        '• Use environment variables for production workflows'
      ],
      example: 'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
      securityWarning: true
    };
  }
  
  // CRITICAL: Check fieldLabel directly (not lowercased) for URLs first
  // This handles cases where fieldLabel IS the URL (e.g., "https://api.twitter.com/1.1/?")
  if (fieldLabel.includes('api.twitter.com') || fieldLabel.includes('https://api.twitter.com') || 
      fieldLabel.includes('http://api.twitter.com')) {
    return generateTwitterAPIGuide();
  }
  if (fieldLabel.includes('graph.facebook.com') || fieldLabel.includes('https://graph.facebook.com')) {
    return generateFacebookGraphAPIGuide();
  }

  // Check for specific URLs in label or placeholder (HIGHEST PRIORITY)
  // Twitter API URLs - Check for api.twitter.com specifically
  if (combined.includes('api.twitter.com') || lowerLabel.includes('api.twitter.com') || 
      lowerPlaceholder.includes('api.twitter.com')) {
    return generateTwitterAPIGuide();
  }

  if (combined.includes('developers.facebook.com') || combined.includes('facebook.com/docs') || 
      combined.includes('graph-api') || combined.includes('facebook graph') ||
      lowerLabel.includes('developers.facebook.com') || lowerPlaceholder.includes('developers.facebook.com')) {
    return generateFacebookGraphAPIGuide();
  }

  if (combined.includes('developers.instagram.com') || combined.includes('instagram.com/docs') ||
      lowerLabel.includes('developers.instagram.com') || lowerPlaceholder.includes('developers.instagram.com')) {
    return generateInstagramAPIDocsGuide();
  }

  if (combined.includes('developer.twitter.com') || combined.includes('twitter.com/en/developer') ||
      lowerLabel.includes('developer.twitter.com') || lowerPlaceholder.includes('developer.twitter.com')) {
    return generateTwitterAPIDocsGuide();
  }

  // Facebook API - Specific guide
  if (combined.includes('facebook api') || lowerLabel.includes('facebook api')) {
    return generateFacebookAPIGuide();
  }

  // Instagram API - Specific guide
  if (combined.includes('instagram api') || lowerLabel.includes('instagram api')) {
    return generateInstagramAPIGuide();
  }

  // Twitter API - Specific guide
  if (combined.includes('twitter api') || lowerLabel.includes('twitter api') || lowerLabel.includes('x api')) {
    return generateTwitterAPIGuide();
  }

  // Content Repository - Specific guide
  if (combined.includes('content repository') || lowerLabel.includes('content repository') || 
      lowerLabel.includes('google drive') || lowerLabel.includes('dropbox')) {
    return generateContentRepositoryGuide(fieldLabel);
  }

  // API Key fields
  if (combined.includes('api key') || combined.includes('apikey') || lowerKey.includes('apikey')) {
    return generateAPIKeyGuide(nodeType, fieldLabel);
  }

  // URL/Endpoint fields - Check FIRST before token detection
  // Check if field label or placeholder contains a URL
  const hasURL = lowerLabel.includes('http://') || lowerLabel.includes('https://') ||
                 lowerPlaceholder.includes('http://') || lowerPlaceholder.includes('https://') ||
                 fieldLabel.includes('http://') || fieldLabel.includes('https://') ||
                 combined.includes('url') || combined.includes('endpoint') || 
                 combined.includes('base url') || combined.includes('server url') || 
                 combined.includes('webhook url');
  
  if (hasURL) {
    // Check for specific API URLs first (HIGHEST PRIORITY)
    if (combined.includes('api.twitter.com') || lowerLabel.includes('api.twitter.com') || 
        lowerPlaceholder.includes('api.twitter.com') || fieldLabel.includes('api.twitter.com')) {
      return generateTwitterAPIGuide();
    }
    if (combined.includes('graph.facebook.com') || lowerLabel.includes('graph.facebook.com') ||
        lowerPlaceholder.includes('graph.facebook.com') || fieldLabel.includes('graph.facebook.com')) {
      return generateFacebookGraphAPIGuide();
    }
    // Check if it's a documentation URL that needs specific guide
    if (combined.includes('docs') || combined.includes('documentation')) {
      return generateDocumentationURLGuide(fieldLabel, placeholder || fieldLabel);
    }
    return generateURLGuide(nodeType, fieldKey, fieldLabel);
  }

  // Page Token fields (Facebook Page Access Token) - Must come before generic token
  // Check fieldLabel directly for "page-token" or "page access token" pattern
  const isPageToken = fieldLabel.toLowerCase().includes('page-token') || 
                      fieldLabel.toLowerCase().includes('page token') ||
                      fieldLabel.toLowerCase().includes('page access token') ||
                      combined.includes('page token') || combined.includes('page-token') || 
                      lowerKey.includes('pagetoken') || lowerKey.includes('page_token') ||
                      lowerKey.includes('pageaccesstoken') || lowerKey.includes('page_access_token') ||
                      lowerLabel.includes('page token') || lowerLabel.includes('page-token') ||
                      lowerLabel.includes('page access token');
  
  // If it's a page token and in Facebook context, use Facebook Page Token guide
  if (isPageToken && (nodeType === 'facebook' || combined.includes('facebook') || 
                      lowerLabel.includes('facebook') || lowerPlaceholder.includes('facebook'))) {
    return generateFacebookPageTokenGuide();
  }
  
  // Also check if nodeType is facebook and field contains page/token
  if (nodeType === 'facebook' && isPageToken) {
    return generateFacebookPageTokenGuide();
  }

  // Token fields
  if (combined.includes('token') || combined.includes('bearer') || combined.includes('access token')) {
    // Check node type for service-specific token guides
    if (nodeType === 'facebook' && (combined.includes('access token') || combined.includes('page'))) {
      return generateFacebookPageTokenGuide();
    }
    if (nodeType === 'instagram' && combined.includes('access token')) {
      return generateInstagramAPIGuide();
    }
    if (nodeType === 'twitter' && combined.includes('access token')) {
      return generateTwitterAPIGuide();
    }
    return generateTokenGuide(nodeType, fieldLabel);
  }

  // Credential/Secret fields - Check for specific credentials first
  if (combined.includes('slack') && combined.includes('webhook')) {
    return generateSlackWebhookGuide();
  }
  if (combined.includes('google') && (combined.includes('oauth') || combined.includes('client'))) {
    if (combined.includes('secret')) {
      return generateGoogleOAuthSecretGuide();
    }
    return generateGoogleOAuthClientIDGuide();
  }
  if (combined.includes('smtp')) {
    if (combined.includes('host')) {
      return generateSMTPHostGuide();
    }
    if (combined.includes('username') || combined.includes('user')) {
      return generateSMTPUsernameGuide();
    }
    if (combined.includes('password') || combined.includes('pass')) {
      return generateSMTPPasswordGuide();
    }
    return generateSMTPGuide();
  }
  if (combined.includes('credential') || combined.includes('password') || combined.includes('secret') || 
      combined.includes('auth') || combined.includes('client secret')) {
    return generateCredentialGuide(nodeType, fieldLabel);
  }

  // Spreadsheet ID fields (Google Sheets)
  if (combined.includes('spreadsheet') || combined.includes('sheet id') || lowerKey.includes('spreadsheetid')) {
    return generateSpreadsheetIDGuide();
  }

  // Webhook URL fields
  if (combined.includes('webhook') && (combined.includes('url') || lowerKey.includes('webhook'))) {
    return generateWebhookURLGuide(nodeType, fieldLabel);
  }

  // Page ID fields (Facebook, Instagram)
  if (combined.includes('page id') || lowerKey.includes('pageid') || lowerKey.includes('page_id')) {
    return generatePageIDGuide(nodeType);
  }

  // Account ID fields (Instagram, etc.)
  if (combined.includes('account id') || lowerKey.includes('accountid') || lowerKey.includes('account_id')) {
    return generateAccountIDGuide(nodeType);
  }

  // Shop Domain fields (Shopify)
  if (combined.includes('shop domain') || combined.includes('shop url') || lowerKey.includes('shopdomain')) {
    return generateShopDomainGuide();
  }

  // Product/Order/Customer ID fields
  if ((combined.includes('product id') || lowerKey.includes('productid')) && 
      !combined.includes('api')) {
    return generateIDGuide('Product', 'product');
  }
  if ((combined.includes('order id') || lowerKey.includes('orderid')) && 
      !combined.includes('api')) {
    return generateIDGuide('Order', 'order');
  }
  if ((combined.includes('customer id') || lowerKey.includes('customerid')) && 
      !combined.includes('api')) {
    return generateIDGuide('Customer', 'customer');
  }

  // Expression fields (template variables)
  if (combined.includes('expression') || combined.includes('template') || 
      placeholder?.includes('{{') || lowerKey.includes('expression')) {
    return generateExpressionGuide(fieldLabel);
  }

  // Condition fields
  if (combined.includes('condition') || combined.includes('filter')) {
    return generateConditionGuide(fieldLabel);
  }

  // Array fields
  if (combined.includes('array') || lowerKey.includes('array')) {
    return generateArrayGuide(fieldLabel);
  }

  // Database fields
  if (combined.includes('database') || combined.includes('db name') || combined.includes('db_name')) {
    return generateDatabaseGuide(fieldKey, fieldLabel);
  }

  // Host/Server fields
  if (combined.includes('host') || combined.includes('server') || combined.includes('address')) {
    return generateHostGuide(fieldLabel);
  }

  // Port fields
  if (combined.includes('port')) {
    return generatePortGuide(fieldLabel);
  }

  // Model fields
  if (combined.includes('model')) {
    return generateModelGuide(nodeType, fieldLabel);
  }

  // Prompt fields
  if (combined.includes('prompt') || combined.includes('system prompt') || combined.includes('message')) {
    return generatePromptGuide(fieldLabel);
  }

  // JSON fields
  if (fieldType === 'json' || lowerKey.includes('json')) {
    return generateJSONGuide(fieldLabel, placeholder);
  }

  // Cron/Schedule fields
  if (fieldType === 'cron' || combined.includes('cron') || combined.includes('schedule')) {
    return generateCronGuide(fieldLabel);
  }

  // Time fields
  if (fieldType === 'time' || combined.includes('time')) {
    return generateTimeGuide(fieldLabel);
  }

  // Temperature fields
  if (combined.includes('temperature')) {
    return generateTemperatureGuide();
  }

  // Number fields
  if (fieldType === 'number') {
    return generateNumberGuide(fieldLabel, placeholder);
  }

  // Textarea fields
  if (fieldType === 'textarea') {
    // Check if it's a specific textarea type
    if (combined.includes('prompt') || combined.includes('system prompt')) {
      return generatePromptGuide(fieldLabel);
    }
    if (combined.includes('message') || combined.includes('body') || combined.includes('content')) {
      return generateMessageGuide(fieldLabel);
    }
    return generateTextareaGuide(fieldLabel);
  }

  // Text fields - check for specific patterns
  if (fieldType === 'text') {
    // Email fields
    if (combined.includes('email') || lowerKey.includes('email')) {
      return generateEmailGuide(fieldLabel);
    }
    // Phone fields
    if (combined.includes('phone') || combined.includes('tel') || lowerKey.includes('phone')) {
      return generatePhoneGuide(fieldLabel);
    }
    // Name fields (usually don't need guide, but provide basic help)
    if ((combined.includes('name') || lowerKey.includes('name')) && 
        !combined.includes('username') && !combined.includes('hostname')) {
      return generateNameGuide(fieldLabel);
    }
    // Title/Subject fields
    if (combined.includes('title') || combined.includes('subject') || lowerKey.includes('title')) {
      return generateTitleGuide(fieldLabel);
    }
    // Description fields
    if (combined.includes('description') || lowerKey.includes('description')) {
      return generateDescriptionGuide(fieldLabel);
    }
    // Message fields
    if (combined.includes('message') || lowerKey.includes('message')) {
      return generateMessageGuide(fieldLabel);
    }
  }

  // Default: Generic guide for any other field
  return generateGenericGuide(fieldLabel, fieldType);
}

function generateAPIKeyGuide(nodeType: string, fieldLabel: string): FieldGuide {
  const lowerLabel = fieldLabel.toLowerCase();
  
  // Check for Gemini API Key (most specific first)
  if (lowerLabel.includes('gemini') && (lowerLabel.includes('api key') || lowerLabel.includes('api_key'))) {
    return {
      title: 'How to get Gemini API Key?',
      url: 'https://aistudio.google.com/apikey',
      steps: [
        'Step 1: Go to https://aistudio.google.com/apikey',
        'Step 2: Sign in with your Google account',
        'Step 3: Click "Get API key" or "Create API key" button',
        'Step 4: Select "Create API key in new project" or choose an existing project',
        'Step 5: If creating new project:',
        '   • Enter a project name (e.g., "Workflow Automation")',
        '   • Click "Create"',
        'Step 6: Your API key will be generated and displayed',
        'Step 7: Click "Copy" to copy the API key immediately',
        'Step 8: Paste the API key into the input field above',
        '',
        'Important Notes:',
        '• The API key starts with "AIza"',
        '• You can only see the full key once - copy it immediately',
        '• If you lose it, you\'ll need to create a new one',
        '• API keys are free but have usage limits',
        '',
        'Token format:',
        'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Security Warning:',
        '• Keep your API key secret - never share it publicly',
        '• Do not commit API keys to version control',
        '• Use environment variables for production workflows',
        '• If exposed, delete and regenerate the key immediately'
      ],
      example: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    };
  }
  
  // Check for specific services in fieldLabel
  if (lowerLabel.includes('google sheets') || lowerLabel.includes('sheets api')) {
    return {
      title: 'How to get Google Sheets API?',
      url: 'https://console.cloud.google.com',
      steps: [
        'Step 1: Go to https://console.cloud.google.com',
        'Step 2: Sign in with your Google account',
        'Step 3: Create a new project or select an existing project',
        'Step 4: Click "APIs & Services" → "Library"',
        'Step 5: Search for "Google Sheets API"',
        'Step 6: Click on "Google Sheets API" and click "Enable"',
        'Step 7: Go to "APIs & Services" → "Credentials"',
        'Step 8: Click "Create Credentials" → "API Key"',
        'Step 9: Copy the API key immediately',
        'Step 10: (Optional) Restrict the API key to Google Sheets API for security',
        'Step 11: Paste the API key into the input field',
        '',
        'Example format:',
        'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Keep your API key secure. Restrict it to specific APIs and services.'
      ],
      example: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    };
  }
  
  // Check for Slack Bot Token (most specific first)
  if (lowerLabel.includes('slack') && (lowerLabel.includes('bot token') || lowerLabel.includes('bot_token'))) {
    return {
      title: 'How to get Slack Bot Token?',
      url: 'https://api.slack.com/apps',
      steps: [
        'Step 1: Go to https://api.slack.com/apps',
        'Step 2: Sign in with your Slack workspace account',
        'Step 3: Click "Create New App" button (or select an existing app)',
        'Step 4: Choose "From scratch" option',
        'Step 5: Enter an app name (e.g., "Workflow Bot") and select your workspace',
        'Step 6: Click "Create App"',
        'Step 7: In the left sidebar, click "OAuth & Permissions"',
        'Step 8: Scroll down to "Scopes" section → "Bot Token Scopes"',
        'Step 9: Click "Add an OAuth Scope" and add required scopes:',
        '   • chat:write (to send messages)',
        '   • channels:read (to read channel info)',
        '   • channels:history (to read message history, if needed)',
        'Step 10: Scroll up to the top of the page',
        'Step 11: Click "Install to Workspace" button',
        'Step 12: Review permissions and click "Allow" to authorize',
        'Step 13: After installation, you\'ll see "Bot User OAuth Token"',
        'Step 14: Click "Copy" next to the token (starts with xoxb-)',
        'Step 15: Paste the token into the input field above',
        '',
        'Token format:',
        'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
        '',
        '⚠️ Security Warning:',
        '• Keep your Bot Token secret - never share it publicly',
        '• If exposed, regenerate it immediately in Slack app settings',
        '• Use environment variables for production workflows'
      ],
      example: 'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
      securityWarning: true
    };
  }
  
  // Check for Slack API (general)
  if (lowerLabel.includes('slack') && lowerLabel.includes('api')) {
    return {
      title: 'How to get Slack API?',
      url: 'https://api.slack.com/apps',
      steps: [
        'Step 1: Go to https://api.slack.com/apps',
        'Step 2: Sign in with your Slack workspace',
        'Step 3: Click "Create New App" or select an existing app',
        'Step 4: Choose "From scratch"',
        'Step 5: Enter app name and select workspace',
        'Step 6: Go to "OAuth & Permissions" in left sidebar',
        'Step 7: Scroll to "Scopes" → "Bot Token Scopes"',
        'Step 8: Add required scopes (e.g., chat:write, channels:read)',
        'Step 9: Scroll up and click "Install to Workspace"',
        'Step 10: Authorize the app',
        'Step 11: Copy the "Bot User OAuth Token" (starts with xoxb-)',
        'Step 12: Paste it into the input field',
        '',
        'Example format:',
        'xoxb-YOUR-BOT-TOKEN-HERE',
        '',
        '⚠️ Keep your Bot Token secure. Never expose it publicly.'
      ],
      example: 'xoxb-YOUR-BOT-TOKEN-HERE',
      securityWarning: true
    };
  }
  
  const guides: Record<string, FieldGuide> = {
    google_gemini: {
      title: 'How to get Gemini API Key?',
      url: 'https://aistudio.google.com/apikey',
      steps: [
        'Step 1: Go to https://aistudio.google.com/apikey',
        'Step 2: Sign in with your Google account',
        'Step 3: Click "Get API key" or "Create API key" button',
        'Step 4: Select "Create API key in new project" or choose an existing project',
        'Step 5: If creating new project:',
        '   • Enter a project name (e.g., "Workflow Automation")',
        '   • Click "Create"',
        'Step 6: Your API key will be generated and displayed',
        'Step 7: Click "Copy" to copy the API key immediately',
        'Step 8: Paste the API key into the input field above',
        '',
        'Important Notes:',
        '• The API key starts with "AIza"',
        '• You can only see the full key once - copy it immediately',
        '• If you lose it, you\'ll need to create a new one',
        '• API keys are free but have usage limits',
        '',
        'Token format:',
        'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Security Warning:',
        '• Keep your API key secret - never share it publicly',
        '• Do not commit API keys to version control',
        '• Use environment variables for production workflows',
        '• If exposed, delete and regenerate the key immediately'
      ],
      example: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    },
    openai_gpt: {
      title: 'How to get OpenAI API Key?',
      url: 'https://platform.openai.com/api-keys',
      steps: [
        'Step 1: Go to https://platform.openai.com/api-keys',
        'Step 2: Sign in or create an account',
        'Step 3: Click on your profile icon (top right)',
        'Step 4: Select "API keys" from the dropdown',
        'Step 5: Click "Create new secret key"',
        'Step 6: Give it a name (e.g., "Workflow Integration")',
        'Step 7: Copy the key immediately (starts with "sk-")',
        '',
        'Example:',
        'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Do not expose this key in frontend code. Store it securely.'
      ],
      example: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    },
    anthropic_claude: {
      title: 'How to get Anthropic Claude API Key?',
      url: 'https://console.anthropic.com/settings/keys',
      steps: [
        'Step 1: Go to https://console.anthropic.com/settings/keys',
        'Step 2: Sign in or create an account',
        'Step 3: Click "Create Key" button',
        'Step 4: Give it a name (e.g., "Workflow Integration")',
        'Step 5: Copy the key immediately (starts with "sk-ant-")',
        '',
        'Example:',
        'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Do not expose this key in frontend code. Store it securely.'
      ],
      example: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    }
  };

  return guides[nodeType] || {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Log in to your service provider\'s dashboard or developer portal',
      'Step 2: Navigate to the "API Keys", "Developer Settings", or "Credentials" section',
      'Step 3: Click "Create API Key" or "Generate New Key"',
      'Step 4: Give your API key a descriptive name (e.g., "Workflow Automation")',
      'Step 5: Select the permissions/scopes your workflow needs',
      'Step 6: Copy the API key immediately - it may only be shown once',
      'Step 7: Store it securely and paste it into the input field above',
      '',
      '⚠️ Do not expose this value on frontend. Store it securely.'
    ],
    securityWarning: true
  };
}

function generateTokenGuide(nodeType: string, fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Log in to your service provider\'s platform',
      'Step 2: Navigate to "Developer Settings", "API Tokens", or "Access Tokens"',
      'Step 3: Click "Generate Token" or "Create New Token"',
      'Step 4: Select the required permissions or scopes for your workflow',
      'Step 5: Set an expiration time if available (or use long-lived tokens for automation)',
      'Step 6: Copy the token immediately after generation',
      'Step 7: For OAuth tokens: Complete the OAuth flow and copy the access token',
      'Step 8: Paste the token into the input field - tokens are case-sensitive',
      '',
      '⚠️ Do not expose this value on frontend. Store it securely.'
    ],
    securityWarning: true
  };
}

function generateURLGuide(nodeType: string, fieldKey: string, fieldLabel: string): FieldGuide {
  const lowerKey = fieldKey.toLowerCase();
  
  if (lowerKey.includes('webhook')) {
    return {
      title: 'How to get Webhook URL?',
      steps: [
        'Step 1: Identify where you want to receive webhook data',
        'Step 2: Use your server\'s public URL',
        'Step 3: For production: Use your server\'s public URL',
        'Step 4: The webhook URL format is: https://your-domain.com/webhook/endpoint',
        'Step 5: Copy the complete URL including protocol (http:// or https://)',
        'Step 6: Paste it into the service that will send webhooks to you',
        'Step 7: Test the webhook to verify it\'s working',
        '',
        'Example:',
        'https://api.example.com/webhook/receive'
      ],
      example: 'https://api.example.com/webhook/receive'
    };
  }

  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Identify the service or API you need to connect to',
      'Step 2: Check the service\'s official documentation for the base URL or endpoint',
      'Step 3: Common formats: https://api.service.com or https://service.com/api/v1',
      'Step 4: For REST APIs, the URL typically includes: protocol (https://), domain, and path',
      'Step 5: Some services provide URLs in their dashboard under "API Settings" or "Integration"',
      'Step 6: Ensure the URL includes the protocol (http:// or https://)',
      'Step 7: Test the URL in a browser or API client to verify it\'s accessible',
      '',
      'Example:',
      'https://api.example.com/v1'
    ],
    example: 'https://api.example.com/v1'
  };
}

function generateCredentialGuide(nodeType: string, fieldLabel: string): FieldGuide {
  // Check if this is a database credential
  const isDatabaseCredential = fieldLabel.toLowerCase().includes('database') || 
                               nodeType?.toLowerCase().includes('postgres') ||
                               nodeType?.toLowerCase().includes('mysql') ||
                               nodeType?.toLowerCase().includes('mongo') ||
                               nodeType?.toLowerCase().includes('sql') ||
                               nodeType?.toLowerCase().includes('timescale') ||
                               nodeType?.toLowerCase().includes('database');
  
  if (isDatabaseCredential) {
    return {
      title: 'How to get DATABASE CREDENTIALS?',
      steps: [
        'Step 1: Identify Your Database Type',
        '   Determine which database you\'re using:',
        '   • PostgreSQL / TimescaleDB',
        '   • MySQL / MariaDB',
        '   • MongoDB',
        '   • Microsoft SQL Server',
        '   • SQLite',
        '   • Other (Redis, Cassandra, etc.)',
        '',
        'Step 2: Access Database Management Interface',
        '   For Cloud Databases (AWS RDS, Google Cloud SQL, Azure):',
        '   • Log in to your cloud provider console',
        '   • Navigate to Database Services section',
        '   • Select your database instance',
        '   • Go to "Connection" or "Credentials" tab',
        '',
        '   For Self-Hosted Databases:',
        '   • Connect via database client (pgAdmin, MySQL Workbench, etc.)',
        '   • Or access via command line (psql, mysql, mongo)',
        '   • Or check your application configuration files',
        '',
        'Step 3: Locate Connection Credentials',
        '   You need these details:',
        '   • Host/Server: Database server address (e.g., localhost, db.example.com)',
        '   • Port: Database port number (PostgreSQL: 5432, MySQL: 3306, MongoDB: 27017)',
        '   • Database Name: Specific database to connect to',
        '   • Username: Database user account name',
        '   • Password: Database user password',
        '',
        'Step 4: Get Username and Password',
        '   For New Databases:',
        '   • Create user: CREATE USER myuser WITH PASSWORD \'mypassword\';',
        '   • Grant permissions: GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;',
        '',
        '   For Existing Databases:',
        '   • Check with your database administrator',
        '   • Review application configuration files (.env, config.yml)',
        '   • Check cloud provider\'s credential management',
        '',
        'Step 5: For Cloud Databases',
        '   AWS RDS:',
        '   • Go to RDS Dashboard → Your Database → Configuration',
        '   • Master username and password are set during creation',
        '   • Or use IAM database authentication',
        '',
        '   Google Cloud SQL:',
        '   • Go to SQL → Your Instance → Users',
        '   • Create or view existing users',
        '   • Reset password if needed',
        '',
        '   Azure SQL Database:',
        '   • Go to SQL Server → Your Server → SQL databases',
        '   • Use server admin credentials or create contained database users',
        '',
        'Step 6: Security Best Practices',
        '   • Use strong, unique passwords',
        '   • Create dedicated users with minimal required permissions',
        '   • Never use root/admin accounts for applications',
        '   • Store credentials in environment variables or secret managers',
        '   • Enable SSL/TLS encryption for connections',
        '   • Rotate credentials regularly',
        '',
        'Step 7: Enter Credentials',
        '   • Copy each credential value exactly as shown',
        '   • Usernames and database names are often case-sensitive',
        '   • Passwords may contain special characters - copy carefully',
        '   • Test connection before saving',
        '',
        '⚠️ Security Warning:',
        '   Never commit database credentials to version control.',
        '   Use environment variables or secure vaults for production.'
      ],
      securityWarning: true
    };
  }
  
  // Generic credential guide for non-database credentials
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Access your service provider\'s account settings or developer portal',
      'Step 2: Look for "Security", "Authentication", or "Credentials" section',
      'Step 3: Depending on the service, you may need:',
      '   • Username and Password',
      '   • OAuth tokens',
      '   • API keys',
      '   • Service account credentials',
      'Step 4: Follow the service\'s specific authentication setup process',
      'Step 5: For OAuth: Authorize the application and copy the access token',
      'Step 6: For service accounts: Download the JSON key file or copy credentials',
      'Step 7: Store credentials securely - use environment variables or secure vaults when possible',
      '',
      '⚠️ Do not expose this value on frontend. Store it securely.'
    ],
    securityWarning: true
  };
}

function generateDatabaseGuide(fieldKey: string, fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Access your database management interface (phpMyAdmin, pgAdmin, MongoDB Compass, etc.)',
      'Step 2: List all available databases',
      'Step 3: Select the database name you want to use',
      'Step 4: Copy the exact database name (case-sensitive for some databases)',
      'Step 5: Ensure the database exists and you have proper permissions',
      'Step 6: Paste the database name into the input field',
      '',
      'Example:',
      'my_workflow_db'
    ],
    example: 'my_workflow_db'
  };
}

function generateHostGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Identify your server or service hostname',
      'Step 2: For cloud services: Check your service dashboard for the host address',
      'Step 3: Common formats:',
      '   • IP address: 192.168.1.100',
      '   • Domain: db.example.com',
      '   • Localhost: localhost or 127.0.0.1',
      'Step 4: For databases: Usually found in your database provider\'s connection details',
      'Step 5: Copy the hostname or IP address',
      'Step 6: Paste it into the input field (do not include protocol or port)',
      '',
      'Example:',
      'db.example.com'
    ],
    example: 'db.example.com'
  };
}

function generatePortGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Identify the service you\'re connecting to',
      'Step 2: Common default ports:',
      '   • HTTP: 80',
      '   • HTTPS: 443',
      '   • PostgreSQL: 5432',
      '   • MySQL: 3306',
      '   • MongoDB: 27017',
      '   • Redis: 6379',
      'Step 3: Check your service provider\'s documentation for the correct port',
      'Step 4: For custom installations: Check your server configuration',
      'Step 5: Enter the port number (usually a number between 1-65535)',
      '',
      'Example:',
      '5432'
    ],
    example: '5432'
  };
}

function generateModelGuide(nodeType: string, fieldLabel: string): FieldGuide {
  return {
    title: `How to select ${fieldLabel}?`,
    steps: [
      'Step 1: Review available models in the dropdown menu',
      'Step 2: Consider your use case:',
      '   • GPT-4o: Most capable, best for complex tasks',
      '   • GPT-4o Mini: Faster and cheaper, good for simple tasks',
      '   • Claude 3.5 Sonnet: Best for analysis and reasoning',
      '   • Gemini 2.5 Flash: Efficient and cost-effective',
      'Step 3: Check model availability in your API plan',
      'Step 4: Consider cost vs. performance trade-offs',
      'Step 5: Select the model from the dropdown',
      '',
      'Note: Model availability depends on your API provider and plan.'
    ]
  };
}

function generatePromptGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to write ${fieldLabel}?`,
    steps: [
      'Step 1: Define the AI\'s role and behavior clearly',
      'Step 2: Specify the input format and expected output format',
      'Step 3: Include constraints and rules (e.g., "Always return JSON")',
      'Step 4: Add examples if helpful for the AI to understand the task',
      'Step 5: Be specific about what the AI should NOT do',
      'Step 6: Test your prompt with sample inputs',
      'Step 7: Refine based on results',
      '',
      'Tip: Good prompts are clear, specific, and include examples.'
    ]
  };
}

function generateJSONGuide(fieldLabel: string, placeholder?: string): FieldGuide {
  return {
    title: `How to format ${fieldLabel}?`,
    steps: [
      'Step 1: Ensure valid JSON syntax (use double quotes, proper commas)',
      'Step 2: Follow the expected structure shown in the placeholder',
      'Step 3: Use a JSON validator if unsure (jsonlint.com)',
      'Step 4: For arrays: Use square brackets []',
      'Step 5: For objects: Use curly braces {}',
      'Step 6: All keys must be strings (in double quotes)',
      'Step 7: Values can be strings, numbers, booleans, arrays, or objects',
      '',
      'Example:',
      placeholder || '{"key": "value", "number": 123, "array": [1, 2, 3]}'
    ],
    example: placeholder || '{"key": "value", "number": 123, "array": [1, 2, 3]}'
  };
}

function generateCronGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to create ${fieldLabel}?`,
    url: 'https://crontab.guru',
    steps: [
      'Step 1: Understand cron format: minute hour day month weekday',
      'Step 2: Use https://crontab.guru to build and test cron expressions',
      'Step 3: Common examples:',
      '   • Every minute: * * * * *',
      '   • Every hour: 0 * * * *',
      '   • Daily at 9 AM: 0 9 * * *',
      '   • Weekly on Monday: 0 9 * * 1',
      '   • Monthly on 1st: 0 9 1 * *',
      'Step 4: Test your expression using the crontab.guru website',
      'Step 5: Paste the cron expression into the field',
      '',
      'Example:',
      '0 9 * * * (Daily at 9 AM)'
    ],
    example: '0 9 * * *'
  };
}

function generateTimeGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to set ${fieldLabel}?`,
    steps: [
      'Step 1: Use 24-hour format (HH:MM)',
      'Step 2: Enter hours (00-23) and minutes (00-59)',
      'Step 3: Examples:',
      '   • 09:00 = 9:00 AM',
      '   • 14:30 = 2:30 PM',
      '   • 23:59 = 11:59 PM',
      'Step 4: Use the time picker or type directly',
      '',
      'Example:',
      '09:00'
    ],
    example: '09:00'
  };
}

function generateTemperatureGuide(): FieldGuide {
  return {
    title: 'How to set Temperature?',
    steps: [
      'Step 1: Understand temperature range: 0.0 to 2.0',
      'Step 2: Lower values (0.0-0.3): More deterministic, focused responses',
      'Step 3: Medium values (0.4-0.7): Balanced creativity and consistency',
      'Step 4: Higher values (0.8-2.0): More creative, varied responses',
      'Step 5: Recommended settings:',
      '   • Summarization/Extraction: 0.3-0.5',
      '   • General tasks: 0.5-0.7',
      '   • Creative writing: 0.7-1.2',
      'Step 6: Start with default (0.5) and adjust based on results',
      '',
      'Example:',
      '0.5'
    ],
    example: '0.5'
  };
}

function generateNumberGuide(fieldLabel: string, placeholder?: string): FieldGuide {
  return {
    title: `How to set ${fieldLabel}?`,
    steps: [
      'Step 1: Enter a numeric value',
      'Step 2: Check the field description for valid range or constraints',
      'Step 3: Use whole numbers (integers) or decimals as appropriate',
      'Step 4: Do not include commas or currency symbols',
      'Step 5: For percentages: Enter as decimal (e.g., 0.5 for 50%)',
      '',
      'Example:',
      placeholder || '100'
    ],
    example: placeholder || '100'
  };
}

function generateTextareaGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to fill ${fieldLabel}?`,
    steps: [
      'Step 1: Read the field description to understand what\'s expected',
      'Step 2: Enter your text in the textarea',
      'Step 3: You can use multiple lines for better readability',
      'Step 4: Check for any formatting requirements',
      'Step 5: Review your input before saving',
      '',
      'Tip: Use clear, descriptive text that explains your intent.'
    ]
  };
}

function generateFacebookAPIGuide(): FieldGuide {
  return {
    title: 'How to get Facebook API?',
    url: 'https://developers.facebook.com',
    steps: [
      'Step 1: Go to https://developers.facebook.com',
      'Step 2: Sign in with your Facebook account',
      'Step 3: Click "My Apps" in the top right',
      'Step 4: Click "Create App" or select an existing app',
      'Step 5: Choose app type: "Business" or "Other"',
      'Step 6: Fill in app details (name, contact email)',
      'Step 7: Go to "Settings" → "Basic"',
      'Step 8: Copy your "App ID" and "App Secret"',
      'Step 9: Add products you need (Facebook Login, Pages API, etc.)',
      'Step 10: Go to "Tools" → "Graph API Explorer"',
      'Step 11: Select your app and generate an access token',
      'Step 12: For Page access: Select your Page and generate Page Access Token',
      '',
      'Example App ID:',
      '1234567890123456',
      '',
      '⚠️ Keep your App Secret secure. Never expose it publicly.'
    ],
    example: '1234567890123456',
    securityWarning: true
  };
}

function generateInstagramAPIGuide(): FieldGuide {
  return {
    title: 'How to get Instagram API?',
    url: 'https://developers.facebook.com',
    steps: [
      'Step 1: Go to https://developers.facebook.com',
      'Step 2: Sign in with your Facebook account',
      'Step 3: Create or select a Facebook App',
      'Step 4: Add "Instagram Graph API" product to your app',
      'Step 5: Go to "Settings" → "Basic" and note your App ID',
      'Step 6: Connect your Instagram Business Account:',
      '   • Your Instagram account must be a Business or Creator account',
      '   • Link it to a Facebook Page',
      'Step 7: Go to "Tools" → "Graph API Explorer"',
      'Step 8: Select your app and Instagram Business Account',
      'Step 9: Add permissions: instagram_basic, instagram_content_publish',
      'Step 10: Click "Generate Access Token"',
      'Step 11: Copy the access token',
      'Step 12: Get your Instagram Business Account ID:',
      '   • Query: GET /me/accounts → Get your Page ID',
      '   • Query: GET /{page-id}?fields=instagram_business_account',
      '   • Copy the "instagram_business_account.id" value',
      '',
      'Example Access Token:',
      'EAAG...',
      '',
      '⚠️ Keep your access token secure. Never expose it publicly.'
    ],
    example: 'EAAG...',
    securityWarning: true
  };
}

function generateTwitterAPIGuide(): FieldGuide {
  return {
    title: 'How to get Twitter API URL?',
    url: 'https://developer.twitter.com',
    steps: [
      'Step 1: Go to https://developer.twitter.com',
      'Step 2: Sign in with your Twitter/X account',
      'Step 3: Apply for Developer Access (if not already approved)',
      'Step 4: Go to "Developer Portal" → "Projects & Apps"',
      'Step 5: Create a new Project or select existing',
      'Step 6: Create a new App within the project',
      'Step 7: The Twitter API base URLs are:',
      '   • API v2: https://api.twitter.com/2',
      '   • API v1.1: https://api.twitter.com/1.1',
      'Step 8: For most workflows, use API v2: https://api.twitter.com/2',
      'Step 9: Common endpoints:',
      '   • Tweets: /2/tweets',
      '   • Users: /2/users',
      '   • Search: /2/tweets/search/recent',
      'Step 10: Full endpoint format: https://api.twitter.com/2/{endpoint}',
      'Step 11: You need API credentials (API Key, Secret, Access Token)',
      'Step 12: Get credentials from: Developer Portal → Projects & Apps → Keys and tokens',
      '',
      'Example Base URL (v2):',
      'https://api.twitter.com/2',
      '',
      'Example Base URL (v1.1):',
      'https://api.twitter.com/1.1',
      '',
      '⚠️ Keep all credentials secure. Never expose them publicly.'
    ],
    example: 'https://api.twitter.com/2',
    securityWarning: true
  };
}

function generateFacebookPageTokenGuide(): FieldGuide {
  return {
    title: 'How to get Facebook Page Access Token?',
    url: 'https://developers.facebook.com',
    steps: [
      'Step 1: Go to https://developers.facebook.com',
      'Step 2: Sign in with your Facebook account',
      'Step 3: Create or select an App',
      'Step 4: Add "Facebook Login" product to your app',
      'Step 5: Go to "Tools" → "Graph API Explorer"',
      'Step 6: Select your app from the dropdown',
      'Step 7: Select your Page from the "User or Page" dropdown',
      'Step 8: Select required permissions:',
      '   • pages_manage_posts (to create posts)',
      '   • pages_read_engagement (to read engagement)',
      '   • pages_show_list (to list pages)',
      'Step 9: Click "Generate Access Token"',
      'Step 10: Copy the Page Access Token immediately',
      'Step 11: For long-lived tokens:',
      '   • Use the token to exchange for a long-lived token',
      '   • Query: GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}',
      'Step 12: Paste the token into the input field',
      '',
      'Example Token Format:',
      'EAAG...',
      '',
      '⚠️ Keep your Page Access Token secure. Never expose it publicly.'
    ],
    example: 'EAAG...',
    securityWarning: true
  };
}

function generateFacebookGraphAPIGuide(): FieldGuide {
  return {
    title: 'How to get Facebook Graph API URL?',
    url: 'https://developers.facebook.com/docs/graph-api',
    steps: [
      'Step 1: Go to https://developers.facebook.com/docs/graph-api',
      'Step 2: Read the documentation to understand the API structure',
      'Step 3: The base URL for Facebook Graph API is:',
      '   https://graph.facebook.com',
      'Step 4: Add API version to the URL:',
      '   https://graph.facebook.com/v18.0',
      '   (Replace v18.0 with the latest version number)',
      'Step 5: To find the latest version:',
      '   • Check the documentation header for "Current Version"',
      '   • Or use: https://graph.facebook.com/v18.0 (check docs for latest)',
      'Step 6: For specific endpoints, add the path:',
      '   • Pages: /me/accounts or /{page-id}',
      '   • Posts: /{page-id}/posts',
      '   • User: /me',
      'Step 7: Full endpoint example:',
      '   https://graph.facebook.com/v18.0/me/accounts',
      'Step 8: You need an access token to use the API',
      'Step 9: Get access token:',
      '   • Go to developers.facebook.com',
      '   • Tools → Graph API Explorer',
      '   • Select your app and generate token',
      '',
      'Example Base URL:',
      'https://graph.facebook.com/v18.0',
      '',
      'Example Full Endpoint:',
      'https://graph.facebook.com/v18.0/me/accounts'
    ],
    example: 'https://graph.facebook.com/v18.0'
  };
}

function generateInstagramAPIDocsGuide(): FieldGuide {
  return {
    title: 'How to get Instagram API URL?',
    url: 'https://developers.facebook.com/docs/instagram-api',
    steps: [
      'Step 1: Go to https://developers.facebook.com/docs/instagram-api',
      'Step 2: Instagram uses Facebook Graph API',
      'Step 3: Base URL: https://graph.facebook.com',
      'Step 4: Instagram endpoints use: https://graph.facebook.com/v18.0/{instagram-business-account-id}/...',
      'Step 5: To get your Instagram Business Account ID:',
      '   • Go to Graph API Explorer',
      '   • Query: GET /me/accounts → Get your Page ID',
      '   • Query: GET /{page-id}?fields=instagram_business_account',
      '   • Copy the "instagram_business_account.id"',
      'Step 6: Example endpoint: https://graph.facebook.com/v18.0/{account-id}/media',
      'Step 7: You need an access token with instagram_basic permission',
      'Step 8: Get token from: developers.facebook.com → Tools → Graph API Explorer',
      '',
      'Example Base URL:',
      'https://graph.facebook.com/v18.0',
      '',
      'Example Endpoint:',
      'https://graph.facebook.com/v18.0/{instagram-business-account-id}/media'
    ],
    example: 'https://graph.facebook.com/v18.0'
  };
}

function generateTwitterAPIDocsGuide(): FieldGuide {
  return {
    title: 'How to get Twitter API URL?',
    url: 'https://developer.twitter.com/en/docs',
    steps: [
      'Step 1: Go to https://developer.twitter.com/en/docs',
      'Step 2: Twitter API v2 base URL: https://api.twitter.com/2',
      'Step 3: Twitter API v1.1 base URL: https://api.twitter.com/1.1',
      'Step 4: For most workflows, use API v2: https://api.twitter.com/2',
      'Step 5: Common endpoints:',
      '   • Tweets: /2/tweets',
      '   • Users: /2/users',
      '   • Search: /2/tweets/search/recent',
      'Step 6: Full endpoint format: https://api.twitter.com/2/{endpoint}',
      'Step 7: You need API credentials (API Key, Secret, Access Token)',
      'Step 8: Get credentials from: developer.twitter.com → Developer Portal → Projects & Apps',
      '',
      'Example Base URL (v2):',
      'https://api.twitter.com/2',
      '',
      'Example Endpoint:',
      'https://api.twitter.com/2/tweets'
    ],
    example: 'https://api.twitter.com/2'
  };
}

function generateDocumentationURLGuide(fieldLabel: string, placeholder?: string): FieldGuide {
  // Extract service name from URL if possible
  const url = placeholder || fieldLabel;
  let serviceName = 'the service';
  
  if (url.includes('facebook')) serviceName = 'Facebook';
  else if (url.includes('instagram')) serviceName = 'Instagram';
  else if (url.includes('twitter')) serviceName = 'Twitter';
  else if (url.includes('google')) serviceName = 'Google';
  else if (url.includes('github')) serviceName = 'GitHub';
  else if (url.includes('slack')) serviceName = 'Slack';
  
  return {
    title: `How to get ${fieldLabel}?`,
    url: url.includes('http') ? url : undefined,
    steps: [
      `Step 1: Go to ${url.includes('http') ? url : 'the documentation URL'}`,
      'Step 2: This is the official API documentation',
      'Step 3: Read the documentation to find:',
      '   • Base API URL (usually in "Getting Started" or "Quick Start")',
      '   • Endpoint URLs for specific operations',
      '   • Authentication requirements',
      'Step 4: Look for sections like:',
      '   • "Base URL" or "API Endpoint"',
      '   • "Authentication" or "Getting Started"',
      '   • "Endpoints" or "API Reference"',
      'Step 5: Copy the base URL or specific endpoint URL',
      'Step 6: Note any required parameters or authentication',
      'Step 7: Test the URL in a browser or API client',
      '',
      `Example: Check ${serviceName} documentation for the exact URL format`
    ],
    example: url.includes('http') ? url : undefined
  };
}

function generateContentRepositoryGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Choose your content repository service:',
      '   • Google Drive: drive.google.com',
      '   • Dropbox: dropbox.com',
      '   • OneDrive: onedrive.live.com',
      '   • Other cloud storage services',
      '',
      'For Google Drive:',
      'Step 2: Go to https://console.cloud.google.com',
      'Step 3: Create or select a project',
      'Step 4: Enable "Google Drive API"',
      'Step 5: Go to "Credentials" → "Create Credentials"',
      'Step 6: Choose "OAuth client ID" or "Service Account"',
      'Step 7: For OAuth: Configure consent screen and get Client ID/Secret',
      'Step 8: For Service Account: Download JSON key file',
      'Step 9: Copy credentials or upload JSON file',
      '',
      'For Dropbox:',
      'Step 2: Go to https://dropbox.com/developers',
      'Step 3: Sign in and go to "App Console"',
      'Step 4: Click "Create app"',
      'Step 5: Choose app type (Scoped access recommended)',
      'Step 6: Set app name and permissions',
      'Step 7: Go to "Settings" → "OAuth 2"',
      'Step 8: Generate access token or use OAuth flow',
      'Step 9: Copy the access token',
      '',
      'Example (Google Drive Client ID):',
      '123456789-abcdefghijklmnop.apps.googleusercontent.com',
      '',
      '⚠️ Keep credentials secure. Use OAuth for user data access.'
    ],
    example: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
    securityWarning: true
  };
}

function generateSpreadsheetIDGuide(): FieldGuide {
  return {
    title: 'How to get Google Sheets Spreadsheet ID?',
    url: 'https://docs.google.com/spreadsheets',
    steps: [
      'Step 1: Open your Google Sheet in a web browser',
      'Step 2: Look at the URL in your browser address bar',
      'Step 3: The URL format is:',
      '   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit',
      'Step 4: Copy the SPREADSHEET_ID (the long string between /d/ and /edit)',
      'Step 5: Example:',
      '   URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      '   Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      'Step 6: Paste the ID into the input field',
      '',
      'Example:',
      '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    ],
    example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  };
}

function generateWebhookURLGuide(nodeType: string, fieldLabel: string): FieldGuide {
  const serviceGuides: Record<string, FieldGuide> = {
    slack_message: {
      title: 'How to get Slack Webhook URL?',
      url: 'https://api.slack.com/apps',
      steps: [
        'Step 1: Go to https://api.slack.com/apps',
        'Step 2: Sign in with your Slack workspace',
        'Step 3: Click "Create New App" or select existing app',
        'Step 4: Choose "From scratch"',
        'Step 5: Enter app name and select workspace',
        'Step 6: Go to "Incoming Webhooks" in left sidebar',
        'Step 7: Toggle "Activate Incoming Webhooks" to ON',
        'Step 8: Click "Add New Webhook to Workspace"',
        'Step 9: Select the channel where messages should be posted',
        'Step 10: Click "Allow"',
        'Step 11: Copy the Webhook URL (starts with https://hooks.slack.com/services/)',
        'Step 12: Paste it into the input field',
        '',
        'Example format:',
        '[YOUR_SLACK_WEBHOOK_URL] - Format: https://hooks.slack.com/services/...',
        '',
        '⚠️ Keep your webhook URL secure. Anyone with this URL can post to your Slack channel.'
      ],
      example: '[YOUR_SLACK_WEBHOOK_URL]',
      securityWarning: true
    },
    discord_webhook: {
      title: 'How to get Discord Webhook URL?',
      url: 'https://discord.com',
      steps: [
        'Step 1: Open Discord app or web',
        'Step 2: Go to your server',
        'Step 3: Right-click on the channel where you want messages',
        'Step 4: Select "Edit Channel" or "Channel Settings"',
        'Step 5: Go to "Integrations" tab',
        'Step 6: Click "Webhooks" → "New Webhook"',
        'Step 7: Give it a name (e.g., "Workflow Bot")',
        'Step 8: Click "Copy Webhook URL"',
        'Step 9: Paste it into the input field',
        '',
        'Example:',
        'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz',
        '',
        '⚠️ Keep your webhook URL secure. Anyone with this URL can post to your Discord channel.'
      ],
      example: 'https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz',
      securityWarning: true
    }
  };

  return serviceGuides[nodeType] || {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Identify where you want to receive webhook data',
      'Step 2: Use your server\'s public URL',
      'Step 3: For production: Use your server\'s public URL',
      'Step 4: The webhook URL format is: https://your-domain.com/webhook/endpoint',
      'Step 5: Copy the complete URL including protocol (http:// or https://)',
      'Step 6: Paste it into the service that will send webhooks to you',
      'Step 7: Test the webhook to verify it\'s working',
      '',
      'Example:',
      'https://api.example.com/webhook/receive',
      '',
      '⚠️ Keep your webhook URL secure.'
    ],
    example: 'https://api.example.com/webhook/receive',
    securityWarning: true
  };
}

function generatePageIDGuide(nodeType: string): FieldGuide {
  if (nodeType === 'facebook') {
    return {
      title: 'How to get Facebook Page ID?',
      url: 'https://developers.facebook.com',
      steps: [
        'Step 1: Go to your Facebook Page',
        'Step 2: Click "About" in the left sidebar',
        'Step 3: Scroll down to find "Page ID"',
        'Step 4: Or use Graph API Explorer:',
        '   • Go to developers.facebook.com → Tools → Graph API Explorer',
        '   • Query: GET /me/accounts',
        '   • Find your page and copy the "id" field',
        'Step 5: Alternative method:',
        '   • View page source (Ctrl+U)',
        '   • Search for "page_id"',
        '   • Copy the numeric ID',
        '',
        'Example:',
        '123456789012345'
      ],
      example: '123456789012345'
    };
  }
  
  return {
    title: 'How to get Page ID?',
    steps: [
      'Step 1: Go to the service\'s dashboard or admin panel',
      'Step 2: Navigate to your page/profile settings',
      'Step 3: Look for "Page ID", "Profile ID", or "Account ID"',
      'Step 4: Copy the ID (usually a numeric string)',
      'Step 5: Paste it into the input field',
      '',
      'Tip: Check the service\'s API documentation for specific instructions.'
    ]
  };
}

function generateAccountIDGuide(nodeType: string): FieldGuide {
  if (nodeType === 'instagram') {
    return {
      title: 'How to get Instagram Business Account ID?',
      url: 'https://developers.facebook.com',
      steps: [
        'Step 1: Go to https://developers.facebook.com',
        'Step 2: Go to Tools → Graph API Explorer',
        'Step 3: Select your app and generate an access token',
        'Step 4: Query: GET /me/accounts',
        'Step 5: Find your Facebook Page and copy the Page ID',
        'Step 6: Query: GET /{page-id}?fields=instagram_business_account',
        'Step 7: Copy the "instagram_business_account.id" value',
        'Step 8: Paste it into the input field',
        '',
        'Example:',
        '17841405309211844'
      ],
      example: '17841405309211844'
    };
  }
  
  return {
    title: 'How to get Account ID?',
    steps: [
      'Step 1: Go to the service\'s dashboard or admin panel',
      'Step 2: Navigate to account settings or API settings',
      'Step 3: Look for "Account ID", "User ID", or "Business Account ID"',
      'Step 4: Copy the ID',
      'Step 5: Paste it into the input field',
      '',
      'Tip: Check the service\'s API documentation for specific instructions.'
    ]
  };
}

function generateShopDomainGuide(): FieldGuide {
  return {
    title: 'How to get Shopify Shop Domain?',
    url: 'https://admin.shopify.com',
    steps: [
      'Step 1: Log in to your Shopify Admin panel',
      'Step 2: Go to https://admin.shopify.com',
      'Step 3: Look at the URL in your browser address bar',
      'Step 4: The format is: admin.shopify.com/store/YOUR_SHOP',
      'Step 5: Or go to Settings → General → Store details',
      'Step 6: Find "Store address" or "Primary domain"',
      'Step 7: Copy the domain (e.g., "mystore.myshopify.com")',
      'Step 8: Do NOT include "https://" or "www"',
      'Step 9: Paste it into the input field',
      '',
      'Example:',
      'mystore.myshopify.com'
    ],
    example: 'mystore.myshopify.com'
  };
}

function generateIDGuide(resourceType: string, resourceKey: string): FieldGuide {
  return {
    title: `How to get ${resourceType} ID?`,
    steps: [
      `Step 1: Go to the ${resourceType.toLowerCase()} in your dashboard`,
      `Step 2: Open the ${resourceType.toLowerCase()} details page`,
      `Step 3: Look for "${resourceType} ID" in the URL or details`,
      `Step 4: The ID is usually in the URL format:`,
      `   .../${resourceKey}s/ID or .../${resourceKey}/ID`,
      `Step 5: Copy the ID (numeric or alphanumeric string)`,
      `Step 6: Or get it from API response when creating/listing ${resourceType.toLowerCase()}s`,
      `Step 7: Paste it into the input field`,
      '',
      `Example ${resourceType} ID:`,
      resourceType === 'Product' ? 'gid://shopify/Product/123456789' : '123456789'
    ],
    example: resourceType === 'Product' ? 'gid://shopify/Product/123456789' : '123456789'
  };
}

function generateExpressionGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to write ${fieldLabel}?`,
    steps: [
      'Step 1: Use template expressions to reference data from previous nodes',
      'Step 2: Format: {{input.fieldName}} or {{$json.fieldName}}',
      'Step 3: Examples:',
      '   • {{input.name}} - Get "name" from input',
      '   • {{input.user.email}} - Get nested field',
      '   • {{$json.items[0].title}} - Get first item title',
      'Step 4: For arrays: {{input.items}}',
      'Step 5: For conditions: Use JavaScript expressions',
      'Step 6: Test your expression to ensure it works',
      '',
      'Example:',
      '{{input.userName}}'
    ],
    example: '{{input.userName}}'
  };
}

function generateConditionGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to write ${fieldLabel}?`,
    steps: [
      'Step 1: Write a JavaScript expression that returns true or false',
      'Step 2: Use template variables: {{input.fieldName}}',
      'Step 3: Comparison operators: ===, !==, >, <, >=, <=',
      'Step 4: Logical operators: && (AND), || (OR), ! (NOT)',
      'Step 5: Examples:',
      '   • {{input.status}} === "active"',
      '   • {{input.age}} >= 18',
      '   • {{input.count}} > 10 && {{input.enabled}} === true',
      'Step 6: For arrays: item.fieldName (in filter/loop contexts)',
      'Step 7: Test your condition to ensure it works correctly',
      '',
      'Example:',
      '{{input.status}} === "active"'
    ],
    example: '{{input.status}} === "active"'
  };
}

function generateArrayGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Use a template expression that returns an array',
      'Step 2: Format: {{input.arrayField}}',
      'Step 3: The expression should reference data from a previous node',
      'Step 4: Examples:',
      '   • {{input.items}} - Get items array',
      '   • {{input.users}} - Get users array',
      'Step 5: Ensure the previous node outputs an array',
      'Step 6: Test to verify the array is correctly formatted',
      '',
      'Example:',
      '{{input.items}}'
    ],
    example: '{{input.items}}'
  };
}

function generateEmailGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to enter ${fieldLabel}?`,
    steps: [
      'Step 1: Enter a valid email address',
      'Step 2: Format: username@domain.com',
      'Step 3: Examples:',
      '   • john@example.com',
      '   • user.name@company.co.uk',
      '   • test+tag@domain.com',
      'Step 4: Must include @ symbol',
      'Step 5: Domain must have a valid TLD (.com, .org, etc.)',
      'Step 6: No spaces allowed',
      '',
      'Example:',
      'user@example.com'
    ],
    example: 'user@example.com'
  };
}

function generatePhoneGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to enter ${fieldLabel}?`,
    steps: [
      'Step 1: Enter phone number with country code',
      'Step 2: Format: +[country code][number]',
      'Step 3: Examples:',
      '   • +1234567890 (US)',
      '   • +441234567890 (UK)',
      '   • +911234567890 (India)',
      'Step 4: Include + prefix for international format',
      'Step 5: No spaces, dashes, or parentheses needed',
      'Step 6: Country code is required for international numbers',
      '',
      'Example:',
      '+1234567890'
    ],
    example: '+1234567890'
  };
}

function generateNameGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to enter ${fieldLabel}?`,
    steps: [
      'Step 1: Enter the name as it should appear',
      'Step 2: Can be a person name, company name, or identifier',
      'Step 3: Examples:',
      '   • John Doe',
      '   • Acme Corporation',
      '   • Product Name',
      'Step 4: Use proper capitalization',
      'Step 5: Avoid special characters unless required',
      '',
      'Example:',
      'John Doe'
    ],
    example: 'John Doe'
  };
}

function generateTitleGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to enter ${fieldLabel}?`,
    steps: [
      'Step 1: Enter a clear, descriptive title',
      'Step 2: Keep it concise (typically 50-100 characters)',
      'Step 3: Use title case or sentence case',
      'Step 4: Examples:',
      '   • "New Product Launch"',
      '   • "Customer Support Request"',
      '   • "Monthly Report - January 2024"',
      'Step 5: Make it specific and meaningful',
      '',
      'Example:',
      'New Product Launch'
    ],
    example: 'New Product Launch'
  };
}

function generateDescriptionGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to write ${fieldLabel}?`,
    steps: [
      'Step 1: Write a clear description',
      'Step 2: Explain what this item is or what it does',
      'Step 3: Include relevant details',
      'Step 4: Keep it concise but informative',
      'Step 5: Use proper grammar and punctuation',
      'Step 6: Examples:',
      '   • "This workflow processes customer orders"',
      '   • "Automated email notification system"',
      '',
      'Example:',
      'This workflow processes customer orders and sends confirmation emails.'
    ],
    example: 'This workflow processes customer orders and sends confirmation emails.'
  };
}

function generateMessageGuide(fieldLabel: string): FieldGuide {
  return {
    title: `How to write ${fieldLabel}?`,
    steps: [
      'Step 1: Write your message content',
      'Step 2: Use clear, professional language',
      'Step 3: Include all necessary information',
      'Step 4: You can use template variables: {{input.fieldName}}',
      'Step 5: Examples:',
      '   • Plain text: "Hello, thank you for your order!"',
      '   • With variables: "Hello {{input.name}}, your order #{{input.orderId}} is ready."',
      'Step 6: For multi-line messages, use line breaks',
      '',
      'Example:',
      'Hello {{input.name}},\n\nThank you for your order!'
    ],
    example: 'Hello {{input.name}},\n\nThank you for your order!'
  };
}

function generateSlackWebhookGuide(): FieldGuide {
  return {
    title: 'How to get Slack Webhook URL?',
    url: 'https://api.slack.com/apps',
    steps: [
      'Step 1: Go to https://api.slack.com/apps',
      'Step 2: Sign in with your Slack workspace',
      'Step 3: Click "Create New App" or select an existing app',
      'Step 4: Choose "From scratch"',
      'Step 5: Enter app name and select workspace',
      'Step 6: Go to "Incoming Webhooks" in left sidebar',
      'Step 7: Toggle "Activate Incoming Webhooks" to ON',
      'Step 8: Click "Add New Webhook to Workspace"',
      'Step 9: Select the channel where messages should be posted',
      'Step 10: Click "Allow"',
      'Step 11: Copy the Webhook URL (starts with https://hooks.slack.com/services/)',
      'Step 12: Paste it into the input field',
      '',
      'Example format:',
      'https://hooks.slack.com/services/YOUR-WORKSPACE-ID/YOUR-CHANNEL-ID/YOUR-WEBHOOK-TOKEN',
      '',
      '⚠️ Keep your webhook URL secure. Anyone with this URL can post to your Slack channel.'
    ],
    example: 'https://hooks.slack.com/services/YOUR-WORKSPACE-ID/YOUR-CHANNEL-ID/YOUR-WEBHOOK-TOKEN',
    securityWarning: true
  };
}

function generateGoogleOAuthClientIDGuide(): FieldGuide {
  return {
    title: 'How to get Google OAuth Client ID?',
    url: 'https://console.cloud.google.com',
    steps: [
      'Step 1: Go to https://console.cloud.google.com',
      'Step 2: Sign in with your Google account',
      'Step 3: Create a new project or select an existing project',
      'Step 4: Click "APIs & Services" → "Credentials"',
      'Step 5: Click "Create Credentials" → "OAuth client ID"',
      'Step 6: If prompted, configure the OAuth consent screen:',
      '   • Choose "External" (unless you have Google Workspace)',
      '   • Fill in app name, user support email, developer contact',
      '   • Add scopes (e.g., https://www.googleapis.com/auth/spreadsheets)',
      '   • Add test users if needed',
      'Step 7: Back in Credentials, select "Web application" as application type',
      'Step 8: Enter a name for your OAuth client',
      'Step 9: Add authorized redirect URIs (if needed for your workflow)',
      'Step 10: Click "Create"',
      'Step 11: Copy the "Client ID" (long string ending in .apps.googleusercontent.com)',
      'Step 12: Paste it into the input field',
      '',
      'Example format:',
      '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
      '',
      '⚠️ Keep your Client ID and Secret secure. Do not expose them publicly.'
    ],
    example: '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
    securityWarning: true
  };
}

function generateGoogleOAuthSecretGuide(): FieldGuide {
  return {
    title: 'How to get Google OAuth Client Secret?',
    url: 'https://console.cloud.google.com',
    steps: [
      'Step 1: Go to https://console.cloud.google.com',
      'Step 2: Sign in with your Google account',
      'Step 3: Select your project',
      'Step 4: Click "APIs & Services" → "Credentials"',
      'Step 5: Find your OAuth 2.0 Client ID in the list',
      'Step 6: Click on the Client ID name to open details',
      'Step 7: Look for "Client secret" section',
      'Step 8: If secret is hidden, click "Show" or "Reveal"',
      'Step 9: Copy the Client Secret (long random string)',
      'Step 10: Paste it into the input field',
      '',
      'Note: If you don\'t see a secret, you may need to create a new OAuth client.',
      'The secret is only shown once when created - save it securely!',
      '',
      'Example format:',
      'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      '',
      '⚠️ Keep your Client Secret secure. Never expose it publicly or commit it to version control.'
    ],
    example: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    securityWarning: true
  };
}

function generateSMTPHostGuide(): FieldGuide {
  return {
    title: 'How to get SMTP Host?',
    steps: [
      'Step 1: Identify your email service provider',
      'Step 2: Common SMTP host addresses:',
      '   • Gmail: smtp.gmail.com',
      '   • Outlook/Hotmail: smtp-mail.outlook.com',
      '   • Yahoo: smtp.mail.yahoo.com',
      '   • Custom domain: Check with your email provider',
      'Step 3: For Gmail:',
      '   • Host: smtp.gmail.com',
      '   • Port: 587 (TLS) or 465 (SSL)',
      'Step 4: For Outlook:',
      '   • Host: smtp-mail.outlook.com',
      '   • Port: 587',
      'Step 5: For custom email (cPanel, etc.):',
      '   • Check your hosting provider\'s documentation',
      '   • Usually: mail.yourdomain.com or smtp.yourdomain.com',
      'Step 6: Enter the SMTP host address (without port number)',
      '',
      'Example:',
      'smtp.gmail.com'
    ],
    example: 'smtp.gmail.com'
  };
}

function generateSMTPUsernameGuide(): FieldGuide {
  return {
    title: 'How to get SMTP Username?',
    steps: [
      'Step 1: Use your full email address as the username',
      'Step 2: For Gmail:',
      '   • Username: your-email@gmail.com',
      '   • Or use App Password if 2FA is enabled',
      'Step 3: For Outlook/Hotmail:',
      '   • Username: your-email@outlook.com',
      'Step 4: For custom email:',
      '   • Username: your-email@yourdomain.com',
      '   • Or just the part before @ (check with your provider)',
      'Step 5: If using App Password (Gmail with 2FA):',
      '   • Go to Google Account → Security → 2-Step Verification',
      '   • Generate App Password',
      '   • Use the generated password as username (or email)',
      'Step 6: Enter your email address into the input field',
      '',
      'Example:',
      'your-email@gmail.com'
    ],
    example: 'your-email@gmail.com'
  };
}

function generateSMTPPasswordGuide(): FieldGuide {
  return {
    title: 'How to get SMTP Password?',
    steps: [
      'Step 1: For Gmail:',
      '   • If 2FA is enabled: Generate App Password',
      '   • Go to Google Account → Security → 2-Step Verification',
      '   • Click "App passwords"',
      '   • Select "Mail" and "Other (Custom name)"',
      '   • Enter "Workflow" as name',
      '   • Copy the 16-character password',
      '   • If 2FA is NOT enabled: Use your regular Gmail password',
      'Step 2: For Outlook/Hotmail:',
      '   • Use your Microsoft account password',
      '   • Or use App Password if 2FA is enabled',
      'Step 3: For custom email:',
      '   • Use your email account password',
      '   • Check with your hosting provider for specific requirements',
      'Step 4: Enter the password into the input field',
      '',
      '⚠️ Security Note:',
      '• Never share your password',
      '• Use App Passwords when 2FA is enabled',
      '• Store passwords securely (use environment variables)',
      '',
      'Example (Gmail App Password):',
      'abcd efgh ijkl mnop'
    ],
    example: 'abcd efgh ijkl mnop',
    securityWarning: true
  };
}

function generateSMTPGuide(): FieldGuide {
  return {
    title: 'How to configure SMTP?',
    steps: [
      'Step 1: Identify your email service provider',
      'Step 2: Get SMTP settings from your provider:',
      '   • SMTP Host (e.g., smtp.gmail.com)',
      '   • SMTP Port (usually 587 for TLS or 465 for SSL)',
      '   • Username (your email address)',
      '   • Password (your email password or App Password)',
      'Step 3: For Gmail:',
      '   • Host: smtp.gmail.com',
      '   • Port: 587',
      '   • Username: your-email@gmail.com',
      '   • Password: App Password (if 2FA enabled)',
      'Step 4: For Outlook:',
      '   • Host: smtp-mail.outlook.com',
      '   • Port: 587',
      '   • Username: your-email@outlook.com',
      '   • Password: Your Microsoft account password',
      'Step 5: Test the connection to verify settings are correct',
      '',
      '⚠️ Keep your SMTP credentials secure. Use environment variables in production.'
    ],
    securityWarning: true
  };
}

function generateGenericGuide(fieldLabel: string, fieldType: string): FieldGuide {
  // ✅ PRODUCTION: Null-safe string operations
  const normalizedLabel = fieldLabel?.toLowerCase?.() ?? "";
  const normalizedType = fieldType?.toLowerCase?.() ?? "";
  const lowerLabel = normalizedLabel;
  
  // Try to detect service from fieldLabel
  if (lowerLabel.includes('google sheets') || lowerLabel.includes('sheets')) {
    return {
      title: 'How to get Google Sheets API?',
      url: 'https://console.cloud.google.com',
      steps: [
        'Step 1: Go to https://console.cloud.google.com',
        'Step 2: Sign in with your Google account',
        'Step 3: Create a new project or select an existing project',
        'Step 4: Click "APIs & Services" → "Library"',
        'Step 5: Search for "Google Sheets API" and click "Enable"',
        'Step 6: Go to "APIs & Services" → "Credentials"',
        'Step 7: Click "Create Credentials" → "API Key"',
        'Step 8: Copy the API key and paste it into the input field',
        '',
        'Example format:',
        'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '',
        '⚠️ Keep your API key secure. Restrict it to specific APIs for security.'
      ],
      example: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      securityWarning: true
    };
  }
  
  // Check for Slack (general, not webhook)
  if (lowerLabel.includes('slack') && !lowerLabel.includes('webhook')) {
    // If it's a token field, use the detailed Bot Token guide
    // ✅ PRODUCTION: Use lowerLabel only (lowerKey not available in this function)
    if (lowerLabel.includes('token')) {
      return {
        title: 'How to get Slack Bot Token?',
        url: 'https://api.slack.com/apps',
        steps: [
          'Step 1: Go to https://api.slack.com/apps',
          'Step 2: Sign in with your Slack workspace account',
          'Step 3: Click "Create New App" button (or select an existing app)',
          'Step 4: Choose "From scratch" option',
          'Step 5: Enter an app name (e.g., "Workflow Bot") and select your workspace',
          'Step 6: Click "Create App"',
          'Step 7: In the left sidebar, click "OAuth & Permissions"',
          'Step 8: Scroll down to "Scopes" section → "Bot Token Scopes"',
          'Step 9: Click "Add an OAuth Scope" and add required scopes:',
          '   • chat:write (to send messages)',
          '   • channels:read (to read channel info)',
          '   • channels:history (to read message history, if needed)',
          'Step 10: Scroll up to the top of the page',
          'Step 11: Click "Install to Workspace" button',
          'Step 12: Review permissions and click "Allow" to authorize',
          'Step 13: After installation, you\'ll see "Bot User OAuth Token"',
          'Step 14: Click "Copy" next to the token (starts with xoxb-)',
          'Step 15: Paste the token into the input field above',
          '',
          'Token format:',
          'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
          '',
          '⚠️ Security Warning:',
          '• Keep your Bot Token secret - never share it publicly',
          '• If exposed, regenerate it immediately in Slack app settings',
          '• Use environment variables for production workflows'
        ],
        example: 'xoxb-XXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX',
        securityWarning: true
      };
    }
    // Otherwise use general Slack API guide
    return {
      title: 'How to get Slack API?',
      url: 'https://api.slack.com/apps',
      steps: [
        'Step 1: Go to https://api.slack.com/apps',
        'Step 2: Sign in with your Slack workspace',
        'Step 3: Click "Create New App" or select an existing app',
        'Step 4: Choose "From scratch" and enter app details',
        'Step 5: Go to "OAuth & Permissions" in left sidebar',
        'Step 6: Add required Bot Token Scopes (e.g., chat:write, channels:read)',
        'Step 7: Click "Install to Workspace" and authorize',
        'Step 8: Copy the "Bot User OAuth Token" (starts with xoxb-)',
        'Step 9: Paste it into the input field',
        '',
        'Example format:',
        'xoxb-YOUR-BOT-TOKEN-HERE',
        '',
        '⚠️ Keep your Bot Token secure. Never expose it publicly.'
      ],
      example: 'xoxb-YOUR-BOT-TOKEN-HERE',
      securityWarning: true
    };
  }
  
  return {
    title: `How to get ${fieldLabel}?`,
    steps: [
      'Step 1: Identify the service or platform you need credentials from',
      'Step 2: Go to the service\'s official developer portal or dashboard',
      'Step 3: Sign in with your account or create a new account',
      'Step 4: Navigate to "API Keys", "Credentials", or "Developer Settings"',
      'Step 5: Create a new API key, token, or credential',
      'Step 6: Give it a descriptive name (e.g., "Workflow Integration")',
      'Step 7: Select the required permissions or scopes',
      'Step 8: Copy the credential immediately - it may only be shown once',
      'Step 9: Paste it into the input field above',
      'Step 10: Test the connection to verify it works',
      '',
      `Field Type: ${fieldType}`,
      '',
      '💡 Tip: Check the service\'s official documentation for specific setup instructions.'
    ]
  };
}

