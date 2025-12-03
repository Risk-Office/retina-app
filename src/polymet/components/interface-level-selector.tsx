import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import {
  useInterfaceLevelSettings,
  type InterfaceLevel,
} from "@/polymet/data/tenant-settings";
import { useTenant } from "@/polymet/data/tenant-context";
import { MonitorIcon, ZapIcon, SettingsIcon, SparklesIcon } from "lucide-react";

export interface InterfaceLevelSelectorProps {
  /**
   * Variant: "global" for settings page, "decision" for per-decision override
   */
  variant: "global" | "decision";
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Callback when level changes (for analytics)
   */
  onLevelChange?: (level: InterfaceLevel, isTemporary: boolean) => void;
  /**
   * Show label
   */
  showLabel?: boolean;
}

const LEVEL_CONFIG: Record<
  InterfaceLevel,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  basic: {
    label: "Basic",
    description: "Simplified interface with essential controls",
    icon: MonitorIcon,
    color: "text-blue-500",
  },
  intermediate: {
    label: "Intermediate",
    description: "Balanced interface with common features",
    icon: SettingsIcon,
    color: "text-green-500",
  },
  advanced: {
    label: "Advanced",
    description: "Full interface with all controls and analytics",
    icon: ZapIcon,
    color: "text-orange-500",
  },
  auto: {
    label: "Auto",
    description: "Automatically adapts based on context",
    icon: SparklesIcon,
    color: "text-purple-500",
  },
};

export function InterfaceLevelSelector({
  variant,
  className = "",
  onLevelChange,
  showLabel = true,
}: InterfaceLevelSelectorProps) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const { level: globalLevel, setInterfaceLevel: setGlobalLevel } =
    useInterfaceLevelSettings(tenantId);
  const { interfaceLevel: currentLevel, setInterfaceLevel } =
    useInterfaceLevel();

  // For decision variant, track temporary override
  const [decisionOverride, setDecisionOverride] =
    useState<InterfaceLevel | null>(null);

  // Determine which level to show
  const displayLevel =
    variant === "decision" && decisionOverride
      ? decisionOverride
      : variant === "decision"
        ? currentLevel
        : globalLevel;

  const handleLevelChange = (newLevel: InterfaceLevel) => {
    const isTemporary = variant === "decision";

    if (variant === "global") {
      // Update global settings
      setGlobalLevel(newLevel);

      // Apply theme immediately
      if (newLevel !== "auto") {
        setInterfaceLevel(newLevel, "user-profile");
      }

      // Show toast
      const config = LEVEL_CONFIG[newLevel];
      toast({
        title: `Interface level: ${config.label}`,
        description: config.description,
      });

      // Analytics event
      if (onLevelChange) {
        onLevelChange(newLevel, false);
      }

      // Fire analytics event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "interface_level_changed", {
          level: newLevel,
          variant: "global",
          timestamp: Date.now(),
        });
      }
    } else {
      // Decision-level temporary override
      setDecisionOverride(newLevel);

      // Apply theme temporarily
      if (newLevel !== "auto") {
        setInterfaceLevel(newLevel, "decision-mode");
      }

      // Show toast with temporary indicator
      const config = LEVEL_CONFIG[newLevel];
      toast({
        title: `View mode: ${config.label}`,
        description: `${config.description} (temporary for this session)`,
      });

      // Analytics event
      if (onLevelChange) {
        onLevelChange(newLevel, true);
      }

      // Fire analytics event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "interface_level_changed", {
          level: newLevel,
          variant: "decision",
          temporary: true,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Reset decision override when component unmounts
  useEffect(() => {
    return () => {
      if (variant === "decision" && decisionOverride) {
        setDecisionOverride(null);
      }
    };
  }, [variant, decisionOverride]);

  const config = LEVEL_CONFIG[displayLevel];
  const Icon = config.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {variant === "global" ? "Interface Level" : "View Mode"}
          </Label>
          {variant === "decision" && decisionOverride && (
            <Badge variant="outline" className="text-xs">
              Temporary
            </Badge>
          )}
        </div>
      )}
      <Select value={displayLevel} onValueChange={handleLevelChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${config.color}`} />

              <span>{config.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LEVEL_CONFIG) as InterfaceLevel[]).map((level) => {
            const levelConfig = LEVEL_CONFIG[level];
            const LevelIcon = levelConfig.icon;
            return (
              <SelectItem key={level} value={level}>
                <div className="flex items-start gap-3 py-1">
                  <LevelIcon
                    className={`w-5 h-5 mt-0.5 ${levelConfig.color}`}
                  />

                  <div className="flex-1">
                    <div className="font-medium">{levelConfig.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {levelConfig.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
