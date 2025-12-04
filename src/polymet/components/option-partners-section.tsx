import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon, UsersIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export type RelationshipType =
  | "supplier"
  | "customer"
  | "JV"
  | "investor"
  | "lender";

export interface Partner {
  id: string;
  partner_name: string;
  relationship_type: RelationshipType;
  credit_exposure: number;
  dependency_score: number;
  notes: string;
  // Aliases for backward compatibility
  name?: string;
  relationship?: string;
  dependencyScore?: number;
  creditExposure?: number;
}

export interface OptionWithPartners {
  id: string;
  label: string;
  partners?: Partner[];
}

interface OptionPartnersSectionProps {
  options: OptionWithPartners[];
  onUpdatePartners: (optionId: string, partners: Partner[]) => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  supplier: "Supplier",
  customer: "Customer",
  JV: "Joint Venture",
  investor: "Investor",
  lender: "Lender",
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  supplier: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  customer: "bg-green-500/10 text-green-700 dark:text-green-400",
  JV: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  investor: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  lender: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function OptionPartnersSection({
  options,
  onUpdatePartners,
}: OptionPartnersSectionProps) {
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(
    new Set()
  );

  const toggleOption = (optionId: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(optionId)) {
      newExpanded.delete(optionId);
    } else {
      newExpanded.add(optionId);
    }
    setExpandedOptions(newExpanded);
  };

  const addPartner = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    const currentPartners = option.partners || [];
    if (currentPartners.length >= 5) {
      return; // Max 5 partners per option
    }

    const newPartner: Partner = {
      id: `partner-${Date.now()}`,
      partner_name: "",
      relationship_type: "supplier",
      credit_exposure: 0,
      dependency_score: 0.5,
      notes: "",
    };

    onUpdatePartners(optionId, [...currentPartners, newPartner]);
  };

  const removePartner = (optionId: string, partnerId: string) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    const currentPartners = option.partners || [];
    onUpdatePartners(
      optionId,
      currentPartners.filter((p) => p.id !== partnerId)
    );
  };

  const updatePartner = (
    optionId: string,
    partnerId: string,
    updates: Partial<Partner>
  ) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    const currentPartners = option.partners || [];
    onUpdatePartners(
      optionId,
      currentPartners.map((p) =>
        p.id === partnerId ? { ...p, ...updates } : p
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />

            <CardTitle className="text-base">
              Who else is involved or depends on this?
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    External parties tied to this decision (customers,
                    suppliers, financiers, etc.)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => {
          const isExpanded = expandedOptions.has(option.id);
          const partners = option.partners || [];
          const canAddMore = partners.length < 5;

          return (
            <div
              key={option.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Option Header */}
              <div
                className="p-3 bg-muted/50 flex items-center justify-between cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleOption(option.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{option.label}</span>
                  {partners.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {partners.length}{" "}
                      {partners.length === 1 ? "partner" : "partners"}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canAddMore) {
                      addPartner(option.id);
                      if (!isExpanded) {
                        toggleOption(option.id);
                      }
                    }
                  }}
                  disabled={!canAddMore}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Partner
                </Button>
              </div>

              {/* Partners List */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {partners.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No partners added yet. Click "Add Partner" to get started.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {partners.map((partner) => (
                        <div
                          key={partner.id}
                          className="p-4 border border-border rounded-lg space-y-3 bg-background"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              {/* Partner Name */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Partner Name
                                </Label>
                                <Input
                                  value={partner.partner_name}
                                  onChange={(e) =>
                                    updatePartner(option.id, partner.id, {
                                      partner_name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter partner name"
                                  className="h-8"
                                />
                              </div>

                              {/* Relationship Type */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Relationship Type
                                </Label>
                                <Select
                                  value={partner.relationship_type}
                                  onValueChange={(value: RelationshipType) =>
                                    updatePartner(option.id, partner.id, {
                                      relationship_type: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(RELATIONSHIP_LABELS).map(
                                      ([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                          {label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Credit Exposure */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Credit Exposure ($)
                                </Label>
                                <Input
                                  type="number"
                                  value={partner.credit_exposure}
                                  onChange={(e) =>
                                    updatePartner(option.id, partner.id, {
                                      credit_exposure: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="h-8"
                                  min={0}
                                />
                              </div>

                              {/* Dependency Score */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Dependency Score (0–1)
                                </Label>
                                <Input
                                  type="number"
                                  value={partner.dependency_score}
                                  onChange={(e) => {
                                    const value = Math.max(
                                      0,
                                      Math.min(1, Number(e.target.value))
                                    );
                                    updatePartner(option.id, partner.id, {
                                      dependency_score: value,
                                    });
                                  }}
                                  placeholder="0.5"
                                  className="h-8"
                                  step={0.1}
                                  min={0}
                                  max={1}
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removePartner(option.id, partner.id)
                              }
                              className="shrink-0 mt-5"
                            >
                              <TrashIcon className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Notes
                            </Label>
                            <Textarea
                              value={partner.notes}
                              onChange={(e) =>
                                updatePartner(option.id, partner.id, {
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Additional notes about this partner..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>

                          {/* Relationship Badge */}
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                RELATIONSHIP_COLORS[partner.relationship_type]
                              }
                            >
                              {RELATIONSHIP_LABELS[partner.relationship_type]}
                            </Badge>
                            {partner.dependency_score >= 0.7 && (
                              <Badge variant="outline" className="text-xs">
                                High dependency
                              </Badge>
                            )}
                            {partner.credit_exposure > 0 && (
                              <Badge variant="outline" className="text-xs">
                                ${partner.credit_exposure.toLocaleString()}{" "}
                                exposure
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!canAddMore && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Maximum of 5 partners per option reached
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
