import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DownloadIcon,
  UploadIcon,
  RotateCcwIcon,
  EyeIcon,
  EyeOffIcon,
  CodeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { advancedTheme } from "@/polymet/data/theme-tokens";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ExpertPanelWrapperProps {
  /**
   * Panel title
   */
  title: string;
  /**
   * Panel description
   */
  description?: string;
  /**
   * Panel content
   */
  children: React.ReactNode;
  /**
   * Current configuration (for export/import)
   */
  config?: any;
  /**
   * Default configuration (for reset)
   */
  defaultConfig?: any;
  /**
   * Callback when config is imported
   */
  onConfigImport?: (config: any) => void;
  /**
   * Callback when reset is clicked
   */
  onReset?: () => void;
  /**
   * Show expert mode toggle
   */
  showExpertToggle?: boolean;
  /**
   * Expert mode state
   */
  expertMode?: boolean;
  /**
   * Callback when expert mode changes
   */
  onExpertModeChange?: (enabled: boolean) => void;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Is collapsible
   */
  collapsible?: boolean;
  /**
   * Initially collapsed
   */
  defaultCollapsed?: boolean;
  /**
   * Badge text (e.g., "Beta", "Advanced")
   */
  badge?: string;
}

/**
 * Expert panel wrapper with controls
 * Provides export/import JSON, reset to defaults, and expert mode toggle
 */
export function ExpertPanelWrapper({
  title,
  description,
  children,
  config,
  defaultConfig,
  onConfigImport,
  onReset,
  showExpertToggle = true,
  expertMode = false,
  onExpertModeChange,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
  badge,
}: ExpertPanelWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Export config as JSON
  const handleExport = () => {
    if (!config) return;

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import config from JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);
        onConfigImport?.(importedConfig);
      } catch (error) {
        console.error("Failed to import config:", error);
        alert("Failed to import configuration. Please check the file format.");
      }
    };
    input.click();
  };

  return (
    <Card
      className={`${className}`}
      style={{
        fontSize: advancedTheme.typography.fontSize.sm,
        borderRadius: advancedTheme.radius.md,
      }}
    >
      <CardHeader
        style={{
          padding: `${advancedTheme.spacing.md} ${advancedTheme.spacing.lg}`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle
                style={{
                  fontSize: advancedTheme.typography.fontSize.lg,
                  lineHeight: advancedTheme.typography.lineHeight.tight,
                }}
              >
                {title}
              </CardTitle>
              {badge && (
                <Badge
                  variant="secondary"
                  style={{
                    fontSize: advancedTheme.typography.fontSize.xs,
                    padding: `${advancedTheme.spacing.xs} ${advancedTheme.spacing.sm}`,
                  }}
                >
                  {badge}
                </Badge>
              )}
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="ml-auto"
                >
                  {isCollapsed ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronUpIcon className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            {description && (
              <CardDescription
                style={{
                  fontSize: advancedTheme.typography.fontSize.xs,
                  lineHeight: advancedTheme.typography.lineHeight.normal,
                }}
              >
                {description}
              </CardDescription>
            )}
          </div>

          {/* Expert Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              {/* Expert Mode Toggle */}
              {showExpertToggle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={expertMode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onExpertModeChange?.(!expertMode)}
                      style={{
                        padding: advancedTheme.spacing.sm,
                      }}
                    >
                      {expertMode ? (
                        <EyeIcon className="w-4 h-4" />
                      ) : (
                        <EyeOffIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {expertMode ? "Hide" : "Show"} parameter IDs and technical
                      details
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Export JSON */}
              {config && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExport}
                      style={{
                        padding: advancedTheme.spacing.sm,
                      }}
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export configuration as JSON</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Import JSON */}
              {onConfigImport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleImport}
                      style={{
                        padding: advancedTheme.spacing.sm,
                      }}
                    >
                      <UploadIcon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Import configuration from JSON</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Reset to Defaults */}
              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onReset}
                      style={{
                        padding: advancedTheme.spacing.sm,
                      }}
                    >
                      <RotateCcwIcon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to recommended defaults</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent
          style={{
            padding: `0 ${advancedTheme.spacing.lg} ${advancedTheme.spacing.lg}`,
          }}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
}
