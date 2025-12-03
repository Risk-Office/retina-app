import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export interface AntifragilityThresholds {
  excellent: number;
  good: number;
  moderate: number;
  needsAttention: number;
}

interface AntifragilityGaugeProps {
  /**
   * Antifragility Index value (0-100)
   */
  value: number;
  /**
   * Optional title override
   */
  title?: string;
  /**
   * Optional size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Optional className for the card wrapper
   */
  className?: string;
  /**
   * Show as card or inline
   */
  variant?: "card" | "inline";
  /**
   * Custom thresholds for color coding
   */
  thresholds?: AntifragilityThresholds;
}

/**
 * Default thresholds
 */
const DEFAULT_THRESHOLDS: AntifragilityThresholds = {
  excellent: 80,
  good: 60,
  moderate: 40,
  needsAttention: 0,
};

/**
 * Get color based on antifragility index value with custom thresholds
 */
function getColorForValue(
  value: number,
  thresholds: AntifragilityThresholds = DEFAULT_THRESHOLDS
): {
  stroke: string;
  text: string;
  bg: string;
  label: string;
} {
  if (value >= thresholds.excellent) {
    return {
      stroke: "stroke-green-500",
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      label: "Excellent",
    };
  } else if (value >= thresholds.good) {
    return {
      stroke: "stroke-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      label: "Good",
    };
  } else if (value >= thresholds.moderate) {
    return {
      stroke: "stroke-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-500/10",
      label: "Moderate",
    };
  } else {
    return {
      stroke: "stroke-red-500",
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      label: "Needs Attention",
    };
  }
}

/**
 * Get size dimensions based on size variant
 */
function getSizeDimensions(size: "sm" | "md" | "lg") {
  switch (size) {
    case "sm":
      return {
        radius: 50,
        strokeWidth: 8,
        fontSize: "text-2xl",
        labelSize: "text-xs",
        width: 140,
        height: 140,
      };
    case "lg":
      return {
        radius: 90,
        strokeWidth: 12,
        fontSize: "text-5xl",
        labelSize: "text-base",
        width: 240,
        height: 240,
      };
    case "md":
    default:
      return {
        radius: 70,
        strokeWidth: 10,
        fontSize: "text-4xl",
        labelSize: "text-sm",
        width: 180,
        height: 180,
      };
  }
}

function CircularGauge({
  value,
  size = "md",
  thresholds,
}: {
  value: number;
  size: "sm" | "md" | "lg";
  thresholds?: AntifragilityThresholds;
}) {
  const colors = getColorForValue(value, thresholds);
  const dimensions = getSizeDimensions(size);
  const { radius, strokeWidth, fontSize, labelSize, width, height } =
    dimensions;

  // Calculate circle properties
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Center coordinates
  const center = width / 2;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          className="stroke-muted fill-none"
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("fill-none transition-all duration-500", colors.stroke)}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("font-bold", colors.text, fontSize)}>
          {Math.round(value)}
        </div>
        <div className={cn("text-muted-foreground font-medium", labelSize)}>
          / 100
        </div>
        <div
          className={cn(
            "mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
            colors.bg,
            colors.text
          )}
        >
          {colors.label}
        </div>
      </div>
    </div>
  );
}

export function AntifragilityGauge({
  value,
  title,
  size = "md",
  className,
  variant = "card",
  thresholds,
}: AntifragilityGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <CircularGauge value={clampedValue} size={size} thresholds={thresholds} />
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-xl font-bold">
            {title || "Antifragility Index"}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs font-semibold mb-1">
                  Antifragility Index (AI)
                </p>
                <p className="text-xs">
                  Higher = gains from volatility instead of being harmed by it.
                  Measures how well this choice benefits from stress.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          How well this choice benefits from stress
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">{content}</CardContent>
    </Card>
  );
}

/**
 * Compact version for inline display
 */
export function AntifragilityGaugeCompact({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <AntifragilityGauge
      value={value}
      size="sm"
      variant="inline"
      className={className}
    />
  );
}
