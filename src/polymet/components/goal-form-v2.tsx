import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PlusIcon,
  TrashIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";
import {
  validateSMART,
  getSMARTHelperText,
  getSMARTSuggestions,
} from "@/polymet/data/smart-validator-v2";
import type {
  GoalV2,
  TimeUnit,
  TimeHorizonDetail,
} from "@/polymet/data/goal-v2-schema";
import { computeTimeHorizonCategory } from "@/polymet/data/goal-v2-schema";
import type { StakeholderV2 } from "@/polymet/data/stakeholder-v2-schema";

interface GoalFormV2Props {
  formData: Partial<GoalV2>;
  setFormData: (data: Partial<GoalV2>) => void;
  currentStep: number;
  stakeholders: StakeholderV2[];
  goals: GoalV2[];
}

export function GoalFormV2({
  formData,
  setFormData,
  currentStep,
  stakeholders,
  goals,
}: GoalFormV2Props) {
  const [smartResult, setSmartResult] = useState<ReturnType<
    typeof validateSMART
  > | null>(null);

  // Update SMART validation when relevant fields change
  useEffect(() => {
    if (currentStep === 2 || currentStep === 6) {
      const result = validateSMART({
        statement: formData.statement || "",
        description: formData.description,
        kpis: formData.kpis || [],
        owners: formData.owners || [],
        time_horizon: formData.time_horizon,
        category: formData.category,
        currentStep: currentStep, // Pass current step for context-aware validation
      });
      setSmartResult(result);
    }
  }, [formData, currentStep]);

  // Step 1: Category
  if (currentStep === 1) {
    const categories = [
      "Strategic",
      "Financial",
      "Customer",
      "Operational",
      "Innovation",
      "People",
      "Compliance",
      "Sustainability",
      "Quality",
      "Growth",
    ];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Goal Category</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pick where this goal lives (e.g., Finance or Operations).
          </p>
        </div>

        <RadioGroup
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value as GoalV2["category"] })
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => (
              <div key={category} className="relative">
                <RadioGroupItem
                  value={category}
                  id={category}
                  className="peer sr-only"
                />

                <Label
                  htmlFor={category}
                  className="flex items-center justify-between p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <span className="font-medium">{category}</span>
                  {formData.category === category && (
                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                  )}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    );
  }

  // Step 2: Statement & Description
  if (currentStep === 2) {
    const helperText = getSMARTHelperText();
    const suggestions = smartResult ? getSMARTSuggestions(smartResult) : [];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Define Your Goal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Say exactly what you want to achieve, by when.
          </p>
        </div>

        {/* SMART Helper */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <InfoIcon className="w-4 h-4" />
              SMART Goal Helper (Specific, Measurable, Achievable, Relevant,
              Time-bound)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Specific:</span>{" "}
              {helperText.specific}
            </div>
            <div>
              <span className="font-medium">Measurable:</span>{" "}
              {helperText.measurable}
            </div>
            <div>
              <span className="font-medium">Achievable:</span>{" "}
              {helperText.achievable}
            </div>
            <div>
              <span className="font-medium">Relevant:</span>{" "}
              {helperText.relevant}
            </div>
            <div>
              <span className="font-medium">Time-bound:</span>{" "}
              {helperText.timeBound}
            </div>
          </CardContent>
        </Card>

        {/* Statement */}
        <div className="space-y-2">
          <Label htmlFor="statement">
            Goal Statement <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="statement"
            placeholder="Enter a clear, specific goal statement (10-600 characters)"
            value={formData.statement}
            onChange={(e) =>
              setFormData({ ...formData, statement: e.target.value })
            }
            rows={3}
            maxLength={600}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formData.statement?.length || 0} / 600 characters</span>
            {formData.statement && formData.statement.length >= 10 && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" />
                Minimum length met
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Additional context or details"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
          />
        </div>

        {/* Time Horizon */}
        <div className="space-y-2">
          <Label>
            Time Horizon (How long will it take?){" "}
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                placeholder="Enter duration"
                value={formData.time_horizon_detail?.value || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  const unit = formData.time_horizon_detail?.unit || "months";
                  if (value && value > 0) {
                    const category = computeTimeHorizonCategory(value, unit);
                    setFormData({
                      ...formData,
                      time_horizon: category,
                      time_horizon_detail: {
                        value,
                        unit,
                        category,
                      },
                    });
                  } else {
                    setFormData({
                      ...formData,
                      time_horizon: undefined,
                      time_horizon_detail: undefined,
                    });
                  }
                }}
              />
            </div>
            <div className="w-40">
              <Select
                value={formData.time_horizon_detail?.unit || "months"}
                onValueChange={(value) => {
                  const unit = value as TimeUnit;
                  const numValue = formData.time_horizon_detail?.value || 1;
                  const category = computeTimeHorizonCategory(numValue, unit);
                  setFormData({
                    ...formData,
                    time_horizon: category,
                    time_horizon_detail: {
                      value: numValue,
                      unit,
                      category,
                    },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="quarters">Quarters</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.time_horizon && formData.time_horizon_detail && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {formData.time_horizon.replace("_", " ")}
              </Badge>
              <span>
                {formData.time_horizon === "short_term" &&
                  "(≤ 12 months) - Quick wins and immediate priorities"}
                {formData.time_horizon === "mid_term" &&
                  "(1-3 years) - Strategic initiatives and growth"}
                {formData.time_horizon === "long_term" &&
                  "(3+ years) - Transformational and visionary goals"}
              </span>
            </div>
          )}
        </div>

        {/* SMART Validation Result */}
        {smartResult && (
          <Card
            className={
              smartResult.score >= 80
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
                : smartResult.score >= 60
                  ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
            }
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {smartResult.score >= 80 ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                ) : smartResult.score >= 60 ? (
                  <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 text-red-600" />
                )}
                SMART Validation Score: {smartResult.score}/100
                {smartResult.score >= 80 && (
                  <Badge variant="default" className="ml-2">
                    Excellent
                  </Badge>
                )}
                {smartResult.score >= 60 && smartResult.score < 80 && (
                  <Badge variant="secondary" className="ml-2">
                    Good - Can Improve
                  </Badge>
                )}
                {smartResult.score < 60 && (
                  <Badge variant="destructive" className="ml-2">
                    Needs Improvement
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Criteria */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  SMART Criteria:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(smartResult.criteria).map(([key, value]) => (
                    <Badge
                      key={key}
                      variant={value ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {value ? "✓" : "✗"} {key}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {smartResult.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    ⚠️ Required Actions:
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 text-red-600 dark:text-red-400">
                    {smartResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">💡 Suggestions:</div>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    {suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Minimum Score Warning */}
              {smartResult.score < 60 && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ Your goal needs improvement to meet SMART criteria.
                    Please address the required actions above before proceeding.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Step 3: KPIs & Targets
  if (currentStep === 3) {
    // Common KPI names
    const commonKPIs = [
      "Revenue Growth",
      "Customer Satisfaction Score (CSAT)",
      "Net Promoter Score (NPS)",
      "Customer Retention Rate",
      "Market Share",
      "Operating Margin",
      "Return on Investment (ROI)",
      "Employee Satisfaction",
      "Time to Market",
      "Cost Reduction",
      "Quality Score",
      "Productivity Rate",
      "Sales Conversion Rate",
      "Customer Acquisition Cost (CAC)",
      "Churn Rate",
      "Average Order Value (AOV)",
      "Lead Generation",
      "Website Traffic",
      "Compliance Rate",
      "Carbon Footprint Reduction",
    ];

    // Common units
    const commonUnits = [
      "%",
      "$",
      "€",
      "£",
      "units",
      "days",
      "hours",
      "points",
      "score",
      "count",
      "rate",
      "ratio",
      "kg",
      "tons",
      "liters",
    ];

    const addKPI = () => {
      setFormData({
        ...formData,
        kpis: [
          ...(formData.kpis || []),
          {
            name: "",
            target: undefined,
            range_min: undefined,
            range_max: undefined,
            unit: "",
            direction: "higher_is_better",
            measurement_freq: "monthly",
          },
        ],
      });
    };

    const removeKPI = (index: number) => {
      const newKPIs = [...(formData.kpis || [])];
      newKPIs.splice(index, 1);
      setFormData({ ...formData, kpis: newKPIs });
    };

    const updateKPI = (index: number, field: string, value: any) => {
      const newKPIs = [...(formData.kpis || [])];
      newKPIs[index] = { ...newKPIs[index], [field]: value };
      setFormData({ ...formData, kpis: newKPIs });
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Key Performance Indicators (KPIs)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            How will you measure success? Add at least one metric.
          </p>
        </div>

        <div className="space-y-4">
          {(formData.kpis || []).map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Metric #{index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKPI(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metric Name *</Label>
                    <Select
                      value={kpi.name}
                      onValueChange={(value) => {
                        if (value === "__custom__") {
                          updateKPI(index, "name", "");
                        } else {
                          updateKPI(index, "name", value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type custom metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonKPIs.map((kpiName) => (
                          <SelectItem key={kpiName} value={kpiName}>
                            {kpiName}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">
                          <span className="italic text-muted-foreground">
                            Custom metric...
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {kpi.name === "" && (
                      <Input
                        placeholder="Enter custom metric name"
                        value={kpi.name}
                        onChange={(e) =>
                          updateKPI(index, "name", e.target.value)
                        }
                        className="mt-2"
                      />
                    )}
                    {kpi.name && !commonKPIs.includes(kpi.name) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          placeholder="Enter custom metric name"
                          value={kpi.name}
                          onChange={(e) =>
                            updateKPI(index, "name", e.target.value)
                          }
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateKPI(index, "name", "")}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={kpi.unit}
                      onValueChange={(value) => {
                        if (value === "__custom__") {
                          updateKPI(index, "unit", "");
                        } else {
                          updateKPI(index, "unit", value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type custom unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonUnits.map((unitName) => (
                          <SelectItem key={unitName} value={unitName}>
                            {unitName}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">
                          <span className="italic text-muted-foreground">
                            Custom unit...
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {kpi.unit === "" && (
                      <Input
                        placeholder="Enter custom unit"
                        value={kpi.unit}
                        onChange={(e) =>
                          updateKPI(index, "unit", e.target.value)
                        }
                        className="mt-2"
                      />
                    )}
                    {kpi.unit && !commonUnits.includes(kpi.unit) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          placeholder="Enter custom unit"
                          value={kpi.unit}
                          onChange={(e) =>
                            updateKPI(index, "unit", e.target.value)
                          }
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateKPI(index, "unit", "")}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      value={kpi.target || ""}
                      onChange={(e) =>
                        updateKPI(
                          index,
                          "target",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Range Min</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 80"
                      value={kpi.range_min || ""}
                      onChange={(e) =>
                        updateKPI(
                          index,
                          "range_min",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Range Max</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 120"
                      value={kpi.range_max || ""}
                      onChange={(e) =>
                        updateKPI(
                          index,
                          "range_max",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={kpi.direction}
                      onValueChange={(value) =>
                        updateKPI(index, "direction", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="higher_is_better">
                          <div className="flex items-center gap-2">
                            <TrendingUpIcon className="w-4 h-4" />
                            Higher is Better
                          </div>
                        </SelectItem>
                        <SelectItem value="lower_is_better">
                          <div className="flex items-center gap-2">
                            <TrendingDownIcon className="w-4 h-4" />
                            Lower is Better
                          </div>
                        </SelectItem>
                        <SelectItem value="range">
                          <div className="flex items-center gap-2">
                            <MinusIcon className="w-4 h-4" />
                            Range
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Measurement Frequency</Label>
                    <Select
                      value={kpi.measurement_freq}
                      onValueChange={(value) =>
                        updateKPI(index, "measurement_freq", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={addKPI} variant="outline" className="w-full">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Metric
        </Button>

        {(formData.kpis || []).length === 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />

                <div className="text-sm">
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">
                    At least one metric is required
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Add at least one way to measure progress toward this goal.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Step 4: Owners & Stakeholders
  if (currentStep === 4) {
    const toggleOwner = (
      stakeholderId: string,
      role: "owner" | "co_owner" | "contributor" | "consumer"
    ) => {
      const existingIndex = (formData.owners || []).findIndex(
        (o) => o.stakeholder_id === stakeholderId
      );

      if (existingIndex >= 0) {
        const newOwners = [...(formData.owners || [])];
        if (newOwners[existingIndex].role === role) {
          // Remove if same role
          newOwners.splice(existingIndex, 1);
        } else {
          // Update role
          newOwners[existingIndex] = { stakeholder_id: stakeholderId, role };
        }
        setFormData({ ...formData, owners: newOwners });
      } else {
        // Add new
        setFormData({
          ...formData,
          owners: [
            ...(formData.owners || []),
            { stakeholder_id: stakeholderId, role },
          ],
        });
      }
    };

    const getStakeholderRole = (stakeholderId: string) => {
      return (formData.owners || []).find(
        (o) => o.stakeholder_id === stakeholderId
      )?.role;
    };

    const groupedStakeholders = stakeholders.reduce(
      (acc, stakeholder) => {
        if (!acc[stakeholder.group]) {
          acc[stakeholder.group] = [];
        }
        acc[stakeholder.group].push(stakeholder);
        return acc;
      },
      {} as Record<string, StakeholderV2[]>
    );

    const hasOwner = (formData.owners || []).some((o) => o.role === "owner");

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Assign Owners & Stakeholders
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Who is responsible for this goal?
          </p>
        </div>

        {!hasOwner && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />

                <div className="text-sm">
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">
                    At least one owner is required
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Choose at least one person who will be responsible for
                    making this goal happen.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {Object.entries(groupedStakeholders).map(([group, members]) => (
            <Card key={group}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{group}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map((stakeholder) => {
                  const currentRole = getStakeholderRole(stakeholder.id);

                  return (
                    <div
                      key={stakeholder.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {stakeholder.name}
                        </div>
                        {stakeholder.email && (
                          <div className="text-xs text-muted-foreground">
                            {stakeholder.email}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {["owner", "co_owner", "contributor", "consumer"].map(
                          (role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant={
                                currentRole === role ? "default" : "outline"
                              }
                              onClick={() =>
                                toggleOwner(stakeholder.id, role as any)
                              }
                              className="text-xs"
                            >
                              {role === "owner" && "Owner"}
                              {role === "co_owner" && "Co-Owner"}
                              {role === "contributor" && "Contributor"}
                              {role === "consumer" && "Consumer"}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Step 5: Dependencies
  if (currentStep === 5) {
    const activeGoals = goals.filter((g) => g.status === "Active");

    const toggleDependency = (
      goalId: string,
      type: "depends_on" | "enables"
    ) => {
      const existingIndex = (formData.dependencies || []).findIndex(
        (d) => d.goalId === goalId && d.type === type
      );

      if (existingIndex >= 0) {
        const newDeps = [...(formData.dependencies || [])];
        newDeps.splice(existingIndex, 1);
        setFormData({ ...formData, dependencies: newDeps });
      } else {
        setFormData({
          ...formData,
          dependencies: [...(formData.dependencies || []), { goalId, type }],
        });
      }
    };

    const hasDependency = (goalId: string, type: "depends_on" | "enables") => {
      return (formData.dependencies || []).some(
        (d) => d.goalId === goalId && d.type === type
      );
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Goal Dependencies (Optional)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Does this goal rely on or enable another goal?
          </p>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div>
              <span className="font-medium">Depends On:</span> This goal needs
              another goal to finish first before it can start.
            </div>
            <div>
              <span className="font-medium">Enables:</span> Completing this goal
              will unlock or make another goal possible.
            </div>
          </CardContent>
        </Card>

        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No active goals available for linking
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-sm">
                        {goal.statement}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {goal.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {goal.time_horizon}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          hasDependency(goal.id, "depends_on")
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleDependency(goal.id, "depends_on")}
                        className="text-xs"
                      >
                        {hasDependency(goal.id, "depends_on") ? "✓ " : ""}
                        Depends On
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          hasDependency(goal.id, "enables")
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleDependency(goal.id, "enables")}
                        className="text-xs"
                      >
                        {hasDependency(goal.id, "enables") ? "✓ " : ""}Enables
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 6: Review & Save
  if (currentStep === 6) {
    const hasOwner = (formData.owners || []).some((o) => o.role === "owner");

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Review Your Goal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review all details before creating the goal
          </p>
        </div>

        {/* SMART Score */}
        {smartResult && (
          <Card
            className={
              smartResult.isValid
                ? "border-green-200 dark:border-green-800"
                : "border-red-200 dark:border-red-800"
            }
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {smartResult.isValid ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 text-red-600" />
                )}
                SMART Validation: {smartResult.score}/100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {Object.entries(smartResult.criteria).map(([key, value]) => (
                  <Badge
                    key={key}
                    variant={value ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {key}
                  </Badge>
                ))}
              </div>

              {smartResult.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-sm font-medium text-red-600">
                    Errors:
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {smartResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Goal Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <Badge>{formData.category}</Badge>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Statement
              </div>
              <div className="text-sm">{formData.statement}</div>
            </div>

            {formData.description && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Description
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.description}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-muted-foreground mb-1">KPIs</div>
              <div className="space-y-1">
                {(formData.kpis || []).map((kpi, i) => (
                  <div key={i} className="text-sm">
                    • {kpi.name}{" "}
                    {kpi.target && `(Target: ${kpi.target}${kpi.unit})`}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Owners & Stakeholders
              </div>
              <div className="space-y-1">
                {(formData.owners || []).map((owner, i) => {
                  const stakeholder = stakeholders.find(
                    (s) => s.id === owner.stakeholder_id
                  );
                  return (
                    <div key={i} className="text-sm flex items-center gap-2">
                      • {stakeholder?.name}
                      <Badge variant="outline" className="text-xs">
                        {owner.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {(formData.dependencies || []).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Dependencies
                </div>
                <div className="space-y-1">
                  {(formData.dependencies || []).map((dep, i) => {
                    const goal = goals.find((g) => g.id === dep.goalId);
                    return (
                      <div key={i} className="text-sm flex items-center gap-2">
                        • {goal?.statement}
                        <Badge variant="outline" className="text-xs">
                          {dep.type === "depends_on" ? "Depends On" : "Enables"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Priority
                </div>
                <Badge variant="secondary">{formData.priority}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Time Horizon
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary">
                    {formData.time_horizon_detail
                      ? `${formData.time_horizon_detail.value} ${formData.time_horizon_detail.unit}`
                      : formData.time_horizon}
                  </Badge>
                  {formData.time_horizon && (
                    <span className="text-xs text-muted-foreground capitalize">
                      ({formData.time_horizon.replace("_", " ")})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Priority (How important is it?) *</Label>
              <Select
                value={formData.priority?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Critical</SelectItem>
                  <SelectItem value="2">2 - High</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - Low</SelectItem>
                  <SelectItem value="5">5 - Very Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
