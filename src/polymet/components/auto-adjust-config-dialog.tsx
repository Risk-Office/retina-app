import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InfoIcon,
  PlusIcon,
  XIcon,
  ShieldAlertIcon,
  MailIcon,
} from "lucide-react";
import {
  loadAutoAdjustConfig,
  saveAutoAdjustConfig,
  type AutoAdjustConfig,
} from "@/polymet/data/guardrail-auto-adjust";
import { useTenant } from "@/polymet/data/tenant-context";
import { Separator } from "@/components/ui/separator";

interface AutoAdjustConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function AutoAdjustConfigDialog({
  open,
  onOpenChange,
  onAuditEvent,
}: AutoAdjustConfigDialogProps) {
  const { tenant } = useTenant();
  const [config, setConfig] = useState<AutoAdjustConfig>({
    breachWindowDays: 90,
    breachThresholdCount: 2,
    tighteningPercent: 0.1,
    severityBasedAdjustment: true,
    emailNotifications: false,
    emailRecipients: [],
  });
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (open) {
      const currentConfig = loadAutoAdjustConfig(tenant.tenantId);
      setConfig(currentConfig);
    }
  }, [open, tenant.tenantId]);

  const handleSave = () => {
    saveAutoAdjustConfig(tenant.tenantId, config);

    if (onAuditEvent) {
      onAuditEvent("guardrail.config_updated", {
        tenantId: tenant.tenantId,
        config,
      });
    }

    onOpenChange(false);
  };

  const handleAddEmail = () => {
    if (newEmail && !config.emailRecipients.includes(newEmail)) {
      setConfig({
        ...config,
        emailRecipients: [...config.emailRecipients, newEmail],
      });
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setConfig({
      ...config,
      emailRecipients: config.emailRecipients.filter((e) => e !== email),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldAlertIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Auto-Adjustment Configuration</DialogTitle>
              <DialogDescription>
                Configure guardrail auto-adjustment behavior for{" "}
                {tenant.tenantName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Breach Detection Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Breach Detection
              </h3>
              <InfoIcon className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breach-window">Breach Window (days)</Label>
                <Input
                  id="breach-window"
                  type="number"
                  min="1"
                  max="365"
                  value={config.breachWindowDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      breachWindowDays: parseInt(e.target.value) || 90,
                    })
                  }
                />

                <p className="text-xs text-muted-foreground">
                  Time window to check for repeated breaches
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breach-count">Breach Threshold Count</Label>
                <Input
                  id="breach-count"
                  type="number"
                  min="1"
                  max="10"
                  value={config.breachThresholdCount}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      breachThresholdCount: parseInt(e.target.value) || 2,
                    })
                  }
                />

                <p className="text-xs text-muted-foreground">
                  Number of breaches to trigger auto-adjustment
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Adjustment Behavior */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Adjustment Behavior
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tightening-percent">
                  Base Tightening Percentage
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tightening-percent"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={(config.tighteningPercent * 100).toFixed(0)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        tighteningPercent:
                          (parseInt(e.target.value) || 10) / 100,
                      })
                    }
                    className="w-24"
                  />

                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default percentage to tighten thresholds (used when
                  severity-based adjustment is disabled)
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="space-y-1">
                  <Label htmlFor="severity-based" className="cursor-pointer">
                    Severity-Based Adjustment
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Vary tightening percentage based on breach severity
                  </p>
                </div>
                <Switch
                  id="severity-based"
                  checked={config.severityBasedAdjustment}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, severityBasedAdjustment: checked })
                  }
                />
              </div>

              {config.severityBasedAdjustment && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="text-sm font-medium text-foreground">
                    Severity-Based Tightening
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Minor (&lt;5%):
                      </span>
                      <Badge variant="outline">5% tightening</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Moderate (5-15%):
                      </span>
                      <Badge variant="outline">10% tightening</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Severe (15-30%):
                      </span>
                      <Badge variant="outline">15% tightening</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Critical (&gt;30%):
                      </span>
                      <Badge variant="outline">20% tightening</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-primary" />

              <h3 className="text-sm font-semibold text-foreground">
                Email Notifications
              </h3>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Enable Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send email alerts when auto-adjustments occur
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={config.emailNotifications}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, emailNotifications: checked })
                }
              />
            </div>

            {config.emailNotifications && (
              <div className="space-y-3">
                <Label>Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddEmail}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>

                {config.emailRecipients.length > 0 && (
                  <div className="space-y-2">
                    {config.emailRecipients.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm text-foreground">{email}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveEmail(email)}
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {config.emailRecipients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No recipients added yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
