import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  GoalCategory,
  GoalStatus,
  TimeHorizon,
} from "@/polymet/data/goal-v2-schema";
import type { StakeholderV2 } from "@/polymet/data/stakeholder-v2-schema";

export interface GoalsFilters {
  category?: GoalCategory;
  stakeholder_id?: string;
  status?: GoalStatus;
  time_horizon?: TimeHorizon;
  q?: string;
}

interface GoalsFiltersBarV2Props {
  filters: GoalsFilters;
  onFiltersChange: (filters: GoalsFilters) => void;
  stakeholders: StakeholderV2[];
}

export function GoalsFiltersBarV2({
  filters,
  onFiltersChange,
  stakeholders,
}: GoalsFiltersBarV2Props) {
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleFilterChange = (
    key: keyof GoalsFilters,
    value: string | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" || value === "" ? undefined : value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 text-xs"
          >
            <XIcon className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="text-xs">
            Search
          </Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              id="search"
              placeholder="Search goals..."
              value={filters.q || ""}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category" className="text-xs">
            Category
          </Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => handleFilterChange("category", v)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Operational">Operational</SelectItem>
              <SelectItem value="Strategic">Strategic</SelectItem>
              <SelectItem value="Compliance & Regulatory">
                Compliance & Regulatory
              </SelectItem>
              <SelectItem value="People & Culture">People & Culture</SelectItem>
              <SelectItem value="Resilience & Continuity">
                Resilience & Continuity
              </SelectItem>
              <SelectItem value="Technology & Digital">
                Technology & Digital
              </SelectItem>
              <SelectItem value="Sustainability & ESG">
                Sustainability & ESG
              </SelectItem>
              <SelectItem value="Customer & Market">
                Customer & Market
              </SelectItem>
              <SelectItem value="Innovation & Learning">
                Innovation & Learning
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status" className="text-xs">
            Status
          </Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Horizon */}
        <div>
          <Label htmlFor="time_horizon" className="text-xs">
            Time Horizon
          </Label>
          <Select
            value={filters.time_horizon || "all"}
            onValueChange={(v) => handleFilterChange("time_horizon", v)}
          >
            <SelectTrigger id="time_horizon">
              <SelectValue placeholder="All Horizons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Horizons</SelectItem>
              <SelectItem value="short_term">Short Term</SelectItem>
              <SelectItem value="mid_term">Mid Term</SelectItem>
              <SelectItem value="long_term">Long Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stakeholder Filter - Full Width */}
      <div>
        <Label htmlFor="stakeholder" className="text-xs">
          Filter by Owner/Stakeholder
        </Label>
        <Select
          value={filters.stakeholder_id || "all"}
          onValueChange={(v) => handleFilterChange("stakeholder_id", v)}
        >
          <SelectTrigger id="stakeholder">
            <SelectValue placeholder="All Stakeholders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stakeholders</SelectItem>
            {stakeholders.map((stakeholder) => (
              <SelectItem key={stakeholder.id} value={stakeholder.id}>
                {stakeholder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
