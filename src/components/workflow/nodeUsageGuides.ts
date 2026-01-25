import { NodeUsageGuide } from './nodeTypes';

export const NODE_USAGE_GUIDES: Record<string, NodeUsageGuide> = {
  // Trigger Nodes
  manual_trigger: {
    overview: 'Starts your workflow when you click the "Run" button. Perfect for testing or on-demand tasks. No input required - fires once per manual execution.',
    inputs: ['None - This is a start node'],
    outputs: ['trigger', 'workflow_id', 'executed_at'],
    example: `Connect → OpenAI GPT → Slack Message

When you click Run, the workflow executes.
Output: { 
  trigger: "manual",
  workflow_id: "uuid",
  executed_at: "2024-01-15T10:30:00Z"
}`,
    tips: ['Use for testing before adding automated triggers', 'Can pass custom input data when running', 'workflow_id is auto-generated', 'executed_at is ISO-8601 timestamp'],
  },

  schedule: {
    overview: 'Runs your workflow automatically on a schedule using a simple time picker. Select your time (HH:MM format) and timezone, and the workflow will execute daily at that time. Great for daily reports, periodic checks, or recurring tasks.',
    inputs: ['None - Triggered by schedule'],
    outputs: ['trigger', 'time', 'cron', 'timezone', 'executed_at'],
    example: `Time: "09:00"
Timezone: "Asia/Kolkata" (IST)
Meaning: Daily at 9:00 AM Indian Standard Time

Time: "14:30"
Timezone: "America/New_York"
Meaning: Daily at 2:30 PM Eastern Time

Output: {
  trigger: "schedule",
  time: "09:00",
  cron: "0 9 * * *",
  timezone: "Asia/Kolkata",
  executed_at: "2024-01-15T03:30:00Z"
}`,
    tips: ['Use 24-hour format (e.g., 09:00 for 9 AM, 14:30 for 2:30 PM)', 'Select your timezone from the dropdown (IST, UTC, etc.)', 'Workflow runs daily at the specified time', 'Test with manual trigger first', 'Timezone conversion is handled automatically'],
  },

  webhook: {
    overview: 'Receives HTTP requests from external services. Use this to trigger workflows from other apps, APIs, or services. Parses headers, query parameters, and JSON body safely.',
    inputs: ['HTTP request body', 'Headers', 'Query params'],
    outputs: ['trigger', 'method', 'headers', 'query', 'body'],
    example: `Webhook URL: https://your-app.com/api/webhook/abc123

External Service sends POST:
{
  "event": "order_created",
  "data": { "id": 123, "total": 99.99 }
}

Output: { 
  trigger: "webhook",
  method: "POST",
  headers: {"Content-Type": "application/json"},
  query: {},
  body: {"event": "order_created", "data": {...}}
}`,
    tips: ['Copy the webhook URL after saving', 'Supports GET, POST, PUT methods', 'Headers and query params are available in output', 'JSON body is parsed safely'],
  },

  chat_trigger: {
    overview: 'Triggers workflow from chat / AI / UI messages. Perfect for chatbot integrations and AI assistants. Requires message and session_id.',
    inputs: ['message (required)', 'session_id (required)', 'user_context (optional)'],
    outputs: ['trigger', 'message', 'session_id', 'user_context'],
    example: `Chat Input:
{
  "message": "Hello, how can I help?",
  "session_id": "session_123",
  "user_context": {"name": "John", "role": "user"}
}

Output: {
  trigger: "chat",
  message: "Hello, how can I help?",
  session_id: "session_123",
  user_context: {"name": "John", "role": "user"}
}`,
    tips: ['message cannot be empty', 'session_id is required', 'user_context is optional and normalized to object', 'Perfect for chatbot integrations'],
  },

  error_trigger: {
    overview: 'Automatically fires when any node fails in the workflow. Global scope - cannot be manually executed. Fires on unhandled exceptions.',
    inputs: ['Error information from failed node'],
    outputs: ['trigger', 'failed_node', 'error_message', 'stack_trace'],
    example: `When a node fails:

Output: {
  trigger: "error",
  failed_node: "http_request",
  error_message: "HTTP Request failed: Connection timeout",
  stack_trace: "Error: Connection timeout\n    at executeNode..."
}`,
    tips: ['Cannot be manually executed', 'Fires automatically on node failures', 'Global scope - catches all errors', 'Use for error logging and recovery workflows'],
  },

  interval: {
    overview: 'Runs workflow repeatedly at fixed intervals. Non-blocking and prevents duplicate executions. Supports seconds (s), minutes (m), and hours (h) units.',
    inputs: ['None - Triggered by interval'],
    outputs: ['trigger', 'interval', 'executed_at'],
    example: `Interval: "10m" (every 10 minutes)
Interval: "30s" (every 30 seconds)
Interval: "1h" (every 1 hour)

Output: {
  trigger: "interval",
  interval: "10m",
  executed_at: "2024-01-15T10:30:00Z"
}`,
    tips: ['Use format: number + unit (s/m/h)', 'Examples: 30s, 5m, 1h', 'Non-blocking execution', 'Duplicate executions are prevented', 'Deactivate when not needed'],
  },

  workflow_trigger: {
    overview: 'Triggers one workflow from another workflow. Accepts source workflow_id and passes execution payload. Prevents circular triggers.',
    inputs: ['payload from source workflow'],
    outputs: ['trigger', 'source_workflow_id', 'payload'],
    example: `Source Workflow A triggers Target Workflow B:

Workflow B receives:
{
  trigger: "workflow",
  source_workflow_id: "workflow-a-uuid",
  payload: {
    "order_id": 123,
    "status": "completed"
  }
}`,
    tips: ['source_workflow_id is required', 'Payload is passed from source workflow', 'Prevents circular triggers', 'Great for workflow orchestration'],
  },

  // AI Processing
  openai_gpt: {
    overview: 'Processes text using OpenAI GPT models. Provide a system prompt and the input will be sent as the user message.',
    inputs: ['text', 'any JSON data'],
    outputs: ['response', 'usage', 'model'],
    example: `System Prompt: "You are a helpful assistant that summarizes emails."

Input: { text: "Meeting tomorrow at 3pm..." }
Output: { response: "Summary: Meeting scheduled for tomorrow afternoon", usage: { tokens: 45 } }

Connect: Webhook → OpenAI GPT → Slack`,
    tips: ['Leave API Key empty to use Lovable AI (free)', 'Lower temperature = more focused responses', 'Use {{input.text}} in prompts for dynamic content'],
  },

  anthropic_claude: {
    overview: 'Processes text using Anthropic Claude models. Known for nuanced understanding and detailed responses.',
    inputs: ['text', 'any JSON data'],
    outputs: ['response', 'usage', 'model'],
    example: `System Prompt: "Analyze customer feedback and categorize sentiment."

Input: { text: "Great product but shipping was slow" }
Output: { 
  response: "Mixed sentiment. Positive: product quality. Negative: shipping speed.",
  sentiment: "mixed"
}`,
    tips: ['Claude excels at analysis and nuanced tasks', 'Great for longer documents', 'Sonnet offers best balance of speed/quality'],
  },

  google_gemini: {
    overview: 'Processes text using Google Gemini models. Fast and efficient with strong reasoning capabilities.',
    inputs: ['text', 'any JSON data'],
    outputs: ['response', 'usage', 'model'],
    example: `System Prompt: "Extract key dates and action items from text."

Input: { text: "Call John on Friday about Q2 review" }
Output: { 
  response: "Date: Friday\nAction: Call John\nTopic: Q2 review"
}`,
    tips: ['Gemini Flash is fastest for simple tasks', 'Flash Lite for high volume, low cost', 'Pro for complex reasoning'],
  },

  text_summarizer: {
    overview: 'Automatically summarizes long text content. Choose between concise summaries, detailed overviews, or bullet points.',
    inputs: ['text', 'content'],
    outputs: ['summary', 'word_count'],
    example: `Input: { text: "Long article about AI trends..." }
Style: "bullets"
Max Length: 100

Output: {
  summary: "• AI adoption growing 40% YoY\n• Focus on automation\n• Privacy concerns rising",
  word_count: 15
}`,
    tips: ['Use bullets for quick scanning', 'Detailed for comprehensive summaries', 'Adjust max length for your needs'],
  },

  sentiment_analyzer: {
    overview: 'Analyzes the emotional tone of text. Returns sentiment score and classification (positive, negative, neutral).',
    inputs: ['text'],
    outputs: ['sentiment', 'score', 'confidence'],
    example: `Input: { text: "I love this product!" }
Output: {
  sentiment: "positive",
  score: 0.95,
  confidence: 0.92
}

Connect: Webhook → Sentiment → If/Else (route by sentiment)`,
    tips: ['Score ranges from -1 (negative) to 1 (positive)', 'Use with If/Else to route messages', 'Great for customer feedback analysis'],
  },

  // Logic & Control
  if_else: {
    overview: 'Routes workflow based on conditions. Creates two branches: one for when condition is true, another for false.',
    inputs: ['any data to evaluate'],
    outputs: ['true_branch', 'false_branch'],
    example: `Condition: {{input.score}} > 0.5

If score is 0.8 → Takes TRUE branch
If score is 0.3 → Takes FALSE branch

Connect TRUE → Send Happy Email
Connect FALSE → Send Followup Email`,
    tips: ['Use {{input.field}} to reference data', 'Supports ==, !=, >, <, >=, <=', 'Combine conditions with && or ||'],
  },

  switch: {
    overview: 'Routes to different branches based on matching values. Like multiple if/else statements combined.',
    inputs: ['value to match'],
    outputs: ['matched_case', 'default'],
    example: `Expression: {{input.status}}
Cases: [
  {"value": "pending", "label": "Pending"},
  {"value": "approved", "label": "Approved"},
  {"value": "rejected", "label": "Rejected"}
]

Connects to different nodes based on status value.`,
    tips: ['Add a default case for unmatched values', 'Great for status-based routing', 'Each case can connect to different nodes'],
  },

  loop: {
    overview: 'Iterates over an array of items, executing connected nodes for each item. Useful for batch processing.',
    inputs: ['array of items'],
    outputs: ['current_item', 'index', 'results'],
    example: `Input: { items: ["email1", "email2", "email3"] }
Array Expression: {{input.items}}

Loop executes 3 times:
• Iteration 1: current_item = "email1"
• Iteration 2: current_item = "email2"
• Iteration 3: current_item = "email3"`,
    tips: ['Set max iterations to prevent infinite loops', 'Access current item with {{loop.item}}', 'Results collected after all iterations'],
  },

  wait: {
    overview: 'Pauses workflow execution for a specified duration. Use for rate limiting or delays between actions.',
    inputs: ['any (passes through)'],
    outputs: ['input (unchanged)'],
    example: `Duration: 5000 (5 seconds)

API Call → Wait (5s) → API Call
Prevents hitting rate limits.

Common durations:
• 1000ms = 1 second
• 60000ms = 1 minute`,
    tips: ['Use between API calls to avoid rate limits', 'Data passes through unchanged', 'Duration is in milliseconds'],
  },

  error_handler: {
    overview: 'Catches errors from connected nodes and provides retry logic or fallback values. Prevents workflow failures.',
    inputs: ['any (wraps connected node)'],
    outputs: ['result', 'error', 'attempts'],
    example: `Max Retries: 3
Retry Delay: 2000 (2 seconds)
Fallback: {"status": "failed"}

If connected node fails:
1. Retry up to 3 times
2. Wait 2s between retries
3. If still failing, return fallback`,
    tips: ['Wrap unreliable API calls', 'Set appropriate retry delays', 'Log errors for debugging'],
  },

  filter: {
    overview: 'Filters an array to keep only items matching a condition. Removes items that do not meet criteria.',
    inputs: ['array of items'],
    outputs: ['filtered_array', 'removed_count'],
    example: `Array: {{input.users}}
Condition: item.age >= 18

Input: [
  {name: "John", age: 25},
  {name: "Jane", age: 16},
  {name: "Bob", age: 30}
]
Output: [John, Bob] (filtered out Jane)`,
    tips: ['Use "item" to reference current element', 'Returns new array, original unchanged', 'Chain multiple filters for complex logic'],
  },

  merge: {
    overview: 'Combines data from multiple input branches into a single output. Supports different merge modes: merge objects, append arrays, key-based merge, wait for all, or concatenate arrays.',
    inputs: ['multiple data inputs from different branches'],
    outputs: ['merged_data'],
    example: `Mode: Merge Objects
Input 1: {name: "John", age: 30}
Input 2: {email: "john@test.com", city: "NYC"}

Output: {name: "John", age: 30, email: "john@test.com", city: "NYC"}

Mode: Append to Array
Input 1: [1, 2]
Input 2: [3, 4]
Output: [1, 2, 3, 4]

Mode: Key-based Merge (with mergeKey: "id")
Input 1: [{id: 1, name: "John"}]
Input 2: [{id: 1, email: "john@test.com"}]
Output: [{id: 1, name: "John", email: "john@test.com"}]`,
    tips: ['Use "merge" mode to combine object properties', 'Use "append" to add items to arrays', 'Key-based merge requires a mergeKey field', 'Wait All mode waits for all branches before merging', 'Connect multiple nodes as inputs to merge'],
  },

  noop: {
    overview: 'No operation node - passes input data through unchanged. Useful for debugging, adding breakpoints, or maintaining workflow structure without modification.',
    inputs: ['any data'],
    outputs: ['input (unchanged)'],
    example: `Input: {orderId: 123, status: "pending"}

Output: {orderId: 123, status: "pending"}

No transformation applied - data passes through exactly as received.`,
    tips: ['Useful for debugging workflow flow', 'Can add comments or notes in workflow', 'Maintains data structure without changes', 'No configuration needed'],
  },

  stop_and_error: {
    overview: 'Stops workflow execution and triggers an error. Useful for validation failures, business rule violations, or intentional workflow termination with custom error messages.',
    inputs: ['any data'],
    outputs: ['error (workflow stops)'],
    example: `Error Message: "Payment validation failed"
Error Code: "PAYMENT_INVALID"

When this node executes:
1. Workflow stops immediately
2. Error trigger fires (if configured)
3. Error message and code are logged

Use with If/Else to conditionally stop workflows:
If/Else (condition fails) → Stop And Error`,
    tips: ['Use for validation failures', 'Error code helps categorize errors', 'Triggers error handler if configured', 'Use with conditional logic for smart stopping'],
  },

  split_in_batches: {
    overview: 'Splits a large array into smaller batches. Useful for processing large datasets in chunks, avoiding memory issues, or respecting API rate limits.',
    inputs: ['array of items'],
    outputs: ['batches array', 'batch_index', 'current_batch'],
    example: `Array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
Batch Size: 3

Output: [
  [1, 2, 3],    // Batch 1
  [4, 5, 6],    // Batch 2
  [7, 8, 9],    // Batch 3
  [10]          // Batch 4
]

Each batch can be processed separately in a loop.`,
    tips: ['Set appropriate batch size for your use case', 'Useful for large API calls', 'Prevents memory overflow', 'Each batch can be processed independently'],
  },

  // Data Transformation
  javascript: {
    overview: 'Execute custom JavaScript code. Full access to input data with ability to transform, calculate, or process as needed.',
    inputs: ['any data as "input"'],
    outputs: ['return value'],
    example: `Code:
const total = input.items.reduce(
  (sum, item) => sum + item.price, 0
);
return {
  total,
  count: input.items.length,
  average: total / input.items.length
};

Input: {items: [{price: 10}, {price: 20}]}
Output: {total: 30, count: 2, average: 15}`,
    tips: ['Always return a value', 'Input available as "input" variable', 'Use for complex transformations'],
  },

  function: {
    overview: 'Execute custom JavaScript function at dataset level. Receives both input and data parameters. Useful for complex data processing across entire datasets.',
    inputs: ['any data as "input" and "data"'],
    outputs: ['return value'],
    example: `Code:
const processed = data.map(item => ({
  ...item,
  processed: true,
  timestamp: Date.now()
}));
return { items: processed, count: processed.length };

Input: {items: [{id: 1}, {id: 2}]}
Output: {
  items: [
    {id: 1, processed: true, timestamp: 1234567890},
    {id: 2, processed: true, timestamp: 1234567890}
  ],
  count: 2
}`,
    tips: ['Receives both "input" and "data" variables', 'Use for dataset-level operations', 'Higher timeout than JavaScript node', 'Always return a value'],
  },

  function_item: {
    overview: 'Execute custom JavaScript function for each item in an array. Processes items individually with access to item, index, and input context.',
    inputs: ['array of items'],
    outputs: ['array of processed items'],
    example: `Code:
return {
  ...item,
  doubled: item.value * 2,
  index: index,
  processed: true
};

Input: [
  {id: 1, value: 10},
  {id: 2, value: 20}
]
Output: [
  {id: 1, value: 10, doubled: 20, index: 0, processed: true},
  {id: 2, value: 20, doubled: 40, index: 1, processed: true}
]`,
    tips: ['Receives "item", "index", and "input" variables', 'Processes each array item separately', 'Useful for item-level transformations', 'Returns array of processed items'],
  },

  execute_command: {
    overview: 'Execute system commands or shell scripts. ⚠️ WARNING: Disabled by default for security. Enable only if you trust the command and understand the risks.',
    inputs: ['command parameters'],
    outputs: ['stdout', 'stderr', 'exitCode'],
    example: `Command: echo "Hello {{input.name}}"
Enabled: true (⚠️ Security risk)

Input: {name: "World"}
Output: {
  stdout: "Hello World",
  stderr: "",
  exitCode: 0
}

⚠️ Only enable for trusted commands in secure environments.`,
    tips: ['⚠️ Disabled by default for security', 'Only enable if you trust the command', 'Use for system operations and scripts', 'Set appropriate timeout', 'Be careful with user input'],
  },

  set: {
    overview: 'Sets or updates field values in an object. Creates new fields or overwrites existing ones. Supports template variables for dynamic values.',
    inputs: ['object to modify'],
    outputs: ['object with updated fields'],
    example: `Fields (JSON): {
  "name": "{{input.userName}}",
  "status": "active",
  "updated_at": "2024-01-15"
}

Input: {userName: "John", id: 123}
Output: {
  userName: "John",
  id: 123,
  name: "John",
  status: "active",
  updated_at: "2024-01-15"
}`,
    tips: ['Use {{input.field}} for dynamic values', 'New fields are added, existing ones are overwritten', 'Supports nested object paths', 'Great for data normalization'],
  },

  edit_fields: {
    overview: 'Performs multiple field operations on an object: set values, delete fields, or rename keys. More powerful than Set node for complex transformations.',
    inputs: ['object to modify'],
    outputs: ['modified object'],
    example: `Operations: [
  {"operation": "set", "field": "status", "value": "active"},
  {"operation": "delete", "field": "oldField"},
  {"operation": "rename", "field": "oldName", "newName": "newName"}
]

Input: {oldName: "John", oldField: "remove", id: 123}
Output: {newName: "John", status: "active", id: 123}`,
    tips: ['Operations execute in order', 'Use "set" to add/update fields', 'Use "delete" to remove fields', 'Use "rename" to change field names'],
  },

  aggregate: {
    overview: 'Performs aggregation operations on arrays: sum, average, count, min, or max. Can aggregate by field or group by category.',
    inputs: ['array of items'],
    outputs: ['aggregated result'],
    example: `Operation: Sum
Field: price

Input: [
  {name: "Item 1", price: 10, category: "A"},
  {name: "Item 2", price: 20, category: "A"},
  {name: "Item 3", price: 15, category: "B"}
]

Output: 45 (sum of all prices)

With Group By (category):
Output: {
  "A": 30,
  "B": 15
}`,
    tips: ['Leave field empty to aggregate items directly', 'Use groupBy to aggregate by category', 'Supports sum, avg, count, min, max', 'Great for analytics and reporting'],
  },

  limit: {
    overview: 'Limits the number of items in an array. Returns only the first N items, useful for pagination or processing subsets.',
    inputs: ['array of items'],
    outputs: ['limited array'],
    example: `Limit: 5

Input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
Output: [1, 2, 3, 4, 5]

Useful for:
• Pagination (first page)
• Processing top N items
• Preventing large array processing`,
    tips: ['Returns first N items', 'Useful for pagination', 'Prevents processing large arrays', 'Combine with Sort to get top/bottom items'],
  },

  sort: {
    overview: 'Sorts array items in ascending or descending order. Can sort by a specific field or sort items directly. Supports string, number, and date types.',
    inputs: ['array of items'],
    outputs: ['sorted array'],
    example: `Field: price
Direction: Ascending
Type: Number

Input: [
  {name: "Item A", price: 30},
  {name: "Item B", price: 10},
  {name: "Item C", price: 20}
]

Output: [
  {name: "Item B", price: 10},
  {name: "Item C", price: 20},
  {name: "Item A", price: 30}
]`,
    tips: ['Leave field empty to sort items directly', 'Use "auto" type for automatic detection', 'Ascending = smallest to largest', 'Descending = largest to smallest'],
  },

  item_lists: {
    overview: 'Converts an object into a key-value list format. Useful for displaying object data in lists, tables, or for iteration.',
    inputs: ['object'],
    outputs: ['array of key-value pairs'],
    example: `Input: {
  name: "John",
  age: 30,
  city: "NYC"
}

Output: [
  {key: "name", value: "John"},
  {key: "age", value: 30},
  {key: "city", value: "NYC"}
]`,
    tips: ['Converts object to array format', 'Useful for UI display', 'Each item has key and value', 'Preserves all object properties'],
  },

  merge_data: {
    overview: 'Combines data from multiple input sources. Supports merging objects, appending to arrays, or concatenating arrays. Similar to Merge node but for data manipulation.',
    inputs: ['multiple data inputs'],
    outputs: ['merged data'],
    example: `Mode: Merge Objects
Input 1: {name: "John", age: 30}
Input 2: {email: "john@test.com"}

Output: {name: "John", age: 30, email: "john@test.com"}

Mode: Concatenate Arrays
Input 1: [1, 2, 3]
Input 2: [4, 5, 6]
Output: [1, 2, 3, 4, 5, 6]`,
    tips: ['Merge mode combines object properties', 'Append adds items to arrays', 'Concat joins arrays together', 'Useful for combining workflow data'],
  },

  json_parser: {
    overview: 'Extract specific values from JSON using JSONPath expressions. Navigate nested data structures easily.',
    inputs: ['JSON data'],
    outputs: ['extracted_value'],
    example: `Input: {
  "data": {
    "users": [
      {"name": "John", "email": "john@test.com"},
      {"name": "Jane", "email": "jane@test.com"}
    ]
  }
}

Expression: $.data.users[*].email
Output: ["john@test.com", "jane@test.com"]`,
    tips: ['$ represents root', '[*] selects all items', 'Use .field for nested access'],
  },

  text_formatter: {
    overview: 'Format text using templates with variable substitution. Create dynamic messages, emails, or any text content.',
    inputs: ['data for template variables'],
    outputs: ['formatted_text'],
    example: `Template: "Hello {{name}}! Your order #{{orderId}} ships on {{shipDate}}."

Input: {name: "John", orderId: 123, shipDate: "Jan 20"}
Output: "Hello John! Your order #123 ships on Jan 20."`,
    tips: ['Use {{variable}} for substitution', 'Supports nested: {{user.name}}', 'Great for email/message templates'],
  },

  http_request: {
    overview: 'Make HTTP requests to external APIs. Fetch data, call webhooks, or interact with any REST API.',
    inputs: ['URL params', 'body data'],
    outputs: ['response', 'status', 'headers'],
    example: `URL: https://api.example.com/users/{{input.userId}}
Method: GET
Headers: {"Authorization": "Bearer {{input.token}}"}

Output: {
  response: {id: 1, name: "John"},
  status: 200
}`,
    tips: ['Use {{input.x}} in URL for dynamic values', 'Add auth headers for protected APIs', 'Set timeout for slow APIs'],
  },

  graphql: {
    overview: 'Execute GraphQL queries and mutations. Send GraphQL requests to any GraphQL API endpoint with custom queries and variables.',
    inputs: ['query variables'],
    outputs: ['data', 'errors'],
    example: `Endpoint: https://api.example.com/graphql
Query: 
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
Variables: {"id": "{{input.userId}}"}

Output: {
  data: {
    user: {
      name: "John",
      email: "john@test.com"
    }
  },
  errors: null
}`,
    tips: ['Use GraphQL query syntax', 'Variables can use {{input.x}} templates', 'Check errors array for GraphQL errors', 'Supports both queries and mutations'],
  },

  respond_to_webhook: {
    overview: 'Send HTTP response back to webhook caller. Use this at the end of webhook-triggered workflows to return data or status to the caller.',
    inputs: ['response data'],
    outputs: ['sent response'],
    example: `Status Code: 200
Headers: {"Content-Type": "application/json"}
Body: {"status": "success", "data": "{{input}}"}

When webhook receives request:
1. Process workflow
2. Respond with this node's configuration
3. Caller receives the response`,
    tips: ['Use at end of webhook workflows', 'Set appropriate status codes (200, 400, 500)', 'Add headers for content type', 'Body supports template variables'],
  },

  set_variable: {
    overview: 'Store a value for use later in the workflow. Variables persist throughout the workflow execution.',
    inputs: ['any value'],
    outputs: ['variable_name', 'value'],
    example: `Variable Name: totalCount
Value: {{input.items.length}}

Later nodes can access: {{variables.totalCount}}

Useful for storing computed values to use in multiple places.`,
    tips: ['Access with {{variables.name}}', 'Great for values used multiple times', 'Persists through entire workflow'],
  },

  google_sheets: {
    overview: 'Read or write data from Google Sheets. Connect your spreadsheets to workflows for data analysis, validation, and automation.',
    inputs: ['spreadsheet_id', 'range', 'data (for write operations)'],
    outputs: ['data', 'rows', 'columns', 'formatted_data'],
    example: `Operation: Read
Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
Sheet: Sheet1
Range: A1:D100
Output Format: JSON

Output: {
  data: [
    {Name: "John", Email: "john@example.com", Status: "Active"},
    {Name: "Jane", Email: "jane@example.com", Status: "Pending"}
  ],
  rows: 2,
  columns: 4
}

AI Agent can then analyze, filter, or process this data.`,
    tips: [
      'Get Spreadsheet ID from URL: /d/SPREADSHEET_ID/edit',
      'Leave range empty to read all used cells',
      'Use key-value format for easier AI processing',
      'Admin can enable write access for updates',
      'Authenticate with Google account first',
    ],
  },



  database_read: {
    overview: 'Read data from your database tables. Query with filters, ordering, and limits.',
    inputs: ['filter criteria'],
    outputs: ['rows', 'count'],
    example: `Table: orders
Columns: id, customer_name, total
Filters: {"status": "pending"}
Limit: 10
Order By: created_at

Output: [
  {id: 1, customer_name: "John", total: 99},
  {id: 2, customer_name: "Jane", total: 150}
]`,
    tips: ['Use * for all columns', 'Filters use exact match', 'Combine with Loop for batch processing'],
  },

  // Output Actions
  http_post: {
    overview: 'Send data to external APIs via HTTP POST. Perfect for webhooks, API integrations, and data sync.',
    inputs: ['data to send'],
    outputs: ['response', 'status'],
    example: `URL: https://api.example.com/webhook
Headers: {"Content-Type": "application/json"}
Body: {"event": "workflow_complete", "data": "{{input}}"}

Sends POST request with workflow data.`,
    tips: ['Use body template for dynamic content', 'Add auth headers if needed', 'Check response for errors'],
  },

  email_resend: {
    overview: 'Send emails using Resend. Supports HTML content, templates, and dynamic content from workflow data.',
    inputs: ['email content', 'recipient data'],
    outputs: ['message_id', 'status'],
    example: `To: {{input.customer.email}}
From: notifications@yourapp.com
Subject: Order Confirmed #{{input.orderId}}
Body: "<h1>Thank you!</h1><p>Order {{input.orderId}} confirmed.</p>"

Sends personalized order confirmation.`,
    tips: ['Requires RESEND_API_KEY secret', 'Use HTML for rich emails', 'Use {{input.x}} for personalization'],
  },

  slack_message: {
    overview: 'Send messages to Slack channels. Supports rich formatting, blocks, and custom bot appearance.',
    inputs: ['message content'],
    outputs: ['message_id', 'channel'],
    example: `Webhook URL: https://hooks.slack.com/services/...
Channel: #alerts
Message: "New order: {{input.orderId}} - Total: {{input.total}}"
Icon: :robot_face:

Sends formatted alert to Slack channel.`,
    tips: ['Create webhook at api.slack.com', 'Use emoji for visual appeal', 'Blocks for rich formatting'],
  },

  discord_webhook: {
    overview: 'Send messages to Discord channels via webhook. Great for notifications and alerts.',
    inputs: ['message content'],
    outputs: ['message_id'],
    example: `Webhook URL: https://discord.com/api/webhooks/...
Message: "✅ Workflow completed successfully!"
Username: "Alert Bot"

Sends message to Discord channel.`,
    tips: ['Create webhook in Discord channel settings', 'Customize username and avatar', 'Supports markdown formatting'],
  },

  database_write: {
    overview: 'Write data to your database tables. Supports insert, update, upsert, and delete operations.',
    inputs: ['data to write'],
    outputs: ['affected_rows', 'inserted_id'],
    example: `Table: orders
Operation: insert
Data: {
  "customer_id": "{{input.userId}}",
  "total": "{{input.cart.total}}",
  "status": "pending"
}

Creates new order record from workflow data.`,
    tips: ['Use upsert to update or insert', 'Match column required for updates', 'Data uses {{input.x}} for dynamic values'],
  },

  log_output: {
    overview: 'Log data for debugging and monitoring. View logs in the execution history.',
    inputs: ['any data'],
    outputs: ['logged (passes input through)'],
    example: `Message: "Processing order: {{input.orderId}}"
Level: info

Appears in execution logs:
[INFO] Processing order: 12345

Useful for debugging workflow flow.`,
    tips: ['Use different levels for filtering', 'Data passes through to next node', 'Check execution history for logs'],
  },

  llm_chain: {
    overview: 'Chain multiple AI prompts together where each step builds on the previous. Great for complex reasoning tasks.',
    inputs: ['initial text/data'],
    outputs: ['final_response', 'step_outputs'],
    example: `Steps: [
  {"prompt": "Summarize: {{input}}"},
  {"prompt": "Extract key points from: {{previous}}"},
  {"prompt": "Format as bullet list: {{previous}}"}
]

Each step uses output from previous step.`,
    tips: ['Use {{previous}} to reference last output', 'Build complex reasoning chains', 'Each step can use different prompts'],
  },

  csv_processor: {
    overview: 'Parse and process CSV data. Converts CSV text to JSON array for further processing.',
    inputs: ['CSV text'],
    outputs: ['rows', 'headers', 'count'],
    example: `Input CSV:
"name,email,age
John,john@test.com,30
Jane,jane@test.com,25"

Output: [
  {name: "John", email: "john@test.com", age: "30"},
  {name: "Jane", email: "jane@test.com", age: "25"}
]`,
    tips: ['Set correct delimiter (comma, tab, etc)', 'Enable "has header" for column names', 'Output is JSON array'],
  },

  date_time: {
    overview: 'Manipulate dates and times with timezone support. Format dates, add/subtract time, calculate differences, convert timezones, and get current time.',
    inputs: ['date string or timestamp'],
    outputs: ['formatted_date', 'timestamp', 'timezone_info'],
    example: `Operation: Format
Date: 2024-01-15T10:30:00Z
Timezone: America/New_York
Format: ISO

Output: "2024-01-15T05:30:00-05:00"

Operation: Add
Date: 2024-01-15T10:30:00Z
Value: 7
Unit: Days
Output: "2024-01-22T10:30:00Z"

Operation: Now
Timezone: UTC
Output: Current date/time in UTC`,
    tips: ['Supports ISO 8601 date format', 'Use IANA timezone identifiers (e.g., America/New_York)', 'Leave date empty for current time', 'Custom format: YYYY-MM-DD HH:mm:ss'],
  },

  math: {
    overview: 'Perform mathematical operations with precision control. Supports basic arithmetic, advanced functions, and array operations. Deterministic and precise calculations.',
    inputs: ['numeric values or arrays'],
    outputs: ['calculated_result'],
    example: `Operation: Add
Value 1: {{input.price}}
Value 2: {{input.tax}}
Precision: 2

Input: {price: 10.50, tax: 1.25}
Output: 11.75

Operation: Average
Value 1: 10,20,30,40,50
Output: 30

Operation: Power
Value 1: 2
Value 2: 8
Output: 256`,
    tips: ['Supports template expressions like {{input.x}}', 'Use comma-separated values for arrays', 'Set precision for decimal operations (1-20)', 'Supports: add, subtract, multiply, divide, power, sqrt, min, max, avg, sum'],
  },

  crypto: {
    overview: 'Perform secure cryptographic operations: hash data, encode/decode Base64, generate UUIDs, create random strings, and compute HMAC signatures.',
    inputs: ['data to process'],
    outputs: ['hashed_value', 'encoded_value', 'uuid', 'random_string', 'hmac_signature'],
    example: `Operation: Hash
Data: "Hello World"
Algorithm: SHA-256

Output: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"

Operation: Generate UUID v4
Output: "550e8400-e29b-41d4-a716-446655440000"

Operation: HMAC
Data: "message"
Secret Key: "secret"
Algorithm: SHA-256
Output: HMAC signature`,
    tips: ['SHA-256 is most commonly used', 'Keep secret keys secure for HMAC', 'UUID v4 generates random UUIDs', 'Random string length: 1-256 characters'],
  },

  slack_webhook: {
    overview: 'Simple Slack webhook for quick messages. Less features than Slack Message but easier to set up.',
    inputs: ['message text'],
    outputs: ['status'],
    example: `Webhook URL: https://hooks.slack.com/services/...
Text: "Workflow completed at {{input.timestamp}}"

Sends simple text message to Slack.`,
    tips: ['Simplest Slack integration', 'No blocks or rich formatting', 'Good for basic alerts'],
  },

  google_doc: {
    overview: 'Read, create, or update Google Docs documents. Extract text content from existing documents, create new documents, or add content to existing ones. The read operation extracts ALL text including paragraphs, tables, and lists.',
    inputs: ['documentId or full URL (required for read/update)', 'title (required for create)', 'content (required for create/update)'],
    outputs: ['documentId', 'title', 'content (full extracted text)', 'body (same as content)', 'text (same as content)', 'contentLength', 'hasContent', 'documentUrl'],
    example: `Operation: Read
Document ID or URL: https://docs.google.com/document/d/1a2b3c4d5e6f7g8h9i0j/edit
(You can paste the full URL or just the ID: 1a2b3c4d5e6f7g8h9i0j)

Output: {
  documentId: "1a2b3c4d5e6f7g8h9i0j",
  title: "My Document",
  content: "Full text content extracted from the document including all paragraphs, tables, and formatted text...",
  body: "Full text content...", // Same as content
  text: "Full text content...", // Same as content
  contentLength: 1234,
  hasContent: true,
  documentUrl: "https://docs.google.com/document/d/1a2b3c4d5e6f7g8h9i0j/edit"
}

Access the content in next nodes using: {{input.content}}, {{input.body}}, or {{input.text}}

Operation: Create
Title: "New Report"
Content: "This is the document content..."

Output: {
  documentId: "new_doc_id",
  title: "New Report",
  documentUrl: "https://docs.google.com/document/d/new_doc_id/edit"
}

Operation: Update
Document ID: 1a2b3c4d5e6f7g8h9i0j
Content: "New content to append"

Output: {
  documentId: "1a2b3c4d5e6f7g8h9i0j",
  updated: true
}`,
    tips: [
      'Get Document ID from Google Docs URL: https://docs.google.com/document/d/DOCUMENT_ID/edit - you can paste the full URL or just the DOCUMENT_ID part',
      'Read operation extracts ALL text content including paragraphs, tables, lists, and formatted text',
      'The content/body/text fields in read output contain the full document text as a string - use {{input.content}} to access it',
      'Create operation creates an empty document first, then inserts content if provided',
      'Update operation appends new content to the beginning of the document',
      'Always authenticate with Google account first via Settings > Integrations > Google',
      'For read operation, ensure the document is shared with your Google account or is publicly accessible',
    ],
  },

  google_drive: {
    overview: 'List, upload, download, or delete files in Google Drive. Manage your Drive files programmatically.',
    inputs: ['folderId (for list)', 'fileId (for download/delete)', 'fileName and fileContent (for upload)'],
    outputs: ['files array (list)', 'fileId and webViewLink (upload)', 'content (download)', 'deleted status (delete)'],
    example: `Operation: List Files
Folder ID: (leave empty for root)

Output: [
  {id: "file1", name: "document.pdf", mimeType: "application/pdf"},
  {id: "file2", name: "image.jpg", mimeType: "image/jpeg"}
]

Operation: Upload File
File Name: "report.pdf"
File Content: [Base64 encoded content]

Output: {
  fileId: "uploaded_file_id",
  name: "report.pdf",
  webViewLink: "https://drive.google.com/file/d/.../view"
}`,
    tips: [
      'Leave Folder ID empty to list root folder',
      'File IDs are in URL: /file/d/FILE_ID/view',
      'Upload requires Base64 encoded file content',
      'Download returns Base64 encoded content',
    ],
  },

  google_calendar: {
    overview: 'Create, list, update, or delete Google Calendar events. Manage your calendar programmatically.',
    inputs: ['calendarId', 'eventId (for update/delete)', 'summary', 'startTime', 'endTime', 'description'],
    outputs: ['events array (list)', 'eventId and htmlLink (create)', 'updated event (update)', 'deleted status (delete)'],
    example: `Operation: Create Event
Calendar ID: primary
Event Title: "Team Meeting"
Start Time: 2024-01-15T14:00:00Z
End Time: 2024-01-15T15:00:00Z
Description: "Weekly sync"

Output: {
  eventId: "event_id",
  summary: "Team Meeting",
  htmlLink: "https://calendar.google.com/event?eid=..."
}`,
    tips: [
      'Use "primary" for main calendar',
      'Times must be ISO 8601 format (UTC)',
      'Event IDs returned when creating events',
      'List shows upcoming events only',
    ],
  },

  google_gmail: {
    overview: 'Send, list, get, or search Gmail messages. Automate email operations in your workflows.',
    inputs: ['to, subject, body (for send)', 'messageId (for get)', 'query (for search)'],
    outputs: ['messageId and threadId (send)', 'messages array (list/search)', 'full message (get)'],
    example: `Operation: Send Email
To: recipient@example.com
Subject: "Workflow Notification"
Body: "Your workflow completed successfully!"

Output: {
  messageId: "sent_message_id",
  threadId: "thread_id"
}

Operation: Search Messages
Search Query: from:example@gmail.com
Max Results: 10

Output: [
  {id: "message_id_1"},
  {id: "message_id_2"}
]`,
    tips: [
      'Gmail search syntax: from:, subject:, is:unread, has:attachment',
      'Message IDs returned when listing/searching',
      'Body is plain text only',
      'Use search to filter messages before getting details',
    ],
  },

  google_tasks: {
    overview: 'Create, list, update, or complete Google Tasks. Manage your task list programmatically.',
    inputs: ['taskListId', 'taskId (for update/complete)', 'title', 'notes', 'dueDate'],
    outputs: ['tasks array (list)', 'created task (create)', 'updated task (update)', 'completed task (complete)'],
    example: `Operation: Create Task
Task List ID: @default
Task Title: "Review proposal"
Notes: "Check budget and timeline"
Due Date: 2024-01-20T17:00:00Z

Output: {
  id: "task_id",
  title: "Review proposal",
  status: "needsAction"
}`,
    tips: [
      'Use "@default" for default task list',
      'Task IDs returned when creating tasks',
      'Due dates must be ISO 8601 format',
      'Completed tasks hidden from list by default',
    ],
  },

  google_contacts: {
    overview: 'List, create, update, or delete Google Contacts. Manage your contact list programmatically.',
    inputs: ['contactId (for update/delete)', 'name', 'email', 'phone', 'maxResults'],
    outputs: ['contacts array (list)', 'created contact (create)', 'updated contact (update)', 'deleted status (delete)'],
    example: `Operation: Create Contact
Name: "John Doe"
Email: john@example.com
Phone: +1234567890

Output: {
  resourceName: "people/c1234567890",
  name: "John Doe",
  email: "john@example.com"
}`,
    tips: [
      'Contact ID is resourceName field (e.g., people/c1234567890)',
      'Email required for creating contacts',
      'Phone should include country code (e.g., +1234567890)',
      'Max results limit applies to list operation',
    ],
  },

  // ============================================
  // AUTHENTICATION & IDENTITY NODES
  // ============================================
  oauth2: {
    overview: 'OAuth2 authentication and token management. Get access tokens, refresh tokens, validate tokens, and revoke access.',
    inputs: ['clientId', 'clientSecret', 'tokenUrl', 'code (for authorization_code)', 'refreshToken (for refresh)'],
    outputs: ['access_token', 'refresh_token', 'expires_in', 'token_type'],
    example: `Operation: Get Access Token
Grant Type: Authorization Code
Client ID: your-client-id
Client Secret: your-client-secret
Token URL: https://api.example.com/oauth/token
Code: authorization-code-from-callback

Output: {
  access_token: "eyJhbGci...",
  refresh_token: "def502...",
  expires_in: 3600,
  token_type: "Bearer"
}`,
    tips: [
      'Use authorization_code for user authorization flows',
      'Use client_credentials for server-to-server',
      'Store refresh tokens securely for token renewal',
      'Token URL is usually: https://provider.com/oauth/token',
    ],
  },

  auth0: {
    overview: 'Auth0 identity and access management. Manage users, get tokens, and perform identity operations.',
    inputs: ['domain', 'clientId', 'clientSecret', 'userId (for user ops)', 'userData (for create/update)'],
    outputs: ['user object', 'users array', 'access_token (get_token)', 'success status'],
    example: `Operation: Get User
Domain: dev-abc123.us.auth0.com
Client ID: your-client-id
Client Secret: your-client-secret
User ID: auth0|123456

Output: {
  user_id: "auth0|123456",
  email: "user@example.com",
  name: "John Doe",
  created_at: "2024-01-15T10:00:00Z"
}`,
    tips: [
      'Get credentials from Auth0 Dashboard → Applications',
      'User ID format: "auth0|123456" or "google-oauth2|123456"',
      'Use Management API for user operations',
      'Get token operation uses client credentials grant',
    ],
  },

  // ============================================
  // PAYMENT & FINANCE NODES
  // ============================================
  stripe: {
    overview: 'Stripe payment processing. Create payments, manage customers, handle subscriptions, and process refunds.',
    inputs: ['apiKey', 'amount', 'currency', 'paymentMethodId', 'customerId'],
    outputs: ['payment_intent', 'payment', 'customer', 'subscription', 'refund'],
    example: `Operation: Create Payment Intent
API Key: sk_test_...
Amount: 1000 (cents)
Currency: usd

Output: {
  id: "pi_1234567890",
  amount: 1000,
  currency: "usd",
  status: "requires_payment_method",
  client_secret: "pi_1234567890_secret_..."
}`,
    tips: [
      'Amount is in smallest currency unit (cents for USD)',
      'Use test keys (sk_test_) for development',
      'Payment Intent is required for modern payment flows',
      'Customer ID format: cus_...',
    ],
  },

  razorpay: {
    overview: 'Razorpay payment gateway. Create orders, process payments, handle refunds, and manage customers.',
    inputs: ['keyId', 'keySecret', 'amount', 'currency', 'orderId', 'paymentId'],
    outputs: ['order', 'payment', 'refund', 'customer'],
    example: `Operation: Create Order
Key ID: rzp_test_...
Key Secret: your-key-secret
Amount: 10000 (paise)
Currency: INR

Output: {
  id: "order_1234567890",
  amount: 10000,
  currency: "INR",
  status: "created",
  created_at: 1642234567
}`,
    tips: [
      'Amount is in smallest currency unit (paise for INR)',
      'Use test keys (rzp_test_) for development',
      'Order must be created before payment',
      'Payment ID format: pay_...',
    ],
  },

  paypal: {
    overview: 'PayPal payment processing. Create orders, capture payments, process refunds, and manage transactions.',
    inputs: ['clientId', 'clientSecret', 'environment', 'amount', 'currency', 'orderId'],
    outputs: ['order', 'access_token', 'capture', 'refund'],
    example: `Operation: Create Order
Client ID: your-client-id
Client Secret: your-client-secret
Environment: sandbox
Amount: 10.00
Currency: USD

Output: {
  id: "5O190127TN364715T",
  status: "CREATED",
  links: [{
    href: "https://api.sandbox.paypal.com/v2/checkout/orders/5O190127TN364715T",
    rel: "self"
  }]
}`,
    tips: [
      'Use sandbox for testing, production for live',
      'Amount is decimal string (e.g., "10.00")',
      'Order must be captured after creation',
      'Access token auto-generated for API calls',
    ],
  },

  // ============================================
  // E-COMMERCE NODES
  // ============================================
  shopify: {
    overview: 'Shopify e-commerce operations. Manage products, orders, customers, and inventory.',
    inputs: ['shopDomain', 'accessToken', 'productId', 'orderId', 'customerId'],
    outputs: ['product', 'products array', 'order', 'orders array', 'customer', 'customers array'],
    example: `Operation: Get Product
Shop Domain: mystore.myshopify.com
Access Token: shpat_...
Product ID: 123456789

Output: {
  product: {
    id: 123456789,
    title: "Product Name",
    vendor: "Vendor Name",
    product_type: "Type",
    variants: [...],
    images: [...]
  }
}`,
    tips: [
      'Get access token from Shopify Admin → Settings → Apps → Develop apps',
      'Shop domain format: your-shop.myshopify.com',
      'Product ID is numeric',
      'Use Admin API version 2024-01 or later',
    ],
  },

  woocommerce: {
    overview: 'WooCommerce store operations. Manage products, orders, customers, and store data.',
    inputs: ['storeUrl', 'consumerKey', 'consumerSecret', 'productId', 'orderId', 'customerId'],
    outputs: ['product', 'products array', 'order', 'orders array', 'customer'],
    example: `Operation: Get Product
Store URL: https://yourstore.com
Consumer Key: ck_...
Consumer Secret: cs_...
Product ID: 123

Output: {
  id: 123,
  name: "Product Name",
  sku: "PRODUCT-SKU",
  price: "29.99",
  stock_status: "instock"
}`,
    tips: [
      'Get API keys from WooCommerce → Settings → Advanced → REST API',
      'Store URL without trailing slash',
      'Consumer key starts with ck_, secret with cs_',
      'Product/Order IDs are numeric',
    ],
  },

  magento: {
    overview: 'Magento e-commerce operations. Manage products, orders, and store data via REST API.',
    inputs: ['storeUrl', 'accessToken', 'productId (SKU)', 'orderId', 'searchCriteria'],
    outputs: ['product', 'products array', 'order', 'orders array'],
    example: `Operation: Get Product
Store URL: https://yourstore.com
Access Token: your-access-token
Product ID (SKU): PRODUCT-SKU

Output: {
  sku: "PRODUCT-SKU",
  name: "Product Name",
  price: 29.99,
  status: 1,
  type_id: "simple"
}`,
    tips: [
      'Get access token from Magento Admin → System → Integrations',
      'Product ID is the SKU (string)',
      'Order ID is numeric',
      'Use searchCriteria for filtering list operations',
    ],
  },

  bigcommerce: {
    overview: 'BigCommerce store operations. Manage products, orders, customers, and store data.',
    inputs: ['storeHash', 'accessToken', 'productId', 'orderId', 'customerId'],
    outputs: ['product', 'products array', 'order', 'orders array', 'customer'],
    example: `Operation: Get Product
Store Hash: your-store-hash
Access Token: your-access-token
Product ID: 123

Output: {
  data: {
    id: 123,
    name: "Product Name",
    sku: "PRODUCT-SKU",
    price: "29.99",
    inventory_level: 100
  }
}`,
    tips: [
      'Get credentials from BigCommerce → Advanced Settings → API Accounts',
      'Store hash is in API URL: /stores/{storeHash}/v3',
      'Product/Order IDs are numeric',
      'API uses v3 endpoint',
    ],
  },

  // ============================================
  // ANALYTICS & DATA TOOLS NODES
  // ============================================
  google_analytics: {
    overview: 'Google Analytics data and reporting. Get reports, track events, and analyze user behavior.',
    inputs: ['accessToken', 'propertyId', 'dateRanges', 'dimensions', 'metrics', 'eventName'],
    outputs: ['report data', 'properties array', 'success status'],
    example: `Operation: Get Report
Access Token: your-access-token
Property ID: properties/123456789
Date Ranges: [{"startDate": "2024-01-01", "endDate": "2024-01-31"}]
Dimensions: ["date", "country"]
Metrics: ["activeUsers", "sessions"]

Output: {
  rows: [{
    dimensionValues: [{value: "20240101"}, {value: "US"}],
    metricValues: [{value: "1000"}, {value: "1500"}]
  }]
}`,
    tips: [
      'Get access token via OAuth2 or Service Account',
      'Property ID format: properties/123456789',
      'Use GA4 Data API for reports',
      'Measurement Protocol for event tracking',
    ],
  },

  mixpanel: {
    overview: 'Mixpanel analytics and event tracking. Track events, identify users, and query insights.',
    inputs: ['projectToken', 'apiSecret (for queries)', 'eventName', 'distinctId', 'properties'],
    outputs: ['success status', 'insights data'],
    example: `Operation: Track Event
Project Token: your-project-token
Event Name: Button Clicked
Distinct ID: user-123
Properties: {"button": "signup", "page": "home"}

Output: {
  status: 1,
  error: null
}`,
    tips: [
      'Get project token from Mixpanel → Project Settings',
      'API secret needed for query operations',
      'Distinct ID identifies the user',
      'Properties are custom event data',
    ],
  },

  segment: {
    overview: 'Segment analytics and data routing. Track events, identify users, track page views, and group users.',
    inputs: ['writeKey', 'userId', 'event', 'properties', 'traits'],
    outputs: ['success status'],
    example: `Operation: Track
Write Key: your-write-key
User ID: user-123
Event: Button Clicked
Properties: {"button": "signup", "page": "home"}

Output: {
  success: true
}`,
    tips: [
      'Get write key from Segment → Settings → API Keys',
      'User ID identifies the user across events',
      'Traits are user properties (for identify)',
      'Segment routes data to your connected destinations',
    ],
  },

  amplitude: {
    overview: 'Amplitude product analytics. Track events, identify users, and analyze product usage.',
    inputs: ['apiKey', 'secretKey (for get_event)', 'userId', 'eventType', 'eventProperties'],
    outputs: ['success status', 'event data'],
    example: `Operation: Track Event
API Key: your-api-key
User ID: user-123
Event Type: Button Clicked
Event Properties: {"button": "signup", "page": "home"}

Output: {
  code: 200,
  events_ingested: 1
}`,
    tips: [
      'Get API key from Amplitude → Settings → Projects',
      'Secret key needed for get_event operation',
      'Event type is the event name',
      'Event properties are custom data',
    ],
  },

  elasticsearch: {
    overview: 'Elasticsearch search and analytics. Search documents, index data, update records, and perform bulk operations.',
    inputs: ['nodeUrl', 'username/password (optional)', 'index', 'query', 'documentId', 'document'],
    outputs: ['search results', 'document', 'success status'],
    example: `Operation: Search
Node URL: https://localhost:9200
Index: my-index
Query: {"query": {"match": {"field": "value"}}}

Output: {
  hits: {
    total: {value: 10},
    hits: [{
      _id: "1",
      _source: {field: "value"}
    }]
  }
}`,
    tips: [
      'Node URL is your Elasticsearch cluster URL',
      'Index is the index name',
      'Query uses Elasticsearch Query DSL',
      'Bulk operations use NDJSON format',
    ],
  },

  // ============================================
  // MISSING TRIGGER NODES
  // ============================================
  form: {
    overview: 'Creates a web form that users can submit to trigger your workflow. Supports multiple field types (text, email, number, select, file, etc.). Generates a unique form URL that can be shared. Perfect for contact forms, surveys, registrations, or data collection.',
    inputs: ['None - Triggered by form submission'],
    outputs: ['trigger', 'form_id', 'submission_data', 'form_fields', 'submitted_at', 'user_id (if authenticated)'],
    example: `Form Fields:
- Name (text, required)
- Email (email, required)
- Message (textarea, optional)
- Category (select: Support, Sales, General)

User submits form with:
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Need help with order",
  "category": "Support"
}

Output: {
  trigger: "form",
  form_id: "form_abc123",
  submission_data: {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Need help with order",
    "category": "Support"
  },
  submitted_at: "2024-01-15T10:30:00Z"
}

Connect form → Process submission → Send email notification`,
    tips: [
      'Copy the Form URL after saving to share with users',
      'Form fields are configured in the node settings',
      'Enable CAPTCHA to prevent spam',
      'Use authentication requirement for user tracking',
      'Set redirect URL to thank users after submission',
      'Form URL is unique per workflow',
      'Multiple submissions allowed by default (can disable)',
    ],
  },

  // ============================================
  // MISSING LOGIC & CONTROL NODES
  // ============================================
  human_approval: {
    overview: 'Pauses workflow execution until a human approves or rejects the request. Sends approval requests to specified approvers via email or notification. Supports single or multiple approval modes (all approvers must approve vs. any approver can approve). Perfect for compliance, quality control, or authorization workflows.',
    inputs: ['any data to include in approval request'],
    outputs: ['approved', 'rejected', 'approval_data', 'approver', 'approved_at', 'timeout'],
    example: `Approvers: ["manager@example.com", "admin@example.com"]
Approval Type: Multiple (all must approve)
Timeout: 3600 seconds (1 hour)
Default Action: Reject

Workflow flow:
1. Human Approval node executes
2. Approval emails sent to approvers
3. Workflow pauses, waiting for approvals
4. All approvers approve → Workflow continues with "approved" branch
5. Any approver rejects or timeout → Workflow continues with "rejected" branch

Output (approved): {
  approved: true,
  approver: "manager@example.com",
  approved_at: "2024-01-15T10:30:00Z",
  approval_data: {...}
}

Output (rejected/timeout): {
  approved: false,
  reason: "timeout" or "rejected",
  approved_at: null
}`,
    tips: [
      'Use single approval for faster processing',
      'Use multiple approvals for critical decisions',
      'Set appropriate timeout (default 1 hour)',
      'Choose default action for timeout scenarios',
      'Approval emails include workflow context',
      'Approvers can approve/reject via email or dashboard',
      'Approval status is tracked and logged',
    ],
  },

  escalation_router: {
    overview: 'Routes workflow execution based on severity levels (low, medium, high, critical). Assigns different handlers or workflows for each severity level. Useful for incident management, alert routing, or priority-based processing.',
    inputs: ['severity', 'item_data', 'routing_rules'],
    outputs: ['routed_to', 'severity', 'handler_id'],
    example: `Severity: "high"
Routing Rules: {
  "low": "handler_low",
  "medium": "handler_medium",
  "high": "handler_urgent",
  "critical": "handler_critical"
}

Input: {
  severity: "high",
  issue: "Server error rate > 5%",
  timestamp: "2024-01-15T10:30:00Z"
}

Output: {
  routed_to: "handler_urgent",
  severity: "high",
  handler_id: "handler_urgent"
}

Routes to urgent handler for immediate response.`,
    tips: [
      'Define routing rules for each severity level',
      'Use severity levels to prioritize handling',
      'Each severity routes to different handler/node',
      'Critical and High should route to priority handlers',
      'Low and Medium can route to standard handlers',
      'Severity must match one of the defined levels',
    ],
  },

  fallback_router: {
    overview: 'Provides fallback routing when primary path fails. Tries primary handler first, then falls back to alternative handlers in sequence if failures occur. Useful for high availability, backup systems, or graceful degradation.',
    inputs: ['any data', 'fallback_paths'],
    outputs: ['successful_path', 'fallback_used', 'attempts'],
    example: `Fallback Paths: ["primary_handler", "backup_handler", "default_handler"]

Execution flow:
1. Try primary_handler
2. If fails → Try backup_handler
3. If fails → Try default_handler
4. If all fail → Error

Output (primary succeeds): {
  successful_path: "primary_handler",
  fallback_used: false,
  attempts: 1
}

Output (backup succeeds): {
  successful_path: "backup_handler",
  fallback_used: true,
  attempts: 2
}`,
    tips: [
      'Order fallback paths by priority',
      'Use for high availability scenarios',
      'Each path is tried in sequence',
      'Stops at first successful path',
      'Logs all attempts for debugging',
      'Useful for backup systems or load balancing',
    ],
  },

  retry_with_backoff: {
    overview: 'Implements exponential backoff retry strategy. Retries failed operations with increasing delays (1s, 2s, 4s, 8s, etc.). Prevents overwhelming services while giving transient failures time to recover. Perfect for API calls, database operations, or network requests.',
    inputs: ['any data from previous node'],
    outputs: ['result', 'attempts', 'total_delay', 'success'],
    example: `Max Retries: 5
Initial Delay: 1000ms (1 second)
Backoff Multiplier: 2

Retry sequence:
- Attempt 1: Immediate
- Attempt 2: Wait 1s (1000ms)
- Attempt 3: Wait 2s (2000ms)
- Attempt 4: Wait 4s (4000ms)
- Attempt 5: Wait 8s (8000ms)
- If all fail → Error

Output (success on attempt 3): {
  result: {...},
  attempts: 3,
  total_delay: 3000,
  success: true
}`,
    tips: [
      'Exponential backoff prevents overwhelming services',
      'Initial delay × multiplier^attempt = delay for each retry',
      'Use for transient failures (network, rate limits)',
      'Increase max retries for critical operations',
      'Adjust multiplier based on service recovery time',
      'Total delay increases exponentially: 1s, 2s, 4s, 8s, 16s...',
    ],
  },

  timeout_guard: {
    overview: 'Enforces maximum execution time for workflow or node execution. Terminates execution if timeout is exceeded. Prevents infinite loops, hanging operations, or resource exhaustion. Useful for protecting against slow APIs, long-running processes, or runaway workflows.',
    inputs: ['any data'],
    outputs: ['result', 'timeout_exceeded', 'execution_time'],
    example: `Timeout: 30000ms (30 seconds)

Execution:
1. Start timer
2. Execute connected node
3. If completes within timeout → Continue
4. If exceeds timeout → Terminate with error

Output (within timeout): {
  result: {...},
  timeout_exceeded: false,
  execution_time: 15000
}

Output (exceeded): {
  result: null,
  timeout_exceeded: true,
  execution_time: 30000,
  error: "Execution timeout exceeded"
}`,
    tips: [
      'Set timeout based on expected execution time',
      'Use for slow APIs or long-running operations',
      'Prevents infinite loops or hanging processes',
      'Timeout is in milliseconds',
      'Common timeouts: 5s (fast), 30s (normal), 60s (slow)',
      'Increase for complex operations, decrease for quick checks',
    ],
  },

  circuit_breaker: {
    overview: 'Implements circuit breaker pattern to protect against cascading failures. Opens circuit after threshold failures, preventing further requests to failing service. Circuit closes after cooldown period. Essential for resilience and preventing service overload.',
    inputs: ['service_name', 'operation_data'],
    outputs: ['result', 'circuit_state', 'failures_count', 'circuit_opened'],
    example: `Service Name: "api_service"
Failure Threshold: 5 failures
Cooldown Period: 60000ms (1 minute)

Behavior:
1. Normal: Circuit closed, requests pass through
2. After 5 failures: Circuit opens, requests blocked
3. After 1 minute cooldown: Circuit closes, allows 1 test request
4. If test succeeds: Circuit stays closed
5. If test fails: Circuit reopens

Output (circuit closed): {
  result: {...},
  circuit_state: "closed",
  failures_count: 0
}

Output (circuit opened): {
  result: null,
  circuit_state: "open",
  failures_count: 5,
  circuit_opened: true,
  error: "Circuit breaker is open"
}`,
    tips: [
      'Circuit breaker prevents cascading failures',
      'Opens after failure threshold is reached',
      'Cooldown period allows service to recover',
      'Test request validates service health',
      'Use for external APIs or unreliable services',
      'Failure threshold: 3-10 depending on service',
      'Cooldown: 30s-5min depending on recovery time',
    ],
  },

  workflow_state_manager: {
    overview: 'Manages workflow state and persistence. Stores workflow data, retrieves previous state, or resets state. Enables stateful workflows, resumable executions, or data persistence across workflow runs. Useful for long-running processes or stateful automation.',
    inputs: ['state_data', 'operation'],
    outputs: ['state', 'retrieved_data', 'success'],
    example: `Operation: Store State
State Key: "order_processing"
State Data: {
  "orderId": 123,
  "step": "payment_processing",
  "progress": 50
}

Operation: Retrieve State
State Key: "order_processing"

Output: {
  state: {
    "orderId": 123,
    "step": "payment_processing",
    "progress": 50,
    "updated_at": "2024-01-15T10:30:00Z"
  },
  retrieved_data: {...}
}

Useful for resuming interrupted workflows.`,
    tips: [
      'Store state for resumable workflows',
      'State persists across workflow executions',
      'Use unique state keys per workflow instance',
      'Retrieve state to resume from last step',
      'Clear state when workflow completes',
      'State is scoped to workflow instance',
      'Useful for long-running processes',
    ],
  },

  execution_context_store: {
    overview: 'Stores execution context and metadata for workflow runs. Preserves context across nodes, tracks execution history, or maintains workflow-wide variables. Useful for debugging, audit trails, or context passing.',
    inputs: ['context_data', 'execution_id'],
    outputs: ['context', 'stored_at', 'execution_id'],
    example: `Context Data: {
  "user_id": "user_123",
  "session_id": "session_abc",
  "workflow_run": "run_xyz",
  "metadata": {"source": "webhook"}
}

Stores context for entire workflow execution.
All nodes can access this context.

Output: {
  context: {...},
  stored_at: "2024-01-15T10:30:00Z",
  execution_id: "exec_123"
}`,
    tips: [
      'Context persists for entire workflow execution',
      'All nodes can access stored context',
      'Useful for audit trails and debugging',
      'Store user/session/workflow metadata',
      'Context is cleared after workflow completes',
      'Execution ID links context to workflow run',
    ],
  },

  session_manager: {
    overview: 'Manages user sessions with TTL (Time To Live). Creates, validates, and terminates sessions. Useful for authentication, state management, or temporary data storage with expiration.',
    inputs: ['session_id', 'action', 'ttl'],
    outputs: ['session_id', 'valid', 'expires_at', 'session_data'],
    example: `Action: Create Session
TTL: 3600 seconds (1 hour)

Output: {
  session_id: "session_abc123",
  valid: true,
  expires_at: "2024-01-15T11:30:00Z",
  session_data: {}
}

Action: Validate Session
Session ID: "session_abc123"

Output (valid): {
  session_id: "session_abc123",
  valid: true,
  expires_at: "2024-01-15T11:30:00Z"
}

Output (expired): {
  session_id: "session_abc123",
  valid: false,
  error: "Session expired"
}`,
    tips: [
      'Create session with TTL for expiration',
      'Validate session before accessing protected resources',
      'TTL is in seconds (3600 = 1 hour)',
      'Terminate session for logout',
      'Session ID is auto-generated for create',
      'Useful for user authentication workflows',
      'Sessions expire automatically after TTL',
    ],
  },

  // ============================================
  // MISSING DATA MANIPULATION NODES
  // ============================================
  rename_keys: {
    overview: 'Renames object keys while preserving values. Maps old key names to new key names. Useful for data normalization, API compatibility, or restructuring data format.',
    inputs: ['object with keys to rename', 'key_mappings'],
    outputs: ['object with renamed keys'],
    example: `Mappings: {
  "firstName": "first_name",
  "lastName": "last_name",
  "emailAddress": "email"
}

Input: {
  firstName: "John",
  lastName: "Doe",
  emailAddress: "john@example.com",
  age: 30
}

Output: {
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  age: 30  // Unmapped keys preserved
}`,
    tips: [
      'Keys not in mappings remain unchanged',
      'Useful for API field name conversion',
      'Preserves all values',
      'Can rename nested keys with dot notation',
      'Mappings are applied in order',
      'Useful for data normalization',
    ],
  },

  // ============================================
  // MISSING GOOGLE NODES (Already have most)
  // ============================================
  google_bigquery: {
    overview: 'Execute SQL queries on BigQuery datasets. Run analytics queries and get results as JSON. Supports standard SQL and legacy SQL modes. Perfect for data analytics, reporting, or data warehouse operations.',
    inputs: ['projectId', 'datasetId', 'query', 'useLegacySql'],
    outputs: ['rows', 'totalRows', 'jobComplete'],
    example: `Project ID: my-project-id
Dataset ID: my_dataset
SQL Query: SELECT * FROM \`my-project-id.my_dataset.my_table\` LIMIT 10
Use Legacy SQL: false

Output: {
  rows: [
    {column1: "value1", column2: "value2"},
    {column1: "value3", column2: "value4"}
  ],
  totalRows: "2",
  jobComplete: true
}`,
    tips: [
      'Use backticks for table names: `project.dataset.table`',
      'Standard SQL recommended (set Use Legacy SQL to false)',
      'Results automatically formatted as JSON objects',
      'Large queries may take time',
      'Authenticate with Google account first',
      'Project ID and Dataset ID are required',
    ],
  },

  // ============================================
  // ADDITIONAL AI & ML NODES
  // ============================================
  azure_openai: {
    overview: 'Interact with Azure OpenAI service to use GPT models hosted on Microsoft Azure. Provides the same capabilities as OpenAI GPT but with Azure infrastructure and deployment control. Perfect for enterprises using Azure services or requiring data residency.',
    inputs: ['endpoint', 'apiKey', 'deploymentName', 'prompt', 'temperature', 'memory'],
    outputs: ['response', 'usage', 'model'],
    example: `Endpoint: https://my-resource.openai.azure.com
Deployment Name: gpt-4
System Prompt: "You are a helpful assistant..."
Temperature: 0.7

Output: {
  response: "Hello! How can I help you today?",
  usage: { tokens: 150 },
  model: "gpt-4"
}`,
    tips: [
      'Get endpoint from Azure Portal → Your Resource → Keys and Endpoint',
      'Deployment name is the name you gave your model deployment in Azure',
      'API version defaults to latest preview',
      'Use Azure endpoints for better data residency control',
      'Same models available as OpenAI but hosted on Azure',
    ],
  },

  hugging_face: {
    overview: 'Use Hugging Face Inference API to access thousands of open-source AI models. Supports text generation, classification, question answering, summarization, and translation tasks. Perfect for experimenting with different models or using specialized models.',
    inputs: ['apiKey', 'model', 'task', 'parameters'],
    outputs: ['output', 'model', 'task'],
    example: `Model ID: gpt2
Task: text-generation
Parameters: {"max_length": 100, "temperature": 0.7}
Input Text: "The future of AI is"

Output: {
  output: "The future of AI is bright and full of possibilities...",
  model: "gpt2",
  task: "text-generation"
}`,
    tips: [
      'Find model IDs at huggingface.co/models',
      'Task must match model capabilities',
      'Many models available for free',
      'Use model-specific parameters for best results',
      'Token starts with hf_',
    ],
  },

  cohere: {
    overview: 'Use Cohere AI models for text generation and language understanding. Cohere specializes in command models optimized for following instructions and generating high-quality text. Great for content generation, summarization, and classification tasks.',
    inputs: ['apiKey', 'model', 'prompt', 'temperature'],
    outputs: ['text', 'generation_id', 'model'],
    example: `Model: command
Prompt: "Summarize this text: [text]"
Temperature: 0.7

Output: {
  text: "Summary of the provided text...",
  generation_id: "gen_abc123",
  model: "command"
}`,
    tips: [
      'Command model is best for general tasks',
      'Command Light is faster and cheaper',
      'Command R/R+ for complex multi-step tasks',
      'Lower temperature for factual tasks',
      'Get API key from dashboard.cohere.com',
    ],
  },

  ollama: {
    overview: 'Interact with Ollama server to run large language models locally. Run models on your own infrastructure without API costs. Perfect for privacy-sensitive applications or when you want full control over the AI models. Requires Ollama server to be running.',
    inputs: ['serverUrl', 'model', 'prompt', 'temperature'],
    outputs: ['response', 'model', 'done'],
    example: `Server URL: http://localhost:11434
Model: llama2
Prompt: "Explain quantum computing in simple terms"
Temperature: 0.7

Output: {
  response: "Quantum computing uses quantum mechanics...",
  model: "llama2",
  done: true
}`,
    tips: [
      'Install Ollama from ollama.ai first',
      'Pull models: ollama pull llama2',
      'Default port is 11434',
      'Free to use but requires your own compute',
      'Great for local development and testing',
    ],
  },

  embeddings: {
    overview: 'Generate vector embeddings for text using OpenAI or Google Gemini models. Embeddings convert text into numerical vectors for similarity search, semantic search, or AI applications. Perfect for building search systems, recommendation engines, or RAG applications.',
    inputs: ['provider', 'apiKey', 'model', 'text', 'dimensions'],
    outputs: ['embedding', 'model', 'dimensions'],
    example: `Provider: OpenAI
Model: text-embedding-ada-002
Text: "Machine learning is fascinating"

Output: {
  embedding: [0.123, -0.456, 0.789, ...],
  model: "text-embedding-ada-002",
  dimensions: 1536
}`,
    tips: [
      'OpenAI ada-002: 1536 dimensions, fast and cheap',
      'text-embedding-3-small: 1536 dimensions, better quality',
      'text-embedding-3-large: 3072 dimensions, best quality',
      'Dimensions only for text-embedding-3 models',
      'Use embeddings for semantic search and similarity',
    ],
  },

  vector_store: {
    overview: 'Store and query vector embeddings in vector databases (Pinecone or Supabase pgvector). Perfect for building RAG systems, semantic search, or recommendation engines. Store embeddings with metadata and query for similar vectors.',
    inputs: ['provider', 'apiKey', 'indexName', 'operation', 'vectors', 'queryVector', 'ids'],
    outputs: ['result', 'matches', 'count'],
    example: `Provider: Pinecone
Operation: upsert
Vectors: [{"id": "1", "values": [0.1, 0.2, ...], "metadata": {"text": "hello"}}]

Query Operation:
Query Vector: {"vector": [0.1, 0.2, ...], "topK": 5}

Output: {
  matches: [
    {"id": "1", "score": 0.95, "metadata": {"text": "hello"}}
  ],
  count: 1
}`,
    tips: [
      'Pinecone is cloud-hosted vector database',
      'Supabase uses pgvector extension on PostgreSQL',
      'Upsert: insert or update vectors',
      'Query: search for similar vectors',
      'Delete: remove vectors by IDs',
    ],
  },

  chat_model: {
    overview: 'Unified interface for multiple AI chat providers (OpenAI, Anthropic, Google Gemini, Azure). Switch between providers easily or use multiple providers in the same workflow. Perfect for multi-provider strategies or cost optimization.',
    inputs: ['provider', 'apiKey', 'model', 'prompt', 'temperature', 'endpoint', 'deploymentName'],
    outputs: ['response', 'provider', 'model', 'usage'],
    example: `Provider: OpenAI
Model: gpt-4o
System Prompt: "You are a helpful assistant..."
Temperature: 0.7

Output: {
  response: "Hello! How can I help you?",
  provider: "openai",
  model: "gpt-4o",
  usage: { tokens: 150 }
}`,
    tips: [
      'Switch providers easily without changing workflow logic',
      'Each provider has different model options',
      'Azure requires endpoint and deploymentName',
      'Use for cost optimization across providers',
      'Test with different providers to find best fit',
    ],
  },

  intent_classification_agent: {
    overview: 'AI agent that classifies user intent from text input. Identifies primary and secondary intents, calculates confidence scores, and handles ambiguous cases. Perfect for chatbots, customer service automation, or routing user requests.',
    inputs: ['apiKey', 'model', 'prompt', 'text', 'confidenceThreshold', 'temperature'],
    outputs: ['primaryIntent', 'secondaryIntents', 'confidence', 'isAmbiguous', 'clarificationQuestions'],
    example: `Text: "I want to cancel my subscription"
Confidence Threshold: 0.7

Output: {
  primaryIntent: "cancel_subscription",
  secondaryIntents: [],
  confidence: 0.95,
  isAmbiguous: false,
  clarificationQuestions: []
}`,
    tips: [
      'Lower confidence threshold = more classifications but less certain',
      'Higher threshold = fewer but more confident classifications',
      'Handles ambiguous cases by requesting clarification',
      'Use for routing user requests to appropriate handlers',
      'Temperature 0.3 recommended for classification tasks',
    ],
  },

  sentiment_analysis_agent: {
    overview: 'AI agent that analyzes sentiment and emotions in text. Detects sentiment polarity (positive/negative/neutral), emotional tones (joy, anger, sadness, etc.), and intensity. Perfect for customer feedback analysis, social media monitoring, or content moderation.',
    inputs: ['apiKey', 'model', 'prompt', 'text', 'granularity', 'temperature'],
    outputs: ['sentiment', 'confidence', 'emotions', 'intensity'],
    example: `Text: "I love this product! It works perfectly."
Granularity: overall

Output: {
  sentiment: "positive",
  confidence: 0.92,
  emotions: {
    joy: 0.85,
    anger: 0.02,
    sadness: 0.01,
    fear: 0.01,
    surprise: 0.10
  },
  intensity: "high"
}`,
    tips: [
      'Overall: single sentiment for entire text',
      'Sentence: sentiment per sentence for detailed analysis',
      'Aspect: sentiment for specific topics/aspects mentioned',
      'Handles sarcasm when possible',
      'Use for customer feedback and social media monitoring',
    ],
  },

  confidence_scoring_agent: {
    overview: 'AI agent that evaluates the confidence and certainty of AI-generated responses. Penalizes vague or speculative language and assigns confidence scores. Perfect for quality control, filtering unreliable outputs, or ensuring factual accuracy.',
    inputs: ['apiKey', 'model', 'prompt', 'responseText', 'context', 'temperature'],
    outputs: ['confidenceScore', 'confidenceLevel', 'riskFactors'],
    example: `Response Text: "This might be true, I think..."
Context: "Factual question about science"

Output: {
  confidenceScore: 0.35,
  confidenceLevel: "low",
  riskFactors: [
    "Uses vague language (might, think)",
    "Lacks definitive statements",
    "Speculative tone"
  ]
}`,
    tips: [
      'Penalizes vague language (might, think, possibly)',
      'Lower score for speculative or uncertain responses',
      'Higher score for clear, factual statements',
      'Use for filtering unreliable AI outputs',
      'Helps ensure quality control in AI workflows',
    ],
  },

  lead_qualification_agent: {
    overview: 'AI agent that qualifies sales leads using BANT or MEDDIC frameworks. Evaluates lead readiness, identifies missing information, and assigns qualification stages. Perfect for sales automation, lead routing, or CRM integration.',
    inputs: ['apiKey', 'model', 'prompt', 'leadData', 'framework', 'temperature'],
    outputs: ['qualified', 'qualificationStage', 'missingInformation', 'reasoning'],
    example: `Lead Data: {
  name: "John Doe",
  company: "Acme Corp",
  budget: 50000,
  timeline: "Q2 2024"
}
Framework: BANT

Output: {
  qualified: true,
  qualificationStage: "hot",
  missingInformation: [],
  reasoning: "Budget, Authority, Need, Timeline all present"
}`,
    tips: [
      'BANT: Budget, Authority, Need, Timeline (sales qualification)',
      'MEDDIC: Complex sales qualification framework',
      'Identifies missing information automatically',
      'Use for routing qualified leads to sales team',
      'Temperature 0.3 recommended for consistent evaluation',
    ],
  },

  lead_scoring_agent: {
    overview: 'AI agent that assigns weighted scores to sales leads based on attributes. Normalizes scores to 0-100 range and provides recommended actions. Perfect for prioritizing leads, lead nurturing, or sales pipeline management.',
    inputs: ['apiKey', 'model', 'prompt', 'leadAttributes', 'scoringRules', 'temperature'],
    outputs: ['leadScore', 'scoreCategory', 'scoreBreakdown', 'recommendedAction'],
    example: `Lead Attributes: {
  companySize: "enterprise",
  engagement: "high",
  budget: 100000
}
Scoring Rules: {"companySize": 20, "engagement": 30, "budget": 50}

Output: {
  leadScore: 85,
  scoreCategory: "high",
  scoreBreakdown: {
    companySize: 20,
    engagement: 30,
    budget: 50
  },
  recommendedAction: "Immediate follow-up with sales team"
}`,
    tips: [
      'Custom scoring rules available (optional)',
      'Scores normalized to 0-100 range',
      'Categories: low (0-40), medium (41-70), high (71-100)',
      'Use for prioritizing leads in CRM',
      'Integrate with lead nurturing workflows',
    ],
  },

  skill_matching_agent: {
    overview: 'AI agent that matches candidate skills with required skills and identifies gaps. Calculates match percentage and provides recommendations. Perfect for recruitment, team building, or skill gap analysis.',
    inputs: ['apiKey', 'model', 'prompt', 'candidateSkills', 'requiredSkills', 'experienceLevel', 'temperature'],
    outputs: ['matchPercentage', 'matchedSkills', 'missingSkills', 'recommendations'],
    example: `Candidate Skills: ["JavaScript", "React", "Node.js"]
Required Skills: ["JavaScript", "React", "TypeScript", "GraphQL"]
Experience Level: "mid-level"

Output: {
  matchPercentage: 66.7,
  matchedSkills: ["JavaScript", "React"],
  missingSkills: ["TypeScript", "GraphQL"],
  recommendations: [
    "Candidate has strong foundation",
    "Recommend training in TypeScript and GraphQL",
    "Good fit with some skill development"
  ]
}`,
    tips: [
      'Calculates match percentage automatically',
      'Identifies both matched and missing skills',
      'Provides actionable recommendations',
      'Use for recruitment and team planning',
      'Helps identify training needs',
    ],
  },

  document_qa_agent: {
    overview: 'AI agent that answers questions strictly from provided document text. Cites reference sections and rejects hallucinations. Perfect for document search, knowledge bases, or RAG applications where factual accuracy is critical.',
    inputs: ['apiKey', 'model', 'prompt', 'documentText', 'question', 'temperature'],
    outputs: ['answer', 'confidence', 'sourceExcerpt', 'found'],
    example: `Document Text: "The company was founded in 2020..."
Question: "When was the company founded?"

Output: {
  answer: "The company was founded in 2020.",
  confidence: 0.98,
  sourceExcerpt: "The company was founded in 2020...",
  found: true
}`,
    tips: [
      'Answers strictly from document - no hallucinations',
      'Cites source excerpts for verification',
      'Returns found: false if answer not in document',
      'Use for factual Q&A from documents',
      'Perfect for RAG and knowledge base systems',
    ],
  },

  policy_reasoning_agent: {
    overview: 'AI agent that interprets and applies policies or rules to given situations. Provides reasoning for policy decisions and identifies applicable rules. Perfect for compliance checking, policy enforcement, or automated decision-making.',
    inputs: ['apiKey', 'model', 'prompt', 'policy', 'situation', 'temperature'],
    outputs: ['decision', 'reasoning', 'applicableRules', 'compliance'],
    example: `Policy: "Employees must work 40 hours per week"
Situation: "Employee worked 35 hours"

Output: {
  decision: "Non-compliant",
  reasoning: "Employee worked 35 hours, which is less than the required 40 hours per week",
  applicableRules: ["Minimum 40 hours per week"],
  compliance: false
}`,
    tips: [
      'Interprets complex policies and rules',
      'Provides clear reasoning for decisions',
      'Identifies applicable rules automatically',
      'Use for compliance automation',
      'Perfect for HR and legal workflows',
    ],
  },

  memory: {
    overview: 'Store, retrieve, clear, or search conversation memory for AI applications. Maintains context across multiple interactions using different memory types (short-term, long-term, or both). Perfect for chatbots, AI assistants, or multi-turn conversations.',
    inputs: ['operation', 'memoryType', 'ttl', 'maxMessages', 'key', 'sessionId'],
    outputs: ['memory', 'messages', 'searchResults'],
    example: `Operation: store
Memory Type: both
TTL: 3600 seconds (1 hour)
Max Messages: 100
Session ID: session_123

Stored memory for session_123 with 1 hour TTL

Retrieve Operation:
Output: {
  memory: {...},
  messages: [...]
}`,
    tips: [
      'Store: save conversation memory',
      'Retrieve: get stored memory by key/session',
      'Clear: delete stored memory',
      'Search: find memory by content',
      'Short-term: session-based, Long-term: persistent',
    ],
  },

  // ============================================
  // DATABASE NODES
  // ============================================
  redis: {
    overview: 'Interact with Redis key-value store for caching, session management, or fast data storage. Supports get, set, and delete operations with optional TTL (time-to-live). Perfect for caching frequently accessed data or managing sessions.',
    inputs: ['host', 'port', 'password', 'operation', 'key', 'value', 'ttl'],
    outputs: ['value', 'result'],
    example: `Operation: set
Key: "user:123:cache"
Value: "cached_data"
TTL: 3600 seconds (1 hour)

Get Operation:
Output: {
  value: "cached_data",
  result: "success"
}`,
    tips: [
      'Use namespaces like "user:123" or "session:abc"',
      'TTL sets expiration time in seconds',
      'Fast key-value operations',
      'Perfect for caching and session storage',
      'Get operation returns null if key not found',
    ],
  },

  mssql: {
    overview: 'Query Microsoft SQL Server databases using SELECT queries or raw SQL. Supports Azure SQL Database and on-premise SQL Server. Perfect for enterprise databases, data analysis, or SQL Server-specific operations.',
    inputs: ['server', 'database', 'username', 'password', 'operation', 'table', 'query', 'filters', 'limit'],
    outputs: ['rows', 'count'],
    example: `Server: myserver.database.windows.net
Database: mydb
Operation: select
Table: users
Filters: {"status": "active"}

Output: {
  rows: [
    {id: 1, name: "John", status: "active"},
    {id: 2, name: "Jane", status: "active"}
  ],
  count: 2
}`,
    tips: [
      'Azure SQL format: username@servername',
      'Use Raw SQL for stored procedures or complex queries',
      'Select operation uses simple filters',
      'Supports T-SQL specific features in Raw SQL mode',
      'Use connection pooling for better performance',
    ],
  },

  sqlite: {
    overview: 'Query SQLite databases using SELECT queries or raw SQL. SQLite is a file-based database perfect for local development, embedded applications, or lightweight data storage. No server required - just a file path.',
    inputs: ['databasePath', 'operation', 'table', 'query', 'filters', 'limit'],
    outputs: ['rows', 'count'],
    example: `Database Path: /tmp/mydb.db
Operation: select
Table: users
Filters: {"active": true}

Output: {
  rows: [
    {id: 1, name: "John", active: true}
  ],
  count: 1
}`,
    tips: [
      'Database file created automatically if not exists',
      'Use absolute or relative file paths',
      'Perfect for local development and testing',
      'Single-file database - easy to backup',
      'Standard SQL syntax supported',
    ],
  },

  snowflake: {
    overview: 'Query Snowflake data warehouse using SELECT queries or raw SQL. Snowflake is optimized for analytics and data warehousing. Perfect for large-scale data analytics, reporting, or data warehouse operations.',
    inputs: ['account', 'username', 'password', 'warehouse', 'database', 'schema', 'operation', 'table', 'query', 'limit'],
    outputs: ['rows', 'count'],
    example: `Account: xy12345
Warehouse: COMPUTE_WH
Database: MY_DATABASE
Schema: PUBLIC
Operation: select
Table: sales_data

Output: {
  rows: [
    {date: "2024-01-15", revenue: 10000},
    {date: "2024-01-16", revenue: 12000}
  ],
  count: 2
}`,
    tips: [
      'Account identifier from Snowflake URL',
      'Warehouse required for compute resources',
      'Case-sensitive: database and schema names',
      'Use Raw SQL for complex analytics queries',
      'Optimized for large-scale data processing',
    ],
  },

  timescaledb: {
    overview: 'Query TimescaleDB (PostgreSQL extension for time-series data) using SELECT queries or raw SQL. Perfect for time-series data, metrics, IoT data, or time-based analytics. Supports hypertables and time-series functions.',
    inputs: ['host', 'port', 'database', 'username', 'password', 'operation', 'table', 'query', 'filters', 'limit'],
    outputs: ['rows', 'count'],
    example: `Host: timescale.example.com
Database: metrics_db
Operation: query
SQL Query: SELECT time_bucket('1 hour', time) AS hour, AVG(value) FROM metrics GROUP BY hour

Output: {
  rows: [
    {hour: "2024-01-15 10:00:00", avg: 45.5},
    {hour: "2024-01-15 11:00:00", avg: 48.2}
  ],
  count: 2
}`,
    tips: [
      'Uses PostgreSQL syntax plus time-series functions',
      'Hypertables automatically partitioned by time',
      'Use time_bucket() for time-based aggregations',
      'Perfect for metrics, IoT, and time-series data',
      'Optimized for time-based queries',
    ],
  },

  // ============================================
  // STORAGE NODES
  // ============================================
  read_binary_file: {
    overview: 'Read binary files from the file system. Supports images, PDFs, or any binary file format. Useful for processing files in workflows. Set max size to prevent memory issues with large files.',
    inputs: ['filePath', 'maxSize'],
    outputs: ['content', 'size', 'mimeType'],
    example: `File Path: /tmp/document.pdf
Max Size: 10485760 (10 MB)

Output: {
  content: "base64_encoded_content...",
  size: 5242880,
  mimeType: "application/pdf"
}`,
    tips: [
      'Returns content as base64-encoded string',
      'Set max size to prevent memory issues',
      'Supports absolute and relative paths',
      'Useful for file processing workflows',
      'Binary files must be base64-encoded',
    ],
  },

  aws_s3: {
    overview: 'Interact with AWS S3 for cloud file storage. Upload, download, list, or delete files in S3 buckets. Perfect for file backups, media storage, or cloud file management. Supports folders using object key paths.',
    inputs: ['accessKeyId', 'secretAccessKey', 'region', 'bucket', 'operation', 'key', 'content', 'prefix'],
    outputs: ['result', 'content', 'objects'],
    example: `Operation: put
Bucket: my-bucket
Key: "folder/file.txt"
Content: "Hello from CtrlChecks!"
Region: us-east-1

Get Operation:
Output: {
  content: "Hello from CtrlChecks!",
  result: "success"
}`,
    tips: [
      'Use folder structure in object keys: "folder/subfolder/file.txt"',
      'Content can be plain text or base64-encoded binary',
      'Region must match bucket region',
      'List operation supports prefix filtering',
      'Secure credentials - use IAM best practices',
    ],
  },

  ftp: {
    overview: 'Interact with FTP servers for file transfer. Upload, download, list, or delete files on FTP servers. Supports standard FTP (port 21) and FTPS (port 990). Perfect for legacy file transfer workflows.',
    inputs: ['host', 'port', 'username', 'password', 'operation', 'remotePath', 'content'],
    outputs: ['result', 'content', 'files'],
    example: `Operation: get
Host: ftp.example.com
Port: 21
Remote Path: /files/data.txt

Output: {
  content: "File content...",
  result: "success"
}`,
    tips: [
      'Port 21 for standard FTP, 990 for FTPS',
      'Use absolute paths starting with /',
      'Content for put operation can be text or base64',
      'List operation returns files in directory',
      'Consider SFTP for better security',
    ],
  },

  sftp: {
    overview: 'Interact with SFTP servers for secure file transfer over SSH. Upload, download, list, or delete files on SFTP servers. More secure than FTP. Perfect for secure file transfers to servers.',
    inputs: ['host', 'port', 'username', 'password', 'privateKey', 'operation', 'remotePath', 'content'],
    outputs: ['result', 'content', 'files'],
    example: `Operation: put
Host: sftp.example.com
Port: 22
Remote Path: /var/www/uploads/file.txt
Content: "Hello World"

Output: {
  result: "success"
}`,
    tips: [
      'Port 22 is standard SSH/SFTP port',
      'Use private key for better security than password',
      'Private key format: -----BEGIN RSA PRIVATE KEY----- ...',
      'Supports absolute and relative paths',
      'More secure than FTP - uses SSH protocol',
    ],
  },

  dropbox: {
    overview: 'Interact with Dropbox cloud storage. Upload, download, list, or delete files in Dropbox. Perfect for cloud file management, backups, or syncing files with Dropbox accounts.',
    inputs: ['accessToken', 'operation', 'path', 'content'],
    outputs: ['result', 'content', 'files'],
    example: `Operation: upload
Path: /Documents/file.txt
Content: "Hello from CtrlChecks!"

List Operation:
Output: {
  files: [
    {name: "file.txt", path: "/Documents/file.txt", size: 1234}
  ]
}`,
    tips: [
      'Paths start with / for root',
      'Get access token from Dropbox App Console',
      'Set required permissions (files.read, files.write)',
      'Content for upload can be text or base64',
      'List operation shows files in folder',
    ],
  },

  telegram: {
    overview: 'Send messages to Telegram chats using Telegram Bot API. Get bot token from @BotFather on Telegram. Perfect for notifications, alerts, or chatbot integrations.',
    inputs: ['botToken', 'chatId', 'message'],
    outputs: ['messageId', 'timestamp'],
    example: `Bot Token: 123456:ABC-DEF...
Chat ID: 123456789
Message: "Hello from CtrlChecks!"

Output: {
  messageId: 12345,
  timestamp: "2024-01-15T10:30:00Z"
}`,
    tips: [
      'Get bot token from @BotFather on Telegram',
      'Chat ID: User ID or group chat ID',
      'Bot must be added to chat first',
      'Supports basic text messages',
      'Use for notifications and alerts',
    ],
  },

  whatsapp_cloud: {
    overview: 'Send WhatsApp messages using Meta WhatsApp Cloud API. Requires phone number ID and access token from Meta developers. Perfect for business messaging, notifications, or customer communication.',
    inputs: ['phoneNumberId', 'accessToken', 'to', 'message'],
    outputs: ['messageId', 'status'],
    example: `Phone Number ID: 123456789012345
Access Token: EAAG...
To: 1234567890 (with country code, no +)
Message: "Hello from CtrlChecks!"

Output: {
  messageId: "wamid.xxx",
  status: "sent"
}`,
    tips: [
      'Get credentials from Meta for Developers',
      'Phone number must include country code (no +)',
      'Business phone number required',
      'Access token required for API access',
      'Use for business messaging and notifications',
    ],
  },

  twilio: {
    overview: 'Send SMS messages using Twilio. Requires Account SID, Auth Token, and a Twilio phone number. Perfect for SMS notifications, alerts, or two-factor authentication.',
    inputs: ['accountSid', 'authToken', 'from', 'to', 'message'],
    outputs: ['messageId', 'status', 'price'],
    example: `From: +1234567890
To: +1987654321
Message: "Hello from CtrlChecks!"

Output: {
  messageId: "SM1234567890abcdef",
  status: "sent",
  price: "0.0075"
}`,
    tips: [
      'Phone numbers in E.164 format (include + and country code)',
      'Get credentials from Twilio Console',
      'Must have a verified Twilio phone number',
      'Message limit: 1600 characters',
      'Supports template variables',
    ],
  },

  email_sequence_sender: {
    overview: 'Send email sequences (drip campaigns) with multiple steps, delays, and conditions. Perfect for onboarding, marketing campaigns, or automated follow-ups. Stop sequence if recipient replies.',
    inputs: ['recipient', 'sequence', 'stopOnReply', 'tracking'],
    outputs: ['sequenceId', 'sentCount', 'status'],
    example: `Recipient: {"email": "user@example.com", "name": "John"}
Sequence: [
  {"step": 1, "subject": "Welcome", "body": "Hello!", "delayAfter": 0},
  {"step": 2, "subject": "Day 1", "body": "Check this out...", "delayAfter": 86400}
]
Stop on Reply: true

Output: {
  sequenceId: "seq_123",
  sentCount: 1,
  status: "active"
}`,
    tips: [
      'delayAfter in seconds (86400 = 1 day)',
      'Sequence stops if recipient replies (if enabled)',
      'Supports tracking (open, click)',
      'Use for onboarding and marketing campaigns',
      'Each step sends after delay from previous step',
    ],
  },

  auto_followup_sender: {
    overview: 'Automatically send follow-up messages if original message receives no reply. Monitors original message and sends follow-up after wait time. Perfect for ensuring important messages are seen.',
    inputs: ['originalMessageId', 'recipient', 'followUpMessage', 'waitTime', 'maxAttempts'],
    outputs: ['followUpId', 'attempt', 'status'],
    example: `Original Message ID: msg_123
Wait Time: 86400 seconds (24 hours)
Max Attempts: 3
Follow-up Message: {"subject": "Follow-up", "body": "Just checking in..."}

Output: {
  followUpId: "followup_456",
  attempt: 1,
  status: "scheduled"
}`,
    tips: [
      'Wait time in seconds before sending follow-up',
      'Max attempts limits number of follow-ups',
      'Stops if recipient replies',
      'Use for important messages that need response',
      'Helps ensure messages are seen',
    ],
  },

  human_handoff_notification: {
    overview: 'Notify humans when workflow needs manual intervention. Sends notification via email, Slack, or SMS with workflow context. Perfect for escalation, approval requests, or manual review.',
    inputs: ['channel', 'recipient', 'context', 'priority'],
    outputs: ['notificationId', 'status'],
    example: `Channel: email
Recipient: agent@example.com
Priority: high
Context: {
  "workflowId": "wf_123",
  "reason": "Manual review needed",
  "data": {...}
}

Output: {
  notificationId: "notif_789",
  status: "sent"
}`,
    tips: [
      'Channels: email, slack, sms',
      'Priority: low, medium, high',
      'Context includes workflow details',
      'Use for escalation and manual review',
      'Ensures humans are notified when needed',
    ],
  },

  approval_request_sender: {
    overview: 'Send approval requests to approvers and wait for response. Supports approve/reject options and timeout handling. Perfect for workflow approvals, purchase requests, or content moderation.',
    inputs: ['approver', 'approvalMessage', 'approvalOptions', 'timeout'],
    outputs: ['approvalId', 'status', 'decision'],
    example: `Approver: manager@example.com
Approval Message: "Please approve this request..."
Approval Options: ["approve", "reject"]
Timeout: 86400 seconds (24 hours)

Output: {
  approvalId: "approval_123",
  status: "pending",
  decision: null
}`,
    tips: [
      'Timeout in seconds - auto-handles if timeout reached',
      'Approval options: approve, reject, or custom',
      'Approver receives notification',
      'Use for workflow approvals and permissions',
      'Workflow pauses until approval received',
    ],
  },

  reminder_scheduler: {
    overview: 'Schedule reminders to be sent at specific times or on recurring schedules. Supports email, SMS, or push notifications. Perfect for deadline reminders, task reminders, or recurring notifications.',
    inputs: ['recipient', 'message', 'channel', 'schedule'],
    outputs: ['reminderId', 'scheduledTime'],
    example: `Recipient: user@example.com
Message: "Don't forget to submit your report"
Channel: email
Schedule: {
  "type": "one_time",
  "time": "2024-01-20T09:00:00Z"
}

Output: {
  reminderId: "reminder_123",
  scheduledTime: "2024-01-20T09:00:00Z"
}`,
    tips: [
      'Schedule type: one_time or recurring (with cron)',
      'Channels: email, sms, push',
      'Time in ISO-8601 format',
      'Use for deadline and task reminders',
      'Recurring reminders use cron expressions',
    ],
  },

  // ============================================
  // STORAGE & DOCUMENT PROCESSING NODES
  // ============================================
  resume_parser: {
    overview: 'Extract structured data from resume/CV files (PDF, DOCX, images). Parses contact information, skills, work experience, education, and certifications. Normalizes skills to standard formats and calculates total experience. Perfect for recruitment, applicant tracking, or skill matching.',
    inputs: ['file', 'normalizeSkills', 'experienceCalculation'],
    outputs: ['contactInfo', 'skills', 'experience', 'education', 'totalExperience'],
    example: `File: {
  "name": "resume.pdf",
  "type": "pdf",
  "binary": "base64_encoded_pdf..."
}
Normalize Skills: true
Experience Calculation: true

Output: {
  contactInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890"
  },
  skills: ["JavaScript", "React", "Node.js", "Python"],
  experience: [
    {
      company: "Tech Corp",
      position: "Senior Developer",
      duration: "2 years",
      description: "Led development team..."
    }
  ],
  education: [...],
  totalExperience: 5.5
}`,
    tips: [
      'Supports PDF, DOCX, and image formats',
      'Normalize skills to standard format names',
      'Calculates total years of experience automatically',
      'Extracts structured data from unstructured resumes',
      'Use for ATS (Applicant Tracking System) integration',
    ],
  },

  invoice_parser: {
    overview: 'Extract structured data from invoice files (PDF, images). Parses invoice number, date, line items, totals, tax information, and vendor details. Normalizes currency values and detects tax amounts. Perfect for accounts payable automation, expense tracking, or invoice processing workflows.',
    inputs: ['file', 'currencyNormalization', 'taxDetection'],
    outputs: ['invoiceNumber', 'date', 'vendor', 'lineItems', 'subtotal', 'tax', 'total', 'currency'],
    example: `File: {
  "name": "invoice.pdf",
  "type": "pdf",
  "binary": "base64_encoded_pdf..."
}
Currency Normalization: true
Tax Detection: true

Output: {
  invoiceNumber: "INV-2024-001",
  date: "2024-01-15",
  vendor: {
    name: "Acme Corp",
    address: "123 Main St..."
  },
  lineItems: [
    {
      description: "Service A",
      quantity: 2,
      unitPrice: 100,
      total: 200
    }
  ],
  subtotal: 200,
  tax: 20,
  total: 220,
  currency: "USD"
}`,
    tips: [
      'Supports PDF and image formats',
      'Normalizes currency to standard format',
      'Detects and extracts tax information',
      'Extracts all line items with quantities and prices',
      'Use for automated invoice processing and accounting',
    ],
  },

  document_classifier: {
    overview: 'Classify documents into predefined categories based on text content. Uses AI to analyze document text and assign it to the most likely category. Returns confidence scores for classification. Perfect for document routing, categorization, or content management workflows.',
    inputs: ['text', 'availableClasses', 'confidenceThreshold'],
    outputs: ['classification', 'confidence', 'alternativeClasses'],
    example: `Text: "Invoice #12345 dated January 15, 2024..."
Available Classes: ["invoice", "resume", "contract", "report"]
Confidence Threshold: 0.7

Output: {
  classification: "invoice",
  confidence: 0.95,
  alternativeClasses: [
    {class: "contract", confidence: 0.05},
    {class: "report", confidence: 0.00}
  ]
}`,
    tips: [
      'Requires text content from document',
      'Available classes define possible categories',
      'Confidence threshold filters low-confidence classifications',
      'Returns alternative classifications with scores',
      'Use for automatic document routing and categorization',
    ],
  },

  file_metadata_extractor: {
    overview: 'Extract metadata from files including file type, size, creation date, modification date, MIME type, and format-specific metadata (EXIF for images, PDF metadata, etc.). Perfect for file organization, metadata indexing, or content management.',
    inputs: ['file'],
    outputs: ['metadata', 'type', 'size', 'mimeType', 'createdAt', 'modifiedAt'],
    example: `File: {
  "name": "photo.jpg",
  "type": "image/jpeg",
  "size": 1024000,
  "binary": "base64_encoded_image..."
}

Output: {
  metadata: {
    width: 1920,
    height: 1080,
    camera: "Canon EOS 5D",
    location: {...}
  },
  type: "image/jpeg",
  size: 1024000,
  mimeType: "image/jpeg",
  createdAt: "2024-01-15T10:30:00Z",
  modifiedAt: "2024-01-15T10:30:00Z"
}`,
    tips: [
      'Extracts format-specific metadata (EXIF, PDF info, etc.)',
      'Returns file type and MIME type',
      'Includes file size and timestamps',
      'Metadata varies by file type',
      'Use for file indexing and organization',
    ],
  },

  // ============================================
  // UTILITY NODES
  // ============================================
  html_extract: {
    overview: 'Extract content from HTML using CSS selectors or tag names. Can extract text, HTML, or attributes from HTML documents. Sanitizes HTML by default to prevent XSS attacks. Perfect for web scraping, content extraction, or HTML processing.',
    inputs: ['html', 'selector', 'sanitize', 'stripScripts', 'extractText', 'maxSize'],
    outputs: ['content', 'elements', 'text'],
    example: `HTML: "<div class='content'><p>Hello World</p></div>"
Selector: ".content p"
Extract Text: false

Output: {
  content: "<p>Hello World</p>",
  elements: [...],
  text: "Hello World"
}`,
    tips: [
      'Use CSS selectors for precise extraction (e.g., .class, #id, tag)',
      'Sanitize HTML by default to prevent XSS attacks',
      'Strip scripts and styles for security',
      'Extract text only removes all HTML tags',
      'Set max size to prevent memory issues with large HTML',
    ],
  },

  xml: {
    overview: 'Parse, extract, or validate XML documents. Converts XML to JSON, extracts data using XPath expressions, or validates XML structure. Safe mode enabled by default to prevent XXE attacks. Perfect for XML processing, data extraction, or API integrations.',
    inputs: ['xml', 'operation', 'xpath', 'safeMode', 'maxSize'],
    outputs: ['json', 'extracted', 'valid'],
    example: `Operation: parse
XML: "<root><item id='1'>Value</item></root>"
Safe Mode: true

Output: {
  json: {
    root: {
      item: {
        "@id": "1",
        "#text": "Value"
      }
    }
  },
  valid: true
}`,
    tips: [
      'Parse: converts XML to JSON object',
      'Extract: uses XPath to extract specific data',
      'Validate: checks XML structure and syntax',
      'Safe mode prevents XXE attacks (enabled by default)',
      'Use XPath syntax for precise data extraction',
    ],
  },

  rss_feed_read: {
    overview: 'Read and parse RSS/Atom feeds from URLs. Extracts feed items with titles, descriptions, links, dates, and authors. Can detect and filter duplicate entries. Perfect for content aggregation, blog monitoring, or news feeds.',
    inputs: ['feedUrl', 'maxItems', 'detectDuplicates', 'timeout'],
    outputs: ['items', 'feedInfo', 'totalItems'],
    example: `Feed URL: https://example.com/feed.xml
Max Items: 10
Detect Duplicates: true

Output: {
  items: [
    {
      title: "Article Title",
      description: "Article description...",
      link: "https://example.com/article",
      pubDate: "2024-01-15T10:30:00Z",
      author: "John Doe"
    },
    ...
  ],
  feedInfo: {
    title: "Example Blog",
    description: "Blog description",
    link: "https://example.com"
  },
  totalItems: 10
}`,
    tips: [
      'Supports RSS and Atom feed formats',
      'Max items limits number of articles returned',
      'Detect duplicates prevents same article appearing twice',
      'Timeout prevents hanging on slow feeds',
      'Use for content aggregation and monitoring',
    ],
  },

  pdf: {
    overview: 'Extract text content or metadata from PDF files. Can extract all text from PDF documents or read PDF metadata (title, author, creation date, etc.). Perfect for document processing, content extraction, or PDF analysis.',
    inputs: ['pdfUrl', 'operation', 'maxSize'],
    outputs: ['text', 'metadata', 'pageCount'],
    example: `Operation: extractText
PDF URL: https://example.com/document.pdf
Max Size: 10485760 (10 MB)

Output: {
  text: "Full text content of the PDF document...",
  pageCount: 5,
  metadata: {
    title: "Document Title",
    author: "John Doe",
    creationDate: "2024-01-15"
  }
}`,
    tips: [
      'Extract text: gets all text content from PDF',
      'Read metadata: extracts PDF properties (title, author, etc.)',
      'Supports URLs or base64-encoded PDF data',
      'Set max size to prevent memory issues',
      'Use for document processing and content analysis',
    ],
  },

  image_manipulation: {
    overview: 'Resize, crop, convert format, or extract metadata from images. Supports JPEG, PNG, WebP formats. Can preserve or remove EXIF metadata. Perfect for image processing, thumbnail generation, or format conversion workflows.',
    inputs: ['imageUrl', 'operation', 'width', 'height', 'format', 'preserveMetadata', 'maxSize'],
    outputs: ['image', 'metadata', 'dimensions'],
    example: `Operation: resize
Image URL: https://example.com/photo.jpg
Width: 800
Height: 600
Format: jpeg
Preserve Metadata: true

Output: {
  image: "base64_encoded_resized_image...",
  dimensions: {
    width: 800,
    height: 600
  },
  metadata: {...}
}`,
    tips: [
      'Resize: changes image dimensions',
      'Crop: crops image to specific size',
      'Convert format: changes image format (JPEG, PNG, WebP)',
      'Read metadata: extracts EXIF and image information',
      'Preserve metadata to keep EXIF data (enabled by default)',
    ],
  },

  // ============================================
  // CRM NODES
  // ============================================
  hubspot: {
    overview: 'Interact with HubSpot CRM to manage contacts, companies, deals, tickets, and other CRM objects. Supports CRUD operations, search, and batch processing. Perfect for sales automation, marketing automation, or customer relationship management.',
    inputs: ['authType', 'apiKey', 'accessToken', 'resource', 'operation', 'id', 'properties', 'searchQuery', 'limit'],
    outputs: ['result', 'records', 'paging'],
    example: `Resource: contact
Operation: create
Properties: {
  "email": "john@example.com",
  "firstname": "John",
  "lastname": "Doe"
}

Output: {
  result: {
    id: "12345",
    properties: {
      email: "john@example.com",
      firstname: "John",
      lastname: "Doe"
    }
  }
}`,
    tips: [
      'Use API Key for simple integrations',
      'Use OAuth2 Access Token for secure integrations',
      'Resources: contact, company, deal, ticket, product, etc.',
      'Batch operations for processing multiple records',
      'Search operation uses HubSpot search syntax',
    ],
  },

  salesforce: {
    overview: 'Interact with Salesforce CRM using SOQL queries, SOSL search, or CRUD operations. Supports standard objects (Account, Contact, Lead, Opportunity) and custom objects. Perfect for enterprise CRM automation, sales pipeline management, or Salesforce data integration.',
    inputs: ['instanceUrl', 'accessToken', 'resource', 'operation', 'soql', 'sosl', 'id', 'fields', 'externalIdField', 'externalIdValue'],
    outputs: ['records', 'result', 'totalSize'],
    example: `Resource: Contact
Operation: query
SOQL Query: SELECT Id, Name, Email FROM Contact WHERE Email = 'john@example.com' LIMIT 10

Output: {
  records: [
    {
      Id: "003xx000004TmiQAAS",
      Name: "John Doe",
      Email: "john@example.com"
    }
  ],
  totalSize: 1
}`,
    tips: [
      'Instance URL: https://yourinstance.salesforce.com',
      'Use SOQL for structured queries',
      'Use SOSL for full-text search',
      'Upsert uses External ID fields',
      'Bulk operations for large data sets',
    ],
  },

  zoho_crm: {
    overview: 'Interact with Zoho CRM to manage leads, contacts, accounts, deals, and other CRM modules. Supports CRUD operations, search, and bulk processing. Perfect for small to medium business CRM automation or Zoho ecosystem integration.',
    inputs: ['accessToken', 'module', 'operation', 'id', 'data', 'criteria', 'limit'],
    outputs: ['result', 'data', 'info'],
    example: `Module: Contacts
Operation: create
Data: {
  "First_Name": "John",
  "Last_Name": "Doe",
  "Email": "john@example.com"
}

Output: {
  result: {
    id: "1234567890123456789",
    status: "success"
  },
  data: {
    First_Name: "John",
    Last_Name: "Doe",
    Email: "john@example.com"
  }
}`,
    tips: [
      'Get access token from Zoho Developer Console',
      'Modules: Leads, Contacts, Accounts, Deals, etc.',
      'Use criteria for search operations',
      'Bulk operations available for efficiency',
      'Field names are case-sensitive',
    ],
  },

  pipedrive: {
    overview: 'Interact with Pipedrive CRM to manage deals, persons, organizations, and activities. Supports CRUD operations and search. Perfect for sales pipeline management, deal tracking, or Pipedrive automation.',
    inputs: ['apiToken', 'resource', 'operation', 'id', 'data', 'filter', 'limit'],
    outputs: ['result', 'data', 'additional_data'],
    example: `Resource: deals
Operation: create
Data: {
  "title": "New Deal",
  "value": 10000,
  "currency": "USD",
  "person_id": 123
}

Output: {
  result: {
    id: 12345,
    title: "New Deal",
    value: 10000,
    currency: "USD"
  }
}`,
    tips: [
      'Get API token from Pipedrive Settings → Personal → API',
      'Resources: deals, persons, organizations, activities',
      'Filter operations for searching',
      'Use person_id or org_id to link deals',
      'Currency codes: USD, EUR, GBP, etc.',
    ],
  },

  // ============================================
  // ADDITIONAL NODES
  // ============================================
  quickbooks: {
    overview: 'Interact with QuickBooks Online API to manage customers, invoices, payments, and accounting data. Supports CRUD operations and queries. Perfect for accounting automation, invoice processing, or financial data integration.',
    inputs: ['accessToken', 'realmId', 'resource', 'operation', 'id', 'data', 'query'],
    outputs: ['result', 'QueryResponse'],
    example: `Resource: Customer
Operation: create
Data: {
  "DisplayName": "Acme Corp",
  "PrimaryEmailAddr": {
    "Address": "contact@acme.com"
  }
}

Output: {
  result: {
    Id: "123",
    DisplayName: "Acme Corp",
    PrimaryEmailAddr: {
      Address: "contact@acme.com"
    }
  }
}`,
    tips: [
      'Get credentials from QuickBooks Developer account',
      'Realm ID is your company ID',
      'Resources: Customer, Invoice, Payment, Item, etc.',
      'Use query for filtering and searching',
      'OAuth2 authentication required',
    ],
  },

  xero: {
    overview: 'Interact with Xero accounting software to manage contacts, invoices, payments, and financial data. Supports CRUD operations and queries. Perfect for accounting automation, invoice management, or Xero ecosystem integration.',
    inputs: ['accessToken', 'tenantId', 'resource', 'operation', 'id', 'data', 'where'],
    outputs: ['result', 'Items'],
    example: `Resource: Contacts
Operation: create
Data: {
  "Name": "Acme Corp",
  "EmailAddress": "contact@acme.com"
}

Output: {
  result: {
    ContactID: "12345678-1234-1234-1234-123456789012",
    Name: "Acme Corp",
    EmailAddress: "contact@acme.com"
  }
}`,
    tips: [
      'Get access token from Xero Developer Portal',
      'Tenant ID is your organization ID',
      'Resources: Contacts, Invoices, Payments, Items, etc.',
      'Use where clause for filtering',
      'OAuth2 authentication required',
    ],
  },

  jwt: {
    overview: 'Create, verify, or decode JSON Web Tokens (JWT). Supports HS256, RS256, and other algorithms. Perfect for authentication, API security, or token-based authorization.',
    inputs: ['operation', 'algorithm', 'secret', 'header', 'payload', 'token'],
    outputs: ['token', 'decoded', 'valid'],
    example: `Operation: create
Algorithm: HS256
Secret: "your-secret-key"
Payload: {
  "sub": "user123",
  "exp": 1735689600,
  "iat": 1704153600
}

Output: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNzM1Njg5NjAwLCJpYXQiOjE3MDQxNTM2MDB9.signature"
}`,
    tips: [
      'Create: generates new JWT token',
      'Verify: validates token signature and expiration',
      'Decode: extracts payload without verification',
      'HS256: symmetric algorithm (requires secret)',
      'RS256: asymmetric algorithm (requires public/private key)',
    ],
  },

  okta: {
    overview: 'Interact with Okta identity management platform. Manage users, groups, applications, and authentication. Perfect for user management automation, SSO integration, or identity provider workflows.',
    inputs: ['domain', 'apiToken', 'resource', 'operation', 'id', 'data'],
    outputs: ['result', 'profile'],
    example: `Resource: users
Operation: create
Data: {
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "login": "john@example.com"
  }
}

Output: {
  result: {
    id: "00u1234567890abcdef",
    profile: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com"
    }
  }
}`,
    tips: [
      'Domain: your-org.okta.com',
      'Get API token from Okta Admin Console',
      'Resources: users, groups, applications, factors',
      'Profile contains user attributes',
      'Use for user provisioning and management',
    ],
  },

  keycloak: {
    overview: 'Interact with Keycloak identity and access management. Manage users, roles, clients, and authentication. Perfect for SSO automation, user management, or Keycloak administration workflows.',
    inputs: ['serverUrl', 'realm', 'clientId', 'clientSecret', 'resource', 'operation', 'id', 'data'],
    outputs: ['result', 'access_token'],
    example: `Server URL: https://keycloak.example.com
Realm: master
Resource: users
Operation: create
Data: {
  "username": "john",
  "email": "john@example.com",
  "enabled": true
}

Output: {
  result: {
    id: "12345678-1234-1234-1234-123456789012",
    username: "john",
    email: "john@example.com"
  }
}`,
    tips: [
      'Server URL: your Keycloak server address',
      'Realm: authentication realm name',
      'Client ID and Secret for authentication',
      'Resources: users, roles, clients, groups',
      'Use for identity management automation',
    ],
  },

  // ============================================
  // AI AGENT NODES
  // ============================================
  meeting_notes_agent: {
    overview: 'AI agent that extracts structured meeting notes from transcripts. Identifies agenda items, decisions made, and action items. Perfect for automating meeting documentation, note-taking workflows, or meeting summary generation.',
    inputs: ['apiKey', 'model', 'prompt', 'meetingTranscript', 'temperature'],
    outputs: ['agenda', 'decisions', 'notes', 'actionItems'],
    example: `Meeting Transcript: "In today's meeting, we discussed Q4 goals. John agreed to finish the project by Friday. Decision: Launch next week."
Temperature: 0.5

Output: {
  agenda: ["Q4 Goals", "Project Timeline"],
  decisions: ["Launch next week"],
  notes: "Discussed Q4 goals and project timeline...",
  actionItems: [
    {
      task: "Finish project",
      owner: "John",
      deadline: "Friday"
    }
  ]
}`,
    tips: [
      'Extracts structured data from unstructured transcripts',
      'Identifies agenda items, decisions, and action items',
      'Temperature 0.5 recommended for balanced extraction',
      'Use for automated meeting documentation',
      'Customize prompt for specific meeting formats',
    ],
  },

  action_items_extractor: {
    overview: 'AI agent that extracts action items (tasks, owners, deadlines) from text. Perfect for task management automation, email processing, or document analysis workflows.',
    inputs: ['apiKey', 'model', 'prompt', 'text', 'temperature'],
    outputs: ['actionItems'],
    example: `Text: "John will complete the report by Friday. Sarah should review the proposal. Mike needs to schedule the meeting."
Temperature: 0.5

Output: {
  actionItems: [
    {
      task: "Complete the report",
      owner: "John",
      deadline: "Friday"
    },
    {
      task: "Review the proposal",
      owner: "Sarah",
      deadline: null
    },
    {
      task: "Schedule the meeting",
      owner: "Mike",
      deadline: null
    }
  ]
}`,
    tips: [
      'Extracts tasks, owners, and deadlines from text',
      'Handles natural language descriptions',
      'Temperature 0.5 recommended for consistent extraction',
      'Use for task management automation',
      'Can extract from emails, documents, or messages',
    ],
  },

  workflow_planner_agent: {
    overview: 'AI agent that analyzes requirements and generates workflow plans. Creates step-by-step workflows based on goals and constraints. Perfect for workflow automation planning or intelligent workflow generation.',
    inputs: ['apiKey', 'model', 'prompt', 'requirements', 'temperature'],
    outputs: ['workflow', 'steps', 'recommendations'],
    example: `Requirements: "Send email notification when new order is created"
Temperature: 0.3

Output: {
  workflow: {
    steps: [
      {
        step: 1,
        node: "webhook",
        description: "Trigger on new order"
      },
      {
        step: 2,
        node: "email_resend",
        description: "Send notification email"
      }
    ]
  },
  recommendations: ["Add error handling", "Include order details in email"]
}`,
    tips: [
      'Generates workflow plans from requirements',
      'Provides step-by-step instructions',
      'Temperature 0.3 recommended for planning tasks',
      'Use for workflow automation planning',
      'Customize prompt for specific workflow patterns',
    ],
  },

  // ============================================
  // DATABASE NODES
  // ============================================
  postgresql: {
    overview: 'Query PostgreSQL databases using SELECT queries or raw SQL. Supports standard PostgreSQL SQL syntax, joins, subqueries, and advanced features. Perfect for relational database operations, data analysis, or PostgreSQL-specific features.',
    inputs: ['host', 'port', 'database', 'username', 'password', 'operation', 'table', 'query', 'filters', 'limit', 'orderBy', 'ascending'],
    outputs: ['rows', 'count'],
    example: `Operation: query
SQL Query: SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' LIMIT 10

Output: {
  rows: [
    {name: "John Doe", total: 1000},
    {name: "Jane Smith", total: 1500}
  ],
  count: 2
}`,
    tips: [
      'Supports standard PostgreSQL SQL syntax',
      'Use Raw SQL for complex queries with JOINs',
      'Select operation for simple queries with filters',
      'PostgreSQL-specific features supported in Raw SQL',
      'Use connection pooling for better performance',
    ],
  },

  supabase: {
    overview: 'Query Supabase (PostgreSQL-based) databases using SELECT queries or raw SQL. Supabase uses PostgreSQL, so same syntax applies. Perfect for Supabase projects, real-time applications, or PostgreSQL database operations.',
    inputs: ['projectUrl', 'apiKey', 'operation', 'table', 'query', 'filters', 'limit', 'orderBy', 'ascending'],
    outputs: ['rows', 'count'],
    example: `Operation: select
Table: users
Filters: {"status": "active"}
Limit: 10

Output: {
  rows: [
    {id: 1, name: "John", status: "active"},
    {id: 2, name: "Jane", status: "active"}
  ],
  count: 2
}`,
    tips: [
      'Uses PostgreSQL syntax (same as PostgreSQL node)',
      'Get project URL and API key from Supabase dashboard',
      'Select operation for simple queries',
      'Raw SQL for complex queries with JOINs',
      'Perfect for Supabase project integration',
    ],
  },

  mysql: {
    overview: 'Query MySQL databases using SELECT queries. Currently supports simple SELECT operations with filters. Perfect for MySQL database queries, data retrieval, or MySQL-specific operations.',
    inputs: ['host', 'port', 'database', 'username', 'password', 'table', 'filters', 'limit'],
    outputs: ['rows', 'count'],
    example: `Table: users
Filters: {"status": "active"}
Limit: 10

Output: {
  rows: [
    {id: 1, name: "John", status: "active"},
    {id: 2, name: "Jane", status: "active"}
  ],
  count: 2
}`,
    tips: [
      'Currently supports SELECT operations only',
      'Use filters for WHERE clause conditions',
      'Simple query interface for quick data retrieval',
      'Use PostgreSQL node for complex queries',
      'Perfect for basic MySQL queries',
    ],
  },

  mongodb: {
    overview: 'Query MongoDB collections using find operations. Supports MongoDB query syntax with operators ($gt, $gte, $regex, etc.). Perfect for NoSQL database operations, document queries, or MongoDB-specific features.',
    inputs: ['connectionString', 'database', 'collection', 'query', 'limit'],
    outputs: ['documents', 'count'],
    example: `Collection: users
Query: {"status": "active", "age": {"$gte": 18}}
Limit: 10

Output: {
  documents: [
    {_id: "123", name: "John", status: "active", age: 25},
    {_id: "456", name: "Jane", status: "active", age: 30}
  ],
  count: 2
}`,
    tips: [
      'Currently supports Find operation only',
      'Use MongoDB query operators ($gt, $gte, $regex, etc.)',
      'Collection names are similar to tables in SQL',
      'Query format is JSON with MongoDB operators',
      'Perfect for NoSQL document queries',
    ],
  },

  // ============================================
  // DEVOPS NODES
  // ============================================
  github: {
    overview: 'Interact with GitHub API to manage repositories, issues, pull requests, branches, commits, releases, and workflows. Supports comprehensive GitHub operations. Perfect for GitHub automation, CI/CD integration, or repository management.',
    inputs: ['token', 'owner', 'repo', 'operation', 'title', 'body', 'workflowId', 'ref'],
    outputs: ['result', 'data', 'workflowRuns'],
    example: `Operation: create_issue
Owner: octocat
Repo: Hello-World
Title: "Bug in login"
Body: "Login button not working"

Output: {
  result: {
    number: 123,
    title: "Bug in login",
    state: "open"
  }
}`,
    tips: [
      'Get token from GitHub Settings → Developer settings → Personal access tokens',
      'Owner is username or organization name',
      'Repo is repository name',
      'Supports issues, PRs, branches, commits, releases, workflows',
      'Use for GitHub automation and CI/CD integration',
    ],
  },

  gitlab: {
    overview: 'Interact with GitLab API to manage projects, issues, merge requests, branches, commits, pipelines, and releases. Supports comprehensive GitLab operations. Perfect for GitLab automation, CI/CD integration, or project management.',
    inputs: ['token', 'projectId', 'operation', 'data'],
    outputs: ['result', 'data'],
    example: `Operation: create_issue
Project ID: 12345
Data: {
  "title": "Feature request",
  "description": "Add new feature"
}

Output: {
  result: {
    iid: 1,
    title: "Feature request",
    state: "opened"
  }
}`,
    tips: [
      'Get token from GitLab Settings → Access Tokens',
      'Project ID is numeric identifier or path',
      'Supports issues, MRs, branches, commits, pipelines',
      'Use for GitLab automation and CI/CD',
      'Works with GitLab.com and self-hosted instances',
    ],
  },

  bitbucket: {
    overview: 'Interact with Bitbucket API to manage repositories, pull requests, branches, commits, and pipelines. Supports Bitbucket Cloud operations. Perfect for Bitbucket automation or repository management.',
    inputs: ['username', 'appPassword', 'workspace', 'repo', 'operation', 'data'],
    outputs: ['result', 'data'],
    example: `Operation: create_pull_request
Workspace: my-workspace
Repo: my-repo
Data: {
  "title": "New feature",
  "source": {"branch": {"name": "feature-branch"}},
  "destination": {"branch": {"name": "main"}}
}

Output: {
  result: {
    id: 1,
    title: "New feature",
    state: "OPEN"
  }
}`,
    tips: [
      'Use App Password from Bitbucket Settings → App passwords',
      'Workspace is username or organization',
      'Supports PRs, branches, commits, pipelines',
      'Use for Bitbucket Cloud automation',
      'App passwords required instead of personal access tokens',
    ],
  },

  docker: {
    overview: 'Interact with Docker daemon to manage containers and images. Supports listing, building, tagging, pushing, pulling images, and managing containers. Perfect for Docker automation, CI/CD pipelines, or container management.',
    inputs: ['host', 'port', 'operation', 'containerId', 'imageName', 'dockerfilePath', 'buildContext', 'tag', 'registry', 'registryUsername', 'registryPassword'],
    outputs: ['result', 'containers', 'images', 'logs'],
    example: `Operation: list_containers
Host: localhost
Port: 2375

Output: {
  containers: [
    {
      id: "abc123",
      name: "my-container",
      status: "running",
      image: "nginx:latest"
    }
  ]
}`,
    tips: [
      'Host: localhost or Unix socket path (unix:///var/run/docker.sock)',
      'Port: 2375 (TCP) or 2376 (TLS)',
      'Supports containers and images management',
      'Build images from Dockerfile',
      'Push/pull images from registries',
    ],
  },

  kubernetes: {
    overview: 'Interact with Kubernetes API to manage pods, deployments, services, and namespaces. Supports comprehensive Kubernetes operations including scaling, restarting, and log retrieval. Perfect for Kubernetes automation, CI/CD, or cluster management.',
    inputs: ['apiServer', 'token', 'namespace', 'operation', 'resourceName', 'deploymentManifest', 'replicas'],
    outputs: ['result', 'pods', 'deployments', 'services', 'logs'],
    example: `Operation: list_pods
Namespace: default
API Server: https://kubernetes.example.com:6443

Output: {
  pods: [
    {
      name: "my-pod",
      namespace: "default",
      status: "Running",
      ready: true
    }
  ]
}`,
    tips: [
      'Get API Server URL from kubeconfig or kubectl cluster-info',
      'Get token from kubeconfig or service account',
      'Namespace defaults to "default"',
      'Supports pods, deployments, services management',
      'Use for Kubernetes automation and orchestration',
    ],
  },

  jenkins: {
    overview: 'Interact with Jenkins API to manage jobs, builds, and pipelines. Supports triggering builds, getting build status, and managing jobs. Perfect for CI/CD automation or Jenkins integration.',
    inputs: ['baseUrl', 'username', 'token', 'jobName', 'operation', 'parameters'],
    outputs: ['result', 'jobs', 'builds', 'buildStatus'],
    example: `Operation: trigger_build
Base URL: https://jenkins.example.com
Job Name: my-job
Parameters: {"BRANCH": "main"}

Output: {
  result: {
    buildNumber: 123,
    status: "QUEUED"
  }
}`,
    tips: [
      'Base URL: your Jenkins server URL',
      'Get token from Jenkins → Configure → API Token',
      'Supports job management and build triggering',
      'Use for CI/CD automation',
      'Parameters passed as JSON object',
    ],
  },

  pagerduty: {
    overview: 'Interact with PagerDuty API to manage incidents, alerts, and on-call schedules. Supports creating incidents, acknowledging/resolving incidents, and managing on-call rotations. Perfect for incident management automation or alert integration.',
    inputs: ['apiKey', 'operation', 'incidentId', 'data'],
    outputs: ['result', 'incidents', 'onCallSchedules'],
    example: `Operation: create_incident
API Key: your-api-key
Data: {
  "title": "Service Down",
  "service": {"id": "service_id"},
  "urgency": "high"
}

Output: {
  result: {
    id: "incident_id",
    title: "Service Down",
    status: "triggered"
  }
}`,
    tips: [
      'Get API key from PagerDuty → Configuration → API → API Access Keys',
      'Supports incident management and on-call schedules',
      'Use for alert automation and incident response',
      'Integrate with monitoring tools',
      'Create incidents, acknowledge, resolve automatically',
    ],
  },

  datadog: {
    overview: 'Interact with Datadog API to query metrics, events, logs, and monitors. Supports time-series queries, event creation, and monitor management. Perfect for monitoring automation, metric analysis, or Datadog integration.',
    inputs: ['apiKey', 'appKey', 'operation', 'query', 'data'],
    outputs: ['result', 'metrics', 'events', 'logs'],
    example: `Operation: query_metrics
Query: "avg:system.cpu.usage{*}"
Time Range: "1h"

Output: {
  result: {
    series: [
      {
        pointlist: [[1234567890, 45.5], [1234567900, 46.2]],
        metric: "system.cpu.usage"
      }
    ]
  }
}`,
    tips: [
      'Get API key and App key from Datadog Settings → API Keys',
      'Supports metrics, events, logs, monitors',
      'Query metrics using Datadog query syntax',
      'Use for monitoring automation and analysis',
      'Create events and manage monitors programmatically',
    ],
  },

  sentry: {
    overview: 'Interact with Sentry API to manage projects, issues, events, and releases. Supports querying errors, creating releases, and managing projects. Perfect for error tracking automation or Sentry integration.',
    inputs: ['authToken', 'organization', 'project', 'operation', 'data'],
    outputs: ['result', 'issues', 'events', 'releases'],
    example: `Operation: list_issues
Organization: my-org
Project: my-project

Output: {
  issues: [
    {
      id: "issue_id",
      title: "Error in login",
      level: "error",
      count: 10
    }
  ]
}`,
    tips: [
      'Get auth token from Sentry Settings → Auth Tokens',
      'Organization and project slug required',
      'Supports issues, events, releases management',
      'Use for error tracking automation',
      'Query issues and events programmatically',
    ],
  },

  // ============================================
  // PRODUCTIVITY NODES
  // ============================================
  asana: {
    overview: 'Interact with Asana API to manage projects, tasks, subtasks, and teams. Supports creating tasks, updating status, assigning tasks, and managing projects. Perfect for project management automation or Asana integration.',
    inputs: ['accessToken', 'workspace', 'project', 'operation', 'data'],
    outputs: ['result', 'tasks', 'projects'],
    example: `Operation: create_task
Project: 12345
Data: {
  "name": "Complete report",
  "assignee": "user@example.com",
  "due_on": "2024-01-20"
}

Output: {
  result: {
    gid: "task_id",
    name: "Complete report",
    completed: false
  }
}`,
    tips: [
      'Get access token from Asana Developer Console',
      'Workspace and project IDs required',
      'Supports tasks, projects, teams management',
      'Use for project management automation',
      'Create, update, assign tasks programmatically',
    ],
  },

  trello: {
    overview: 'Interact with Trello API to manage boards, lists, cards, and members. Supports creating cards, moving cards, adding comments, and managing boards. Perfect for task management automation or Trello integration.',
    inputs: ['apiKey', 'apiToken', 'boardId', 'operation', 'data'],
    outputs: ['result', 'cards', 'boards', 'lists'],
    example: `Operation: create_card
Board ID: board123
List ID: list456
Data: {
  "name": "New task",
  "desc": "Task description"
}

Output: {
  result: {
    id: "card_id",
    name: "New task",
    idList: "list456"
  }
}`,
    tips: [
      'Get API key and token from Trello Developer API Keys',
      'Board ID and List ID required for card operations',
      'Supports boards, lists, cards, members',
      'Use for task management automation',
      'Move cards between lists, add comments, attach files',
    ],
  },

  todoist: {
    overview: 'Interact with Todoist API to manage tasks, projects, labels, and comments. Supports creating tasks, updating status, completing tasks, and managing projects. Perfect for task automation or Todoist integration.',
    inputs: ['apiToken', 'operation', 'projectId', 'data'],
    outputs: ['result', 'tasks', 'projects'],
    example: `Operation: create_task
Project ID: 1234567890
Data: {
  "content": "Buy groceries",
  "due_string": "tomorrow",
  "priority": 4
}

Output: {
  result: {
    id: 12345,
    content: "Buy groceries",
    completed: false
  }
}`,
    tips: [
      'Get API token from Todoist Settings → Integrations → Developer',
      'Project ID required for project-specific tasks',
      'Supports tasks, projects, labels, comments',
      'Use for task automation and reminders',
      'Due dates support natural language (tomorrow, next week)',
    ],
  },

  notion: {
    overview: 'Interact with Notion API to manage pages, databases, blocks, and content. Supports creating pages, querying databases, updating content, and managing workspaces. Perfect for knowledge management automation or Notion integration.',
    inputs: ['accessToken', 'operation', 'databaseId', 'pageId', 'data'],
    outputs: ['result', 'pages', 'databases', 'blocks'],
    example: `Operation: create_page
Database ID: database_id
Data: {
  "properties": {
    "Name": {"title": [{"text": {"content": "New Page"}}]},
    "Status": {"select": {"name": "Active"}}
  }
}

Output: {
  result: {
    id: "page_id",
    properties: {
      Name: {"title": [{"text": {"content": "New Page"}}]}
    }
  }
}`,
    tips: [
      'Get access token from Notion → Settings & Members → Integrations',
      'Share database/page with integration bot',
      'Supports pages, databases, blocks management',
      'Use for knowledge management automation',
      'Query databases and create pages programmatically',
    ],
  },

  clickup: {
    overview: 'Interact with ClickUp API to manage workspaces, spaces, folders, lists, and tasks. Supports creating tasks, updating status, assigning tasks, and managing projects. Perfect for project management automation or ClickUp integration.',
    inputs: ['apiToken', 'workspaceId', 'spaceId', 'operation', 'data'],
    outputs: ['result', 'tasks', 'lists', 'spaces'],
    example: `Operation: create_task
List ID: list123
Data: {
  "name": "Complete task",
  "assignees": ["user_id"],
  "due_date": 1735689600000
}

Output: {
  result: {
    id: "task_id",
    name: "Complete task",
    status: {"status": "to do"}
  }
}`,
    tips: [
      'Get API token from ClickUp Settings → Apps → API',
      'Workspace, Space, and List IDs required',
      'Supports tasks, lists, folders, spaces',
      'Use for project management automation',
      'Create, update, assign tasks programmatically',
    ],
  },

  monday: {
    overview: 'Interact with Monday.com API to manage boards, groups, items, and columns. Supports creating items, updating column values, and managing boards. Perfect for project management automation or Monday.com integration.',
    inputs: ['apiToken', 'boardId', 'operation', 'data'],
    outputs: ['result', 'items', 'boards', 'groups'],
    example: `Operation: create_item
Board ID: 1234567890
Group ID: new_group
Data: {
  "item_name": "New item",
  "column_values": {
    "status": {"label": "Working on it"}
  }
}

Output: {
  result: {
    id: "item_id",
    name: "New item",
    board: {"id": "1234567890"}
  }
}`,
    tips: [
      'Get API token from Monday.com Account → Admin → API',
      'Board ID and Group ID required',
      'Supports items, boards, groups, columns',
      'Use for project management automation',
      'Update column values and create items programmatically',
    ],
  },

  jira: {
    overview: 'Interact with Jira API to manage projects, issues, workflows, and users. Supports creating issues, updating status, adding comments, and managing projects. Perfect for issue tracking automation or Jira integration.',
    inputs: ['baseUrl', 'email', 'apiToken', 'operation', 'projectKey', 'data'],
    outputs: ['result', 'issues', 'projects'],
    example: `Operation: create_issue
Project Key: PROJ
Data: {
  "summary": "Bug in login",
  "description": "Login button not working",
  "issuetype": {"name": "Bug"}
}

Output: {
  result: {
    id: "10000",
    key: "PROJ-1",
    summary: "Bug in login"
  }
}`,
    tips: [
      'Get API token from Atlassian Account Settings → Security → API tokens',
      'Base URL: your Jira instance URL',
      'Project Key required for issue operations',
      'Supports issues, projects, workflows, users',
      'Use for issue tracking automation',
    ],
  },

  airtable: {
    overview: 'Interact with Airtable API to manage bases, tables, records, and fields. Supports creating records, updating fields, querying records, and managing bases. Perfect for database automation or Airtable integration.',
    inputs: ['apiKey', 'baseId', 'tableId', 'operation', 'data', 'fields'],
    outputs: ['result', 'records', 'tables'],
    example: `Operation: create_record
Base ID: app123
Table ID: tbl456
Data: {
  "fields": {
    "Name": "John Doe",
    "Email": "john@example.com"
  }
}

Output: {
  result: {
    id: "rec123",
    fields: {
      Name: "John Doe",
      Email: "john@example.com"
    }
  }
}`,
    tips: [
      'Get API key from Airtable Account → Developers → Personal access tokens',
      'Base ID and Table ID required',
      'Supports records, tables, fields management',
      'Use for database automation',
      'Query, create, update records programmatically',
    ],
  },

  // ============================================
  // SOCIAL MEDIA NODES
  // ============================================
  facebook: {
    overview: 'Interact with Facebook Graph API to manage posts, pages, comments, and messages. Supports creating posts, reading feeds, managing pages, and sending messages. Perfect for social media automation or Facebook integration.',
    inputs: ['accessToken', 'pageId', 'operation', 'data'],
    outputs: ['result', 'posts', 'comments', 'messages'],
    example: `Operation: create_post
Page ID: page123
Data: {
  "message": "Hello from CtrlChecks!",
  "link": "https://example.com"
}

Output: {
  result: {
    id: "post_id",
    message: "Hello from CtrlChecks!",
    created_time: "2024-01-15T10:30:00Z"
  }
}`,
    tips: [
      'Get access token from Facebook Developers → App → Tools → Graph API Explorer',
      'Page ID required for page operations',
      'Supports posts, pages, comments, messages',
      'Use for social media automation',
      'Requires appropriate Facebook App permissions',
    ],
  },

  twitter: {
    overview: 'Interact with Twitter API to manage tweets, users, timelines, and direct messages. Supports creating tweets, reading timelines, managing followers, and sending DMs. Perfect for social media automation or Twitter integration.',
    inputs: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret', 'operation', 'data'],
    outputs: ['result', 'tweets', 'users'],
    example: `Operation: create_tweet
Data: {
  "text": "Hello from CtrlChecks!"
}

Output: {
  result: {
    id: "tweet_id",
    text: "Hello from CtrlChecks!",
    created_at: "2024-01-15T10:30:00Z"
  }
}`,
    tips: [
      'Get credentials from Twitter Developer Portal → App → Keys and tokens',
      'Requires API key, secret, access token, and access token secret',
      'Supports tweets, users, timelines, direct messages',
      'Use for social media automation',
      'Rate limits apply - respect Twitter API limits',
    ],
  },

  linkedin: {
    overview: 'Interact with LinkedIn API to manage posts, profiles, connections, and messages. Supports creating posts, reading profiles, managing connections, and sending messages. Perfect for professional networking automation or LinkedIn integration.',
    inputs: ['accessToken', 'operation', 'data'],
    outputs: ['result', 'posts', 'profiles'],
    example: `Operation: create_post
Data: {
  "text": "Excited to share our new feature!",
  "visibility": "PUBLIC"
}

Output: {
  result: {
    id: "post_id",
    text: "Excited to share our new feature!",
    created: {"time": 1705314600000}
  }
}`,
    tips: [
      'Get access token from LinkedIn Developer Portal → App → Auth',
      'Requires OAuth 2.0 authentication',
      'Supports posts, profiles, connections, messages',
      'Use for professional networking automation',
      'Requires appropriate LinkedIn API permissions',
    ],
  },

  instagram: {
    overview: 'Interact with Instagram Graph API to manage posts, stories, comments, and media. Supports creating posts, reading feeds, managing comments, and uploading media. Perfect for Instagram automation or social media integration.',
    inputs: ['accessToken', 'pageId', 'operation', 'data'],
    outputs: ['result', 'posts', 'comments', 'media'],
    example: `Operation: create_post
Page ID: page123
Data: {
  "image_url": "https://example.com/image.jpg",
  "caption": "Check out our new product!"
}

Output: {
  result: {
    id: "media_id",
    permalink: "https://instagram.com/p/..."
  }
}`,
    tips: [
      'Get access token from Facebook Developers (Instagram uses Facebook Graph API)',
      'Page ID required (Instagram Business account)',
      'Supports posts, stories, comments, media',
      'Use for Instagram automation',
      'Requires Instagram Business account and appropriate permissions',
    ],
  },

  youtube: {
    overview: 'Interact with YouTube Data API to manage videos, playlists, channels, and comments. Supports uploading videos, reading playlists, managing channels, and moderating comments. Perfect for video content automation or YouTube integration.',
    inputs: ['apiKey', 'operation', 'channelId', 'data'],
    outputs: ['result', 'videos', 'playlists', 'channels'],
    example: `Operation: list_videos
Channel ID: channel123
Max Results: 10

Output: {
  videos: [
    {
      id: "video_id",
      title: "Video Title",
      publishedAt: "2024-01-15T10:30:00Z"
    }
  ]
}`,
    tips: [
      'Get API key from Google Cloud Console → APIs & Services → Credentials',
      'Enable YouTube Data API v3',
      'Channel ID required for channel-specific operations',
      'Supports videos, playlists, channels, comments',
      'Use for video content automation',
    ],
  },

  reddit: {
    overview: 'Interact with Reddit API to manage posts, comments, subreddits, and messages. Supports creating posts, reading feeds, managing comments, and sending messages. Perfect for Reddit automation or content management.',
    inputs: ['clientId', 'clientSecret', 'username', 'password', 'operation', 'data'],
    outputs: ['result', 'posts', 'comments', 'subreddits'],
    example: `Operation: create_post
Subreddit: test
Data: {
  "title": "New Post",
  "text": "Post content"
}

Output: {
  result: {
    id: "post_id",
    title: "New Post",
    subreddit: "test"
  }
}`,
    tips: [
      'Get credentials from Reddit → Preferences → Apps → create app',
      'Client ID and Secret required',
      'Username and password for authentication',
      'Supports posts, comments, subreddits, messages',
      'Use for Reddit automation and content management',
    ],
  },

  // ============================================
  // STORAGE & OTHER NODES
  // ============================================
  box: {
    overview: 'Interact with Box cloud storage to manage files and folders. Supports uploading, downloading, listing files, and managing folders. Perfect for cloud file management or Box integration.',
    inputs: ['accessToken', 'operation', 'fileId', 'path', 'content'],
    outputs: ['result', 'file', 'files'],
    example: `Operation: upload
Path: /Documents/file.txt
Content: "Hello World"

Output: {
  result: {
    id: "file_id",
    name: "file.txt",
    size: 11
  }
}`,
    tips: [
      'Get access token from Box Developer Console → OAuth 2.0',
      'Use OAuth 2.0 flow for authentication',
      'Supports files and folders management',
      'Use for cloud file management',
      'List, upload, download files programmatically',
    ],
  },

  onedrive: {
    overview: 'Interact with Microsoft OneDrive to manage files and folders. Supports uploading, downloading, listing files, and managing folders using Microsoft Graph API. Perfect for cloud file management or Microsoft integration.',
    inputs: ['accessToken', 'operation', 'path', 'content'],
    outputs: ['result', 'file', 'files'],
    example: `Operation: upload
Path: /Documents/file.txt
Content: "Hello World"

Output: {
  result: {
    id: "file_id",
    name: "file.txt",
    size: 11
  }
}`,
    tips: [
      'Get access token from Azure Portal → App registrations → Microsoft Graph API',
      'Requires Files.ReadWrite permission',
      'Supports files and folders via Microsoft Graph API',
      'Use for cloud file management',
      'List, upload, download files programmatically',
    ],
  },

  write_binary_file: {
    overview: 'Write binary files to the file system. Accepts base64-encoded content and writes it to the specified path. Perfect for file generation, backup creation, or file processing workflows.',
    inputs: ['filePath', 'content'],
    outputs: ['result', 'filePath', 'size'],
    example: `File Path: /tmp/data.txt
Content: "SGVsbG8gV29ybGQ=" (base64 for "Hello World")

Output: {
  result: "success",
  filePath: "/tmp/data.txt",
  size: 11
}`,
    tips: [
      'Content must be base64-encoded',
      'File will be created if it doesn\'t exist',
      'Supports absolute and relative paths',
      'Use for file generation and backups',
      'Files are written to the local filesystem (default /tmp/ on the backend)',
    ],
  },

  document_ocr: {
    overview: 'Extract text from images or PDF documents using OCR (Optical Character Recognition). Supports multiple languages, layout detection, and confidence scoring. Perfect for document digitization, text extraction, or document processing.',
    inputs: ['file', 'language', 'detectLayout', 'confidenceRequired'],
    outputs: ['text', 'confidence', 'layout'],
    example: `File: {
  "name": "document.pdf",
  "type": "pdf",
  "binary": "base64_encoded_pdf..."
}
Language: auto
Detect Layout: true

Output: {
  text: "Extracted text from document...",
  confidence: 0.95,
  layout: {...}
}`,
    tips: [
      'Supports PDF, PNG, JPEG, TIFF formats',
      'Language: auto-detect or specify (en, es, fr, etc.)',
      'Detect layout for structured documents',
      'Confidence score indicates extraction quality',
      'Use for document digitization and text extraction',
    ],
  },

  intercom: {
    overview: 'Interact with Intercom API to manage contacts, conversations, messages, and teams. Supports creating contacts, sending messages, managing conversations, and accessing help center. Perfect for customer support automation or Intercom integration.',
    inputs: ['accessToken', 'resource', 'operation', 'id', 'data'],
    outputs: ['result', 'contacts', 'conversations', 'messages'],
    example: `Resource: contacts
Operation: create
Data: {
  "email": "user@example.com",
  "name": "John Doe"
}

Output: {
  result: {
    id: "contact_id",
    email: "user@example.com",
    name: "John Doe"
  }
}`,
    tips: [
      'Get access token from Intercom → Settings → Developers → Access tokens',
      'Resources: contacts, conversations, messages, teams',
      'Use for customer support automation',
      'Create contacts, send messages, manage conversations',
      'Integrate with help center and live chat',
    ],
  },

  mailchimp: {
    overview: 'Interact with Mailchimp API to manage audiences, campaigns, lists, and members. Supports creating campaigns, managing subscribers, segmenting audiences, and tracking analytics. Perfect for email marketing automation or Mailchimp integration.',
    inputs: ['apiKey', 'dataCenter', 'resource', 'operation', 'listId', 'data'],
    outputs: ['result', 'members', 'campaigns', 'audiences'],
    example: `Resource: audience
Operation: add_member
List ID: list123
Data: {
  "email_address": "user@example.com",
  "status": "subscribed"
}

Output: {
  result: {
    id: "member_id",
    email_address: "user@example.com",
    status: "subscribed"
  }
}`,
    tips: [
      'Get API key from Mailchimp Account → Extras → API keys',
      'Data center from API key (e.g., us1, us2, eu1)',
      'Resources: audience, campaigns, lists, members',
      'Use for email marketing automation',
      'Add subscribers, create campaigns, manage lists',
    ],
  },

  freshdesk: {
    overview: 'Interact with Freshdesk API to manage tickets, contacts, agents, and conversations. Supports creating tickets, updating status, managing contacts, and accessing knowledge base. Perfect for customer support automation or Freshdesk integration.',
    inputs: ['apiKey', 'domain', 'resource', 'operation', 'id', 'data'],
    outputs: ['result', 'tickets', 'contacts', 'agents'],
    example: `Resource: ticket
Operation: create
Data: {
  "subject": "Support request",
  "description": "Need help with login",
  "email": "user@example.com"
}

Output: {
  result: {
    id: 12345,
    subject: "Support request",
    status: 2
  }
}`,
    tips: [
      'Get API key from Freshdesk Profile → API',
      'Domain: your Freshdesk subdomain',
      'Resources: ticket, contact, agent, conversation',
      'Use for customer support automation',
      'Create tickets, update status, manage contacts',
    ],
  },

  // ============================================
  // SPECIALIZED AI AGENTS & AUTOMATION NODES
  // ============================================
  ai_agent: {
    overview: 'Generic AI agent node that can perform various AI tasks with customizable prompts. Supports multi-iteration reasoning and tool use. Perfect for complex AI tasks that require custom behavior or multi-step reasoning.',
    inputs: ['apiKey', 'model', 'prompt', 'task', 'maxIterations'],
    outputs: ['result', 'iterations', 'reasoning'],
    example: `Model: gpt-4o
Task: "Analyze this data and provide insights"
Max Iterations: 5

Output: {
  result: "Analysis insights...",
  iterations: 3,
  reasoning: "Step-by-step analysis..."
}`,
    tips: [
      'Generic AI agent for custom tasks',
      'Supports multi-iteration reasoning',
      'Customize prompt for specific behavior',
      'Max iterations prevent infinite loops',
      'Use for complex AI tasks requiring reasoning',
    ],
  },

  accuracy_evaluator: {
    overview: 'AI agent that evaluates the accuracy of AI-generated responses or predictions. Compares outputs against ground truth or known correct answers. Perfect for quality assurance, model evaluation, or accuracy monitoring.',
    inputs: ['apiKey', 'model', 'prompt', 'response', 'groundTruth', 'temperature'],
    outputs: ['accuracy', 'score', 'errors', 'feedback'],
    example: `Response: "Paris is the capital of France"
Ground Truth: "Paris is the capital of France"

Output: {
  accuracy: true,
  score: 1.0,
  errors: [],
  feedback: "Correct answer"
}`,
    tips: [
      'Evaluates AI response accuracy',
      'Compares against ground truth',
      'Provides accuracy score and feedback',
      'Use for quality assurance',
      'Temperature 0.3 recommended for evaluation',
    ],
  },

  agent_performance_tracker: {
    overview: 'Tracks and monitors performance metrics for AI agents. Collects execution time, success rate, cost, and other performance indicators. Perfect for agent monitoring, optimization, or performance analysis.',
    inputs: ['agentId', 'metrics', 'timeWindow'],
    outputs: ['performance', 'metrics', 'trends'],
    example: `Agent ID: agent_123
Metrics: ["executionTime", "successRate", "cost"]
Time Window: "24h"

Output: {
  performance: {
    executionTime: 1.5,
    successRate: 0.95,
    cost: 0.02
  },
  trends: {...}
}`,
    tips: [
      'Tracks agent performance metrics',
      'Monitors execution time, success rate, cost',
      'Time window for metric aggregation',
      'Use for agent optimization',
      'Identifies performance trends',
    ],
  },

  agent_role_assigner: {
    overview: 'AI agent that assigns roles to team members or agents based on skills, availability, and workload. Perfect for task distribution, workload balancing, or team management automation.',
    inputs: ['apiKey', 'model', 'prompt', 'teamMembers', 'tasks', 'criteria'],
    outputs: ['assignments', 'reasoning'],
    example: `Team Members: [
  {"name": "John", "skills": ["frontend", "react"]},
  {"name": "Jane", "skills": ["backend", "python"]}
]
Tasks: ["Build UI", "Create API"]

Output: {
  assignments: {
    "Build UI": "John",
    "Create API": "Jane"
  },
  reasoning: "Based on skills match..."
}`,
    tips: [
      'Assigns roles based on criteria',
      'Considers skills, availability, workload',
      'Provides assignment reasoning',
      'Use for task distribution',
      'Temperature 0.3 recommended for consistent assignments',
    ],
  },

  agent_voting_consensus: {
    overview: 'Coordinates multiple AI agents to reach consensus through voting. Collects opinions from multiple agents and determines the final decision. Perfect for multi-agent systems, consensus building, or decision-making automation.',
    inputs: ['agents', 'question', 'votingMethod'],
    outputs: ['consensus', 'votes', 'confidence'],
    example: `Question: "Is this code secure?"
Agents: [agent1, agent2, agent3]
Voting Method: "majority"

Output: {
  consensus: "Yes",
  votes: {"Yes": 2, "No": 1},
  confidence: 0.67
}`,
    tips: [
      'Coordinates multiple AI agents',
      'Reaches consensus through voting',
      'Voting methods: majority, unanimous, weighted',
      'Use for multi-agent decision making',
      'Higher confidence with more agents',
    ],
  },

  alert_correlation_engine: {
    overview: 'Correlates multiple alerts to identify root causes and reduce alert fatigue. Groups related alerts and identifies patterns. Perfect for monitoring automation, incident management, or alert optimization.',
    inputs: ['alerts', 'correlationRules', 'timeWindow'],
    outputs: ['correlatedAlerts', 'patterns', 'rootCauses'],
    example: `Alerts: [
  {"source": "server1", "type": "cpu_high"},
  {"source": "server1", "type": "memory_high"}
]
Time Window: "5m"

Output: {
  correlatedAlerts: {
    "incident_123": ["cpu_high", "memory_high"]
  },
  rootCauses: ["server1 overload"],
  patterns: {...}
}`,
    tips: [
      'Correlates related alerts',
      'Reduces alert fatigue',
      'Identifies root causes',
      'Time window for correlation',
      'Use for monitoring automation',
    ],
  },

  anomaly_detection_agent: {
    overview: 'AI agent that detects anomalies in datasets or time-series data. Identifies outliers and explains deviations from baseline patterns. Perfect for monitoring, fraud detection, or anomaly identification.',
    inputs: ['apiKey', 'model', 'prompt', 'dataset', 'baseline', 'temperature'],
    outputs: ['anomalies', 'anomalyScore', 'pattern'],
    example: `Dataset: [10, 11, 12, 9, 50, 11, 10]
Baseline: {"mean": 10.5, "std": 1.0}

Output: {
  anomalies: [50],
  anomalyScore: 0.95,
  pattern: "Single outlier significantly above mean"
}`,
    tips: [
      'Detects outliers in datasets',
      'Compares against baseline patterns',
      'Provides anomaly scores',
      'Use for monitoring and fraud detection',
      'Temperature 0.3 recommended for analysis',
    ],
  },

  audit_trail_generator: {
    overview: 'Generates audit trails for workflow executions, user actions, or system events. Tracks who did what, when, and why. Perfect for compliance, security, or audit logging.',
    inputs: ['events', 'userId', 'metadata'],
    outputs: ['auditTrail', 'timeline'],
    example: `Events: [
  {"action": "login", "timestamp": "2024-01-15T10:00:00Z"},
  {"action": "create_record", "timestamp": "2024-01-15T10:05:00Z"}
]
User ID: user123

Output: {
  auditTrail: [
    {"user": "user123", "action": "login", "timestamp": "..."},
    {"user": "user123", "action": "create_record", "timestamp": "..."}
  ],
  timeline: {...}
}`,
    tips: [
      'Generates comprehensive audit trails',
      'Tracks user actions and events',
      'Includes timestamps and metadata',
      'Use for compliance and security',
      'Creates immutable audit logs',
    ],
  },

  auto_remediation_planner: {
    overview: 'AI agent that analyzes incidents and generates remediation plans. Identifies issues and suggests automated fixes. Perfect for incident response automation or self-healing systems.',
    inputs: ['apiKey', 'model', 'prompt', 'incident', 'availableActions', 'temperature'],
    outputs: ['remediationPlan', 'steps', 'riskAssessment'],
    example: `Incident: {
  "type": "high_cpu",
  "severity": "critical",
  "source": "server1"
}

Output: {
  remediationPlan: {
    steps: [
      {"action": "scale_up", "target": "server1"},
      {"action": "restart_service", "service": "app"}
    ]
  },
  riskAssessment: "Low risk - automated actions"
}`,
    tips: [
      'Generates automated remediation plans',
      'Analyzes incidents and suggests fixes',
      'Assesses risk of remediation actions',
      'Use for incident response automation',
      'Temperature 0.3 recommended for planning',
    ],
  },

  compliance_check_agent: {
    overview: 'AI agent that validates data against compliance rules and regulations. Detects violations and assesses risk levels. Perfect for compliance automation, regulatory checking, or governance workflows.',
    inputs: ['apiKey', 'model', 'prompt', 'data', 'rules', 'temperature'],
    outputs: ['compliant', 'violations', 'riskLevel'],
    example: `Data: {
  "userAge": 16,
  "consent": true
}
Rules: ["GDPR: Minimum age 18", "Require explicit consent"]

Output: {
  compliant: false,
  violations: ["GDPR: Minimum age 18"],
  riskLevel: "high"
}`,
    tips: [
      'Validates against compliance rules',
      'Detects regulatory violations',
      'Assesses risk levels',
      'Use for compliance automation',
      'Temperature 0.3 recommended for validation',
    ],
  },

  compliance_log_writer: {
    overview: 'Writes compliance logs for audit and regulatory purposes. Formats logs according to compliance standards (GDPR, HIPAA, SOX, etc.). Perfect for compliance logging or audit trail generation.',
    inputs: ['event', 'userId', 'data', 'complianceStandard'],
    outputs: ['logEntry', 'formattedLog'],
    example: `Event: "data_access"
User ID: user123
Compliance Standard: "GDPR"

Output: {
  logEntry: {
    timestamp: "2024-01-15T10:30:00Z",
    userId: "user123",
    event: "data_access",
    data: {...}
  },
  formattedLog: "GDPR-compliant log format..."
}`,
    tips: [
      'Writes compliance-standard logs',
      'Supports GDPR, HIPAA, SOX formats',
      'Includes required fields for compliance',
      'Use for audit and regulatory logging',
      'Creates formatted compliance logs',
    ],
  },

  conversation_summarizer: {
    overview: 'AI agent that summarizes conversations, chat logs, or meeting transcripts. Extracts key topics and identifies sentiment trends. Perfect for conversation analysis, meeting documentation, or chat log processing.',
    inputs: ['apiKey', 'model', 'prompt', 'conversation', 'summaryLength', 'temperature'],
    outputs: ['summary', 'keyTopics', 'sentimentTrend'],
    example: `Conversation: [
  "Hello, how can I help?",
  "I need help with login",
  "Let me check your account..."
]
Summary Length: medium

Output: {
  summary: "Customer requested help with login issue. Agent checked account.",
  keyTopics: ["login", "account", "support"],
  sentimentTrend: "neutral"
}`,
    tips: [
      'Summarizes conversations and transcripts',
      'Extracts key topics automatically',
      'Summary lengths: short, medium, long',
      'Use for conversation analysis',
      'Temperature 0.5 recommended for summarization',
    ],
  },

  cost_monitor: {
    overview: 'Monitors and tracks costs for workflows, API calls, or cloud resources. Provides cost analytics and budget alerts. Perfect for cost optimization, budget management, or spending tracking.',
    inputs: ['workflowId', 'metrics', 'budget', 'alertThreshold'],
    outputs: ['cost', 'usage', 'alerts'],
    example: `Workflow ID: workflow_123
Budget: 100.00
Alert Threshold: 80

Output: {
  cost: 45.50,
  usage: {
    apiCalls: 1200,
    computeTime: "2.5h"
  },
  alerts: []
}`,
    tips: [
      'Monitors workflow and API costs',
      'Tracks usage metrics',
      'Budget alerts when threshold reached',
      'Use for cost optimization',
      'Provides cost analytics',
    ],
  },

  crm_duplicate_detector: {
    overview: 'Detects duplicate records in CRM systems based on similarity matching. Identifies potential duplicates using fuzzy matching algorithms. Perfect for data quality, CRM cleanup, or duplicate prevention.',
    inputs: ['records', 'matchingFields', 'threshold'],
    outputs: ['duplicates', 'confidence', 'groups'],
    example: `Records: [
  {"name": "John Doe", "email": "john@example.com"},
  {"name": "John D.", "email": "john@example.com"}
]
Threshold: 0.8

Output: {
  duplicates: [{"record1": 0, "record2": 1, "confidence": 0.95}],
  groups: [{"records": [0, 1], "confidence": 0.95}]
}`,
    tips: [
      'Detects duplicate CRM records',
      'Uses fuzzy matching algorithms',
      'Confidence threshold for matching',
      'Use for data quality and cleanup',
      'Groups similar records together',
    ],
  },

  crm_lead_router: {
    overview: 'Routes leads to appropriate sales representatives based on criteria such as geography, product interest, or workload. Perfect for lead distribution, sales routing, or CRM automation.',
    inputs: ['lead', 'routingRules', 'salesReps'],
    outputs: ['assignedRep', 'reasoning'],
    example: `Lead: {
  "location": "NYC",
  "product": "Enterprise"
}
Routing Rules: {"location": "priority", "product": "secondary"}

Output: {
  assignedRep: "sales_rep_123",
  reasoning: "Assigned based on location match"
}`,
    tips: [
      'Routes leads to sales representatives',
      'Considers geography, product, workload',
      'Routing rules define assignment logic',
      'Use for lead distribution automation',
      'Ensures balanced workload distribution',
    ],
  },

  crm_sla_monitor: {
    overview: 'Monitors SLA (Service Level Agreement) compliance for CRM tickets, cases, or support requests. Tracks response times and resolution deadlines. Perfect for SLA compliance, service monitoring, or performance tracking.',
    inputs: ['tickets', 'slaRules', 'timeWindow'],
    outputs: ['slaStatus', 'violations', 'metrics'],
    example: `Tickets: [
  {"id": 1, "created": "2024-01-15T10:00:00Z", "status": "open"}
]
SLA Rules: {"responseTime": "1h", "resolutionTime": "24h"}

Output: {
  slaStatus: {
    "1": {"responseTime": "compliant", "resolutionTime": "pending"}
  },
  violations: [],
  metrics: {...}
}`,
    tips: [
      'Monitors SLA compliance',
      'Tracks response and resolution times',
      'Identifies SLA violations',
      'Use for service level monitoring',
      'Provides SLA metrics and reports',
    ],
  },

  crm_ticket_prioritizer: {
    overview: 'AI agent that prioritizes CRM tickets based on severity, impact, customer value, and other factors. Assigns priority levels automatically. Perfect for ticket management automation or support optimization.',
    inputs: ['apiKey', 'model', 'prompt', 'ticket', 'prioritizationRules', 'temperature'],
    outputs: ['priority', 'score', 'reasoning'],
    example: `Ticket: {
  "subject": "Service down",
  "customer": "enterprise",
  "impact": "high"
}

Output: {
  priority: "P0",
  score: 95,
  reasoning: "Enterprise customer, high impact issue"
}`,
    tips: [
      'Automatically prioritizes tickets',
      'Considers severity, impact, customer value',
      'Custom prioritization rules available',
      'Use for ticket management automation',
      'Temperature 0.3 recommended for consistent prioritization',
    ],
  },

  decision_recommendation_agent: {
    overview: 'AI agent that provides decision recommendations based on context, constraints, and objectives. Analyzes options and suggests optimal decisions. Perfect for decision support, recommendation systems, or automated decision-making.',
    inputs: ['apiKey', 'model', 'prompt', 'context', 'options', 'criteria', 'temperature'],
    outputs: ['recommendation', 'confidence', 'reasoning'],
    example: `Context: "Choose cloud provider"
Options: ["AWS", "GCP", "Azure"]
Criteria: ["cost", "performance", "reliability"]

Output: {
  recommendation: "AWS",
  confidence: 0.85,
  reasoning: "Best balance of cost and performance"
}`,
    tips: [
      'Provides decision recommendations',
      'Analyzes options and criteria',
      'Includes confidence scores',
      'Use for decision support systems',
      'Temperature 0.3 recommended for consistent recommendations',
    ],
  },

  employee_faq_indexer: {
    overview: 'Indexes and organizes employee FAQ knowledge base for search and retrieval. Creates searchable index from documents, chat logs, or knowledge bases. Perfect for internal knowledge management or employee self-service.',
    inputs: ['documents', 'indexType', 'updateMode'],
    outputs: ['index', 'documentCount'],
    example: `Documents: [
  {"id": "doc1", "title": "VPN Setup", "content": "How to setup VPN..."},
  {"id": "doc2", "title": "Password Reset", "content": "How to reset password..."}
]
Index Type: "vector"

Output: {
  index: "faq_index_id",
  documentCount: 2
}`,
    tips: [
      'Indexes FAQ documents for search',
      'Creates searchable knowledge base',
      'Vector or keyword indexing supported',
      'Use for knowledge management',
      'Enables fast FAQ retrieval',
    ],
  },

  execution_explainer: {
    overview: 'AI agent that explains workflow execution steps, decisions, and outcomes in human-readable format. Provides execution summaries and reasoning. Perfect for workflow debugging, documentation, or user explanations.',
    inputs: ['apiKey', 'model', 'prompt', 'executionLog', 'format', 'temperature'],
    outputs: ['explanation', 'summary', 'reasoning'],
    example: `Execution Log: {
  "steps": ["webhook", "filter", "email"],
  "decisions": {"filter": "passed"},
  "duration": "2.5s"
}

Output: {
  explanation: "Workflow received webhook trigger, filtered data (passed), and sent email notification in 2.5 seconds.",
  summary: "3 steps executed successfully",
  reasoning: {...}
}`,
    tips: [
      'Explains workflow execution',
      'Human-readable summaries',
      'Documents decisions and outcomes',
      'Use for debugging and documentation',
      'Temperature 0.5 recommended for explanations',
    ],
  },

  expense_categorizer: {
    overview: 'AI agent that categorizes expenses automatically based on descriptions, amounts, and merchant information. Perfect for expense management, accounting automation, or financial categorization.',
    inputs: ['apiKey', 'model', 'prompt', 'expense', 'categories', 'temperature'],
    outputs: ['category', 'confidence', 'subcategory'],
    example: `Expense: {
  "description": "Lunch at Restaurant ABC",
  "amount": 45.50,
  "merchant": "Restaurant ABC"
}
Categories: ["Meals", "Travel", "Office Supplies"]

Output: {
  category: "Meals",
  confidence: 0.95,
  subcategory: "Business Lunch"
}`,
    tips: [
      'Categorizes expenses automatically',
      'Uses description and merchant info',
      'Custom categories available',
      'Use for expense management automation',
      'Temperature 0.3 recommended for categorization',
    ],
  },

  feedback_loop_collector: {
    overview: 'Collects and aggregates feedback from multiple sources (users, systems, metrics). Creates feedback loops for continuous improvement. Perfect for product feedback, user satisfaction tracking, or improvement automation.',
    inputs: ['sources', 'feedbackTypes', 'aggregationMethod'],
    outputs: ['aggregatedFeedback', 'trends', 'insights'],
    example: `Sources: [
  {"source": "user_survey", "rating": 4.5},
  {"source": "support_tickets", "sentiment": "positive"},
  {"source": "usage_metrics", "engagement": "high"}
]

Output: {
  aggregatedFeedback: {
    overallScore: 4.5,
    sentiment: "positive",
    engagement: "high"
  },
  trends: {...},
  insights: ["High user satisfaction", "Good engagement"]
}`,
    tips: [
      'Collects feedback from multiple sources',
      'Aggregates and analyzes feedback',
      'Identifies trends and insights',
      'Use for continuous improvement',
      'Creates feedback loops automatically',
    ],
  },

  fraud_detection_node: {
    overview: 'AI-powered fraud detection system that analyzes transactions, user behavior, or events to identify fraudulent activity. Uses machine learning patterns and rule-based checks. Perfect for payment security, transaction monitoring, or fraud prevention.',
    inputs: ['transaction', 'userHistory', 'patterns', 'riskThreshold'],
    outputs: ['fraudulent', 'riskScore', 'indicators'],
    example: `Transaction: {
  "amount": 10000,
  "location": "unusual_country",
  "time": "midnight"
}
Risk Threshold: 0.7

Output: {
  fraudulent: true,
  riskScore: 0.85,
  indicators: ["unusual_location", "high_amount", "odd_time"]
}`,
    tips: [
      'Detects fraudulent transactions',
      'Analyzes user behavior patterns',
      'Risk score indicates fraud likelihood',
      'Use for payment security',
      'Identifies fraud indicators',
    ],
  },

  incident_classifier: {
    overview: 'AI agent that classifies incidents by type, severity, and category. Automatically categorizes incidents for proper routing and handling. Perfect for incident management, support automation, or alert classification.',
    inputs: ['apiKey', 'model', 'prompt', 'incident', 'categories', 'temperature'],
    outputs: ['classification', 'severity', 'confidence'],
    example: `Incident: {
  "title": "Server CPU at 100%",
  "description": "High CPU usage detected"
}

Output: {
  classification: "performance",
  severity: "high",
  confidence: 0.92
}`,
    tips: [
      'Classifies incidents automatically',
      'Assigns severity levels',
      'Categories: performance, security, availability, etc.',
      'Use for incident management automation',
      'Temperature 0.3 recommended for classification',
    ],
  },

  knowledge_base_search: {
    overview: 'Searches knowledge base using semantic search or keyword matching. Retrieves relevant articles, documents, or FAQ entries. Perfect for self-service support, knowledge retrieval, or documentation search.',
    inputs: ['query', 'knowledgeBaseId', 'searchType', 'maxResults'],
    outputs: ['results', 'relevance', 'snippets'],
    example: `Query: "How to reset password"
Knowledge Base ID: kb_123
Search Type: semantic

Output: {
  results: [
    {
      "id": "article_1",
      "title": "Password Reset Guide",
      "relevance": 0.95,
      "snippet": "To reset your password..."
    }
  ]
}`,
    tips: [
      'Searches knowledge base content',
      'Semantic or keyword search supported',
      'Returns relevant articles and snippets',
      'Use for self-service support',
      'Ranked by relevance score',
    ],
  },

  ldap: {
    overview: 'Interact with LDAP (Lightweight Directory Access Protocol) directories for authentication, user management, or directory queries. Supports user authentication, group membership, and directory search. Perfect for enterprise authentication or directory services.',
    inputs: ['server', 'port', 'bindDn', 'password', 'baseDn', 'operation', 'query'],
    outputs: ['result', 'users', 'groups'],
    example: `Operation: authenticate
Bind DN: cn=user,dc=example,dc=com
Password: password123

Output: {
  result: {
    authenticated: true,
    user: "user",
    groups: ["users", "developers"]
  }
}`,
    tips: [
      'LDAP server for directory services',
      'Bind DN for authentication',
      'Base DN for search operations',
      'Use for enterprise authentication',
      'Query users and groups',
    ],
  },

  microsoft_teams: {
    overview: 'Interact with Microsoft Teams API to send messages, create channels, manage members, and access team data. Supports chat, channels, and team management. Perfect for Teams automation or collaboration workflows.',
    inputs: ['accessToken', 'teamId', 'channelId', 'operation', 'data'],
    outputs: ['result', 'messages', 'channels'],
    example: `Operation: send_message
Channel ID: channel123
Data: {
  "content": "Hello from CtrlChecks!"
}

Output: {
  result: {
    id: "message_id",
    content: "Hello from CtrlChecks!",
    createdDateTime: "2024-01-15T10:30:00Z"
  }
}`,
    tips: [
      'Get access token from Azure AD app registration',
      'Team ID and Channel ID required',
      'Supports messages, channels, members',
      'Use for Teams automation',
      'Microsoft Graph API integration',
    ],
  },

  minio: {
    overview: 'Interact with MinIO (S3-compatible object storage) to manage buckets and objects. Supports uploading, downloading, listing objects, and managing buckets. Perfect for private cloud storage or S3-compatible storage automation.',
    inputs: ['endpoint', 'accessKey', 'secretKey', 'bucket', 'operation', 'objectKey', 'content'],
    outputs: ['result', 'objects', 'buckets'],
    example: `Operation: upload
Bucket: my-bucket
Object Key: "file.txt"
Content: "Hello World"

Output: {
  result: {
    etag: "abc123",
    size: 11
  }
}`,
    tips: [
      'MinIO endpoint URL required',
      'Access Key and Secret Key for authentication',
      'S3-compatible API',
      'Use for private cloud storage',
      'Supports buckets and objects management',
    ],
  },

  multi_agent_coordinator: {
    overview: 'Coordinates multiple AI agents to work together on complex tasks. Manages agent communication, task distribution, and result aggregation. Perfect for multi-agent systems, complex workflows, or collaborative AI tasks.',
    inputs: ['agents', 'task', 'coordinationStrategy'],
    outputs: ['results', 'coordination', 'finalResult'],
    example: `Task: "Analyze customer feedback and create report"
Agents: [sentiment_agent, summarizer_agent, report_generator]

Output: {
  results: {
    sentiment: "positive",
    summary: "Customers are satisfied...",
    report: "Customer Feedback Report..."
  },
  finalResult: "Generated comprehensive report"
}`,
    tips: [
      'Coordinates multiple AI agents',
      'Manages task distribution',
      'Aggregates results from agents',
      'Use for complex multi-agent tasks',
      'Supports various coordination strategies',
    ],
  },

  node_selector_agent: {
    overview: 'AI agent that selects the most appropriate workflow nodes based on requirements and context. Recommends optimal node configurations. Perfect for workflow optimization, node selection, or intelligent workflow building.',
    inputs: ['apiKey', 'model', 'prompt', 'requirements', 'availableNodes', 'temperature'],
    outputs: ['selectedNodes', 'reasoning', 'configuration'],
    example: `Requirements: "Send email when order created"
Available Nodes: ["webhook", "email_resend", "slack_message"]

Output: {
  selectedNodes: ["webhook", "email_resend"],
  reasoning: "Webhook for trigger, email_resend for notification",
  configuration: {...}
}`,
    tips: [
      'Selects optimal workflow nodes',
      'Recommends node configurations',
      'Considers requirements and context',
      'Use for workflow optimization',
      'Temperature 0.3 recommended for selection',
    ],
  },

  onboarding_flow_generator: {
    overview: 'Generates onboarding workflows and sequences for new users, employees, or customers. Creates personalized onboarding experiences based on user type or role. Perfect for user onboarding automation or personalized experiences.',
    inputs: ['userType', 'role', 'onboardingTemplate'],
    outputs: ['onboardingFlow', 'steps', 'timeline'],
    example: `User Type: "customer"
Role: "enterprise"
Template: "enterprise_onboarding"

Output: {
  onboardingFlow: {
    steps: [
      {"step": 1, "action": "welcome_email"},
      {"step": 2, "action": "product_tour"},
      {"step": 3, "action": "setup_call"}
    ]
  },
  timeline: "7 days"
}`,
    tips: [
      'Generates personalized onboarding flows',
      'User type and role-based templates',
      'Creates step-by-step onboarding sequences',
      'Use for onboarding automation',
      'Customizable onboarding templates',
    ],
  },

  payment_reminder_engine: {
    overview: 'Automatically sends payment reminders based on due dates, payment status, and customer preferences. Manages payment reminder sequences and escalations. Perfect for accounts receivable automation or payment collection workflows.',
    inputs: ['invoices', 'reminderRules', 'customerPreferences'],
    outputs: ['reminders', 'sent', 'scheduled'],
    example: `Invoices: [
  {"id": 1, "amount": 1000, "dueDate": "2024-01-20", "status": "unpaid"}
]
Reminder Rules: {"before": "3d", "after": "1d", "escalate": "7d"}

Output: {
  reminders: [
    {"invoiceId": 1, "type": "pre_due", "sent": true}
  ],
  sent: 1,
  scheduled: 0
}`,
    tips: [
      'Automates payment reminders',
      'Before and after due date reminders',
      'Escalation rules for overdue payments',
      'Use for accounts receivable automation',
      'Customer preference-aware reminders',
    ],
  },

  policy_sync_node: {
    overview: 'Synchronizes policies across multiple systems or environments. Ensures policy consistency and updates policies automatically. Perfect for policy management, compliance automation, or multi-system policy sync.',
    inputs: ['sourcePolicy', 'targetSystems', 'syncRules'],
    outputs: ['synced', 'updated', 'conflicts'],
    example: `Source Policy: {
  "name": "Password Policy",
  "minLength": 12,
  "requireComplexity": true
}
Target Systems: ["system1", "system2"]

Output: {
  synced: true,
  updated: ["system1", "system2"],
  conflicts: []
}`,
    tips: [
      'Synchronizes policies across systems',
      'Ensures policy consistency',
      'Handles policy conflicts',
      'Use for policy management automation',
      'Multi-system policy synchronization',
    ],
  },

  postmortem_generator: {
    overview: 'AI agent that generates postmortem reports for incidents, outages, or failures. Creates structured postmortem documents with root cause analysis and action items. Perfect for incident documentation or postmortem automation.',
    inputs: ['apiKey', 'model', 'prompt', 'incident', 'timeline', 'temperature'],
    outputs: ['postmortem', 'rootCause', 'actionItems'],
    example: `Incident: {
  "type": "outage",
  "duration": "2h",
  "impact": "high"
}

Output: {
  postmortem: {
    summary: "Service outage for 2 hours...",
    rootCause: "Database connection pool exhaustion",
    actionItems: ["Increase pool size", "Add monitoring"]
  }
}`,
    tips: [
      'Generates structured postmortem reports',
      'Includes root cause analysis',
      'Creates action items automatically',
      'Use for incident documentation',
      'Temperature 0.5 recommended for postmortem generation',
    ],
  },

  prompt_synthesizer: {
    overview: 'AI agent that synthesizes and optimizes prompts for AI models. Creates effective prompts based on desired outputs and use cases. Perfect for prompt engineering, prompt optimization, or prompt generation automation.',
    inputs: ['apiKey', 'model', 'useCase', 'desiredOutput', 'examples', 'temperature'],
    outputs: ['prompt', 'optimizedPrompt', 'explanation'],
    example: `Use Case: "Extract email addresses from text"
Desired Output: "Array of email addresses"
Examples: ["john@example.com", "jane@test.com"]

Output: {
  prompt: "Extract all email addresses from the following text and return as JSON array...",
  optimizedPrompt: "Enhanced prompt with better instructions...",
  explanation: "Prompt optimized for email extraction accuracy"
}`,
    tips: [
      'Synthesizes effective AI prompts',
      'Optimizes prompts for better results',
      'Considers use case and desired output',
      'Use for prompt engineering',
      'Temperature 0.7 recommended for creative prompt generation',
    ],
  },

  root_cause_analysis_agent: {
    overview: 'AI agent that performs root cause analysis for incidents, failures, or issues. Identifies underlying causes and contributing factors. Perfect for incident investigation, problem-solving automation, or root cause identification.',
    inputs: ['apiKey', 'model', 'prompt', 'incident', 'evidence', 'temperature'],
    outputs: ['rootCause', 'contributingFactors', 'confidence'],
    example: `Incident: {
  "symptoms": "Service slow, errors increasing",
  "timeline": "Started at 10:00 AM"
}

Output: {
  rootCause: "Database connection pool exhaustion due to unclosed connections",
  contributingFactors: ["Recent code deployment", "Increased traffic"],
  confidence: 0.88
}`,
    tips: [
      'Performs root cause analysis',
      'Identifies underlying causes',
      'Analyzes contributing factors',
      'Use for incident investigation',
      'Temperature 0.3 recommended for analysis',
    ],
  },

  tax_rule_engine: {
    overview: 'Applies tax rules and calculates taxes based on location, product type, and tax regulations. Supports multiple tax jurisdictions and rules. Perfect for e-commerce, invoicing, or tax calculation automation.',
    inputs: ['amount', 'location', 'productType', 'taxRules'],
    outputs: ['tax', 'taxBreakdown', 'total'],
    example: `Amount: 100.00
Location: "CA, USA"
Product Type: "physical"

Output: {
  tax: 8.50,
  taxBreakdown: {
    "state": 7.25,
    "local": 1.25
  },
  total: 108.50
}`,
    tips: [
      'Calculates taxes based on rules',
      'Supports multiple tax jurisdictions',
      'Considers product type and location',
      'Use for e-commerce and invoicing',
      'Tax rules configurable per jurisdiction',
    ],
  },

  workflow_generator_agent: {
    overview: 'AI agent that generates complete workflows based on requirements and objectives. Creates workflow definitions with nodes, connections, and configurations. Perfect for workflow automation, intelligent workflow creation, or workflow generation.',
    inputs: ['apiKey', 'model', 'prompt', 'requirements', 'availableNodes', 'temperature'],
    outputs: ['workflow', 'nodes', 'connections'],
    example: `Requirements: "Automate customer onboarding with email sequence"

Output: {
  workflow: {
    nodes: [
      {"type": "webhook", "config": {...}},
      {"type": "email_sequence_sender", "config": {...}}
    ],
    connections: [{"from": 0, "to": 1}]
  }
}`,
    tips: [
      'Generates complete workflows',
      'Creates nodes and connections',
      'Configures workflow based on requirements',
      'Use for workflow automation',
      'Temperature 0.5 recommended for workflow generation',
    ],
  },

  workflow_summary_generator: {
    overview: 'Generates human-readable summaries of workflow executions, definitions, or changes. Creates concise summaries for documentation or reporting. Perfect for workflow documentation, execution summaries, or workflow change tracking.',
    inputs: ['workflow', 'executionLog', 'summaryType'],
    outputs: ['summary', 'keyPoints', 'statistics'],
    example: `Workflow: {
  "name": "Customer Onboarding",
  "nodes": 5,
  "executions": 120
}

Output: {
  summary: "Customer Onboarding workflow with 5 nodes, executed 120 times with 98% success rate.",
  keyPoints: ["5 nodes", "120 executions", "98% success"],
  statistics: {...}
}`,
    tips: [
      'Generates workflow summaries',
      'Human-readable format',
      'Includes key points and statistics',
      'Use for documentation and reporting',
      'Various summary types available',
    ],
  },

  activecampaign: {
    overview: 'Interact with ActiveCampaign API to manage contacts, campaigns, automations, and deals. Supports email marketing, CRM, and marketing automation. Perfect for marketing automation or ActiveCampaign integration.',
    inputs: ['apiKey', 'apiUrl', 'resource', 'operation', 'data'],
    outputs: ['result', 'contacts', 'campaigns'],
    example: `Resource: contacts
Operation: create
Data: {
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}

Output: {
  result: {
    id: "contact_id",
    email: "user@example.com",
    firstName: "John"
  }
}`,
    tips: [
      'Get API key from ActiveCampaign Settings → Developer',
      'API URL from your ActiveCampaign account',
      'Resources: contacts, campaigns, automations, deals',
      'Use for marketing automation',
      'Supports email marketing and CRM',
    ],
  },
};
