import { useState, useEffect, useCallback } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Copy, ExternalLink, Loader2 } from "lucide-react";

interface FormSettingsProps {
  workflowId: string | null;
}

export default function FormSettings({ workflowId }: FormSettingsProps) {
  const [open, setOpen] = useState(false);
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { nodes } = useWorkflowStore();

  const loadWorkflowStatus = useCallback(async () => {
    if (!workflowId) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('status')
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      setIsActive(data?.status === 'active');
    } catch (error) {
      console.error('Error loading workflow status:', error);
    }
  }, [workflowId]);

  const generateFormUrl = useCallback(() => {
    if (!workflowId) return;

    setLoading(true);
    try {
      // Check if workflow has a form trigger node
      const formNode = nodes.find((node: any) => node.data?.type === "form");
      if (!formNode) {
        setFormUrl(null);
        return;
      }

      const url = `${window.location.origin}/form/${workflowId}/${formNode.id}`;
      setFormUrl(url);
    } catch (error) {
      console.error("Error generating form URL:", error);
      toast.error("Failed to generate form URL");
    } finally {
      setLoading(false);
    }
  }, [workflowId, nodes]);

  useEffect(() => {
    if (workflowId && open) {
      generateFormUrl();
      loadWorkflowStatus();
    }
  }, [workflowId, open, generateFormUrl, loadWorkflowStatus]);

  const copyToClipboard = () => {
    if (formUrl) {
      navigator.clipboard.writeText(formUrl);
      toast.success("Form URL copied to clipboard");
    }
  };

  const openFormInNewTab = () => {
    if (formUrl) {
      window.open(formUrl, '_blank');
    }
  };

  const handleToggleActivation = async (enabled: boolean) => {
    if (!workflowId) {
      toast.error("Please save the workflow first");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("workflows")
        .update({
          status: enabled ? "active" : "draft"
        })
        .eq("id", workflowId)
        .select("status")
        .single();

      if (error) throw error;

      // Verify the update was successful
      if (data && data.status === (enabled ? "active" : "draft")) {
        setIsActive(enabled);
        toast.success(enabled ? "Workflow activated successfully" : "Workflow deactivated");

        if (enabled) {
          toast.info("Form is now active and waiting for submissions");
        }
      } else {
        // Status didn't update as expected - reload to check
        await loadWorkflowStatus();
        toast.warning("Status update may not have been saved. Please check and try again.");
      }
    } catch (error) {
      console.error("Error updating workflow status:", error);
      toast.error("Failed to update workflow status");
      // Reload status to show current state
      await loadWorkflowStatus();
    } finally {
      setSaving(false);
    }
  };

  const hasFormNode = nodes.some((node: any) => node.data?.type === "form");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!workflowId || !hasFormNode}>
          <FileText className="h-4 w-4 mr-2" />
          Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Form Settings</DialogTitle>
          <DialogDescription>
            Share this form URL to collect data from users
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasFormNode ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Add a Form trigger node to your workflow to generate a form URL
            </p>
          </div>
        ) : formUrl ? (
          <div className="space-y-6">
            {/* Activation Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="form-activation" className="text-base">
                  Activate Workflow
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "Workflow is active and waiting for form submissions"
                    : "Activate to start accepting form submissions"}
                </p>
              </div>
              <Switch
                id="form-activation"
                checked={isActive}
                onCheckedChange={handleToggleActivation}
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <Label>Form URL</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                    <code className="text-sm font-mono break-all whitespace-normal text-foreground flex-1">
                      {formUrl}
                    </code>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0 h-10"
                  title="Copy form URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={openFormInNewTab}
                  className="flex-shrink-0 h-10"
                  title="Open form in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this URL with users to collect form submissions.
                Submissions will automatically trigger your workflow.
              </p>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Note:</strong> The workflow must be saved and active for the form to work.
                  Users can access this URL directly in their browser to fill out and submit the form.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Unable to generate form URL. Please ensure your workflow is saved.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

