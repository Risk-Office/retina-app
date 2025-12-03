import React from "react";
import { TrashIcon } from "lucide-react";
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
import { InfoMicroTip } from "@/polymet/components/info-micro-tip";
import type {
  ScenarioVar,
  DistributionType,
} from "@/polymet/data/scenario-engine";
import {
  getDistParamLabels,
  formatParamSummary,
} from "@/polymet/data/scenario-engine";

export interface ScenarioVariableCardProps {
  variable: ScenarioVar;
  onUpdate: (updates: Partial<ScenarioVar>) => void;
  onUpdateParam: (paramKey: string, value: number) => void;
  onRemove: () => void;
  /**
   * Card index for accessibility
   */
  index: number;
}

/**
 * ScenarioVariableCard Component
 *
 * Card component for scenario variables with acrylic background effect.
 * Uses intermediate theme tokens for professional, data-driven interface.
 */
export function ScenarioVariableCard({
  variable,
  onUpdate,
  onUpdateParam,
  onRemove,
  index,
}: ScenarioVariableCardProps) {
  return (
    <div
      className="relative p-3 rounded-lg border border-border/50 backdrop-blur-sm bg-card/80 hover:bg-card/90 transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      role="group"
      aria-labelledby={`variable-name-${variable.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 space-y-1">
          <Label
            htmlFor={`variable-name-${variable.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Variable Name
          </Label>
          <Input
            id={`variable-name-${variable.id}`}
            value={variable.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-8 text-sm font-medium"
            placeholder="Variable name"
            aria-label={`Variable ${index + 1} name`}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="shrink-0 h-8 w-8 p-0 hover:bg-destructive/10"
          aria-label={`Remove variable ${variable.name || index + 1}`}
        >
          <TrashIcon className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Applies To */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label
              htmlFor={`applies-to-${variable.id}`}
              className="text-xs text-muted-foreground"
            >
              Applies To
            </Label>
            <InfoMicroTip
              content="Whether this variable affects expected returns or costs"
              ariaLabel="Learn more about Applies To"
            />
          </div>
          <Select
            value={variable.appliesTo}
            onValueChange={(value: "return" | "cost") =>
              onUpdate({ appliesTo: value })
            }
          >
            <SelectTrigger
              id={`applies-to-${variable.id}`}
              className="h-8 text-sm"
              aria-label={`Variable ${index + 1} applies to`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Distribution */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label
              htmlFor={`distribution-${variable.id}`}
              className="text-xs text-muted-foreground"
            >
              Distribution
            </Label>
            <InfoMicroTip
              content="Statistical distribution type for modeling uncertainty"
              ariaLabel="Learn more about Distribution"
            />
          </div>
          <Select
            value={variable.dist}
            onValueChange={(value: DistributionType) =>
              onUpdate({ dist: value })
            }
          >
            <SelectTrigger
              id={`distribution-${variable.id}`}
              className="h-8 text-sm"
              aria-label={`Variable ${index + 1} distribution`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="lognormal">Lognormal</SelectItem>
              <SelectItem value="triangular">Triangular</SelectItem>
              <SelectItem value="uniform">Uniform</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Distribution Parameters */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">
            Parameters: {formatParamSummary(variable)}
          </Label>
          <InfoMicroTip
            content={`Parameters for ${variable.dist} distribution. Adjust these values to control the shape and spread of the distribution.`}
            ariaLabel="Learn more about distribution parameters"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {getDistParamLabels(variable.dist).map((paramKey) => (
            <div key={paramKey} className="space-y-1">
              <Label
                htmlFor={`param-${variable.id}-${paramKey}`}
                className="text-xs text-muted-foreground capitalize"
              >
                {paramKey}
              </Label>
              <Input
                id={`param-${variable.id}-${paramKey}`}
                type="number"
                step="0.01"
                value={variable.params[paramKey] ?? 0}
                onChange={(e) =>
                  onUpdateParam(paramKey, Number(e.target.value))
                }
                className="h-8 text-sm"
                aria-label={`Variable ${index + 1} ${paramKey} parameter`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1">
          <Label
            htmlFor={`weight-${variable.id}`}
            className="text-xs text-muted-foreground"
          >
            Weight (multiplier strength)
          </Label>
          <InfoMicroTip
            content="Controls how strongly this variable affects the outcome. Higher values = stronger impact."
            ariaLabel="Learn more about Weight"
          />
        </div>
        <Input
          id={`weight-${variable.id}`}
          type="number"
          step="0.1"
          value={variable.weight ?? 1}
          onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
          className="h-8 text-sm"
          aria-label={`Variable ${index + 1} weight`}
        />
      </div>
    </div>
  );
}
