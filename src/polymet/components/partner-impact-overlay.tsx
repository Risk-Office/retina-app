import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  relationship: string;
  creditExposure?: number;
  dependencyScore?: number;
  notes?: string;
}

interface PartnerImpactOverlayProps {
  partners: Partner[];
  onThresholdChange?: (threshold: number) => void;
  onPartnerSelect?: (partnerId: string) => void;
  selectedPartnerId?: string;
}

export function PartnerImpactOverlay({
  partners,
  onThresholdChange,
  onPartnerSelect,
  selectedPartnerId,
}: PartnerImpactOverlayProps) {
  const [dependencyThreshold, setDependencyThreshold] = useState<number>(0.6);

  const filteredPartners = partners.filter(
    (p) => (p.dependencyScore ?? 0) >= dependencyThreshold
  );

  const handleThresholdChange = (value: string) => {
    const threshold = parseFloat(value);
    setDependencyThreshold(threshold);
    onThresholdChange?.(threshold);
  };

  const getDependencyColor = (score: number) => {
    if (score >= 0.9) return "bg-red-500";
    if (score >= 0.7) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getDependencyLabel = (score: number) => {
    if (score >= 0.9) return "Critical";
    if (score >= 0.7) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (filteredPartners.length === 0) {
    return (
      <div className="absolute top-2 right-8 bg-background/95 border border-border rounded-lg p-4 shadow-lg max-w-xs">
        <div className="text-xs text-muted-foreground text-center">
          No partners meet the dependency threshold of{" "}
          {dependencyThreshold.toFixed(1)}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-8 bg-background/95 border border-border rounded-lg shadow-lg max-w-md">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />

            <div className="text-xs font-semibold text-foreground">
              Partner Impact Analysis
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Shows external partners that drive significant impact on
                  decision outcomes
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Dependency Threshold Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Dependency Threshold
            </label>
            <Badge variant="outline" className="text-xs">
              {filteredPartners.length} partner
              {filteredPartners.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <Select
            value={dependencyThreshold.toString()}
            onValueChange={handleThresholdChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">≥ 0.5 (Medium+)</SelectItem>
              <SelectItem value="0.6">≥ 0.6 (High)</SelectItem>
              <SelectItem value="0.7">≥ 0.7 (High+)</SelectItem>
              <SelectItem value="0.9">≥ 0.9 (Critical)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Partner List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-2 space-y-2">
          {filteredPartners.map((partner) => {
            const isSelected = selectedPartnerId === partner.id;
            const dependencyScore = partner.dependencyScore ?? 0;
            const dependencyColor = getDependencyColor(dependencyScore);
            const dependencyLabel = getDependencyLabel(dependencyScore);

            return (
              <Card
                key={partner.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-orange-500 bg-orange-500/5"
                    : "bg-card"
                }`}
                onClick={() => onPartnerSelect?.(partner.id)}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Partner Name & Dependency Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {partner.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {partner.relationship}
                      </div>
                    </div>
                    <Badge
                      className={`${dependencyColor} text-white text-xs shrink-0`}
                    >
                      {dependencyLabel}
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Dependency
                      </div>
                      <div className="text-sm font-mono font-semibold">
                        {(dependencyScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Exposure
                      </div>
                      <div className="text-sm font-mono font-semibold">
                        {formatCurrency(partner.creditExposure)}
                      </div>
                    </div>
                  </div>

                  {/* Impact Indicator */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {dependencyScore >= 0.7 ? (
                      <>
                        <TrendingDownIcon className="w-3 h-3 text-red-500" />

                        <span className="text-xs text-muted-foreground">
                          High impact on downside risk
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUpIcon className="w-3 h-3 text-orange-500" />

                        <span className="text-xs text-muted-foreground">
                          Moderate impact on outcomes
                        </span>
                      </>
                    )}
                  </div>

                  {/* Notes (if available) */}
                  {partner.notes && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground italic">
                        "{partner.notes}"
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/50">
        <div className="text-xs text-muted-foreground">
          Click a partner to view parameter-specific sensitivity
        </div>
      </div>
    </div>
  );
}
