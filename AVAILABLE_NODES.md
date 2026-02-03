# Available Nodes in CtrlChecks

This document lists all available nodes organized by category. The system currently has **200+ nodes** across 19 categories.

## Node Categories

### 1. **Trigger Nodes** (8 nodes)
Nodes that start workflow execution:

- `chat_trigger` - Chat Trigger
- `error_trigger` - Error Trigger  
- `interval` - Interval Trigger (recurring at intervals)
- `manual_trigger` - Manual Trigger (user-initiated)
- `schedule` - Schedule Trigger (Cron-based)
- `webhook` - Webhook Trigger (HTTP endpoint)
- `workflow_trigger` - Workflow Trigger (from another workflow)
- `form` - Form Trigger (form submission)

### 2. **Core Logic Nodes** (15+ nodes)
Control flow and conditional logic:

- `error_handler` - Error Handler (retry logic)
- `filter` - Filter (array filtering)
- `if_else` - If/Else (conditional branching)
- `loop` - Loop (iterate over arrays)
- `merge` - Merge (combine data streams)
- `noop` - No Operation (pass-through)
- `split_in_batches` - Split in Batches
- `stop_and_error` - Stop and Error
- `switch` - Switch (multi-branch logic)
- `wait` - Wait (delay execution)
- `human_approval` - Human Approval
- `escalation_router` - Escalation Router
- `fallback_router` - Fallback Router
- `retry_with_backoff` - Retry with Backoff
- `timeout_guard` - Timeout Guard
- `circuit_breaker` - Circuit Breaker
- `workflow_state_manager` - Workflow State Manager
- `execution_context_store` - Execution Context Store
- `session_manager` - Session Manager

### 3. **Data Manipulation Nodes** (20+ nodes)
Transform and process data:

- `aggregate` - Aggregate (data aggregation)
- `csv_processor` - CSV Processor
- `edit_fields` - Edit Fields
- `execute_command` - Execute Command
- `function` - Function (custom functions)
- `function_item` - Function Item
- `item_lists` - Item Lists
- `javascript` - JavaScript (custom code)
- `json_parser` - JSON Parser
- `limit` - Limit (limit array size)
- `merge_data` - Merge Data
- `rename_keys` - Rename Keys
- `set` - Set (set variables)
- `set_variable` - Set Variable
- `sort` - Sort (sort arrays)
- `text_formatter` - Text Formatter (template strings)

### 4. **AI & ML Nodes** (40+ nodes)
Artificial Intelligence and Machine Learning:

#### Core AI Models:
- `ai_agent` - AI Agent (autonomous agent)
- `anthropic_claude` - Anthropic Claude
- `google_gemini` - Google Gemini
- `openai_gpt` - OpenAI GPT
- `azure_openai` - Azure OpenAI
- `ollama` - Ollama (local models)
- `hugging_face` - Hugging Face
- `cohere` - Cohere

#### Specialized AI Agents:
- `intent_classification_agent` - Intent Classification Agent
- `sentiment_analysis_agent` - Sentiment Analysis Agent
- `confidence_scoring_agent` - Confidence Scoring Agent
- `lead_qualification_agent` - Lead Qualification Agent
- `lead_scoring_agent` - Lead Scoring Agent
- `skill_matching_agent` - Skill Matching Agent
- `document_qa_agent` - Document Q&A Agent
- `policy_reasoning_agent` - Policy Reasoning Agent
- `compliance_check_agent` - Compliance Check Agent
- `anomaly_detection_agent` - Anomaly Detection Agent
- `root_cause_analysis_agent` - Root Cause Analysis Agent
- `conversation_summarizer` - Conversation Summarizer
- `meeting_notes_agent` - Meeting Notes Agent
- `action_items_extractor` - Action Items Extractor
- `workflow_planner_agent` - Workflow Planner Agent
- `decision_recommendation_agent` - Decision Recommendation Agent
- `workflow_generator_agent` - Workflow Generator Agent
- `node_selector_agent` - Node Selector Agent
- `prompt_synthesizer` - Prompt Synthesizer
- `multi_agent_coordinator` - Multi-Agent Coordinator
- `agent_role_assigner` - Agent Role Assigner
- `agent_voting_consensus` - Agent Voting Consensus
- `execution_explainer` - Execution Explainer
- `workflow_summary_generator` - Workflow Summary Generator

#### AI Utilities:
- `text_summarizer` - Text Summarizer
- `sentiment_analyzer` - Sentiment Analyzer
- `memory` - Memory (context memory)
- `llm_chain` - LLM Chain
- `embeddings` - Embeddings
- `vector_store` - Vector Store
- `chat_model` - Chat Model

### 5. **HTTP & API Nodes** (5+ nodes)
HTTP requests and API integrations:

- `http_request` - HTTP Request (GET, POST, PUT, DELETE)
- `http_post` - HTTP POST
- `graphql` - GraphQL Request
- `respond_to_webhook` - Respond to Webhook

### 6. **Google Integration Nodes** (7 nodes)
Google Workspace integrations:

- `google_bigquery` - Google BigQuery
- `google_calendar` - Google Calendar
- `google_contacts` - Google Contacts
- `google_doc` - Google Docs
- `google_drive` - Google Drive
- `google_gmail` - Gmail
- `google_sheets` - Google Sheets
- `google_tasks` - Google Tasks

### 7. **Database Nodes** (10+ nodes)
Database operations:

- `database_read` - Database Read
- `database_write` - Database Write
- `postgresql` - PostgreSQL
- `supabase` - Supabase
- `mysql` - MySQL
- `mongodb` - MongoDB
- `redis` - Redis
- `mssql` - Microsoft SQL Server
- `sqlite` - SQLite
- `snowflake` - Snowflake
- `timescaledb` - TimescaleDB

### 8. **Communication/Output Nodes** (15+ nodes)
Send notifications and messages:

- `slack_message` - Slack Message
- `slack_webhook` - Slack Webhook
- `discord_webhook` - Discord Webhook
- `microsoft_teams` - Microsoft Teams
- `telegram` - Telegram
- `whatsapp_cloud` - WhatsApp Cloud API
- `twilio` - Twilio (SMS/Voice)
- `email_sequence_sender` - Email Sequence Sender
- `auto_followup_sender` - Auto Follow-up Sender
- `human_handoff_notification` - Human Handoff Notification
- `approval_request_sender` - Approval Request Sender
- `reminder_scheduler` - Reminder Scheduler
- `log_output` - Log Output

### 9. **CRM & Marketing Nodes** (15+ nodes)
Customer Relationship Management:

- `hubspot` - HubSpot
- `salesforce` - Salesforce
- `zoho_crm` - Zoho CRM
- `pipedrive` - Pipedrive
- `freshdesk` - Freshdesk
- `intercom` - Intercom
- `mailchimp` - Mailchimp
- `activecampaign` - ActiveCampaign
- `crm_lead_router` - CRM Lead Router
- `crm_ticket_prioritizer` - CRM Ticket Prioritizer
- `crm_sla_monitor` - CRM SLA Monitor
- `crm_duplicate_detector` - CRM Duplicate Detector

### 10. **File & Storage Nodes** (10+ nodes)
File operations and cloud storage:

- `read_binary_file` - Read Binary File
- `write_binary_file` - Write Binary File
- `aws_s3` - AWS S3
- `ftp` - FTP
- `sftp` - SFTP
- `dropbox` - Dropbox
- `onedrive` - OneDrive
- `box` - Box
- `minio` - MinIO

### 11. **Social Media Nodes** (5+ nodes)
Social media integrations:

- `linkedin` - LinkedIn
- `twitter` - Twitter/X
- (Additional social media nodes)

### 12. **DevOps Nodes** (5+ nodes)
Development and operations:

- `github` - GitHub
- `gitlab` - GitLab
- `bitbucket` - Bitbucket
- `jira` - Jira
- `jenkins` - Jenkins

### 13. **E-commerce Nodes** (5+ nodes)
E-commerce platform integrations:

- `shopify` - Shopify
- `woocommerce` - WooCommerce
- `stripe` - Stripe (payments)
- (Additional e-commerce nodes)

### 14. **Payment Nodes** (3+ nodes)
Payment processing:

- `stripe` - Stripe
- `paypal` - PayPal
- (Additional payment nodes)

### 15. **Data Analytics Nodes** (5+ nodes)
Data analysis and visualization:

- (Analytics-specific nodes)

### 16. **Productivity Nodes** (5+ nodes)
Productivity tools:

- (Productivity-specific nodes)

### 17. **Authentication Nodes** (3+ nodes)
Authentication and security:

- (Authentication-specific nodes)

### 18. **Utility & Miscellaneous Nodes** (20+ nodes)
Utility functions:

- `date_time` - Date/Time operations
- `math` - Mathematical operations
- `crypto` - Cryptographic operations
- `html_extract` - HTML Extraction
- `xml` - XML processing
- `rss_feed_read` - RSS Feed Reader
- `pdf` - PDF processing
- `image_manipulation` - Image Manipulation
- `document_ocr` - Document OCR
- `resume_parser` - Resume Parser
- `invoice_parser` - Invoice Parser
- `document_classifier` - Document Classifier
- `file_metadata_extractor` - File Metadata Extractor

## Node Usage

### Finding Nodes
- Use the **Node Library** panel in the workflow builder
- Search by name or description
- Browse by category

### Adding Nodes
1. Drag and drop from the Node Library
2. Or use the AI workflow generator to automatically select nodes

### Configuring Nodes
- Each node has specific configuration fields
- Required fields are marked with *
- Help text is available for each field
- Use template variables like `{{input.field}}` for dynamic values

## Transformation Nodes

The following nodes are considered "transformation nodes" and benefit from the enhanced property generation:

- `filter` - Filters arrays based on conditions
- `javascript` - Custom JavaScript transformations
- `json_parser` - Parses and transforms JSON
- `text_formatter` - Formats text with templates
- `merge_data` - Merges data structures
- `rename_keys` - Renames object keys
- `edit_fields` - Edits field values
- `csv_processor` - Processes CSV data
- `aggregate` - Aggregates data
- `sort` - Sorts arrays
- `limit` - Limits array size

These nodes now automatically receive:
- Proper input/output field mappings
- Complete configuration objects
- Intelligent defaults
- Template variable resolution

## Node Categories Summary

| Category | Node Count | Description |
|----------|-----------|-------------|
| Triggers | 8 | Workflow initiation |
| Core Logic | 19 | Control flow and conditions |
| Data Manipulation | 20+ | Data transformation |
| AI & ML | 40+ | AI models and agents |
| HTTP & API | 5+ | API integrations |
| Google | 7 | Google Workspace |
| Database | 10+ | Database operations |
| Communication | 15+ | Notifications and messaging |
| CRM & Marketing | 15+ | CRM platforms |
| File & Storage | 10+ | File operations |
| Social Media | 5+ | Social platforms |
| DevOps | 5+ | Development tools |
| E-commerce | 5+ | E-commerce platforms |
| Payment | 3+ | Payment processing |
| Analytics | 5+ | Data analytics |
| Productivity | 5+ | Productivity tools |
| Authentication | 3+ | Security |
| Utility | 20+ | Utility functions |

**Total: 200+ nodes** across 19 categories

## Notes

- Nodes are continuously being added
- Some nodes may require API keys or OAuth setup
- Check individual node documentation for specific requirements
- The AI workflow generator automatically selects appropriate nodes based on your prompt
