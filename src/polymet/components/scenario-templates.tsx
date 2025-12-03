import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SaveIcon,
  DownloadIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ZapIcon,
  TrashIcon,
  AlertTriangleIcon,
  UploadIcon,
  ShareIcon,
  GlobeIcon,
  HistoryIcon,
  PackageIcon,
  ActivityIcon,
  CloudIcon,
  WindIcon,
  SearchIcon,
  FilterIcon,
  TagIcon,
  GitCompareIcon,
  LockIcon,
  UnlockIcon,
  ShieldIcon,
  XIcon,
} from "lucide-react";
import type { ScenarioVar } from "@/polymet/data/scenario-engine";

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: "market", label: "Market", color: "bg-blue-500" },
  { id: "operational", label: "Operational", color: "bg-green-500" },
  { id: "financial", label: "Financial", color: "bg-purple-500" },
  { id: "external", label: "External", color: "bg-orange-500" },
  { id: "regulatory", label: "Regulatory", color: "bg-red-500" },
  { id: "custom", label: "Custom", color: "bg-gray-500" },
];

// Template permission levels
export type TemplatePermission = "read-only" | "edit" | "admin";

// Built-in preset templates
const BUILT_IN_TEMPLATES = [
  {
    id: "demand-shock",
    name: "Demand Shock",
    icon: TrendingUpIcon,
    description: "Sudden change in market demand",
    category: "market" as const,
    tags: ["demand", "market", "volatility"],
    variables: [
      {
        id: "var-demand-shock",
        name: "Demand Shock",
        appliesTo: "return" as const,
        dist: "triangular" as const,
        params: { min: -0.2, mode: 0.0, max: 0.4 },
        weight: 1,
      },
    ],
  },
  {
    id: "cost-inflation",
    name: "Cost Inflation",
    icon: TrendingDownIcon,
    description: "Rising operational costs",
    category: "operational" as const,
    tags: ["cost", "inflation", "operational"],
    variables: [
      {
        id: "var-cost-inflation",
        name: "Cost Inflation",
        appliesTo: "cost" as const,
        dist: "normal" as const,
        params: { mean: 0.05, sd: 0.03 },
        weight: 1,
      },
    ],
  },
  {
    id: "fx-move",
    name: "FX Move",
    icon: DollarSignIcon,
    description: "Foreign exchange volatility",
    category: "financial" as const,
    tags: ["fx", "currency", "financial"],
    variables: [
      {
        id: "var-fx-move",
        name: "FX Move",
        appliesTo: "return" as const,
        dist: "normal" as const,
        params: { mean: 0.0, sd: 0.06 },
        weight: 0.8,
      },
    ],
  },
  {
    id: "supply-delay",
    name: "Supply Delay",
    icon: ZapIcon,
    description: "Supply chain disruption",
    category: "operational" as const,
    tags: ["supply", "chain", "delay"],
    variables: [
      {
        id: "var-supply-delay",
        name: "Supply Delay",
        appliesTo: "cost" as const,
        dist: "lognormal" as const,
        params: { mu: 0.0, sigma: 0.25 },
        weight: 1.2,
      },
    ],
  },
  {
    id: "market-volatility",
    name: "Market Volatility",
    icon: ActivityIcon,
    description: "High market uncertainty",
    category: "market" as const,
    tags: ["market", "volatility", "uncertainty"],
    variables: [
      {
        id: "var-market-volatility",
        name: "Market Volatility",
        appliesTo: "return" as const,
        dist: "normal" as const,
        params: { mean: 0.0, sd: 0.12 },
        weight: 1.5,
      },
    ],
  },
  {
    id: "regulatory-change",
    name: "Regulatory Change",
    icon: PackageIcon,
    description: "New compliance requirements",
    category: "regulatory" as const,
    tags: ["regulatory", "compliance", "legal"],
    variables: [
      {
        id: "var-regulatory-change",
        name: "Regulatory Change",
        appliesTo: "cost" as const,
        dist: "uniform" as const,
        params: { min: 0.02, max: 0.15 },
        weight: 1,
      },
    ],
  },
  {
    id: "weather-event",
    name: "Weather Event",
    icon: CloudIcon,
    description: "Climate-related disruption",
    category: "external" as const,
    tags: ["weather", "climate", "external"],
    variables: [
      {
        id: "var-weather-event",
        name: "Weather Event",
        appliesTo: "cost" as const,
        dist: "lognormal" as const,
        params: { mu: 0.05, sigma: 0.3 },
        weight: 0.7,
      },
    ],
  },
  {
    id: "tech-disruption",
    name: "Tech Disruption",
    icon: WindIcon,
    description: "Technology-driven market shift",
    category: "external" as const,
    tags: ["technology", "disruption", "innovation"],
    variables: [
      {
        id: "var-tech-disruption",
        name: "Tech Disruption",
        appliesTo: "return" as const,
        dist: "triangular" as const,
        params: { min: -0.15, mode: 0.05, max: 0.5 },
        weight: 1.3,
      },
    ],
  },
];

interface TemplateVersion {
  version: number;
  variables: ScenarioVar[];
  modifiedAt: number;
  modifiedBy: string;
}

interface UserTemplate {
  name: string;
  variables: ScenarioVar[];
  createdAt: number;
  createdBy?: string;
  versions?: TemplateVersion[];
  isShared?: boolean;
  sharedBy?: string;
  category?: string;
  tags?: string[];
  permission?: TemplatePermission;
}

interface ScenarioTemplatesProps {
  currentVariables: ScenarioVar[];
  onApplyTemplate: (variables: ScenarioVar[], templateName: string) => void;
  tenantId: string;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function ScenarioTemplates({
  currentVariables,
  onApplyTemplate,
  tenantId,
  onAuditEvent,
}: ScenarioTemplatesProps) {
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(
    null
  );
  const [pendingBuiltInTemplate, setPendingBuiltInTemplate] = useState<
    (typeof BUILT_IN_TEMPLATES)[0] | null
  >(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] =
    useState<UserTemplate | null>(null);
  const [sharedTemplates, setSharedTemplates] = useState<UserTemplate[]>([]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Comparison state
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [comparisonTemplates, setComparisonTemplates] = useState<
    UserTemplate[]
  >([]);

  // Permission and category for new template
  const [newTemplateCategory, setNewTemplateCategory] =
    useState<string>("custom");
  const [newTemplateTags, setNewTemplateTags] = useState<string>("");
  const [newTemplatePermission, setNewTemplatePermission] =
    useState<TemplatePermission>("edit");

  // Load user templates from localStorage
  useEffect(() => {
    const storageKey = `retina:scenarioTemplates:${tenantId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setUserTemplates(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load user templates:", error);
      }
    }

    // Load shared templates
    const sharedKey = "retina:scenarioTemplates:shared";
    const sharedStored = localStorage.getItem(sharedKey);
    if (sharedStored) {
      try {
        setSharedTemplates(JSON.parse(sharedStored));
      } catch (error) {
        console.error("Failed to load shared templates:", error);
      }
    }
  }, [tenantId]);

  // Save user templates to localStorage
  const saveUserTemplates = (templates: UserTemplate[]) => {
    const storageKey = `retina:scenarioTemplates:${tenantId}`;
    localStorage.setItem(storageKey, JSON.stringify(templates));
    setUserTemplates(templates);
  };

  // Handle save template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    // Check if template with same name exists
    const existingTemplate = userTemplates.find(
      (t) => t.name === templateName.trim()
    );

    if (existingTemplate) {
      // Create new version
      const newVersion: TemplateVersion = {
        version: (existingTemplate.versions?.length || 0) + 1,
        variables: currentVariables,
        modifiedAt: Date.now(),
        modifiedBy: "Current User",
      };

      const updatedTemplate: UserTemplate = {
        ...existingTemplate,
        variables: currentVariables,
        versions: [...(existingTemplate.versions || []), newVersion],
      };

      const updatedTemplates = userTemplates.map((t) =>
        t.name === templateName.trim() ? updatedTemplate : t
      );
      saveUserTemplates(updatedTemplates);

      // Add audit event
      onAuditEvent("scenario.template.updated", {
        name: templateName.trim(),
        countVars: currentVariables.length,
        version: newVersion.version,
      });
    } else {
      // Parse tags from comma-separated string
      const tags = newTemplateTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Create new template
      const newTemplate: UserTemplate = {
        name: templateName.trim(),
        variables: currentVariables,
        createdAt: Date.now(),
        createdBy: "Current User",
        versions: [],
        category: newTemplateCategory,
        tags: tags.length > 0 ? tags : undefined,
        permission: newTemplatePermission,
      };

      const updatedTemplates = [...userTemplates, newTemplate];
      saveUserTemplates(updatedTemplates);

      // Add audit event
      onAuditEvent("scenario.template.saved", {
        name: templateName.trim(),
        countVars: currentVariables.length,
        category: newTemplateCategory,
        tags: tags,
      });
    }

    setTemplateName("");
    setNewTemplateTags("");
    setNewTemplateCategory("custom");
    setNewTemplatePermission("edit");
    setShowSaveDialog(false);
  };

  // Handle delete template
  const handleDeleteTemplate = (templateToDelete: UserTemplate) => {
    const updatedTemplates = userTemplates.filter(
      (t) => t.name !== templateToDelete.name
    );
    saveUserTemplates(updatedTemplates);
  };

  // Handle load user template
  const handleLoadUserTemplate = (template: UserTemplate) => {
    setSelectedTemplate(template);
    setShowLoadDialog(false);
    setShowConfirmDialog(true);
  };

  // Handle apply built-in template
  const handleApplyBuiltInTemplate = (
    template: (typeof BUILT_IN_TEMPLATES)[0]
  ) => {
    setPendingBuiltInTemplate(template);
    setShowConfirmDialog(true);
  };

  // Confirm and apply template
  const handleConfirmApply = () => {
    if (selectedTemplate) {
      // Apply user template
      onApplyTemplate(selectedTemplate.variables, selectedTemplate.name);

      // Add audit event
      onAuditEvent("scenario.template.loaded", {
        name: selectedTemplate.name,
        countVars: selectedTemplate.variables.length,
      });

      setSelectedTemplate(null);
    } else if (pendingBuiltInTemplate) {
      // Apply built-in template (merge with existing)
      const mergedVariables = [
        ...currentVariables,
        ...pendingBuiltInTemplate.variables,
      ];

      onApplyTemplate(mergedVariables, pendingBuiltInTemplate.name);

      // Add audit event
      onAuditEvent("scenario.template.loaded", {
        name: pendingBuiltInTemplate.name,
        countVars: pendingBuiltInTemplate.variables.length,
      });

      setPendingBuiltInTemplate(null);
    }

    setShowConfirmDialog(false);
  };

  // Handle export template
  const handleExportTemplate = (template: UserTemplate) => {
    const exportData = {
      name: template.name,
      variables: template.variables,
      createdAt: template.createdAt,
      createdBy: template.createdBy,
      versions: template.versions,
      exportedAt: Date.now(),
      exportedFrom: tenantId,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${template.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Add audit event
    onAuditEvent("scenario.template.exported", {
      name: template.name,
      countVars: template.variables.length,
    });
  };

  // Handle import template
  const handleImportTemplate = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const importedData = JSON.parse(text);

      const newTemplate: UserTemplate = {
        name: importedData.name,
        variables: importedData.variables,
        createdAt: Date.now(),
        createdBy: `Imported from ${importedData.exportedFrom || "unknown"}`,
        versions: importedData.versions || [],
      };

      const updatedTemplates = [...userTemplates, newTemplate];
      saveUserTemplates(updatedTemplates);

      // Add audit event
      onAuditEvent("scenario.template.imported", {
        name: newTemplate.name,
        countVars: newTemplate.variables.length,
      });

      setImportFile(null);
      setShowImportDialog(false);
    } catch (error) {
      console.error("Failed to import template:", error);
      alert("Failed to import template. Please check the file format.");
    }
  };

  // Handle share template
  const handleShareTemplate = (template: UserTemplate) => {
    const sharedTemplate: UserTemplate = {
      ...template,
      isShared: true,
      sharedBy: tenantId,
    };

    const sharedKey = "retina:scenarioTemplates:shared";
    const existingShared = localStorage.getItem(sharedKey);
    let sharedList: UserTemplate[] = [];

    if (existingShared) {
      try {
        sharedList = JSON.parse(existingShared);
      } catch (error) {
        console.error("Failed to load shared templates:", error);
      }
    }

    // Check if already shared
    const alreadyShared = sharedList.some(
      (t) => t.name === template.name && t.sharedBy === tenantId
    );

    if (!alreadyShared) {
      sharedList.push(sharedTemplate);
      localStorage.setItem(sharedKey, JSON.stringify(sharedList));
      setSharedTemplates(sharedList);

      // Add audit event
      onAuditEvent("scenario.template.shared", {
        name: template.name,
        countVars: template.variables.length,
      });
    }
  };

  // Handle use shared template
  const handleUseSharedTemplate = (template: UserTemplate) => {
    const newTemplate: UserTemplate = {
      ...template,
      createdAt: Date.now(),
      createdBy: `Copied from ${template.sharedBy || "shared"}`,
      isShared: false,
      sharedBy: undefined,
    };

    const updatedTemplates = [...userTemplates, newTemplate];
    saveUserTemplates(updatedTemplates);

    // Add audit event
    onAuditEvent("scenario.template.copied", {
      name: template.name,
      countVars: template.variables.length,
      from: template.sharedBy,
    });
  };

  // Handle restore version
  const handleRestoreVersion = (
    template: UserTemplate,
    version: TemplateVersion
  ) => {
    const updatedTemplate: UserTemplate = {
      ...template,
      variables: version.variables,
    };

    const updatedTemplates = userTemplates.map((t) =>
      t.name === template.name ? updatedTemplate : t
    );
    saveUserTemplates(updatedTemplates);

    // Add audit event
    onAuditEvent("scenario.template.version_restored", {
      name: template.name,
      version: version.version,
    });

    setShowHistoryDialog(false);
    setSelectedTemplateForHistory(null);
  };

  // Filter templates based on search and category
  const filteredBuiltInTemplates = BUILT_IN_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => template.tags?.includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });

  const filteredUserTemplates = userTemplates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => template.tags?.includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });

  // Get all unique tags from all templates
  const allTags = Array.from(
    new Set([
      ...BUILT_IN_TEMPLATES.flatMap((t) => t.tags || []),
      ...userTemplates.flatMap((t) => t.tags || []),
    ])
  );

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add template to comparison
  const addToComparison = (template: UserTemplate) => {
    if (comparisonTemplates.length >= 3) {
      alert("You can compare up to 3 templates at a time");
      return;
    }
    if (comparisonTemplates.some((t) => t.name === template.name)) {
      return; // Already in comparison
    }
    setComparisonTemplates([...comparisonTemplates, template]);
  };

  // Remove template from comparison
  const removeFromComparison = (templateName: string) => {
    setComparisonTemplates(
      comparisonTemplates.filter((t) => t.name !== templateName)
    );
  };

  // Check if user can edit template
  const canEditTemplate = (template: UserTemplate) => {
    const permission = template.permission || "edit";
    return permission === "edit" || permission === "admin";
  };

  // Get permission icon
  const getPermissionIcon = (permission?: TemplatePermission) => {
    switch (permission) {
      case "read-only":
        return LockIcon;
      case "admin":
        return ShieldIcon;
      default:
        return UnlockIcon;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {comparisonTemplates.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowComparisonDialog(true)}
              >
                <GitCompareIcon className="w-4 h-4 mr-2" />
                Compare ({comparisonTemplates.length})
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />

            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-muted-foreground" />

              {allTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                >
                  Clear tags
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Built-in Templates */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Built-in Presets</Label>
        <div className="grid grid-cols-1 gap-3">
          {filteredBuiltInTemplates.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-sm text-muted-foreground">
              No templates match your search criteria
            </div>
          ) : (
            filteredBuiltInTemplates.map((template) => {
              const Icon = template.icon;
              const category = TEMPLATE_CATEGORIES.find(
                (c) => c.id === template.category
              );
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors border-2"
                  onClick={() => handleApplyBuiltInTemplate(template)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1">
                          {template.name}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {category && (
                        <Badge variant="outline" className="text-xs">
                          {category.label}
                        </Badge>
                      )}
                      {template.tags && template.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {template.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* User Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Your Templates</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={currentVariables.length === 0}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLoadDialog(true)}
              disabled={userTemplates.length === 0}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              disabled={sharedTemplates.length === 0}
            >
              <GlobeIcon className="w-4 h-4 mr-2" />
              Shared ({sharedTemplates.length})
            </Button>
          </div>
        </div>

        {filteredUserTemplates.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              {userTemplates.length === 0
                ? "No saved templates yet. Save your current variables as a template."
                : "No templates match your search criteria"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUserTemplates
              .slice(-5)
              .reverse()
              .map((template, idx) => {
                const PermissionIcon = getPermissionIcon(template.permission);
                const category = TEMPLATE_CATEGORIES.find(
                  (c) => c.id === template.category
                );
                const isReadOnly = template.permission === "read-only";
                const isInComparison = comparisonTemplates.some(
                  (t) => t.name === template.name
                );

                return (
                  <div
                    key={idx}
                    className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm">
                          {template.name}
                        </div>
                        <PermissionIcon className="w-3 h-3 text-muted-foreground" />

                        {category && (
                          <Badge variant="outline" className="text-xs">
                            {category.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {template.variables.length} variables ·{" "}
                        {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant={isInComparison ? "default" : "ghost"}
                        size="sm"
                        onClick={() =>
                          isInComparison
                            ? removeFromComparison(template.name)
                            : addToComparison(template)
                        }
                        title={
                          isInComparison
                            ? "Remove from comparison"
                            : "Add to comparison"
                        }
                      >
                        <GitCompareIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadUserTemplate(template)}
                        title="Load template"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportTemplate(template)}
                        title="Export as JSON"
                      >
                        <SaveIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareTemplate(template)}
                        title="Share with other tenants"
                        disabled={isReadOnly}
                      >
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                      {template.versions && template.versions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplateForHistory(template);
                            setShowHistoryDialog(true);
                          }}
                          title="View version history"
                        >
                          <HistoryIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        title="Delete template"
                        disabled={isReadOnly}
                      >
                        <TrashIcon className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current scenario variables as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Q4 2024 Scenario"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={newTemplateCategory}
                onValueChange={setNewTemplateCategory}
              >
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-tags">Tags (comma-separated)</Label>
              <Input
                id="template-tags"
                placeholder="e.g., market, risk, Q4"
                value={newTemplateTags}
                onChange={(e) => setNewTemplateTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-permission">Permission Level</Label>
              <Select
                value={newTemplatePermission}
                onValueChange={(val) =>
                  setNewTemplatePermission(val as TemplatePermission)
                }
              >
                <SelectTrigger id="template-permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read-only">
                    <div className="flex items-center gap-2">
                      <LockIcon className="w-4 h-4" />
                      Read-only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <UnlockIcon className="w-4 h-4" />
                      Edit
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newTemplatePermission === "read-only" &&
                  "Template cannot be edited or deleted"}
                {newTemplatePermission === "edit" &&
                  "Template can be edited and deleted"}
                {newTemplatePermission === "admin" &&
                  "Full control over template"}
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Current Variables</div>
              <div className="text-xs text-muted-foreground space-y-1">
                {currentVariables.map((v) => (
                  <div key={v.id}>
                    • {v.name} ({v.appliesTo})
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
            <DialogDescription>
              Select a template to load its variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {userTemplates.map((template, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleLoadUserTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="font-medium text-sm mb-1">
                    {template.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {template.variables.length} variables ·{" "}
                    {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Template Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Template</DialogTitle>
            <DialogDescription>
              Import a template from a JSON file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select JSON File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            {importFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{importFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(importFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportTemplate} disabled={!importFile}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Import Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared Templates Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <GlobeIcon className="w-5 h-5" />
                Shared Templates
              </div>
            </DialogTitle>
            <DialogDescription>
              Templates shared by other tenants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {sharedTemplates.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No shared templates available
                </p>
              </div>
            ) : (
              sharedTemplates.map((template, idx) => (
                <Card
                  key={idx}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{template.variables.length} variables</div>
                          <div>Shared by: {template.sharedBy || "Unknown"}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUseSharedTemplate(template)}
                      >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Copy to My Templates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5" />
                Version History: {selectedTemplateForHistory?.name}
              </div>
            </DialogTitle>
            <DialogDescription>
              View and restore previous versions of this template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {/* Current Version */}
            <Card className="border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm">Current Version</div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedTemplateForHistory?.variables.length} variables
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Versions */}
            {selectedTemplateForHistory?.versions &&
            selectedTemplateForHistory.versions.length > 0 ? (
              selectedTemplateForHistory.versions
                .slice()
                .reverse()
                .map((version, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">
                            Version {version.version}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>{version.variables.length} variables</div>
                            <div>
                              {new Date(version.modifiedAt).toLocaleString()}
                            </div>
                            <div>Modified by: {version.modifiedBy}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRestoreVersion(
                              selectedTemplateForHistory,
                              version
                            )
                          }
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No previous versions available
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHistoryDialog(false);
                setSelectedTemplateForHistory(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Comparison Dialog */}
      <Dialog
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <GitCompareIcon className="w-5 h-5" />
                Template Comparison
              </div>
            </DialogTitle>
            <DialogDescription>
              Compare up to 3 templates side by side
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {comparisonTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No templates selected for comparison</p>
                <p className="text-sm mt-2">
                  Click the compare icon on templates to add them
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Template Headers */}
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${comparisonTemplates.length}, 1fr)`,
                  }}
                >
                  {comparisonTemplates.map((template) => {
                    const category = TEMPLATE_CATEGORIES.find(
                      (c) => c.id === template.category
                    );
                    const PermissionIcon = getPermissionIcon(
                      template.permission
                    );

                    return (
                      <Card key={template.name}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {template.name}
                                <PermissionIcon className="w-4 h-4 text-muted-foreground" />
                              </CardTitle>
                              {category && (
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-2"
                                >
                                  {category.label}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFromComparison(template.name)
                              }
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>

                {/* Basic Info Comparison */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Basic Information
                  </h3>
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${comparisonTemplates.length}, 1fr)`,
                    }}
                  >
                    {comparisonTemplates.map((template) => (
                      <Card key={template.name}>
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Variables:
                            </span>{" "}
                            <span className="font-medium">
                              {template.variables.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Created:
                            </span>{" "}
                            <span className="font-medium">
                              {new Date(
                                template.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Permission:
                            </span>{" "}
                            <span className="font-medium">
                              {template.permission || "edit"}
                            </span>
                          </div>
                          {template.versions &&
                            template.versions.length > 0 && (
                              <div>
                                <span className="text-muted-foreground">
                                  Versions:
                                </span>{" "}
                                <span className="font-medium">
                                  {template.versions.length}
                                </span>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Tags Comparison */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Tags</h3>
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${comparisonTemplates.length}, 1fr)`,
                    }}
                  >
                    {comparisonTemplates.map((template) => (
                      <Card key={template.name}>
                        <CardContent className="p-4">
                          {template.tags && template.tags.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {template.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No tags
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Variables Comparison */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Variables</h3>
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${comparisonTemplates.length}, 1fr)`,
                    }}
                  >
                    {comparisonTemplates.map((template) => (
                      <Card key={template.name}>
                        <CardContent className="p-4">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {template.variables.map((v) => (
                              <div
                                key={v.id}
                                className="p-2 bg-muted rounded text-xs space-y-1"
                              >
                                <div className="font-medium">{v.name}</div>
                                <div className="text-muted-foreground">
                                  {v.appliesTo} · {v.dist}
                                </div>
                                <div className="text-muted-foreground">
                                  weight: {v.weight}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {comparisonTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleLoadUserTemplate(template);
                        setShowComparisonDialog(false);
                      }}
                    >
                      Load {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setComparisonTemplates([])}
              disabled={comparisonTemplates.length === 0}
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowComparisonDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Replace Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-orange-500" />

              {selectedTemplate ? "Replace Variables?" : "Merge Variables?"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? "This will replace all current scenario variables with the template variables."
                : "This will add the preset variables to your current scenario variables."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTemplate ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Template: {selectedTemplate.name}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {selectedTemplate.variables.map((v) => (
                      <div key={v.id}>
                        • {v.name} ({v.appliesTo})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : pendingBuiltInTemplate ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Preset: {pendingBuiltInTemplate.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Will add {pendingBuiltInTemplate.variables.length}{" "}
                    variable(s) to your current {currentVariables.length}{" "}
                    variable(s)
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedTemplate(null);
                setPendingBuiltInTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmApply}>
              {selectedTemplate ? "Replace Variables" : "Merge Variables"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
