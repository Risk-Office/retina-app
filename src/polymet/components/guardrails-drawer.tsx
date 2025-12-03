import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlertIcon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  InfoIcon,
  AlertCircleIcon,
  LayoutTemplateIcon,
  BellIcon,
  HistoryIcon,
} from "lucide-react";
import {
  addGuardrail,
  loadGuardrailsForOption,
  deleteGuardrail,
  updateGuardrail,
  initializeDefaultGuardrails,
  getViolatedGuardrails,
  getAlertLevelColor,
  getAlertLevelBadgeVariant,
  type Guardrail,
  type AlertLevel,
  type Direction,
  type GuardrailInput,
} from "@/polymet/data/decision-guardrails";
import {
  getAllTemplates,
  applyTemplate,
  type GuardrailTemplate,
} from "@/polymet/data/guardrail-templates";
import {
  recordViolation,
  getViolationsByOption,
} from "@/polymet/data/guardrail-violations";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  sendViolationNotification,
  sendTestNotification,
  type NotificationConfig,
} from "@/polymet/data/guardrail-notifications";
import { useTenant } from "@/polymet/data/tenant-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GuardrailsDrawerProps {
  decisionId: string;
  optionId: string;
  optionLabel: string;
  currentMetrics?: {
    var95?: number;
    raroc?: number;
    ev?: number;
    creditRiskScore?: number;
    [key: string]: number | undefined;
  };
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function GuardrailsDrawer({
  decisionId,
  optionId,
  optionLabel,
  currentMetrics,
  onAuditEvent,
}: GuardrailsDrawerProps) {
  const { tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [templates] = useState<GuardrailTemplate[]>(
    getAllTemplates(tenant.tenantId)
  );
  const [notificationConfig, setNotificationConfig] =
    useState<NotificationConfig>(
      loadNotificationPreferences(decisionId, optionId)
    );
  const [violations] = useState(getViolationsByOption(decisionId, optionId));
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGuardrail, setNewGuardrail] = useState<GuardrailInput>({
    metricName: "VaR95",
    thresholdValue: 0,
    direction: "below",
    alertLevel: "caution",
  });

  // Load guardrails when drawer opens
  useEffect(() => {
    if (open) {
      loadGuardrailsData();
    }
  }, [open, decisionId, optionId]);

  const loadGuardrailsData = () => {
    const loaded = loadGuardrailsForOption(decisionId, optionId);

    // Initialize defaults if no guardrails exist and we have metrics
    if (loaded.length === 0 && currentMetrics?.var95 !== undefined) {
      const initialized = initializeDefaultGuardrails(
        decisionId,
        optionId,
        currentMetrics.var95,
        currentMetrics.creditRiskScore || 50
      );
      setGuardrails(initialized);

      onAuditEvent("guardrails.initialized", {
        decisionId,
        optionId,
        optionLabel,
        count: initialized.length,
      });
    } else {
      setGuardrails(loaded);
    }
  };

  const handleAddGuardrail = () => {
    if (!newGuardrail.metricName || newGuardrail.thresholdValue === 0) {
      return;
    }

    const added = addGuardrail(decisionId, optionId, newGuardrail);
    setGuardrails([...guardrails, added]);
    setIsAdding(false);

    // Reset form
    setNewGuardrail({
      metricName: "VaR95",
      thresholdValue: 0,
      direction: "below",
      alertLevel: "caution",
    });

    onAuditEvent("guardrail.added", {
      decisionId,
      optionId,
      optionLabel,
      guardrailId: added.id,
      metricName: added.metricName,
      thresholdValue: added.thresholdValue,
      direction: added.direction,
      alertLevel: added.alertLevel,
    });
  };

  const handleApplyTemplate = (template: GuardrailTemplate) => {
    if (!currentMetrics) return;

    const metrics = {
      VaR95: currentMetrics.var95 || 0,
      CVaR95: currentMetrics.cvar95 || 0,
      RAROC: currentMetrics.raroc || 0,
      EV: currentMetrics.ev || 0,
      "Credit Risk Score": currentMetrics.creditRiskScore || 0,
      "Economic Capital": currentMetrics.economicCapital || 0,
    };

    const appliedGuardrails = applyTemplate(template, metrics);

    appliedGuardrails.forEach((g) => {
      const added = addGuardrail(decisionId, optionId, g);
      setGuardrails((prev) => [...prev, added]);
    });

    setShowTemplates(false);

    onAuditEvent("guardrail.template.applied", {
      decisionId,
      optionId,
      optionLabel,
      templateId: template.id,
      templateName: template.name,
      guardrailsAdded: appliedGuardrails.length,
    });
  };

  const handleSaveNotifications = () => {
    saveNotificationPreferences(decisionId, optionId, notificationConfig);
    setShowNotifications(false);

    onAuditEvent("guardrail.notifications.updated", {
      decisionId,
      optionId,
      optionLabel,
      enabled: notificationConfig.enabled,
      recipientCount: notificationConfig.recipients.length,
    });
  };

  const handleTestNotification = async () => {
    if (notificationConfig.recipients.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    const response = await sendTestNotification(
      notificationConfig.recipients,
      `${optionLabel} - Test`
    );

    if (response.success) {
      alert("Test notification sent successfully!");
    } else {
      alert(`Failed to send: ${response.error}`);
    }
  };

  const handleDeleteGuardrail = (guardrailId: string) => {
    const guardrail = guardrails.find((g) => g.id === guardrailId);
    if (!guardrail) return;

    deleteGuardrail(decisionId, guardrailId);
    setGuardrails(guardrails.filter((g) => g.id !== guardrailId));

    onAuditEvent("guardrail.deleted", {
      decisionId,
      optionId,
      optionLabel,
      guardrailId,
      metricName: guardrail.metricName,
    });
  };

  // Get violated guardrails
  const violatedGuardrails = currentMetrics
    ? getViolatedGuardrails(decisionId, optionId, {
        VaR95: currentMetrics.var95 || 0,
        RAROC: currentMetrics.raroc || 0,
        EV: currentMetrics.ev || 0,
        "Credit Risk Score": currentMetrics.creditRiskScore || 0,
      })
    : [];

  const getAlertIcon = (level: AlertLevel) => {
    switch (level) {
      case "info":
        return InfoIcon;
      case "caution":
        return AlertCircleIcon;
      case "critical":
        return AlertTriangleIcon;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShieldAlertIcon className="w-4 h-4 mr-2" />
          Guardrails
          {violatedGuardrails.length > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {violatedGuardrails.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="w-5 h-5 text-primary" />
            Guardrails: {optionLabel}
          </SheetTitle>
          <SheetDescription>
            What limits should never be crossed?
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 inline-block ml-2 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Set threshold limits for key metrics. Get alerted when
                    values cross these boundaries.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Violated Guardrails Alert */}
          {violatedGuardrails.length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangleIcon className="w-5 h-5" />
                {violatedGuardrails.length} Guardrail
                {violatedGuardrails.length > 1 ? "s" : ""} Violated
              </div>
              <div className="space-y-1">
                {violatedGuardrails.map((guardrail) => (
                  <div
                    key={guardrail.id}
                    className="text-sm text-muted-foreground"
                  >
                    • {guardrail.metricName} is {guardrail.direction}{" "}
                    {guardrail.thresholdValue.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Guardrails */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Active Guardrails ({guardrails.length})
              </Label>
              {!isAdding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {guardrails.length === 0 && !isAdding ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <ShieldAlertIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No guardrails configured yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Run simulation to auto-initialize default guardrails
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {guardrails.map((guardrail) => {
                  const isViolated = violatedGuardrails.some(
                    (v) => v.id === guardrail.id
                  );
                  const AlertIcon = getAlertIcon(guardrail.alertLevel);

                  return (
                    <div
                      key={guardrail.id}
                      className={`p-4 border rounded-lg space-y-3 ${
                        isViolated
                          ? "border-destructive bg-destructive/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2 flex-1">
                          <AlertIcon
                            className={`w-5 h-5 mt-0.5 shrink-0 ${getAlertLevelColor(guardrail.alertLevel)}`}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">
                              {guardrail.metricName}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Must be {guardrail.direction}{" "}
                              <span className="font-medium">
                                {guardrail.thresholdValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={getAlertLevelBadgeVariant(
                              guardrail.alertLevel
                            )}
                          >
                            {guardrail.alertLevel}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuardrail(guardrail.id)}
                          >
                            <TrashIcon className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {isViolated && (
                        <div className="text-xs text-destructive font-medium">
                          ⚠ Threshold violated
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Guardrail Form */}
          {isAdding && (
            <div className="p-4 border border-border rounded-lg space-y-4 bg-accent/50">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Add New Guardrail
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="metric-name">Metric Name</Label>
                  <Select
                    value={newGuardrail.metricName}
                    onValueChange={(value) =>
                      setNewGuardrail({ ...newGuardrail, metricName: value })
                    }
                  >
                    <SelectTrigger id="metric-name">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VaR95">VaR95</SelectItem>
                      <SelectItem value="RAROC">RAROC</SelectItem>
                      <SelectItem value="EV">Expected Value</SelectItem>
                      <SelectItem value="Credit Risk Score">
                        Credit Risk Score
                      </SelectItem>
                      <SelectItem value="CVaR95">CVaR95</SelectItem>
                      <SelectItem value="Economic Capital">
                        Economic Capital
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold-value">Threshold Value</Label>
                  <Input
                    id="threshold-value"
                    type="number"
                    step="0.01"
                    value={newGuardrail.thresholdValue}
                    onChange={(e) =>
                      setNewGuardrail({
                        ...newGuardrail,
                        thresholdValue: Number(e.target.value),
                      })
                    }
                    placeholder="Enter threshold value"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="direction">Direction</Label>
                    <Select
                      value={newGuardrail.direction}
                      onValueChange={(value: Direction) =>
                        setNewGuardrail({ ...newGuardrail, direction: value })
                      }
                    >
                      <SelectTrigger id="direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-level">Alert Level</Label>
                    <Select
                      value={newGuardrail.alertLevel}
                      onValueChange={(value: AlertLevel) =>
                        setNewGuardrail({ ...newGuardrail, alertLevel: value })
                      }
                    >
                      <SelectTrigger id="alert-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="caution">Caution</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleAddGuardrail}
                  disabled={
                    !newGuardrail.metricName ||
                    newGuardrail.thresholdValue === 0
                  }
                  className="w-full"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Guardrail
                </Button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="text-sm font-medium">How Guardrails Work</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • <strong>Info</strong>: Informational threshold for awareness
              </li>
              <li>
                • <strong>Caution</strong>: Warning threshold requiring
                attention
              </li>
              <li>
                • <strong>Critical</strong>: Critical threshold requiring
                immediate action
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
