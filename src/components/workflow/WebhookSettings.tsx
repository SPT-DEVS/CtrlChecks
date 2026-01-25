import { useState, useEffect, useCallback } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Webhook, Copy, Loader2 } from "lucide-react";
import { ENDPOINTS } from "@/config/endpoints";

interface WebhookSettingsProps {
  workflowId: string | null;
}

export default function WebhookSettings({ workflowId }: WebhookSettingsProps) {
  const [open, setOpen] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadWebhookSettings = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("webhook_url, status")
        .eq("id", workflowId)
        .single();

      if (error) throw error;

      setWebhookEnabled(!!data.webhook_url);
      setWebhookUrl(data.webhook_url);
    } catch (error) {
      console.error("Error loading webhook settings:", error);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (workflowId && open) {
      loadWebhookSettings();
    }
  }, [workflowId, open, loadWebhookSettings]);

  const generateWebhookUrl = () => {
    return `${ENDPOINTS.itemBackend}/webhook-trigger/${workflowId}`;
  };

  const handleToggleWebhook = async (enabled: boolean) => {
    if (!workflowId) {
      toast.error("Please save the workflow first");
      return;
    }

    setSaving(true);
    try {
      const newWebhookUrl = enabled ? generateWebhookUrl() : null;

      const { error } = await supabase
        .from("workflows")
        .update({
          webhook_url: newWebhookUrl,
          status: enabled ? "active" : "draft"
        })
        .eq("id", workflowId);

      if (error) throw error;

      setWebhookEnabled(enabled);
      setWebhookUrl(newWebhookUrl);
      toast.success(enabled ? "Webhook enabled" : "Webhook disabled");
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast.error("Failed to update webhook settings");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!workflowId}>
          <Webhook className="h-4 w-4 mr-2" />
          Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Webhook Settings</DialogTitle>
          <DialogDescription>
            Enable webhook triggers to start this workflow from external services
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Webhook</Label>
                <p className="text-sm text-muted-foreground">
                  Allow external services to trigger this workflow
                </p>
              </div>
              <Switch
                checked={webhookEnabled}
                onCheckedChange={handleToggleWebhook}
                disabled={saving}
              />
            </div>

            {webhookEnabled && webhookUrl && (
              <div className="space-y-3">
                <Label>Webhook URL</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                      <code className="text-sm font-mono break-all whitespace-normal text-foreground flex-1">
                        {webhookUrl}
                      </code>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="flex-shrink-0 h-10"
                    title="Copy webhook URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send a POST request to this URL to trigger the workflow.
                  The request body will be passed as input to the workflow.
                </p>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Example cURL request:</p>
                  <div className="bg-background p-3 rounded border overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "value"}'`}
                    </pre>
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>Note:</strong> The workflow must be saved and active for webhook triggers to work.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
