import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';

interface ScheduledWorkflow {
  workflowId: string;
  cronExpression: string;
  intervalMs: number;
  interval: number;
  unit: 'minutes' | 'hours';
}

class WorkflowScheduler {
  private schedulers: Map<string, NodeJS.Timeout> = new Map();
  private activeWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private initialized = false;
  private startingWorkflows: Set<string> = new Set(); // Track workflows being started to prevent duplicates
  private executingWorkflows: Set<string> = new Set(); // Execution lock to prevent parallel executions

  // Convert cron to interval in milliseconds
  private cronToIntervalMs(cron: string): number | null {
    const parts = cron.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour] = parts;

    // Every N minutes: */N * * * *
    if (minute.startsWith('*/') && hour === '*') {
      const minutes = parseInt(minute.slice(2));
      if (!isNaN(minutes) && minutes > 0) {
        return minutes * 60 * 1000;
      }
    }

    // Every minute: * * * * *
    if (cron === '* * * * *') {
      return 60 * 1000;
    }

    // Every N hours: 0 */N * * *
    if (minute === '0' && hour.startsWith('*/')) {
      const hours = parseInt(hour.slice(2));
      if (!isNaN(hours) && hours > 0) {
        return hours * 60 * 60 * 1000;
      }
    }

    // Every hour: 0 * * * *
    if (cron === '0 * * * *') {
      return 60 * 60 * 1000;
    }

    return null;
  }

  // Parse interval from cron
  private parseInterval(cron: string): { value: number; unit: 'minutes' | 'hours' } | null {
    const parts = cron.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour] = parts;

    if (minute.startsWith('*/') && hour === '*') {
      const minutes = parseInt(minute.slice(2));
      if (!isNaN(minutes) && minutes > 0) {
        return { value: minutes, unit: 'minutes' };
      }
    }

    if (cron === '* * * * *') {
      return { value: 1, unit: 'minutes' };
    }

    if (minute === '0' && hour.startsWith('*/')) {
      const hours = parseInt(hour.slice(2));
      if (!isNaN(hours) && hours > 0) {
        return { value: hours, unit: 'hours' };
      }
    }

    if (cron === '0 * * * *') {
      return { value: 1, unit: 'hours' };
    }

    return null;
  }

  // Execute a workflow with execution lock
  private async executeWorkflow(workflowId: string): Promise<void> {
    // Check if workflow is already executing (prevent parallel executions)
    if (this.executingWorkflows.has(workflowId)) {
      console.warn(`[Scheduler] ⚠️ Workflow ${workflowId} is already executing, skipping duplicate execution`);
      return;
    }

    // Acquire execution lock
    this.executingWorkflows.add(workflowId);

    try {
      console.log(`[Scheduler] 🚀 Executing workflow ${workflowId} (trigger: schedule)`);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${ENDPOINTS.itemBackend}/execute-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          workflowId,
          input: { 
            _scheduled: 'true',
            _trigger: 'schedule'
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Execution failed' }));
        console.error(`[Scheduler] ❌ Error executing scheduled workflow ${workflowId}:`, error);
      } else {
        console.log(`[Scheduler] ✅ Successfully executed workflow ${workflowId}`);
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ Error invoking execute-workflow for ${workflowId}:`, error);
    } finally {
      // Release execution lock after a delay to prevent rapid re-execution
      // This ensures the workflow has time to complete before allowing another execution
      setTimeout(() => {
        this.executingWorkflows.delete(workflowId);
      }, 1000); // 1 second cooldown
    }
  }

  // Check if a workflow is currently executing
  isExecuting(workflowId: string): boolean {
    return this.executingWorkflows.has(workflowId);
  }

  // Start scheduler for a workflow (ensures only ONE scheduler per workflow)
  start(workflowId: string, cronExpression: string): void {
    // Prevent duplicate starts
    if (this.startingWorkflows.has(workflowId)) {
      console.warn(`[Scheduler] ⚠️ Workflow ${workflowId} is already being started, skipping duplicate start`);
      return;
    }

    this.startingWorkflows.add(workflowId);

    // CRITICAL: Stop existing scheduler FIRST to ensure only ONE scheduler exists
    if (this.schedulers.has(workflowId)) {
      console.log(`[Scheduler] 🔄 Updating existing scheduler for workflow ${workflowId}`);
      this.stop(workflowId);
      // Small delay to ensure cleanup completes, then start
      setTimeout(() => {
        this.startInternal(workflowId, cronExpression);
        this.startingWorkflows.delete(workflowId);
      }, 100);
    } else {
      this.startInternal(workflowId, cronExpression);
      this.startingWorkflows.delete(workflowId);
    }
  }

  // Internal method to start scheduler (called after cleanup)
  private startInternal(workflowId: string, cronExpression: string): void {
    // Final check: ensure no scheduler exists
    if (this.schedulers.has(workflowId)) {
      console.error(`[Scheduler] ❌ CRITICAL: Scheduler still exists for ${workflowId} after stop, aborting`);
      return;
    }

    const intervalMs = this.cronToIntervalMs(cronExpression);
    if (!intervalMs) {
      console.error(`[Scheduler] ❌ Invalid cron expression for workflow ${workflowId}: ${cronExpression}`);
      return;
    }

    const interval = this.parseInterval(cronExpression);
    if (!interval) {
      console.error(`[Scheduler] ❌ Could not parse interval from cron: ${cronExpression}`);
      return;
    }

    // Store workflow info
    this.activeWorkflows.set(workflowId, {
      workflowId,
      cronExpression,
      intervalMs,
      interval: interval.value,
      unit: interval.unit,
    });

    // Execute immediately (first run)
    this.executeWorkflow(workflowId);

    // Set up recurring execution
    const timer = setInterval(() => {
      this.executeWorkflow(workflowId);
    }, intervalMs);

    this.schedulers.set(workflowId, timer);
    console.log(`[Scheduler] ✅ Started for workflow ${workflowId}: cron="${cronExpression}", interval=${interval.value} ${interval.unit}, ms=${intervalMs}`);
    console.log(`[Scheduler] 📊 Active schedulers:`, this.getAllActiveSchedulers());
  }

  // Stop scheduler for a workflow
  stop(workflowId: string): void {
    const timer = this.schedulers.get(workflowId);
    if (timer) {
      clearInterval(timer);
      // Clear the timer reference immediately
      this.schedulers.delete(workflowId);
      const workflow = this.activeWorkflows.get(workflowId);
      this.activeWorkflows.delete(workflowId);
      console.log(`[Scheduler] Stopped for workflow ${workflowId}${workflow ? ` (was: ${workflow.interval} ${workflow.unit}, cron: ${workflow.cronExpression})` : ''}`);
    } else {
      // Even if no timer found, clear from activeWorkflows to be safe
      if (this.activeWorkflows.has(workflowId)) {
        const workflow = this.activeWorkflows.get(workflowId);
        this.activeWorkflows.delete(workflowId);
        console.log(`[Scheduler] Cleaned up workflow ${workflowId} from activeWorkflows${workflow ? ` (was: ${workflow.interval} ${workflow.unit})` : ''}`);
      }
    }
  }

  // Stop all schedulers
  stopAll(): void {
    console.log(`[Scheduler] Stopping all schedulers (${this.schedulers.size} active)`);
    this.schedulers.forEach((timer, workflowId) => {
      clearInterval(timer);
      console.log(`[Scheduler] Stopped scheduler for workflow ${workflowId}`);
    });
    this.schedulers.clear();
    this.activeWorkflows.clear();
    this.startingWorkflows.clear();
    this.executingWorkflows.clear(); // Clear execution locks
    console.log('[Scheduler] ✅ All schedulers stopped');
  }

  // Check if a workflow is scheduled
  isScheduled(workflowId: string): boolean {
    return this.schedulers.has(workflowId);
  }

  // Get scheduled workflow info
  getScheduledWorkflow(workflowId: string): ScheduledWorkflow | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  // Debug: Get all active schedulers
  getAllActiveSchedulers(): Array<{ workflowId: string; cron: string; interval: string }> {
    return Array.from(this.activeWorkflows.values()).map(w => ({
      workflowId: w.workflowId,
      cron: w.cronExpression,
      interval: `${w.interval} ${w.unit}`
    }));
  }

  // Initialize schedulers for all active workflows (call on app load)
  async initializeAll(): Promise<void> {
    // Prevent multiple initializations
    if (this.initialized) {
      console.log('[Scheduler] Already initialized, skipping');
      return;
    }

    try {
      // Stop all existing schedulers first to prevent duplicates
      this.stopAll();

      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('id, cron_expression')
        .not('cron_expression', 'is', null);

      if (error) {
        console.error('Error loading scheduled workflows:', error);
        this.initialized = true;
        return;
      }

      if (!workflows || workflows.length === 0) {
        this.initialized = true;
        console.log('[Scheduler] No scheduled workflows found');
        return;
      }

      console.log(`[Scheduler] Initializing ${workflows.length} scheduled workflows`);
      workflows.forEach((workflow) => {
        if (workflow.cron_expression) {
          console.log(`[Scheduler] Initializing workflow ${workflow.id} with cron: ${workflow.cron_expression}`);
          // start() will stop any existing scheduler for this workflow
          this.start(workflow.id, workflow.cron_expression);
        }
      });

      this.initialized = true;
      console.log(`[Scheduler] Initialization complete: ${workflows.length} workflows scheduled`);
      console.log(`[Scheduler] Active schedulers after init:`, this.getAllActiveSchedulers());
    } catch (error) {
      console.error('Error initializing schedulers:', error);
      this.initialized = true; // Mark as initialized even on error to prevent retry loops
    }
  }

  // Reset initialization flag (useful for testing or manual re-initialization)
  resetInitialization(): void {
    this.initialized = false;
  }

  // Refresh scheduler for a specific workflow (reload from database)
  async refreshWorkflow(workflowId: string): Promise<void> {
    try {
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('id, cron_expression')
        .eq('id', workflowId)
        .single();

      if (error) {
        console.error(`[Scheduler] Error loading workflow ${workflowId}:`, error);
        return;
      }

      if (!workflow) {
        console.log(`[Scheduler] Workflow ${workflowId} not found, stopping scheduler`);
        this.stop(workflowId);
        return;
      }

      if (workflow.cron_expression) {
        console.log(`[Scheduler] Refreshing workflow ${workflowId} with cron: ${workflow.cron_expression}`);
        this.start(workflow.id, workflow.cron_expression);
      } else {
        console.log(`[Scheduler] Workflow ${workflowId} has no cron expression, stopping scheduler`);
        this.stop(workflowId);
      }
    } catch (error) {
      console.error(`[Scheduler] Error refreshing workflow ${workflowId}:`, error);
    }
  }
}

// Singleton instance
export const workflowScheduler = new WorkflowScheduler();

