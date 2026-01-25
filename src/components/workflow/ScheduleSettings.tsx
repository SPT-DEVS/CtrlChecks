import { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { workflowScheduler } from '@/lib/workflowScheduler';

interface ScheduleSettingsProps {
  workflowId: string | null;
  onScheduleChange?: (isActive: boolean) => void; // Callback to notify parent of schedule status
}

type IntervalUnit = 'minutes' | 'hours';

// Convert interval to cron expression
const intervalToCron = (value: number, unit: IntervalUnit): string => {
  if (unit === 'minutes') {
    if (value === 1) return '* * * * *'; // Every minute
    return `*/${value} * * * *`; // Every N minutes
  } else {
    // hours
    if (value === 1) return '0 * * * *'; // Every hour
    return `0 */${value} * * *`; // Every N hours
  }
};

// Convert cron to interval (for loading existing schedules)
const cronToInterval = (cron: string): { value: number; unit: IntervalUnit } | null => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return null;

  const [minute, hour] = parts;

  // Every N minutes pattern: */N * * * *
  if (minute.startsWith('*/') && hour === '*') {
    const minutes = parseInt(minute.slice(2));
    if (!isNaN(minutes) && minutes > 0) {
      return { value: minutes, unit: 'minutes' };
    }
  }

  // Every minute: * * * * *
  if (cron === '* * * * *') {
    return { value: 1, unit: 'minutes' };
  }

  // Every N hours pattern: 0 */N * * *
  if (minute === '0' && hour.startsWith('*/')) {
    const hours = parseInt(hour.slice(2));
    if (!isNaN(hours) && hours > 0) {
      return { value: hours, unit: 'hours' };
    }
  }

  // Every hour: 0 * * * *
  if (cron === '0 * * * *') {
    return { value: 1, unit: 'hours' };
  }

  return null;
};

export default function ScheduleSettings({ workflowId, onScheduleChange }: ScheduleSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [intervalValue, setIntervalValue] = useState<number>(5);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('minutes');
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const loadSchedule = useCallback(async () => {
    if (!workflowId || workflowId === 'new') return;

    const { data, error } = await supabase
      .from('workflows')
      .select('cron_expression')
      .eq('id', workflowId)
      .single();

    if (error) {
      console.error('Error loading schedule:', error);
      return;
    }

    if (data?.cron_expression) {
      setEnabled(true);
      const interval = cronToInterval(data.cron_expression);
      if (interval) {
        setIntervalValue(interval.value);
        setIntervalUnit(interval.unit);
      } else {
        // Fallback for non-interval cron expressions
        setIntervalValue(5);
        setIntervalUnit('minutes');
      }
      const active = workflowScheduler.isScheduled(workflowId);
      setIsActive(active);
      onScheduleChange?.(active);
    } else {
      setEnabled(false);
      setIsActive(false);
      onScheduleChange?.(false);
    }
  }, [workflowId, onScheduleChange]);

  useEffect(() => {
    if (workflowId && workflowId !== 'new' && isOpen) {
      loadSchedule();
    }
  }, [workflowId, isOpen, loadSchedule]);

  const handleSave = async () => {
    if (!workflowId || workflowId === 'new') {
      toast({
        title: 'Save workflow first',
        description: 'Please save the workflow before enabling a schedule.',
        variant: 'destructive',
      });
      return;
    }

    // Validate interval
    if (enabled && (intervalValue < 1 || intervalValue > 1000)) {
      toast({
        title: 'Invalid interval',
        description: 'Interval must be between 1 and 1000.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const cronExpression = enabled ? intervalToCron(intervalValue, intervalUnit) : null;

    // Debug logging
    console.log(`[ScheduleSettings] Saving schedule for workflow ${workflowId}:`, {
      enabled,
      intervalValue,
      intervalUnit,
      cronExpression,
    });

    const { error } = await supabase
      .from('workflows')
      .update({
        cron_expression: cronExpression,
      })
      .eq('id', workflowId);

    setLoading(false);

    if (error) {
      console.error('[ScheduleSettings] Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule.',
        variant: 'destructive',
      });
      return;
    }

    // Verify the save by reading back
    const { data: verifyData } = await supabase
      .from('workflows')
      .select('cron_expression')
      .eq('id', workflowId)
      .single();

    console.log(`[ScheduleSettings] Verified saved cron_expression: ${verifyData?.cron_expression}`);
    console.log(`[ScheduleSettings] Expected cron_expression: ${cronExpression}`);

    // Verify the saved cron matches what we expect
    if (enabled && verifyData?.cron_expression !== cronExpression) {
      console.error(`[ScheduleSettings] ⚠️ Cron mismatch! Expected: ${cronExpression}, Got: ${verifyData?.cron_expression}`);
      toast({
        title: 'Warning',
        description: 'Schedule saved but cron expression mismatch detected. Please refresh and try again.',
        variant: 'destructive',
      });
    }

    // Stop existing scheduler if disabling
    if (!enabled) {
      if (workflowId) {
        workflowScheduler.stop(workflowId);
      }
      setIsActive(false);
      onScheduleChange?.(false);
      toast({
        title: 'Schedule disabled',
        description: 'Scheduled execution has been disabled.',
      });
      setIsOpen(false);
      return;
    }

    // Start scheduler for interval-based execution
    if (cronExpression && workflowId) {
      // Ensure we use the verified cron expression from database (or fallback to what we saved)
      const cronToUse = verifyData?.cron_expression || cronExpression;

      console.log(`[ScheduleSettings] Starting scheduler with cron: ${cronToUse} (${intervalValue} ${intervalUnit})`);

      // Stop any existing scheduler first (extra safety)
      workflowScheduler.stop(workflowId);

      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start the new scheduler
      workflowScheduler.start(workflowId, cronToUse);
      setIsActive(true);
      onScheduleChange?.(true);
      toast({
        title: 'Schedule enabled',
        description: `Workflow will run every ${intervalValue} ${intervalValue === 1 ? intervalUnit.slice(0, -1) : intervalUnit}. Execution started automatically.`,
        duration: 5000,
      });
    }

    setIsOpen(false);
  };

  const getScheduleDescription = (): string => {
    if (!enabled) return 'Schedule is disabled';
    return `Every ${intervalValue} ${intervalValue === 1 ? intervalUnit.slice(0, -1) : intervalUnit}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Schedule Settings</DialogTitle>
          <DialogDescription className="text-sm">
            Configure automatic workflow execution at regular intervals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Schedule</Label>
              <p className="text-xs text-muted-foreground">
                Run this workflow automatically
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Execution Interval</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={intervalValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setIntervalValue(val);
                      }
                    }}
                    className="w-24"
                    placeholder="5"
                  />
                  <Select
                    value={intervalUnit}
                    onValueChange={(value: IntervalUnit) => setIntervalUnit(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Workflow will execute every {intervalValue} {intervalValue === 1 ? intervalUnit.slice(0, -1) : intervalUnit}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Schedule Preview</p>
                  <p className="text-sm text-muted-foreground">
                    {getScheduleDescription()}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Schedule Active
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">
                      Workflow is running automatically. Next execution in {intervalValue} {intervalValue === 1 ? intervalUnit.slice(0, -1) : intervalUnit}.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  The workflow will start executing immediately after saving. No manual Run button is required.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
