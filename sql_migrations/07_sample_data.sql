-- ============================================
-- SAMPLE DATA: Templates and Sample Workflows
-- ============================================
-- This file inserts pre-built workflow templates
-- Run this AFTER running DATABASE_SETUP.sql
-- Templates will be visible to all users
-- ============================================

-- ============================================
-- TEMPLATE 1: Simple AI Chatbot
-- ============================================
-- A basic chatbot that responds to user messages using AI
-- Perfect for customer support or FAQ automation
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Simple AI Chatbot',
  'A basic chatbot that responds to user messages using AI. Perfect for customer support or FAQ automation.',
  'AI Chatbots',
  'Beginner',
  5,
  ARRAY['chatbot', 'ai', 'customer-support', 'beginner'],
  '[
    {
      "id": "webhook_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Webhook",
        "type": "webhook",
        "category": "triggers",
        "icon": "Webhook",
        "config": { "method": "POST" }
      }
    },
    {
      "id": "gemini_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "AI Response",
        "type": "google_gemini",
        "category": "ai",
        "icon": "Gem",
        "config": {
          "apiKey": "",
          "prompt": "You are a helpful assistant. Respond to the user message: {{input.message}}",
          "memory": 10
        }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "webhook_1", "target": "gemini_1" }
  ]'::jsonb,
  true,
  true,
  1
);

-- ============================================
-- TEMPLATE 2: Email Notification System
-- ============================================
-- Send email notifications when triggered by webhook
-- Great for alerts, confirmations, or updates
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Email Notification System',
  'Send email notifications when triggered by webhook. Great for alerts, confirmations, or updates.',
  'Webhook Automation',
  'Beginner',
  5,
  ARRAY['email', 'notification', 'webhook', 'alerts'],
  '[
    {
      "id": "webhook_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Webhook",
        "type": "webhook",
        "category": "triggers",
        "icon": "Webhook",
        "config": { "method": "POST" }
      }
    },
    {
      "id": "formatter_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Format Email",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": {
          "template": "Subject: {{input.subject}}\n\n{{input.message}}\n\nFrom: {{input.from}}"
        }
      }
    },
    {
      "id": "email_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Send Email",
        "type": "email_resend",
        "category": "output",
        "icon": "Mail",
        "config": {
          "to": "{{input.to}}",
          "from": "{{input.from}}",
          "subject": "{{input.subject}}",
          "body": "{{input.message}}"
        }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "webhook_1", "target": "formatter_1" },
    { "id": "e2", "source": "formatter_1", "target": "email_1" }
  ]'::jsonb,
  true,
  true,
  1
);

-- ============================================
-- TEMPLATE 3: Data Processing Pipeline
-- ============================================
-- Process CSV data, transform it, and merge with other data sources
-- Perfect for data transformation tasks
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Data Processing Pipeline',
  'Process CSV data, transform it, and merge with other data sources. Perfect for data transformation tasks.',
  'Data Processing',
  'Intermediate',
  10,
  ARRAY['data', 'csv', 'transformation', 'processing'],
  '[
    {
      "id": "webhook_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Webhook",
        "type": "webhook",
        "category": "triggers",
        "icon": "Webhook",
        "config": { "method": "POST" }
      }
    },
    {
      "id": "csv_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Parse CSV",
        "type": "csv_processor",
        "category": "data",
        "icon": "Table",
        "config": { "delimiter": ",", "hasHeader": true }
      }
    },
    {
      "id": "js_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Transform Data",
        "type": "javascript",
        "category": "data",
        "icon": "Code",
        "config": {
          "code": "return input.csvData.map(row => ({ ...row, processed: true, timestamp: new Date().toISOString() }));"
        }
      }
    },
    {
      "id": "merge_1",
      "type": "custom",
      "position": { "x": 1000, "y": 200 },
      "data": {
        "label": "Merge Data",
        "type": "merge_data",
        "category": "data",
        "icon": "Combine",
        "config": { "mode": "merge" }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "webhook_1", "target": "csv_1" },
    { "id": "e2", "source": "csv_1", "target": "js_1" },
    { "id": "e3", "source": "js_1", "target": "merge_1" }
  ]'::jsonb,
  true,
  true,
  1
);

-- ============================================
-- TEMPLATE 4: Conditional Approval Flow
-- ============================================
-- Approve or reject requests based on conditions
-- Uses If/Else logic for decision making
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Conditional Approval Flow',
  'Approve or reject requests based on conditions. Uses If/Else logic for decision making.',
  'If-Else Logic',
  'Intermediate',
  8,
  ARRAY['approval', 'conditional', 'logic', 'if-else'],
  '[
    {
      "id": "webhook_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Webhook",
        "type": "webhook",
        "category": "triggers",
        "icon": "Webhook",
        "config": { "method": "POST" }
      }
    },
    {
      "id": "js_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Check Condition",
        "type": "javascript",
        "category": "data",
        "icon": "Code",
        "config": {
          "code": "return { approved: input.amount <= 1000, reason: input.amount <= 1000 ? \"Approved\" : \"Amount too high\" };"
        }
      }
    },
    {
      "id": "ifelse_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Approve?",
        "type": "if_else",
        "category": "logic",
        "icon": "GitBranch",
        "config": { "condition": "{{input.approved}} === true" }
      }
    },
    {
      "id": "formatter_approved",
      "type": "custom",
      "position": { "x": 1000, "y": 150 },
      "data": {
        "label": "Approved Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Request approved: {{input.reason}}" }
      }
    },
    {
      "id": "formatter_rejected",
      "type": "custom",
      "position": { "x": 1000, "y": 250 },
      "data": {
        "label": "Rejected Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Request rejected: {{input.reason}}" }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "webhook_1", "target": "js_1" },
    { "id": "e2", "source": "js_1", "target": "ifelse_1" },
    { "id": "e3", "source": "ifelse_1", "target": "formatter_approved", "sourceHandle": "true" },
    { "id": "e4", "source": "ifelse_1", "target": "formatter_rejected", "sourceHandle": "false" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 5: Health Monitor
-- ============================================
-- Monitor API endpoints and send alerts when they fail
-- Great for uptime monitoring
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Health Monitor',
  'Monitor API endpoints and send alerts when they fail. Great for uptime monitoring.',
  'Monitoring & Alerts',
  'Intermediate',
  10,
  ARRAY['monitoring', 'health-check', 'alerts', 'api'],
  '[
    {
      "id": "http_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Check API",
        "type": "http_request",
        "category": "integrations",
        "icon": "Globe",
        "config": {
          "url": "https://api.example.com/health",
          "method": "GET",
          "timeout": 5000
        }
      }
    },
    {
      "id": "ifelse_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Status OK?",
        "type": "if_else",
        "category": "logic",
        "icon": "GitBranch",
        "config": { "condition": "{{input.status}} === 200" }
      }
    },
    {
      "id": "formatter_alert",
      "type": "custom",
      "position": { "x": 700, "y": 250 },
      "data": {
        "label": "Alert Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "API Health Check Failed! Status: {{input.status}}" }
      }
    },
    {
      "id": "email_1",
      "type": "custom",
      "position": { "x": 1000, "y": 250 },
      "data": {
        "label": "Send Alert",
        "type": "email_resend",
        "category": "output",
        "icon": "Mail",
        "config": {
          "to": "admin@example.com",
          "from": "alerts@example.com",
          "subject": "API Health Check Alert",
          "body": "{{input}}"
        }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "http_1", "target": "ifelse_1" },
    { "id": "e2", "source": "ifelse_1", "target": "formatter_alert", "sourceHandle": "false" },
    { "id": "e3", "source": "formatter_alert", "target": "email_1" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 6: Scheduled Data Backup
-- ============================================
-- Automatically fetch data from an API on a schedule
-- Perfect for regular data backups
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Scheduled Data Backup',
  'Automatically fetch data from an API on a schedule. Perfect for regular data backups.',
  'Monitoring & Alerts',
  'Beginner',
  5,
  ARRAY['scheduled', 'backup', 'data', 'api'],
  '[
    {
      "id": "schedule_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Schedule",
        "type": "schedule",
        "category": "triggers",
        "icon": "Clock",
        "config": { "cron": "0 0 * * *" }
      }
    },
    {
      "id": "http_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Fetch Data",
        "type": "http_request",
        "category": "integrations",
        "icon": "Globe",
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET"
        }
      }
    },
    {
      "id": "js_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Save Backup",
        "type": "javascript",
        "category": "data",
        "icon": "Code",
        "config": {
          "code": "return { backup: input, timestamp: new Date().toISOString(), status: \"backed up\" };"
        }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "schedule_1", "target": "http_1" },
    { "id": "e2", "source": "http_1", "target": "js_1" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 7: Error Handling & Retry
-- ============================================
-- Handle errors gracefully with retry logic
-- Demonstrates error handling patterns
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Error Handling & Retry',
  'Handle errors gracefully with retry logic. Demonstrates error handling patterns.',
  'Webhook Automation',
  'Advanced',
  15,
  ARRAY['error-handling', 'retry', 'resilience'],
  '[
    {
      "id": "webhook_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Webhook",
        "type": "webhook",
        "category": "triggers",
        "icon": "Webhook",
        "config": { "method": "POST" }
      }
    },
    {
      "id": "http_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "API Call",
        "type": "http_request",
        "category": "integrations",
        "icon": "Globe",
        "config": {
          "url": "https://api.example.com/endpoint",
          "method": "POST",
          "retries": 2
        }
      }
    },
    {
      "id": "ifelse_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Success?",
        "type": "if_else",
        "category": "logic",
        "icon": "GitBranch",
        "config": { "condition": "{{input.status}} === 200" }
      }
    },
    {
      "id": "formatter_error",
      "type": "custom",
      "position": { "x": 1000, "y": 250 },
      "data": {
        "label": "Error Handler",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Error occurred: {{input.error}}. Retrying..." }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "webhook_1", "target": "http_1" },
    { "id": "e2", "source": "http_1", "target": "ifelse_1" },
    { "id": "e3", "source": "ifelse_1", "target": "formatter_error", "sourceHandle": "false" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 8: Loop & Filter Operations
-- ============================================
-- Process arrays with loops and filters
-- Demonstrates array manipulation
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Loop & Filter Operations',
  'Process arrays with loops and filters. Demonstrates array manipulation.',
  'Data Processing',
  'Intermediate',
  10,
  ARRAY['loop', 'filter', 'array', 'data-processing'],
  '[
    {
      "id": "js_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Generate Array",
        "type": "javascript",
        "category": "data",
        "icon": "Code",
        "config": {
          "code": "return { items: [{ id: 1, value: 10, active: true }, { id: 2, value: 20, active: false }, { id: 3, value: 30, active: true }] };"
        }
      }
    },
    {
      "id": "filter_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Filter Active",
        "type": "filter",
        "category": "logic",
        "icon": "Filter",
        "config": { "condition": "{{item.active}} === true" }
      }
    },
    {
      "id": "loop_1",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Process Items",
        "type": "loop",
        "category": "logic",
        "icon": "Repeat",
        "config": {}
      }
    },
    {
      "id": "formatter_1",
      "type": "custom",
      "position": { "x": 1000, "y": 200 },
      "data": {
        "label": "Format Result",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Processed item: {{item.id}} - {{item.value}}" }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "js_1", "target": "filter_1" },
    { "id": "e2", "source": "filter_1", "target": "loop_1" },
    { "id": "e3", "source": "loop_1", "target": "formatter_1" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 9: Variable Management
-- ============================================
-- Store and retrieve variables across workflow steps
-- Demonstrates variable usage
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Variable Management',
  'Store and retrieve variables across workflow steps. Demonstrates variable usage.',
  'Data Processing',
  'Beginner',
  5,
  ARRAY['variables', 'data-storage', 'state'],
  '[
    {
      "id": "trigger_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Manual Trigger",
        "type": "manual_trigger",
        "category": "triggers",
        "icon": "Play",
        "config": {}
      }
    },
    {
      "id": "setvar_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Set Variable",
        "type": "set_variable",
        "category": "data",
        "icon": "Database",
        "config": { "variable": "userName", "value": "John Doe" }
      }
    },
    {
      "id": "setvar_2",
      "type": "custom",
      "position": { "x": 400, "y": 300 },
      "data": {
        "label": "Set Score",
        "type": "set_variable",
        "category": "data",
        "icon": "Database",
        "config": { "variable": "userScore", "value": "95" }
      }
    },
    {
      "id": "formatter_1",
      "type": "custom",
      "position": { "x": 700, "y": 250 },
      "data": {
        "label": "Format Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "User: {{input.userName}}, Score: {{input.userScore}}" }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "trigger_1", "target": "setvar_1" },
    { "id": "e2", "source": "trigger_1", "target": "setvar_2" },
    { "id": "e3", "source": "setvar_1", "target": "formatter_1" },
    { "id": "e4", "source": "setvar_2", "target": "formatter_1" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- TEMPLATE 10: Switch Case Routing
-- ============================================
-- Route workflow based on multiple conditions
-- Uses Switch node for multi-path routing
INSERT INTO public.templates (
  name, description, category, difficulty, estimated_setup_time, tags,
  nodes, edges, is_active, is_featured, version
) VALUES (
  'Switch Case Routing',
  'Route workflow based on multiple conditions. Uses Switch node for multi-path routing.',
  'If-Else Logic',
  'Intermediate',
  10,
  ARRAY['switch', 'routing', 'conditional', 'multi-path'],
  '[
    {
      "id": "js_1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Get Status",
        "type": "javascript",
        "category": "data",
        "icon": "Code",
        "config": {
          "code": "return { status: \"active\" };"
        }
      }
    },
    {
      "id": "switch_1",
      "type": "custom",
      "position": { "x": 400, "y": 200 },
      "data": {
        "label": "Route by Status",
        "type": "switch",
        "category": "logic",
        "icon": "GitBranch",
        "config": {
          "expression": "{{input.status}}",
          "cases": "[{\"value\": \"active\", \"label\": \"Active\"}, {\"value\": \"inactive\", \"label\": \"Inactive\"}, {\"value\": \"pending\", \"label\": \"Pending\"}]"
        }
      }
    },
    {
      "id": "formatter_active",
      "type": "custom",
      "position": { "x": 700, "y": 150 },
      "data": {
        "label": "Active Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Status: Active - User is ready" }
      }
    },
    {
      "id": "formatter_inactive",
      "type": "custom",
      "position": { "x": 700, "y": 200 },
      "data": {
        "label": "Inactive Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Status: Inactive - User is offline" }
      }
    },
    {
      "id": "formatter_pending",
      "type": "custom",
      "position": { "x": 700, "y": 250 },
      "data": {
        "label": "Pending Message",
        "type": "text_formatter",
        "category": "data",
        "icon": "Type",
        "config": { "template": "Status: Pending - Awaiting activation" }
      }
    },
    {
      "id": "merge_1",
      "type": "custom",
      "position": { "x": 1000, "y": 200 },
      "data": {
        "label": "Merge Results",
        "type": "merge_data",
        "category": "data",
        "icon": "Combine",
        "config": { "mode": "merge" }
      }
    }
  ]'::jsonb,
  '[
    { "id": "e1", "source": "js_1", "target": "switch_1" },
    { "id": "e2", "source": "switch_1", "target": "formatter_active", "sourceHandle": "active" },
    { "id": "e3", "source": "switch_1", "target": "formatter_inactive", "sourceHandle": "inactive" },
    { "id": "e4", "source": "switch_1", "target": "formatter_pending", "sourceHandle": "pending" },
    { "id": "e5", "source": "formatter_active", "target": "merge_1" },
    { "id": "e6", "source": "formatter_inactive", "target": "merge_1" },
    { "id": "e7", "source": "formatter_pending", "target": "merge_1" }
  ]'::jsonb,
  true,
  false,
  1
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify templates were inserted:

SELECT 
  name,
  category,
  difficulty,
  is_featured,
  is_active,
  version,
  array_length(tags, 1) as tag_count
FROM public.templates
ORDER BY is_featured DESC, created_at DESC;

-- ============================================
-- NOTES
-- ============================================
-- - All templates are set to is_active = true (visible to users)
-- - Featured templates (is_featured = true) appear first
-- - Users can copy templates to create their own workflows
-- - Template version auto-increments when admins update them
-- - Node structure follows: { id, type: "custom", position: {x, y}, data: {...} }
-- - Edge structure follows: { id, source: "node_id", target: "node_id" }
-- ============================================

