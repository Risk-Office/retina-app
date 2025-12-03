import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  CheckIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  UtensilsIcon,
  StoreIcon,
  ScaleIcon,
  CalculatorIcon,
  DumbbellIcon,
  HomeIcon,
  WrenchIcon,
  MegaphoneIcon,
  WindIcon,
} from "lucide-react";
import {
  industryGoalTemplates,
  getAvailableIndustries,
  searchTemplates,
  type GoalTemplate,
  type IndustryTemplate,
} from "@/polymet/data/industry-goal-templates";

interface GoalTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: GoalTemplate, industry: string) => void;
}

// Icon mapping for industries
const industryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Assisted Living": HeartPulseIcon,
  Restaurant: UtensilsIcon,
  "Retail Store": StoreIcon,
  "Dental Practice": HeartPulseIcon,
  "Law Firm": ScaleIcon,
  "Accounting Firm": CalculatorIcon,
  "Fitness Center": DumbbellIcon,
  "Real Estate Agency": HomeIcon,
  "Auto Repair Shop": WrenchIcon,
  "Marketing Agency": MegaphoneIcon,
  "HVAC Company": WindIcon,
};

export function GoalTemplatesDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: GoalTemplatesDialogProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"industries" | "templates">(
    "industries"
  );

  // Get available industries
  const industries = useMemo(() => getAvailableIndustries(), []);

  // Get templates for selected industry
  const industryTemplates = useMemo(() => {
    if (!selectedIndustry) return null;
    return industryGoalTemplates.find((t) => t.industry === selectedIndustry);
  }, [selectedIndustry]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTemplates(searchQuery);
  }, [searchQuery]);

  // Handle industry selection
  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    setViewMode("templates");
  };

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate) => {
    onSelectTemplate(template, selectedIndustry || "");
    onOpenChange(false);
  };

  // Reset to industries view
  const handleBack = () => {
    setViewMode("industries");
    setSelectedIndustry(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewMode === "templates" && selectedIndustry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2"
              >
                ← Back
              </Button>
            )}
            Goal Templates
          </DialogTitle>
          <DialogDescription>
            {viewMode === "industries"
              ? "Choose an industry to browse pre-built SMART goal templates"
              : `Browse ${selectedIndustry} goal templates`}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <Input
            placeholder="Search templates by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {searchQuery.trim() ? (
            // Search Results
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No templates found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleTemplateSelect(template)}
                  />
                ))
              )}
            </div>
          ) : viewMode === "industries" ? (
            // Industries Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries.map((industry) => {
                const industryData = industryGoalTemplates.find(
                  (t) => t.industry === industry
                );
                const Icon = industryIcons[industry] || StoreIcon;

                return (
                  <button
                    key={industry}
                    onClick={() => handleIndustrySelect(industry)}
                    className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{industry}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {industryData?.description}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {industryData?.goals.length || 0} templates
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Templates List
            <div className="space-y-3">
              {industryTemplates?.goals.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleTemplateSelect(template)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: GoalTemplate;
  onSelect: () => void;
}) {
  return (
    <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-semibold">{template.title}</h3>
            <Badge variant="outline" className="shrink-0">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              {template.timeframe}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {template.metrics.length} KPIs
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {template.stakeholders.length} stakeholders
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Key Metrics:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {template.metrics.slice(0, 3).map((metric, index) => (
                <li key={index} className="flex items-start gap-1">
                  <CheckIcon className="w-3 h-3 mt-0.5 shrink-0" />

                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button onClick={onSelect} size="sm">
          Use Template
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
