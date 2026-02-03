# AI Workflow Generation Steps

This document outlines the complete process for generating AI workflows in the CtrlChecks system.

## Overview

The AI workflow generation follows a **7-Step Process** that transforms a user's natural language prompt into a fully executable workflow with zero errors.

## The 7-Step Generation Process

### Step 1: User Raw Prompt (Input)
- **Description**: User provides a natural language description of the workflow they want to create
- **Example**: "Send a daily email report with sales data from Google Sheets to my team"
- **Location**: Frontend - `AutonomousAgentWizard` component
- **Status**: User input collected

### Step 2: Questions for Confirming (Analysis)
- **Description**: AI analyzes the prompt and generates clarifying questions to better understand requirements
- **Mode**: `analyze` mode in API
- **Service**: `EnhancedWorkflowAnalyzer.analyzePromptWithNodeOptions()`
- **Output**: 
  - Summary of understanding
  - List of questions with options
  - Node options detected (if applicable)
- **Location**: 
  - Backend: `worker/src/api/generate-workflow.ts` (analyze mode)
  - Frontend: `AutonomousAgentWizard` (questioning step)
- **Status**: User answers questions to clarify requirements

### Step 3: System Prompt Generation (Understanding)
- **Description**: Generate a concise 20-30 word system prompt that captures what the AI understood
- **Process**: 
  - Combines user prompt with answers
  - Extracts first 20-30 words
  - Creates a focused system prompt
- **Example**: "Build an automated workflow to send daily email reports with sales data from Google Sheets to team members"
- **Location**: 
  - Backend: `workflow-builder.ts` - `generateSystemPrompt()`
  - API: `generate-workflow.ts` (refine mode)
- **Progress**: 20% complete

### Step 4: Workflow Requirements Extraction
- **Description**: Extract all technical requirements needed for the workflow
- **Service**: `RequirementsExtractor.extractRequirements()`
- **Extracted Information**:
  - URLs (webhooks, endpoints)
  - APIs (third-party services)
  - Credentials (API keys, tokens)
  - Schedules (cron expressions, intervals)
  - Platforms (Slack, Discord, email, etc.)
  - Data formats (JSON, CSV, etc.)
  - Error handling requirements
  - Notification preferences
- **Location**: 
  - Backend: `worker/src/services/ai/requirements-extractor.ts`
  - API: `generate-workflow.ts` (refine mode)
- **Progress**: 40-45% complete
- **Output**: Structured requirements object

### Step 5: Workflow Building
This is the core generation step, broken into sub-steps:

#### 5.1: Generate Workflow Structure
- **Description**: Create the high-level structure of the workflow
- **Process**: AI determines the flow, node types needed, and their sequence
- **Service**: `AgenticWorkflowBuilder.generateStructure()`
- **Progress**: 50% complete

#### 5.2: Identify Required Credentials
- **Description**: Determine which credentials are needed based on structure and requirements
- **Process**: 
  - Analyzes workflow structure for AI Agent nodes
  - Checks selected services from user answers
  - Identifies all required API keys and tokens
- **Service**: `AgenticWorkflowBuilder.identifyRequiredCredentials()`
- **Progress**: 45% complete
- **Output**: Array of required credential names (e.g., `['GEMINI_API_KEY', 'SLACK_TOKEN']`)

#### 5.3: Apply Node Preferences
- **Description**: Apply user's node preferences from answers
- **Process**: Updates structure based on user's service selections
- **Service**: `EnhancedWorkflowAnalyzer.extractNodePreferences()`
- **Progress**: 50% complete

#### 5.4: Select Nodes
- **Description**: Select specific node instances from the node library
- **Process**: Maps structure requirements to actual node types
- **Service**: `AgenticWorkflowBuilder.selectNodes()`
- **Progress**: 60% complete
- **Output**: Array of node objects with types

#### 5.5: Validate Credentials
- **Description**: Check if required credentials are provided
- **Process**: Validates that all required credentials are available
- **Service**: `AgenticWorkflowBuilder.validateCredentialsProvided()`
- **Progress**: 65% complete
- **Note**: Continues with environment variable references if missing

#### 5.6: Configure Nodes
- **Description**: Configure each node with specific parameters and settings
- **Process**: 
  - Sets up node configurations
  - Fills required fields with intelligent defaults
  - Maps input-output relationships
  - Applies template variables
- **Service**: `AgenticWorkflowBuilder.configureNodes()`
- **Progress**: 70% complete
- **Output**: Fully configured node objects

#### 5.7: Create Connections
- **Description**: Create edges/connections between nodes
- **Process**: 
  - Links nodes based on workflow structure
  - Sets up data flow paths
  - Handles conditional branches
  - Configures chat models if needed
- **Service**: `AgenticWorkflowBuilder.createConnections()`
- **Progress**: 80% complete
- **Output**: Complete workflow with nodes and edges

### Step 6: Validation & Auto-Fix (Self-Repair)
- **Description**: Validate the workflow and automatically fix any errors
- **Process**:
  - Runs comprehensive validation checks
  - Identifies errors and warnings
  - Automatically applies fixes
  - Validates types and connections
  - Checks production readiness
- **Services**: 
  - `WorkflowValidator.validateAndFix()` - Main validation
  - `TypeValidator.validateWorkflow()` - Type checking
  - `isProductionReady()` - Production checks
- **Progress**: 90-92% complete
- **Features**:
  - Zero-error guarantee
  - Auto-fix for common issues
  - Self-repair until valid
  - No placeholders or empty required fields
- **Location**: `worker/src/services/ai/workflow-validator.ts`

### Step 7: Outputs & Documentation
- **Description**: Generate final outputs including documentation and suggestions
- **Process**:
  - Generate workflow documentation
  - Create enhancement suggestions
  - Calculate complexity estimate
  - Prepare final workflow JSON
- **Services**:
  - `AgenticWorkflowBuilder.generateDocumentation()`
  - `AgenticWorkflowBuilder.provideEnhancementSuggestions()`
  - `AgenticWorkflowBuilder.calculateComplexity()`
- **Progress**: 95-100% complete
- **Outputs**:
  - Complete workflow JSON (nodes + edges)
  - Documentation string
  - Enhancement suggestions array
  - Estimated complexity level
  - System prompt
  - Requirements object
  - Required credentials list
  - Validation results

## API Modes

The workflow generation API supports three modes:

### 1. `analyze` Mode
- **Purpose**: Step 2 - Generate clarifying questions
- **Endpoint**: `POST /api/generate-workflow` with `mode: 'analyze'`
- **Input**: `{ prompt, mode: 'analyze' }`
- **Output**: `{ summary, questions, prompt, nodeOptionsDetected }`

### 2. `refine` Mode
- **Purpose**: Steps 3 & 4 - Generate system prompt and extract requirements
- **Endpoint**: `POST /api/generate-workflow` with `mode: 'refine'`
- **Input**: `{ prompt, mode: 'refine', answers }`
- **Output**: `{ refinedPrompt, systemPrompt, requirements, requiredCredentials, prompt }`

### 3. `create` Mode (Default)
- **Purpose**: Steps 5-7 - Build, validate, and output workflow
- **Endpoint**: `POST /api/generate-workflow` with `mode: 'create'` or no mode
- **Input**: `{ prompt, mode: 'create', answers, currentWorkflow?, executionHistory? }`
- **Output**: Complete workflow with all outputs
- **Streaming**: Supports streaming progress updates via `x-stream-progress: true` header

## Frontend Wizard Flow

The frontend wizard (`AutonomousAgentWizard`) follows these steps:

1. **idle** → User enters prompt
2. **analyzing** → API call in analyze mode
3. **questioning** → User answers questions
4. **refining** → API call in refine mode
5. **confirmation** → Show requirements and credentials
6. **credentials** → User provides credentials (if needed)
7. **building** → API call in create mode with streaming
8. **complete** → Workflow saved and ready

## Key Features

### Zero-Error Guarantee
- All workflows are validated and auto-fixed
- No placeholders or empty required fields
- Self-repair until zero errors

### Intelligent Defaults
- Missing values are filled with intelligent defaults
- Template variables are properly configured
- Input-output mapping is automatic

### Production Ready
- All workflows are production-ready on generation
- Comprehensive validation checks
- Type-safe configurations

### Streaming Support
- Real-time progress updates during generation
- Step-by-step progress tracking
- Detailed phase information

## Database Schema

Workflow generation jobs are tracked in the `workflow_generation_jobs` table:
- Job status: `pending`, `processing`, `completed`, `failed`, `cancelled`
- Progress tracking: `progress_percentage`, `current_phase`, `progress_logs`
- Input/Output: `prompt`, `workflow_result`, `error_message`
- Timing: `created_at`, `started_at`, `finished_at`, `duration_ms`

## Example Flow

```
User: "Send daily sales reports from Google Sheets to Slack"

Step 1: Prompt received
Step 2: Questions generated:
  - When should this run? [Daily, Weekly, Monthly]
  - Which Google Sheet? [User provides URL]
  - Which Slack channel? [User provides channel ID]

Step 3: System prompt: "Build automated workflow to send daily sales reports from Google Sheets to Slack channel"

Step 4: Requirements extracted:
  - URLs: [Google Sheets URL]
  - APIs: [Google Sheets API, Slack API]
  - Credentials: [GOOGLE_OAUTH_TOKEN, SLACK_TOKEN]
  - Schedule: [Daily at 9 AM]

Step 5: Workflow built:
  - Trigger: Schedule node (daily 9 AM)
  - Node 1: Google Sheets Read node
  - Node 2: Data Transform node
  - Node 3: Slack Send Message node
  - Connections: Trigger → Sheets → Transform → Slack

Step 6: Validated and auto-fixed:
  - All nodes configured
  - Connections verified
  - Credentials validated

Step 7: Outputs generated:
  - Workflow JSON
  - Documentation
  - Suggestions: "Consider adding error handling"
  - Complexity: "Medium"
```

## Related Files

- **Backend Core**: `worker/src/services/ai/workflow-builder.ts`
- **API Handler**: `worker/src/api/generate-workflow.ts`
- **Requirements**: `worker/src/services/ai/requirements-extractor.ts`
- **Validator**: `worker/src/services/ai/workflow-validator.ts`
- **Analyzer**: `worker/src/services/ai/enhanced-workflow-analyzer.ts`
- **Frontend**: `ctrl_checks/src/components/workflow/AutonomousAgentWizard.tsx`
- **Database**: `ctrl_checks/sql_migrations/13_workflow_generation_jobs.sql`
