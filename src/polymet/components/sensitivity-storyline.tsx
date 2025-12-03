import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SensitivityResult {
  paramName: string;
  paramType: "cost" | "return" | "varWeight" | "varMean";
  deltaPlus: number;
  deltaMinus: number;
  percentPlus: number;
  percentMinus: number;
  maxAbsDelta: number;
}

interface SensitivityStorylineProps {
  results: SensitivityResult[];
  targetMetric: "RAROC" | "CE";
  stepPercent: number;
  baselineMetric: number;
  optionLabel: string;
}

interface StorylineNarrative {
  paramName: string;
  narrative: string;
  impact: "high" | "medium" | "low";
  direction: "positive" | "negative" | "mixed";
}

/**
 * Generate a plain-language narrative for a sensitivity driver
 */
function generateNarrative(
  result: SensitivityResult,
  targetMetric: "RAROC" | "CE",
  stepPercent: number,
  baselineMetric: number
): StorylineNarrative {
  const metricLabel =
    targetMetric === "RAROC" ? "risk-adjusted return" : "certainty equivalent";
  const metricShort = targetMetric === "RAROC" ? "RAROC" : "CE";

  // Determine impact magnitude
  const impactPercent = Math.max(
    Math.abs(result.percentPlus),
    Math.abs(result.percentMinus)
  );
  let impact: "high" | "medium" | "low";
  if (impactPercent > 10) impact = "high";
  else if (impactPercent > 5) impact = "medium";
  else impact = "low";

  // Determine direction
  let direction: "positive" | "negative" | "mixed";
  if (result.deltaPlus > 0 && result.deltaMinus < 0) {
    direction = "mixed";
  } else if (Math.abs(result.deltaPlus) > Math.abs(result.deltaMinus)) {
    direction = result.deltaPlus > 0 ? "positive" : "negative";
  } else {
    direction = result.deltaMinus > 0 ? "positive" : "negative";
  }

  // Generate narrative based on parameter type
  let narrative = "";

  if (result.paramType === "cost") {
    const costImpact = Math.abs(result.percentMinus);
    if (result.deltaMinus < 0) {
      narrative = `A ${stepPercent}% cost increase would reduce our ${metricLabel} by ${costImpact.toFixed(1)}%, mainly because higher costs directly squeeze margins. `;
      narrative += `This is one of our biggest vulnerabilities. `;
      narrative += `Cost control is critical to maintaining performance.`;
    } else {
      narrative = `A ${stepPercent}% cost increase would improve our ${metricLabel} by ${costImpact.toFixed(1)}%. `;
      narrative += `This unusual pattern suggests costs may be offsetting other risks. `;
      narrative += `Review the cost structure carefully.`;
    }
  } else if (result.paramType === "return") {
    const returnImpact = Math.abs(result.percentPlus);
    if (result.deltaPlus > 0) {
      narrative = `A ${stepPercent}% revenue increase would boost our ${metricLabel} by ${returnImpact.toFixed(1)}%, showing strong upside leverage. `;
      narrative += `Revenue growth is a key driver of value. `;
      narrative += `Focus on initiatives that can reliably increase returns.`;
    } else {
      narrative = `A ${stepPercent}% revenue increase would reduce our ${metricLabel} by ${returnImpact.toFixed(1)}%. `;
      narrative += `This counterintuitive result may indicate risk-return tradeoffs. `;
      narrative += `Higher revenues might be bringing disproportionate risks.`;
    }
  } else if (result.paramType === "varWeight") {
    const varName = result.paramName.replace(" (weight)", "");
    const weightImpact = Math.max(
      Math.abs(result.percentPlus),
      Math.abs(result.percentMinus)
    );

    if (direction === "mixed") {
      narrative = `The ${varName} weight has a ${weightImpact.toFixed(1)}% impact on ${metricShort}. `;
      narrative += `Increasing this factor's importance shifts our risk profile significantly. `;
      narrative += `Consider whether this variable deserves more or less weight in decisions.`;
    } else if (Math.abs(result.deltaPlus) > Math.abs(result.deltaMinus)) {
      narrative = `Increasing the ${varName} weight by ${stepPercent}% ${result.deltaPlus > 0 ? "improves" : "worsens"} ${metricShort} by ${Math.abs(result.percentPlus).toFixed(1)}%. `;
      narrative += `This variable's relative importance matters greatly. `;
      narrative += `${result.deltaPlus > 0 ? "Emphasize" : "De-emphasize"} this factor in your analysis.`;
    } else {
      narrative = `Decreasing the ${varName} weight by ${stepPercent}% ${result.deltaMinus > 0 ? "improves" : "worsens"} ${metricShort} by ${Math.abs(result.percentMinus).toFixed(1)}%. `;
      narrative += `This variable's relative importance matters greatly. `;
      narrative += `${result.deltaMinus > 0 ? "Reduce" : "Increase"} this factor's weight in your analysis.`;
    }
  } else if (result.paramType === "varMean") {
    const varName = result.paramName
      .replace(" (mean)", "")
      .replace(" (mu)", "");
    const meanImpact = Math.max(
      Math.abs(result.percentPlus),
      Math.abs(result.percentMinus)
    );

    if (Math.abs(result.deltaPlus) > Math.abs(result.deltaMinus)) {
      narrative = `If ${varName} averages ${stepPercent}% higher, our ${metricLabel} ${result.deltaPlus > 0 ? "increases" : "decreases"} by ${Math.abs(result.percentPlus).toFixed(1)}%. `;
      narrative += `This parameter's central tendency is a major driver. `;
      narrative += `${result.deltaPlus > 0 ? "Favorable" : "Unfavorable"} shifts here have outsized effects.`;
    } else {
      narrative = `If ${varName} averages ${stepPercent}% lower, our ${metricLabel} ${result.deltaMinus > 0 ? "increases" : "decreases"} by ${Math.abs(result.percentMinus).toFixed(1)}%. `;
      narrative += `This parameter's central tendency is a major driver. `;
      narrative += `${result.deltaMinus > 0 ? "Favorable" : "Unfavorable"} shifts here have outsized effects.`;
    }
  }

  return {
    paramName: result.paramName,
    narrative,
    impact,
    direction,
  };
}

export function SensitivityStoryline({
  results,
  targetMetric,
  stepPercent,
  baselineMetric,
  optionLabel,
}: SensitivityStorylineProps) {
  // Get top 3 drivers by absolute sensitivity
  const topThree = results.slice(0, 3);

  // Generate narratives for top 3
  const storylines: StorylineNarrative[] = topThree.map((result) =>
    generateNarrative(result, targetMetric, stepPercent, baselineMetric)
  );

  if (storylines.length === 0) {
    return null;
  }

  const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getDirectionIcon = (direction: "positive" | "negative" | "mixed") => {
    switch (direction) {
      case "positive":
        return "↑";
      case "negative":
        return "↓";
      case "mixed":
        return "↕";
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            <CardTitle className="text-base">What matters most?</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Explains in simple terms which factors move the outcome the
                    most.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className="text-xs">
            Top 3 Drivers
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {storylines.map((storyline, index) => (
          <div
            key={index}
            className="p-4 bg-background rounded-lg border border-border space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  #{index + 1}
                </Badge>
                <span className="font-semibold text-sm">
                  {storyline.paramName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getImpactColor(storyline.impact)}`}
                >
                  {storyline.impact} impact
                </Badge>
                <span
                  className="text-lg"
                  title={`${storyline.direction} direction`}
                >
                  {getDirectionIcon(storyline.direction)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {storyline.narrative}
            </p>
          </div>
        ))}

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            These narratives are generated based on ±{stepPercent}% sensitivity
            analysis for <span className="font-semibold">{optionLabel}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
