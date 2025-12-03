import React from "react";
import { useLocation } from "react-router-dom";
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { getLayer, LAYER_METADATA } from "@/polymet/data/layer-presets";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DecisionLayer } from "@/polymet/data/layer-presets";

/**
 * Layer Theme Indicator
 *
 * Visual indicator that shows:
 * - Current route
 * - Resolved decision layer
 * - Active theme level
 * - Theme source
 *
 * Useful for debugging and demonstrating the layer-based theme system.
 */
export function LayerThemeIndicator() {
  const location = useLocation();
  const { interfaceLevel, source } = useInterfaceLevel();
  const layer = getLayer(location.pathname);

  const themeColors: Record<string, string> = {
    basic: "bg-green-500",
    intermediate: "bg-blue-500",
    advanced: "bg-purple-500",
  };

  const sourceLabels: Record<string, string> = {
    "page-override": "Page Override",
    "decision-mode": "Decision Mode",
    "route-layer": "Route Layer",
    "user-profile": "User Profile",
    "tenant-default": "Tenant Default",
    "system-default": "System Default",
  };

  return (
    <Card className="fixed bottom-4 right-4 p-3 shadow-lg border-2 z-50 max-w-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Theme Level:
          </span>
          <Badge
            className={`${themeColors[interfaceLevel]} text-white capitalize`}
          >
            {interfaceLevel}
          </Badge>
        </div>

        {layer && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Layer:
            </span>
            <Badge variant="outline" className="capitalize text-xs">
              {LAYER_METADATA[layer as DecisionLayer].order}.{" "}
              {LAYER_METADATA[layer as DecisionLayer].name}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Source:
          </span>
          <span className="text-xs text-foreground">
            {sourceLabels[source] || source}
          </span>
        </div>

        <div className="pt-2 border-t border-border">
          <span className="text-xs font-mono text-muted-foreground">
            {location.pathname}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Compact version for header/toolbar
 */
export function LayerThemeIndicatorCompact() {
  const { interfaceLevel } = useInterfaceLevel();

  const themeColors: Record<string, string> = {
    basic: "bg-green-500",
    intermediate: "bg-blue-500",
    advanced: "bg-purple-500",
  };

  return (
    <Badge
      className={`${themeColors[interfaceLevel]} text-white capitalize text-xs`}
    >
      {interfaceLevel}
    </Badge>
  );
}
