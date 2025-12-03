import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  relationship: string;
  creditExposure?: number;
  dependencyScore?: number;
  notes?: string;
}

interface ParameterSensitivity {
  paramName: string;
  partnerInfluence: number; // 0-1 score indicating how much this partner affects this parameter
  direction: "positive" | "negative" | "neutral";
  magnitude: number; // absolute impact magnitude
}

interface PartnerSensitivityPanelProps {
  partner: Partner;
  parameterSensitivities: ParameterSensitivity[];
  onClose?: () => void;
}

export function PartnerSensitivityPanel({
  partner,
  parameterSensitivities,
  onClose,
}: PartnerSensitivityPanelProps) {
  const dependencyScore = partner.dependencyScore ?? 0;

  // Sort by magnitude descending
  const sortedSensitivities = [...parameterSensitivities].sort(
    (a, b) => b.magnitude - a.magnitude
  );

  // Calculate overall risk score
  const overallRiskScore =
    sortedSensitivities.reduce(
      (acc, s) => acc + s.magnitude * s.partnerInfluence,
      0
    ) / sortedSensitivities.length;

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High", color: "bg-red-500" };
    if (score >= 0.4) return { label: "Medium", color: "bg-orange-500" };
    return { label: "Low", color: "bg-yellow-500" };
  };

  const riskLevel = getRiskLevel(overallRiskScore);

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <Card className="border-2 border-orange-500/30">
      <CardHeader className="bg-orange-500/5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-orange-500" />
              Partner-Specific Sensitivity: {partner.name}
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{partner.relationship}</span>
              <span>•</span>
              <span>Exposure: {formatCurrency(partner.creditExposure)}</span>
              <span>•</span>
              <span>Dependency: {(dependencyScore * 100).toFixed(0)}%</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Overall Risk Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              Overall Parameter Risk Score
            </div>
            <Badge className={`${riskLevel.color} text-white`}>
              {riskLevel.label} Risk
            </Badge>
          </div>
          <Progress value={overallRiskScore * 100} className="h-2" />

          <div className="text-xs text-muted-foreground">
            Composite score based on partner influence across all sensitive
            parameters
          </div>
        </div>

        {/* Top Influenced Parameters */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Top Influenced Parameters</div>
          <div className="space-y-2">
            {sortedSensitivities.slice(0, 5).map((sensitivity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {sensitivity.paramName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={sensitivity.partnerInfluence * 100}
                      className="h-1.5 flex-1"
                    />

                    <span className="text-xs text-muted-foreground shrink-0">
                      {(sensitivity.partnerInfluence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {sensitivity.direction === "positive" ? (
                    <TrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : sensitivity.direction === "negative" ? (
                    <TrendingDownIcon className="w-4 h-4 text-red-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Sensitivity Table */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">
            Complete Parameter Analysis
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead className="text-right">Influence</TableHead>
                  <TableHead className="text-right">Magnitude</TableHead>
                  <TableHead className="text-center">Direction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSensitivities.map((sensitivity, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {sensitivity.paramName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {(sensitivity.partnerInfluence * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {sensitivity.magnitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-center">
                      {sensitivity.direction === "positive" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-700 dark:text-green-400"
                        >
                          Positive
                        </Badge>
                      ) : sensitivity.direction === "negative" ? (
                        <Badge
                          variant="outline"
                          className="bg-red-500/10 text-red-700 dark:text-red-400"
                        >
                          Negative
                        </Badge>
                      ) : (
                        <Badge variant="outline">Neutral</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Risk Interpretation */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="text-sm font-semibold">Risk Interpretation</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Influence:</strong> Percentage of parameter sensitivity
              attributable to this partner
            </p>
            <p>
              <strong>Magnitude:</strong> Absolute impact on target metric when
              parameter changes
            </p>
            <p>
              <strong>Direction:</strong> Whether partner relationship improves
              or worsens outcomes
            </p>
          </div>
        </div>

        {/* Partner Notes */}
        {partner.notes && (
          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
            <div className="text-sm font-semibold mb-2">Partner Notes</div>
            <div className="text-sm text-muted-foreground italic">
              "{partner.notes}"
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
