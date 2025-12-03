import React, { useState } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import { useFeatureFlags } from "@/polymet/data/feature-flags";
import { MODULE_REGISTRY } from "@/polymet/data/module-registry";
import { useAuthStore } from "@/polymet/data/auth-store";
import { useRetinaStore } from "@/polymet/data/retina-store";
import { PermissionGuard } from "@/polymet/components/permission-guard";
import {
  useRAROCThresholds,
  useUtilitySettings,
  useTCORSettings,
  UTILITY_MODE_DESCRIPTIONS,
  type UtilityMode,
} from "@/polymet/data/tenant-settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SettingsIcon,
  ShieldIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  ShieldAlertIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ROLE_ICONS = {
  viewer: EyeIcon,
  editor: ShieldAlertIcon,
  admin: ShieldCheckIcon,
};

function AdminContent() {
  const { tenant } = useTenant();
  const { flags, updateFlag, isEnabled } = useFeatureFlags(tenant.tenantId);
  const { user, canModifyFeatureFlags, updateRole } = useAuthStore();
  const { addAudit } = useRetinaStore();
  const { thresholds, updateThresholds } = useRAROCThresholds(tenant.tenantId);
  const { settings: utilitySettings, updateUtilitySettings } =
    useUtilitySettings(tenant.tenantId);
  const { settings: tcorSettings, updateTCORSettings } = useTCORSettings(
    tenant.tenantId
  );
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  } | null>(null);
  const [redThreshold, setRedThreshold] = useState(thresholds.red.toString());
  const [amberThreshold, setAmberThreshold] = useState(
    thresholds.amber.toString()
  );
  const [utilityMode, setUtilityMode] = useState<UtilityMode>(
    utilitySettings.mode
  );
  const [riskAversion, setRiskAversion] = useState(
    utilitySettings.a.toString()
  );
  const [outcomeScale, setOutcomeScale] = useState(
    utilitySettings.scale.toString()
  );
  const [useForRecommendation, setUseForRecommendation] = useState(
    utilitySettings.useForRecommendation
  );
  const [insuranceRate, setInsuranceRate] = useState(
    tcorSettings.insuranceRate.toString()
  );
  const [contingencyOnCap, setContingencyOnCap] = useState(
    tcorSettings.contingencyOnCap.toString()
  );

  // Sync local state with thresholds from hook
  React.useEffect(() => {
    setRedThreshold(thresholds.red.toString());
    setAmberThreshold(thresholds.amber.toString());
  }, [thresholds]);

  // Sync local state with utility settings from hook
  React.useEffect(() => {
    setUtilityMode(utilitySettings.mode);
    setRiskAversion(utilitySettings.a.toString());
    setOutcomeScale(utilitySettings.scale.toString());
    setUseForRecommendation(utilitySettings.useForRecommendation);
  }, [utilitySettings]);

  // Sync local state with TCOR settings from hook
  React.useEffect(() => {
    setInsuranceRate(tcorSettings.insuranceRate.toString());
    setContingencyOnCap(tcorSettings.contingencyOnCap.toString());
  }, [tcorSettings]);

  // Auto-dismiss toast after 5 seconds
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const canManage = canModifyFeatureFlags(tenant.tenantId);

  // Handle individual toggle with permission check
  const handleToggle = (moduleKey: string, enabled: boolean) => {
    if (!canManage) {
      setToastMessage({
        title: "Permission Denied",
        description: "You don't have permission to modify feature flags",
        variant: "destructive",
      });
      return;
    }

    updateFlag(moduleKey, enabled);

    // Add audit event
    addAudit("feature.flag.changed", {
      tenantId: tenant.tenantId,
      moduleKey,
      enabled,
      actorRole: user?.role || "unknown",
    });
  };

  // Handle bulk enable/disable
  const handleBulkAction = (action: "enable" | "disable") => {
    if (!canManage) {
      setToastMessage({
        title: "Permission Denied",
        description: "You don't have permission to modify feature flags",
        variant: "destructive",
      });
      return;
    }

    const newValue = action === "enable";
    const affectedModules: string[] = [];

    MODULE_REGISTRY.forEach((module) => {
      if (isEnabled(module.key) !== newValue) {
        updateFlag(module.key, newValue);
        affectedModules.push(module.key);
      }
    });

    // Add single audit event for bulk action
    if (affectedModules.length > 0) {
      addAudit("feature.flag.bulk.changed", {
        tenantId: tenant.tenantId,
        action,
        modules: affectedModules,
        count: affectedModules.length,
        actorRole: user?.role || "unknown",
      });

      setToastMessage({
        title: "Bulk Action Complete",
        description: `${action === "enable" ? "Enabled" : "Disabled"} ${affectedModules.length} module(s)`,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast Message */}
      {toastMessage && (
        <Alert
          variant={
            toastMessage.variant === "destructive" ? "destructive" : "default"
          }
          className="mb-4"
        >
          <AlertCircleIcon className="h-4 w-4" />

          <div>
            <div className="font-semibold">{toastMessage.title}</div>
            <div className="text-sm">{toastMessage.description}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setToastMessage(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage module features for {tenant.tenantName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <SettingsIcon className="h-3 w-3 mr-1" />
            {enabledCount} / {MODULE_REGISTRY.length} enabled
          </Badge>
          {user && (
            <Badge variant="secondary" className="text-sm">
              {React.createElement(ROLE_ICONS[user.role], {
                className: "h-3 w-3 mr-1",
              })}
              {user.role}
            </Badge>
          )}
        </div>
      </div>

      {/* Role Switcher (Demo Only) */}
      <Card>
        <CardHeader>
          <CardTitle>Role Switcher (Demo)</CardTitle>
          <CardDescription>
            Switch between roles to test RBAC controls. In production, roles are
            assigned by administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["viewer", "editor", "admin"] as const).map((role) => {
                const Icon = ROLE_ICONS[role];
                const isActive = user?.role === role;
                const descriptions = {
                  viewer: "Can view goals and data, but cannot create or edit",
                  editor:
                    "Can create and edit goals, but cannot manage modules",
                  admin: "Full access to all features and settings",
                };

                return (
                  <button
                    key={role}
                    onClick={() => {
                      updateRole(role);
                      addAudit("user.role.changed", {
                        tenantId: tenant.tenantId,
                        previousRole: user?.role,
                        newRole: role,
                        userId: user?.id,
                      });
                      setToastMessage({
                        title: "Role Updated",
                        description: `Switched to ${role} role`,
                      });
                    }}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5" />

                      <div className="font-semibold capitalize">{role}</div>
                      {isActive && (
                        <Badge variant="default" className="ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {descriptions[role]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Info */}
      {!canManage && (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />

          <AlertDescription>
            Your current role (<strong>{user?.role}</strong>) does not have
            permission to manage modules. Module toggles are disabled. Requires{" "}
            <strong>admin</strong> role.
          </AlertDescription>
        </Alert>
      )}

      {/* Module Feature Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Module Features</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enable or disable modules for this tenant. Changes are saved
                automatically.
              </p>
            </div>
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("enable")}
                        disabled={
                          !canManage || enabledCount === MODULE_REGISTRY.length
                        }
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Enable All
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canManage && (
                    <TooltipContent>
                      <p>Requires manager role</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("disable")}
                        disabled={!canManage || enabledCount === 0}
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Disable All
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canManage && (
                    <TooltipContent>
                      <p>Requires manager role</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MODULE_REGISTRY.map((module) => {
              const enabled = isEnabled(module.key);

              return (
                <div
                  key={module.key}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl text-muted-foreground">
                      {module.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{module.name}</div>
                        <Badge
                          variant={enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {module.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Route: {module.path}
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              handleToggle(module.key, checked)
                            }
                            disabled={!canManage}
                          />
                        </span>
                      </TooltipTrigger>
                      {!canManage && (
                        <TooltipContent>
                          <p>Requires manager role</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Decision Metrics Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Metrics</CardTitle>
          <CardDescription>
            Configure RAROC thresholds for risk assessment badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="red-threshold">Red Threshold</Label>
                <Input
                  id="red-threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={redThreshold}
                  onChange={(e) => setRedThreshold(e.target.value)}
                  placeholder="0.05"
                />

                <p className="text-xs text-muted-foreground">
                  RAROC {"<"} {redThreshold || "0.05"} will show red badge
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amber-threshold">Amber Threshold</Label>
                <Input
                  id="amber-threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amberThreshold}
                  onChange={(e) => setAmberThreshold(e.target.value)}
                  placeholder="0.10"
                />

                <p className="text-xs text-muted-foreground">
                  RAROC {"<"} {amberThreshold || "0.10"} will show amber badge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  const red = parseFloat(redThreshold);
                  const amber = parseFloat(amberThreshold);

                  // Validate inputs
                  if (isNaN(red) || isNaN(amber)) {
                    setToastMessage({
                      title: "Invalid Input",
                      description:
                        "Please enter valid numbers for both thresholds",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (red <= 0 || amber <= 0) {
                    setToastMessage({
                      title: "Invalid Thresholds",
                      description: "Thresholds must be greater than 0",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (red >= amber) {
                    setToastMessage({
                      title: "Invalid Thresholds",
                      description:
                        "Red threshold must be less than amber threshold",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    updateThresholds({ red, amber });
                    addAudit("settings.raroc.updated", {
                      tenantId: tenant.tenantId,
                      red,
                      amber,
                      actorRole: user?.role || "unknown",
                    });
                    setToastMessage({
                      title: "Thresholds Updated",
                      description: `RAROC thresholds saved: Red < ${red}, Amber < ${amber}`,
                    });
                  } catch (error) {
                    setToastMessage({
                      title: "Error",
                      description:
                        "Failed to save thresholds. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save Thresholds
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRedThreshold("0.05");
                  setAmberThreshold("0.10");
                }}
              >
                Reset to Defaults
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="text-sm font-medium">Current Thresholds:</div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white hover:bg-red-600">
                    Red
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    RAROC {"<"} {thresholds.red}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                    Amber
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {thresholds.red} ≤ RAROC {"<"} {thresholds.amber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                    Green
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    RAROC ≥ {thresholds.amber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Utility</CardTitle>
          <CardDescription>
            Configure utility function for Expected Utility and Certainty
            Equivalent computation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utility-mode">Mode</Label>
                <Select
                  value={utilityMode}
                  onValueChange={(value) =>
                    setUtilityMode(value as UtilityMode)
                  }
                >
                  <SelectTrigger id="utility-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARA">CARA</SelectItem>
                    <SelectItem value="CRRA">CRRA</SelectItem>
                    <SelectItem value="Exponential">Exponential</SelectItem>
                    <SelectItem value="Quadratic">Quadratic</SelectItem>
                    <SelectItem value="Power">Power</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {UTILITY_MODE_DESCRIPTIONS[utilityMode]}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-aversion">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dotted border-muted-foreground">
                          Risk aversion (a)
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Higher values = more risk-averse. Default: 0.000005
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="risk-aversion"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={riskAversion}
                  onChange={(e) => setRiskAversion(e.target.value)}
                  placeholder="0.000005"
                />

                <p className="text-xs text-muted-foreground">
                  Coefficient for CARA utility function
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outcome-scale">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dotted border-muted-foreground">
                          Outcome scale
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Divides outcomes before utility computation. Default:
                          100000
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="outcome-scale"
                  type="number"
                  step="1000"
                  min="1"
                  value={outcomeScale}
                  onChange={(e) => setOutcomeScale(e.target.value)}
                  placeholder="100000"
                />

                <p className="text-xs text-muted-foreground">
                  Scale factor for normalizing outcomes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="use-recommendation">Recommendation</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="use-recommendation"
                    checked={useForRecommendation}
                    onCheckedChange={setUseForRecommendation}
                  />

                  <Label
                    htmlFor="use-recommendation"
                    className="font-normal cursor-pointer"
                  >
                    Use Utility for recommendation
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, recommendations use CE instead of RAROC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  const a = parseFloat(riskAversion);
                  const scale = parseFloat(outcomeScale);

                  // Validate inputs
                  if (isNaN(a) || isNaN(scale)) {
                    setToastMessage({
                      title: "Invalid Input",
                      description: "Please enter valid numbers for all fields",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (a < 0 || scale <= 0) {
                    setToastMessage({
                      title: "Invalid Values",
                      description:
                        "Risk aversion must be ≥ 0 and scale must be > 0",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    updateUtilitySettings({
                      mode: utilityMode,
                      a,
                      scale,
                      useForRecommendation,
                    });
                    addAudit("settings.utility.changed", {
                      tenantId: tenant.tenantId,
                      mode: utilityMode,
                      a,
                      scale,
                      useForRecommendation,
                      actorRole: user?.role || "unknown",
                    });
                    setToastMessage({
                      title: "Utility Settings Updated",
                      description: `Saved: mode=${utilityMode}, a=${a}, scale=${scale}, useForRec=${useForRecommendation}`,
                    });
                  } catch (error) {
                    setToastMessage({
                      title: "Error",
                      description:
                        "Failed to save utility settings. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save Utility Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUtilityMode("CARA");
                  setRiskAversion("0.000005");
                  setOutcomeScale("100000");
                  setUseForRecommendation(false);
                }}
              >
                Reset to Defaults
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="text-sm font-medium">Current Settings:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Mode: {utilitySettings.mode}</div>
                <div className="text-xs italic">
                  {UTILITY_MODE_DESCRIPTIONS[utilitySettings.mode]}
                </div>
                <div>Risk aversion (a): {utilitySettings.a}</div>
                <div>Outcome scale: {utilitySettings.scale}</div>
                <div>
                  Use for recommendation:{" "}
                  {utilitySettings.useForRecommendation ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TCOR Settings */}
      <Card>
        <CardHeader>
          <CardTitle>TCOR (proxy)</CardTitle>
          <CardDescription>
            Configure Total Cost of Risk parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance-rate">Insurance rate on cost</Label>
                <Input
                  id="insurance-rate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={insuranceRate}
                  onChange={(e) => setInsuranceRate(e.target.value)}
                  placeholder="0.01"
                />

                <p className="text-xs text-muted-foreground">
                  Default: 0.01 (1% of option cost)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contingency-rate">
                  Contingency on econ capital
                </Label>
                <Input
                  id="contingency-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={contingencyOnCap}
                  onChange={(e) => setContingencyOnCap(e.target.value)}
                  placeholder="0.15"
                />

                <p className="text-xs text-muted-foreground">
                  Default: 0.15 (15% of economic capital)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  const insurance = parseFloat(insuranceRate);
                  const contingency = parseFloat(contingencyOnCap);

                  // Validate inputs
                  if (isNaN(insurance) || isNaN(contingency)) {
                    setToastMessage({
                      title: "Invalid Input",
                      description: "Please enter valid numbers for both fields",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (
                    insurance < 0 ||
                    insurance > 1 ||
                    contingency < 0 ||
                    contingency > 1
                  ) {
                    setToastMessage({
                      title: "Invalid Values",
                      description: "Rates must be between 0 and 1",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    updateTCORSettings({
                      insuranceRate: insurance,
                      contingencyOnCap: contingency,
                    });
                    addAudit("settings.tcor.changed", {
                      tenantId: tenant.tenantId,
                      insuranceRate: insurance,
                      contingencyOnCap: contingency,
                      actorRole: user?.role || "unknown",
                    });
                    setToastMessage({
                      title: "TCOR Settings Updated",
                      description: `Saved: insurance=${insurance}, contingency=${contingency}`,
                    });
                  } catch (error) {
                    setToastMessage({
                      title: "Error",
                      description:
                        "Failed to save TCOR settings. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save TCOR Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInsuranceRate("0.01");
                  setContingencyOnCap("0.15");
                }}
              >
                Reset to Defaults
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="text-sm font-medium">Current Settings:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Insurance rate: {tcorSettings.insuranceRate} (
                  {(tcorSettings.insuranceRate * 100).toFixed(1)}%)
                </div>
                <div>
                  Contingency on capital: {tcorSettings.contingencyOnCap} (
                  {(tcorSettings.contingencyOnCap * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Feature flags are stored per-tenant in localStorage with key:{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              retina:features:{tenant.tenantId}
            </code>
          </p>
          <p>
            • Disabled modules will be hidden from the sidebar and modules index
          </p>
          <p>
            • Attempting to access a disabled module will show a guard message
          </p>
          <p>• Changes take effect immediately without page refresh</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function RetinaAdmin() {
  return (
    <PermissionGuard requiredRole="admin">
      <AdminContent />
    </PermissionGuard>
  );
}
