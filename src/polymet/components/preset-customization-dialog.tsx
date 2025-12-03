import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LayoutIcon,
  TypeIcon,
  FileTextIcon,
  PaletteIcon,
  SaveIcon,
  CopyIcon,
} from "lucide-react";
import {
  type ExportPresetConfig,
  type ExportPresetType,
  getPresetConfig,
  getAllPresets,
} from "@/polymet/data/export-presets";

/**
 * Preset Customization Dialog
 *
 * Visual editor for creating custom export presets by:
 * - Starting from an existing preset template
 * - Customizing layout, typography, content, and visual settings
 * - Saving custom presets to localStorage
 * - Previewing preset configuration
 */

export interface PresetCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavePreset: (preset: ExportPresetConfig) => void;
  tenantId: string;
}

export const PresetCustomizationDialog: React.FC<
  PresetCustomizationDialogProps
> = ({ open, onOpenChange, onSavePreset, tenantId }) => {
  // State for custom preset
  const [basePreset, setBasePreset] = useState<ExportPresetType>("executive");
  const [customPreset, setCustomPreset] = useState<ExportPresetConfig>(
    getPresetConfig("executive")
  );

  // Handle base preset change
  const handleBasePresetChange = (type: ExportPresetType) => {
    setBasePreset(type);
    setCustomPreset(getPresetConfig(type));
  };

  // Update preset field
  const updatePreset = (path: string, value: any) => {
    const keys = path.split(".");
    const newPreset = { ...customPreset };
    let current: any = newPreset;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setCustomPreset(newPreset);
  };

  // Handle save
  const handleSave = () => {
    onSavePreset(customPreset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Export Preset</DialogTitle>
          <DialogDescription>
            Create a custom export preset by starting from a template and
            adjusting settings to match your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Base Preset Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Start from Template
            </Label>
            <Select
              value={basePreset}
              onValueChange={(value) =>
                handleBasePresetChange(value as ExportPresetType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllPresets().map((preset) => (
                  <SelectItem key={preset.type} value={preset.type}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{preset.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {preset.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Basic Information</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={customPreset.name}
                  onChange={(e) => updatePreset("name", e.target.value)}
                  placeholder="My Custom Preset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-type">Preset Type</Label>
                <Input
                  id="preset-type"
                  value={customPreset.type}
                  onChange={(e) => updatePreset("type", e.target.value)}
                  placeholder="custom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description</Label>
              <Textarea
                id="preset-description"
                value={customPreset.description}
                onChange={(e) => updatePreset("description", e.target.value)}
                placeholder="Describe the purpose of this preset..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Tabbed Settings */}
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">
                <LayoutIcon className="w-4 h-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="typography">
                <TypeIcon className="w-4 h-4 mr-2" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="content">
                <FileTextIcon className="w-4 h-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="visual">
                <PaletteIcon className="w-4 h-4 mr-2" />
                Visual
              </TabsTrigger>
            </TabsList>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <Select
                    value={customPreset.layout.pageSize}
                    onValueChange={(value) =>
                      updatePreset("layout.pageSize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="a4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={customPreset.layout.orientation}
                    onValueChange={(value) =>
                      updatePreset("layout.orientation", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Column Count</Label>
                  <Select
                    value={customPreset.layout.columnCount.toString()}
                    onValueChange={(value) =>
                      updatePreset("layout.columnCount", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margins (pixels)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    placeholder="Top"
                    value={customPreset.layout.margins.top}
                    onChange={(e) =>
                      updatePreset(
                        "layout.margins.top",
                        parseInt(e.target.value)
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder="Right"
                    value={customPreset.layout.margins.right}
                    onChange={(e) =>
                      updatePreset(
                        "layout.margins.right",
                        parseInt(e.target.value)
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder="Bottom"
                    value={customPreset.layout.margins.bottom}
                    onChange={(e) =>
                      updatePreset(
                        "layout.margins.bottom",
                        parseInt(e.target.value)
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder="Left"
                    value={customPreset.layout.margins.left}
                    onChange={(e) =>
                      updatePreset(
                        "layout.margins.left",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title Size (px)</Label>
                  <Input
                    type="number"
                    value={customPreset.typography.titleSize}
                    onChange={(e) =>
                      updatePreset(
                        "typography.titleSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heading Size (px)</Label>
                  <Input
                    type="number"
                    value={customPreset.typography.headingSize}
                    onChange={(e) =>
                      updatePreset(
                        "typography.headingSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body Size (px)</Label>
                  <Input
                    type="number"
                    value={customPreset.typography.bodySize}
                    onChange={(e) =>
                      updatePreset(
                        "typography.bodySize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Caption Size (px)</Label>
                  <Input
                    type="number"
                    value={customPreset.typography.captionSize}
                    onChange={(e) =>
                      updatePreset(
                        "typography.captionSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={customPreset.typography.lineHeight}
                    onChange={(e) =>
                      updatePreset(
                        "typography.lineHeight",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Input
                    value={customPreset.typography.fontFamily}
                    onChange={(e) =>
                      updatePreset("typography.fontFamily", e.target.value)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Executive Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      High-level overview section
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.includeExecutiveSummary}
                    onCheckedChange={(checked) =>
                      updatePreset("content.includeExecutiveSummary", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Detailed Metrics</Label>
                    <p className="text-sm text-muted-foreground">
                      All metrics including CVaR and utility
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.includeDetailedMetrics}
                    onCheckedChange={(checked) =>
                      updatePreset("content.includeDetailedMetrics", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Parameter Appendix</Label>
                    <p className="text-sm text-muted-foreground">
                      Full parameter details
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.includeParameterAppendix}
                    onCheckedChange={(checked) =>
                      updatePreset("content.includeParameterAppendix", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Model Snapshots</Label>
                    <p className="text-sm text-muted-foreground">
                      Model configuration and fingerprints
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.includeModelSnapshots}
                    onCheckedChange={(checked) =>
                      updatePreset("content.includeModelSnapshots", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Sensitivity Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Top sensitive factors
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.includeSensitivityAnalysis}
                    onCheckedChange={(checked) =>
                      updatePreset(
                        "content.includeSensitivityAnalysis",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use Friendly Titles</Label>
                    <p className="text-sm text-muted-foreground">
                      Plain-language section titles
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.useFriendlyTitles}
                    onCheckedChange={(checked) =>
                      updatePreset("content.useFriendlyTitles", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use Descriptive Captions</Label>
                    <p className="text-sm text-muted-foreground">
                      Detailed table captions
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.content.useDescriptiveCaptions}
                    onCheckedChange={(checked) =>
                      updatePreset("content.useDescriptiveCaptions", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Table Rows</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customPreset.content.maxTableRows ?? ""}
                      onChange={(e) =>
                        updatePreset(
                          "content.maxTableRows",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="Unlimited"
                    />

                    <span className="text-sm text-muted-foreground">
                      (leave empty for unlimited)
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Visual Tab */}
            <TabsContent value="visual" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Charts</Label>
                    <p className="text-sm text-muted-foreground">
                      Visual data representations
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.visual.includeCharts}
                    onCheckedChange={(checked) =>
                      updatePreset("visual.includeCharts", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chart Size</Label>
                  <Select
                    value={customPreset.visual.chartSize}
                    onValueChange={(value) =>
                      updatePreset("visual.chartSize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Sparklines</Label>
                    <p className="text-sm text-muted-foreground">
                      Inline trend indicators
                    </p>
                  </div>
                  <Switch
                    checked={customPreset.visual.includeSparklines}
                    onCheckedChange={(checked) =>
                      updatePreset("visual.includeSparklines", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <Select
                    value={customPreset.visual.colorScheme}
                    onValueChange={(value) =>
                      updatePreset("visual.colorScheme", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Table Density</Label>
                  <Select
                    value={customPreset.visual.tableDensity}
                    onValueChange={(value) =>
                      updatePreset("visual.tableDensity", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Custom Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
