import React from "react";
import { Friendly } from "@/polymet/components/friendly-term";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface DecisionOption {
  id: string;
  label: string;
  score?: number;
  expectedReturn?: number;
  cost?: number;
  mitigationCost?: number;
  horizonMonths?: number;
}

interface OptionFinancialsSectionProps {
  options: DecisionOption[];
  onUpdateOptionFinancials: (
    id: string,
    field: "expectedReturn" | "cost" | "mitigationCost" | "horizonMonths",
    value: number | undefined
  ) => void;
  plainLanguage: boolean;
  globalHorizonMonths: number;
}

export function OptionFinancialsSection({
  options,
  onUpdateOptionFinancials,
  plainLanguage,
  globalHorizonMonths,
}: OptionFinancialsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Option Financials</Label>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.id}
            className="p-3 border border-border rounded-lg space-y-2"
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Expected Return
                </Label>
                <Input
                  type="number"
                  value={option.expectedReturn ?? 0}
                  onChange={(e) =>
                    onUpdateOptionFinancials(
                      option.id,
                      "expectedReturn",
                      Number(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cost</Label>
                <Input
                  type="number"
                  value={option.cost ?? 0}
                  onChange={(e) =>
                    onUpdateOptionFinancials(
                      option.id,
                      "cost",
                      Number(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  <Friendly term="mitigation" />
                </Label>
                <Input
                  type="number"
                  value={option.mitigationCost ?? 0}
                  onChange={(e) =>
                    onUpdateOptionFinancials(
                      option.id,
                      "mitigationCost",
                      Number(e.target.value)
                    )
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">
                    <Friendly term="horizon" /> (months)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          How far ahead this option applies. Leave empty to use
                          Time window from header ({globalHorizonMonths}m).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  value={option.horizonMonths ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    onUpdateOptionFinancials(
                      option.id,
                      "horizonMonths",
                      value === "" ? undefined : Number(value)
                    );
                  }}
                  placeholder={`Use ${globalHorizonMonths}m`}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
