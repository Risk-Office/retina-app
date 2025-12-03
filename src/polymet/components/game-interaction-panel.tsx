import React, { useState, useEffect } from "react";
import { LayeredFrame } from "@/polymet/components/layered-frame";
import { DensityBox, DensityGrid } from "@/polymet/components/density-box";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type OurStrategy = "Conservative" | "Aggressive";
export type CompetitorMove = "Match" | "Undercut";

export interface GameInteractionConfig {
  ourStrategies: OurStrategy[];
  competitorMoves: CompetitorMove[];
  pUndercut: number; // Probability of Undercut [0..1]
  multipliers: {
    Match: {
      retMult: Record<OurStrategy, number>;
      costMult: Record<OurStrategy, number>;
    };
    Undercut: {
      retMult: Record<OurStrategy, number>;
      costMult: Record<OurStrategy, number>;
    };
  };
}

export interface OptionStrategy {
  optionId: string;
  strategy: OurStrategy;
}

export const DEFAULT_GAME_CONFIG: GameInteractionConfig = {
  ourStrategies: ["Conservative", "Aggressive"],
  competitorMoves: ["Match", "Undercut"],
  pUndercut: 0.4,
  multipliers: {
    Match: {
      retMult: { Conservative: 1.0, Aggressive: 1.05 },
      costMult: { Conservative: 1.0, Aggressive: 1.0 },
    },
    Undercut: {
      retMult: { Conservative: 0.95, Aggressive: 0.85 },
      costMult: { Conservative: 1.0, Aggressive: 1.02 },
    },
  },
};

interface GameInteractionPanelProps {
  decisionId: string;
  tenantId: string;
  options: Array<{ id: string; label: string }>;
  onConfigChange: (
    config: GameInteractionConfig,
    optionStrategies: OptionStrategy[]
  ) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function GameInteractionPanel({
  decisionId,
  tenantId,
  options,
  onConfigChange,
  onAuditEvent,
}: GameInteractionPanelProps) {
  const [config, setConfig] =
    useState<GameInteractionConfig>(DEFAULT_GAME_CONFIG);
  const [optionStrategies, setOptionStrategies] = useState<OptionStrategy[]>(
    options.map((opt) => ({ optionId: opt.id, strategy: "Conservative" }))
  );

  // Load config from localStorage on mount
  useEffect(() => {
    const storageKey = `retina:game:${tenantId}:${decisionId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed.config || DEFAULT_GAME_CONFIG);
        setOptionStrategies(
          parsed.optionStrategies ||
            options.map((opt) => ({
              optionId: opt.id,
              strategy: "Conservative",
            }))
        );
      } catch (error) {
        console.error("Failed to load game config:", error);
      }
    }
  }, [decisionId, tenantId]);

  // Sync option strategies when options change
  useEffect(() => {
    setOptionStrategies((prev) => {
      const existingMap = new Map(prev.map((s) => [s.optionId, s.strategy]));
      return options.map((opt) => ({
        optionId: opt.id,
        strategy: existingMap.get(opt.id) || "Conservative",
      }));
    });
  }, [options]);

  // Save config to localStorage and notify parent
  const saveConfig = () => {
    const storageKey = `retina:game:${tenantId}:${decisionId}`;
    const data = { config, optionStrategies };
    localStorage.setItem(storageKey, JSON.stringify(data));

    // Notify parent
    onConfigChange(config, optionStrategies);

    // Add audit event
    const multipliersSummary = {
      Match: {
        Conservative: {
          ret: config.multipliers.Match.retMult.Conservative,
          cost: config.multipliers.Match.costMult.Conservative,
        },
        Aggressive: {
          ret: config.multipliers.Match.retMult.Aggressive,
          cost: config.multipliers.Match.costMult.Aggressive,
        },
      },
      Undercut: {
        Conservative: {
          ret: config.multipliers.Undercut.retMult.Conservative,
          cost: config.multipliers.Undercut.costMult.Conservative,
        },
        Aggressive: {
          ret: config.multipliers.Undercut.retMult.Aggressive,
          cost: config.multipliers.Undercut.costMult.Aggressive,
        },
      },
    };

    onAuditEvent("game.stub.updated", {
      decisionId,
      pUndercut: config.pUndercut,
      multipliersSummary,
    });
  };

  const handleStrategyChange = (optionId: string, strategy: OurStrategy) => {
    setOptionStrategies((prev) =>
      prev.map((s) => (s.optionId === optionId ? { ...s, strategy } : s))
    );
  };

  const handleMultiplierChange = (
    competitorMove: CompetitorMove,
    multType: "retMult" | "costMult",
    strategy: OurStrategy,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      multipliers: {
        ...prev.multipliers,
        [competitorMove]: {
          ...prev.multipliers[competitorMove],
          [multType]: {
            ...prev.multipliers[competitorMove][multType],
            [strategy]: value,
          },
        },
      },
    }));
  };

  return (
    <LayeredFrame
      sectionTitle="Game Interaction (2×2)"
      helpTip="Model competitive dynamics using game theory. Define your strategy per option and set competitor behavior probabilities. The system applies multipliers to returns and costs based on the interaction outcomes."
      variant="bordered"
    >
      <DensityBox>
        {/* Option Strategies */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Our Strategy per Option
          </Label>
          <DensityBox spacing="tight">
            {options.map((option) => {
              const strategy = optionStrategies.find(
                (s) => s.optionId === option.id
              );
              return (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <Select
                    value={strategy?.strategy || "Conservative"}
                    onValueChange={(value: OurStrategy) =>
                      handleStrategyChange(option.id, value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conservative">Conservative</SelectItem>
                      <SelectItem value="Aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </DensityBox>
        </div>

        {/* Competitor Probability */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Competitor Move Probability
            </Label>
            <Badge variant="outline">
              P(Undercut) = {config.pUndercut.toFixed(2)}
            </Badge>
          </div>
          <DensityBox spacing="tight">
            <Slider
              value={[config.pUndercut]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, pUndercut: value }))
              }
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>P(Match) = {(1 - config.pUndercut).toFixed(2)}</span>
              <span>P(Undercut) = {config.pUndercut.toFixed(2)}</span>
            </div>
          </DensityBox>
        </div>

        {/* Multipliers */}
        <div>
          <Label className="text-sm font-semibold">
            Multipliers (Return & Cost)
          </Label>

          {/* Match Multipliers */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div className="font-medium text-sm flex items-center gap-2">
              <span>On Match</span>
              <Badge variant="secondary" className="text-xs">
                Competitor matches our move
              </Badge>
            </div>
            <DensityGrid columns={2}>
              {/* Conservative */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Conservative
                </Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Return Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Match.retMult.Conservative}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Match",
                          "retMult",
                          "Conservative",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Match.costMult.Conservative}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Match",
                          "costMult",
                          "Conservative",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Aggressive */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Aggressive
                </Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Return Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Match.retMult.Aggressive}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Match",
                          "retMult",
                          "Aggressive",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Match.costMult.Aggressive}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Match",
                          "costMult",
                          "Aggressive",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </DensityGrid>
          </div>

          {/* Undercut Multipliers */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div className="font-medium text-sm flex items-center gap-2">
              <span>On Undercut</span>
              <Badge variant="secondary" className="text-xs">
                Competitor undercuts us
              </Badge>
            </div>
            <DensityGrid columns={2}>
              {/* Conservative */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Conservative
                </Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Return Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Undercut.retMult.Conservative}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Undercut",
                          "retMult",
                          "Conservative",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Undercut.costMult.Conservative}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Undercut",
                          "costMult",
                          "Conservative",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Aggressive */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Aggressive
                </Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Return Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Undercut.retMult.Aggressive}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Undercut",
                          "retMult",
                          "Aggressive",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Mult</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.multipliers.Undercut.costMult.Aggressive}
                      onChange={(e) =>
                        handleMultiplierChange(
                          "Undercut",
                          "costMult",
                          "Aggressive",
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </DensityGrid>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={saveConfig} className="w-full">
          Save Game Configuration
        </Button>
      </DensityBox>
    </LayeredFrame>
  );
}
