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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FileTextIcon,
  DownloadIcon,
  CheckCircle2Icon,
  LayoutIcon,
  TypeIcon,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import {
  getPresetConfig,
  applyThemeTokensToPreset,
  applyTenantBranding,
  getSectionTitle,
  SECTION_TITLES,
  type ExportPresetType,
  type ExportFormat,
  type TenantBranding,
  type ExportOptions,
} from "@/polymet/data/export-presets";
import { useTenant } from "@/polymet/data/tenant-context";

/**
 * Export Preset Dialog
 *
 * Dialog for selecting export preset (Executive or Technical) and configuring
 * export options with live preview of preset settings.
 */

export interface ExportPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionTitle: string;
  onExport: (options: ExportOptions) => void;
  tenantBranding?: TenantBranding;
}

export const ExportPresetDialog: React.FC<ExportPresetDialogProps> = ({
  open,
  onOpenChange,
  decisionTitle,
  onExport,
  tenantBranding,
}) => {
  const { tenant } = useTenant();
  const [selectedPreset, setSelectedPreset] =
    useState<ExportPresetType>("executive");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeUserInfo, setIncludeUserInfo] = useState(true);
  const [customFilename, setCustomFilename] = useState("");

  // Get preset configuration with theme tokens applied
  const preset = applyThemeTokensToPreset(getPresetConfig(selectedPreset));

  // Apply tenant branding if available
  const brandedPreset = tenantBranding
    ? applyTenantBranding(preset, tenantBranding)
    : preset;

  const handleExport = () => {
    const options: ExportOptions = {
      preset: brandedPreset,
      format: selectedFormat,
      tenantBranding,
      includeTimestamp,
      includeUserInfo,
      filename: customFilename || undefined,
    };

    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Decision Report</DialogTitle>
          <DialogDescription>
            Choose a preset and format for your report. Both presets use theme
            tokens for brand consistency.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preset Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Preset</Label>
            <RadioGroup
              value={selectedPreset}
              onValueChange={(value) =>
                setSelectedPreset(value as ExportPresetType)
              }
            >
              {/* Executive Preset */}
              <div
                className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  selectedPreset === "executive"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPreset("executive")}
              >
                <RadioGroupItem
                  value="executive"
                  id="executive"
                  className="mt-1"
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="executive"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Executive Summary
                    </Label>
                    <Badge variant="default">Intermediate</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Board-ready report with clear insights and friendly
                    language. Larger margins, descriptive captions, limited
                    tables (top 10), and plain-language titles.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">
                      <LayoutIcon className="w-3 h-3 mr-1" />
                      Comfortable Layout
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TypeIcon className="w-3 h-3 mr-1" />
                      Friendly Titles
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <FileTextIcon className="w-3 h-3 mr-1" />
                      Key Insights
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Technical Preset */}
              <div
                className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  selectedPreset === "technical"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPreset("technical")}
              >
                <RadioGroupItem
                  value="technical"
                  id="technical"
                  className="mt-1"
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="technical"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Technical Report
                    </Label>
                    <Badge variant="secondary">Advanced</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive report with full data and model details. Dense
                    tables, parameter appendices, model snapshots, and technical
                    terminology.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">
                      <LayoutIcon className="w-3 h-3 mr-1" />
                      Dense Layout
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TypeIcon className="w-3 h-3 mr-1" />
                      Technical Terms
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <FileTextIcon className="w-3 h-3 mr-1" />
                      Full Details
                    </Badge>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value) =>
                setSelectedFormat(value as ExportFormat)
              }
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={`flex items-center space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  selectedFormat === "pdf"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedFormat("pdf")}
              >
                <RadioGroupItem value="pdf" id="pdf" />

                <Label
                  htmlFor="pdf"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <FileIcon className="w-4 h-4" />
                  PDF
                </Label>
              </div>

              <div
                className={`flex items-center space-x-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  selectedFormat === "csv"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedFormat("csv")}
              >
                <RadioGroupItem value="csv" id="csv" />

                <Label
                  htmlFor="csv"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  CSV
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Preview of Selected Preset */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preset Preview</Label>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              {/* Layout Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Page Size:</span>{" "}
                  <span className="font-medium">
                    {preset.layout.pageSize.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Orientation:</span>{" "}
                  <span className="font-medium">
                    {preset.layout.orientation}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Margins:</span>{" "}
                  <span className="font-medium">
                    {preset.layout.margins.top}px
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Table Rows:</span>{" "}
                  <span className="font-medium">
                    {preset.content.maxTableRows ?? "Unlimited"}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Section Title Examples */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Section Title Examples:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600" />

                    <span className="text-muted-foreground">Metrics:</span>
                    <span className="font-medium">
                      {getSectionTitle(
                        SECTION_TITLES.metrics.technical,
                        SECTION_TITLES.metrics.friendly,
                        preset
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600" />

                    <span className="text-muted-foreground">Guardrails:</span>
                    <span className="font-medium">
                      {getSectionTitle(
                        SECTION_TITLES.guardrails.technical,
                        SECTION_TITLES.guardrails.friendly,
                        preset
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600" />

                    <span className="text-muted-foreground">Partners:</span>
                    <span className="font-medium">
                      {getSectionTitle(
                        SECTION_TITLES.partners.technical,
                        SECTION_TITLES.partners.friendly,
                        preset
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Branding Info */}
              {tenantBranding && (
                <>
                  <Separator />

                  <div className="flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />

                    <span className="text-muted-foreground">Tenant Logo:</span>
                    <span className="font-medium">
                      {tenantBranding.companyName}
                    </span>
                    <Badge variant="outline" className="ml-auto">
                      Included
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Additional Options
            </Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timestamp">Include Timestamp</Label>
                  <p className="text-sm text-muted-foreground">
                    Add generation date and time to the report
                  </p>
                </div>
                <Switch
                  id="timestamp"
                  checked={includeTimestamp}
                  onCheckedChange={setIncludeTimestamp}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="userinfo">Include User Info</Label>
                  <p className="text-sm text-muted-foreground">
                    Add your name and role to the report
                  </p>
                </div>
                <Switch
                  id="userinfo"
                  checked={includeUserInfo}
                  onCheckedChange={setIncludeUserInfo}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filename">Custom Filename (optional)</Label>
                <Input
                  id="filename"
                  placeholder={`${decisionTitle.toLowerCase().replace(/\s+/g, "-")}-report`}
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
