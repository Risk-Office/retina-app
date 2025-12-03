import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PartnerInfluence {
  partnerId: string;
  partnerName: string;
  influenceScore: number; // 0-1
  dependencyScore: number; // 0-1
}

interface TornadoBarIndicatorsProps {
  paramName: string;
  partnerInfluences: PartnerInfluence[];
  showIndicators: boolean;
}

export function TornadoBarIndicators({
  paramName,
  partnerInfluences,
  showIndicators,
}: TornadoBarIndicatorsProps) {
  if (!showIndicators || partnerInfluences.length === 0) {
    return null;
  }

  // Sort by influence score descending
  const sortedInfluences = [...partnerInfluences].sort(
    (a, b) => b.influenceScore - a.influenceScore
  );

  // Only show top 3 partners
  const topPartners = sortedInfluences.slice(0, 3);

  const getIndicatorColor = (dependencyScore: number) => {
    if (dependencyScore >= 0.9) return "bg-red-500";
    if (dependencyScore >= 0.7) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getIndicatorSize = (influenceScore: number) => {
    if (influenceScore >= 0.7) return "w-2.5 h-2.5";
    if (influenceScore >= 0.4) return "w-2 h-2";
    return "w-1.5 h-1.5";
  };

  return (
    <div className="flex items-center gap-1 ml-2">
      {topPartners.map((influence, idx) => {
        const color = getIndicatorColor(influence.dependencyScore);
        const size = getIndicatorSize(influence.influenceScore);

        return (
          <TooltipProvider key={influence.partnerId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`${color} ${size} rounded-full cursor-help animate-pulse`}
                  style={{
                    animationDelay: `${idx * 200}ms`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-semibold">{influence.partnerName}</div>
                  <div className="text-xs space-y-0.5">
                    <div>
                      Influence on {paramName}:{" "}
                      {(influence.influenceScore * 100).toFixed(0)}%
                    </div>
                    <div>
                      Overall Dependency:{" "}
                      {(influence.dependencyScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {sortedInfluences.length > 3 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-4 px-1 text-xs cursor-help bg-muted"
              >
                +{sortedInfluences.length - 3}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-semibold">Additional Partners</div>
                <div className="text-xs space-y-0.5">
                  {sortedInfluences.slice(3).map((influence) => (
                    <div key={influence.partnerId}>
                      {influence.partnerName} (
                      {(influence.influenceScore * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Helper function to generate mock partner influences for parameters
// This would be replaced with actual calculation logic
export function calculatePartnerInfluences(
  paramName: string,
  partners: Array<{
    id: string;
    name: string;
    dependencyScore?: number;
  }>
): PartnerInfluence[] {
  // Mock calculation - in real implementation, this would analyze
  // how each partner's characteristics affect the parameter
  return partners
    .filter((p) => (p.dependencyScore ?? 0) > 0.5)
    .map((partner) => {
      // Simulate different influence levels based on parameter type
      let baseInfluence = 0.3;

      if (paramName.includes("Cost")) {
        baseInfluence = (partner.dependencyScore ?? 0) * 0.8;
      } else if (paramName.includes("Return")) {
        baseInfluence = (partner.dependencyScore ?? 0) * 0.6;
      } else if (
        paramName.includes("Volatility") ||
        paramName.includes("Risk")
      ) {
        baseInfluence = (partner.dependencyScore ?? 0) * 0.9;
      } else if (paramName.includes("weight")) {
        baseInfluence = (partner.dependencyScore ?? 0) * 0.5;
      }

      // Add some randomness to simulate real-world variation
      const randomFactor = 0.8 + Math.random() * 0.4;
      const influenceScore = Math.min(1, baseInfluence * randomFactor);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        influenceScore,
        dependencyScore: partner.dependencyScore ?? 0,
      };
    })
    .filter((influence) => influence.influenceScore > 0.2);
}
