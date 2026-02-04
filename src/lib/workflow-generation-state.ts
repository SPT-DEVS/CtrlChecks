/**
 * Execution Flow Architecture (STEP-2) - State Management
 * 
 * This module implements the Finite State Machine (FSM) for workflow generation
 * following the strict 7-step pipeline with state transition validation.
 */

// Execution States (STRICT)
export enum WorkflowGenerationState {
  STATE_0_IDLE = 'STATE_0_IDLE',
  STATE_1_USER_PROMPT_RECEIVED = 'STATE_1_USER_PROMPT_RECEIVED',
  STATE_2_CLARIFICATION_ACTIVE = 'STATE_2_CLARIFICATION_ACTIVE',
  STATE_3_UNDERSTANDING_CONFIRMED = 'STATE_3_UNDERSTANDING_CONFIRMED',
  STATE_4_CREDENTIAL_COLLECTION = 'STATE_4_CREDENTIAL_COLLECTION',
  STATE_5_WORKFLOW_BUILDING = 'STATE_5_WORKFLOW_BUILDING',
  STATE_6_WORKFLOW_VALIDATION = 'STATE_6_WORKFLOW_VALIDATION',
  STATE_7_WORKFLOW_READY = 'STATE_7_WORKFLOW_READY',
  STATE_ERROR_HANDLING = 'STATE_ERROR_HANDLING',
}

// State Transition Rules (NON-NEGOTIABLE)
export const ALLOWED_TRANSITIONS: Record<WorkflowGenerationState, WorkflowGenerationState[]> = {
  [WorkflowGenerationState.STATE_0_IDLE]: [WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED],
  [WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED]: [WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE],
  [WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE]: [
    WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED,
    WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE, // Allow staying in same state for edits
  ],
  [WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED]: [
    WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION,
    WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE, // Allow going back to edit
  ],
  [WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION]: [WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING],
  [WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING]: [
    WorkflowGenerationState.STATE_6_WORKFLOW_VALIDATION,
    WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION, // Allow going back to collect credentials if detected during building
  ],
  [WorkflowGenerationState.STATE_6_WORKFLOW_VALIDATION]: [
    WorkflowGenerationState.STATE_7_WORKFLOW_READY,
    WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING, // Retry building
    WorkflowGenerationState.STATE_ERROR_HANDLING, // Fatal errors
  ],
  [WorkflowGenerationState.STATE_7_WORKFLOW_READY]: [], // Terminal state
  [WorkflowGenerationState.STATE_ERROR_HANDLING]: [
    WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE, // Can restart from clarification
    WorkflowGenerationState.STATE_0_IDLE, // Can reset completely
  ],
};

// Internal State Memory Object
export interface ExecutionState {
  current_state: WorkflowGenerationState;
  user_prompt: string;
  clarifying_questions: Array<{ id: string; text: string; options: string[] }>;
  clarifying_answers: Record<string, string>;
  final_understanding: string;
  credentials_required: string[];
  credentials_provided: Record<string, string>;
  workflow_blueprint: {
    nodes?: any[];
    edges?: any[];
    structure?: any;
  };
  validation_errors: Array<{ type: string; message: string; nodeId?: string }>;
  retry_count: number;
  last_error?: string;
  debug_mode?: boolean;
  state_history: Array<{ state: WorkflowGenerationState; timestamp: string; reason?: string }>;
}

/**
 * State Manager for Workflow Generation
 */
export class WorkflowGenerationStateManager {
  private executionState: ExecutionState;
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.executionState = this.initializeState();
  }

  /**
   * Initialize execution state
   */
  private initializeState(): ExecutionState {
    return {
      current_state: WorkflowGenerationState.STATE_0_IDLE,
      user_prompt: '',
      clarifying_questions: [],
      clarifying_answers: {},
      final_understanding: '',
      credentials_required: [],
      credentials_provided: {},
      workflow_blueprint: {},
      validation_errors: [],
      retry_count: 0,
      debug_mode: this.debugMode,
      state_history: [{
        state: WorkflowGenerationState.STATE_0_IDLE,
        timestamp: new Date().toISOString(),
        reason: 'Initialized',
      }],
    };
  }

  /**
   * Get current execution state
   */
  getExecutionState(): ExecutionState {
    return { ...this.executionState };
  }

  /**
   * Validate state transition
   */
  canTransitionTo(newState: WorkflowGenerationState): { valid: boolean; reason?: string } {
    const currentState = this.executionState.current_state;
    const allowedStates = ALLOWED_TRANSITIONS[currentState] || [];

    if (allowedStates.includes(newState)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Invalid transition from ${currentState} to ${newState}. Allowed states: ${allowedStates.join(', ')}`,
    };
  }

  /**
   * Transition to new state (with validation)
   */
  transitionTo(newState: WorkflowGenerationState, reason?: string): { success: boolean; error?: string } {
    const validation = this.canTransitionTo(newState);
    
    if (!validation.valid) {
      const error = validation.reason || 'Invalid state transition';
      if (this.debugMode) {
        console.error(`[StateManager] ${error}`);
      }
      return { success: false, error };
    }

    // Log state transition
    this.executionState.state_history.push({
      state: newState,
      timestamp: new Date().toISOString(),
      reason: reason || 'State transition',
    });

    this.executionState.current_state = newState;

    if (this.debugMode) {
      console.log(`[StateManager] Transitioned: ${this.executionState.state_history[this.executionState.state_history.length - 2]?.state} → ${newState}`, reason ? `(${reason})` : '');
    }

    return { success: true };
  }

  /**
   * Update user prompt (STATE_1)
   */
  setUserPrompt(prompt: string): void {
    if (this.executionState.current_state !== WorkflowGenerationState.STATE_0_IDLE) {
      throw new Error('Can only set user prompt from IDLE state');
    }
    this.executionState.user_prompt = prompt;
    this.transitionTo(WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED, 'User prompt received');
  }

  /**
   * Set clarifying questions (STATE_2)
   */
  setClarifyingQuestions(questions: Array<{ id: string; text: string; options: string[] }>): void {
    this.executionState.clarifying_questions = questions;
    if (this.executionState.current_state === WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED) {
      this.transitionTo(WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE, 'Clarifying questions generated');
    }
  }

  /**
   * Set clarifying answers (STATE_2)
   */
  setClarifyingAnswers(answers: Record<string, string>): void {
    this.executionState.clarifying_answers = answers;
  }

  /**
   * Confirm understanding (STATE_3)
   */
  confirmUnderstanding(finalUnderstanding: string): { success: boolean; error?: string } {
    if (this.executionState.current_state !== WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE) {
      return { success: false, error: 'Can only confirm understanding from CLARIFICATION_ACTIVE state' };
    }
    this.executionState.final_understanding = finalUnderstanding;
    return this.transitionTo(WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED, 'Understanding confirmed by user');
  }

  /**
   * Set required credentials (STATE_4)
   */
  setRequiredCredentials(credentials: string[]): void {
    this.executionState.credentials_required = credentials;
    // Transition to credential collection if we're in a state that allows it
    if (this.executionState.current_state === WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED) {
      this.transitionTo(WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION, 'Credentials required identified');
    } else if (this.executionState.current_state === WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING) {
      // If credentials are detected during building, go back to credential collection
      this.transitionTo(WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION, 'Credentials required detected during building');
    }
  }

  /**
   * Set provided credentials (STATE_4)
   */
  setProvidedCredentials(credentials: Record<string, string>): void {
    this.executionState.credentials_provided = credentials;
  }

  /**
   * Start workflow building (STATE_5)
   */
  startBuilding(): { success: boolean; error?: string } {
    // Execution guard: Must have credentials if required
    if (this.executionState.credentials_required.length > 0) {
      const missingCredentials = this.executionState.credentials_required.filter(
        cred => !this.executionState.credentials_provided[cred] && 
                !this.executionState.credentials_provided[cred.toLowerCase().replace(/_/g, '_')]
      );
      if (missingCredentials.length > 0) {
        return { 
          success: false, 
          error: `Cannot build workflow: Missing required credentials: ${missingCredentials.join(', ')}` 
        };
      }
    }

    // Execution guard: Must have confirmed understanding
    if (!this.executionState.final_understanding) {
      return { success: false, error: 'Cannot build workflow: Understanding not confirmed' };
    }

    return this.transitionTo(WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING, 'Workflow building started');
  }

  /**
   * Set workflow blueprint (STATE_5 → STATE_6)
   */
  setWorkflowBlueprint(blueprint: { nodes?: any[]; edges?: any[]; structure?: any }): void {
    this.executionState.workflow_blueprint = blueprint;
    this.transitionTo(WorkflowGenerationState.STATE_6_WORKFLOW_VALIDATION, 'Workflow blueprint generated');
  }

  /**
   * Add validation error (STATE_6)
   */
  addValidationError(error: { type: string; message: string; nodeId?: string }): void {
    this.executionState.validation_errors.push(error);
  }

  /**
   * Clear validation errors (STATE_6)
   */
  clearValidationErrors(): void {
    this.executionState.validation_errors = [];
  }

  /**
   * Retry workflow building (STATE_6 → STATE_5)
   */
  retryBuilding(): { success: boolean; error?: string } {
    if (this.executionState.retry_count >= 3) {
      return { 
        success: false, 
        error: 'Maximum retry count (3) reached. Moving to error handling.' 
      };
    }

    this.executionState.retry_count += 1;
    this.executionState.workflow_blueprint = {}; // Clear blueprint for rebuild
    this.clearValidationErrors();

    if (this.debugMode) {
      console.log(`[StateManager] Retry attempt ${this.executionState.retry_count}/3`);
    }

    return this.transitionTo(WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING, `Retry ${this.executionState.retry_count}/3`);
  }

  /**
   * Mark workflow as ready (STATE_6 → STATE_7)
   */
  markWorkflowReady(): { success: boolean; error?: string } {
    // Execution guard: Must have no validation errors
    if (this.executionState.validation_errors.length > 0) {
      return { 
        success: false, 
        error: `Cannot mark workflow as ready: ${this.executionState.validation_errors.length} validation errors remain` 
      };
    }

    // Execution guard: Must have workflow blueprint
    if (!this.executionState.workflow_blueprint.nodes || this.executionState.workflow_blueprint.nodes.length === 0) {
      return { success: false, error: 'Cannot mark workflow as ready: No workflow blueprint' };
    }

    return this.transitionTo(WorkflowGenerationState.STATE_7_WORKFLOW_READY, 'Workflow validated and ready');
  }

  /**
   * Handle error (ANY STATE → STATE_ERROR_HANDLING)
   */
  handleError(error: string): void {
    this.executionState.last_error = error;
    this.transitionTo(WorkflowGenerationState.STATE_ERROR_HANDLING, `Error: ${error}`);
  }

  /**
   * Reset to idle (from error state)
   */
  reset(): void {
    this.executionState = this.initializeState();
    if (this.debugMode) {
      console.log('[StateManager] State reset to IDLE');
    }
  }

  /**
   * Get state history (for debugging)
   */
  getStateHistory(): Array<{ state: WorkflowGenerationState; timestamp: string; reason?: string }> {
    return [...this.executionState.state_history];
  }

  /**
   * Check if in terminal state
   */
  isTerminalState(): boolean {
    return this.executionState.current_state === WorkflowGenerationState.STATE_7_WORKFLOW_READY ||
           this.executionState.current_state === WorkflowGenerationState.STATE_ERROR_HANDLING;
  }

  /**
   * Get current state
   */
  getCurrentState(): WorkflowGenerationState {
    return this.executionState.current_state;
  }
}

/**
 * Map wizard step strings to FSM states
 */
export function mapWizardStepToState(step: string): WorkflowGenerationState {
  const stepMap: Record<string, WorkflowGenerationState> = {
    'idle': WorkflowGenerationState.STATE_0_IDLE,
    'analyzing': WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED,
    'questioning': WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE,
    'refining': WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE,
    'confirmation': WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED,
    'credentials': WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION,
    'building': WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING,
    'complete': WorkflowGenerationState.STATE_7_WORKFLOW_READY,
  };
  return stepMap[step] || WorkflowGenerationState.STATE_0_IDLE;
}

/**
 * Map FSM state to wizard step string
 */
export function mapStateToWizardStep(state: WorkflowGenerationState): string {
  const stateMap: Record<WorkflowGenerationState, string> = {
    [WorkflowGenerationState.STATE_0_IDLE]: 'idle',
    [WorkflowGenerationState.STATE_1_USER_PROMPT_RECEIVED]: 'analyzing',
    [WorkflowGenerationState.STATE_2_CLARIFICATION_ACTIVE]: 'questioning',
    [WorkflowGenerationState.STATE_3_UNDERSTANDING_CONFIRMED]: 'confirmation',
    [WorkflowGenerationState.STATE_4_CREDENTIAL_COLLECTION]: 'credentials',
    [WorkflowGenerationState.STATE_5_WORKFLOW_BUILDING]: 'building',
    [WorkflowGenerationState.STATE_6_WORKFLOW_VALIDATION]: 'building', // Validation happens during building
    [WorkflowGenerationState.STATE_7_WORKFLOW_READY]: 'complete',
    [WorkflowGenerationState.STATE_ERROR_HANDLING]: 'idle', // Error handling resets
  };
  return stateMap[state] || 'idle';
}
