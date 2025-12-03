import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadIcon, SettingsIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface PDFExportOptions {
  pageSize: "letter" | "a4" | "legal";
  orientation: "portrait" | "landscape";
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  watermarkText?: string;
  fontSize: number;
  lineSpacing: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeCharts: boolean;
  chartQuality: "low" | "medium" | "high";
  includeAppendix: boolean;
  colorMode: "color" | "grayscale";
  compression: "none" | "low" | "medium" | "high";
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  pageSize: "letter",
  orientation: "portrait",
  includeTableOfContents: true,
  includePageNumbers: true,
  includeWatermark: false,
  fontSize: 11,
  lineSpacing: 1.5,
  margins: {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
  },
  includeCharts: true,
  chartQuality: "high",
  includeAppendix: true,
  colorMode: "color",
  compression: "medium",
};

interface PDFExportOptionsDialogProps {
  onExport: (options: PDFExportOptions) => void;
  defaultOptions?: Partial<PDFExportOptions>;
}

export function PDFExportOptionsDialog({
  onExport,
  defaultOptions,
}: PDFExportOptionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>({
    ...DEFAULT_OPTIONS,
    ...defaultOptions,
  });

  const handleExport = () => {
    onExport(options);
    setOpen(false);
  };

  const updateOption = <K extends keyof PDFExportOptions>(
    key: K,
    value: PDFExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Export Options</DialogTitle>
          <DialogDescription>
            Customize your PDF export settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Page Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Page Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select
                  value={options.pageSize}
                  onValueChange={(value: any) =>
                    updateOption("pageSize", value)
                  }
                >
                  <SelectTrigger id="pageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                    <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
                    <SelectItem value="legal">Legal (8.5" × 14")</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={options.orientation}
                  onValueChange={(value: any) =>
                    updateOption("orientation", value)
                  }
                >
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Margins (inches)</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="marginTop" className="text-xs">
                    Top
                  </Label>
                  <Slider
                    id="marginTop"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={[options.margins.top]}
                    onValueChange={([value]) =>
                      updateOption("margins", {
                        ...options.margins,
                        top: value,
                      })
                    }
                  />

                  <div className="text-xs text-center text-muted-foreground">
                    {options.margins.top}"
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="marginRight" className="text-xs">
                    Right
                  </Label>
                  <Slider
                    id="marginRight"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={[options.margins.right]}
                    onValueChange={([value]) =>
                      updateOption("margins", {
                        ...options.margins,
                        right: value,
                      })
                    }
                  />

                  <div className="text-xs text-center text-muted-foreground">
                    {options.margins.right}"
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="marginBottom" className="text-xs">
                    Bottom
                  </Label>
                  <Slider
                    id="marginBottom"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={[options.margins.bottom]}
                    onValueChange={([value]) =>
                      updateOption("margins", {
                        ...options.margins,
                        bottom: value,
                      })
                    }
                  />

                  <div className="text-xs text-center text-muted-foreground">
                    {options.margins.bottom}"
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="marginLeft" className="text-xs">
                    Left
                  </Label>
                  <Slider
                    id="marginLeft"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={[options.margins.left]}
                    onValueChange={([value]) =>
                      updateOption("margins", {
                        ...options.margins,
                        left: value,
                      })
                    }
                  />

                  <div className="text-xs text-center text-muted-foreground">
                    {options.margins.left}"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Typography */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Typography</h3>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size: {options.fontSize}pt</Label>
              <Slider
                id="fontSize"
                min={8}
                max={16}
                step={1}
                value={[options.fontSize]}
                onValueChange={([value]) => updateOption("fontSize", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineSpacing">
                Line Spacing: {options.lineSpacing}
              </Label>
              <Slider
                id="lineSpacing"
                min={1}
                max={2.5}
                step={0.1}
                value={[options.lineSpacing]}
                onValueChange={([value]) => updateOption("lineSpacing", value)}
              />
            </div>
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Content Options</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="toc" className="cursor-pointer">
                Include Table of Contents
              </Label>
              <Switch
                id="toc"
                checked={options.includeTableOfContents}
                onCheckedChange={(checked) =>
                  updateOption("includeTableOfContents", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pageNumbers" className="cursor-pointer">
                Include Page Numbers
              </Label>
              <Switch
                id="pageNumbers"
                checked={options.includePageNumbers}
                onCheckedChange={(checked) =>
                  updateOption("includePageNumbers", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="appendix" className="cursor-pointer">
                Include Appendix
              </Label>
              <Switch
                id="appendix"
                checked={options.includeAppendix}
                onCheckedChange={(checked) =>
                  updateOption("includeAppendix", checked)
                }
              />
            </div>
          </div>

          <Separator />

          {/* Charts & Graphics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Charts & Graphics</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="charts" className="cursor-pointer">
                Include Charts
              </Label>
              <Switch
                id="charts"
                checked={options.includeCharts}
                onCheckedChange={(checked) =>
                  updateOption("includeCharts", checked)
                }
              />
            </div>

            {options.includeCharts && (
              <div className="space-y-2">
                <Label htmlFor="chartQuality">Chart Quality</Label>
                <Select
                  value={options.chartQuality}
                  onValueChange={(value: any) =>
                    updateOption("chartQuality", value)
                  }
                >
                  <SelectTrigger id="chartQuality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Faster)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Best Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="colorMode">Color Mode</Label>
              <Select
                value={options.colorMode}
                onValueChange={(value: any) => updateOption("colorMode", value)}
              >
                <SelectTrigger id="colorMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Full Color</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Watermark */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Watermark</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="watermark" className="cursor-pointer">
                Include Watermark
              </Label>
              <Switch
                id="watermark"
                checked={options.includeWatermark}
                onCheckedChange={(checked) =>
                  updateOption("includeWatermark", checked)
                }
              />
            </div>

            {options.includeWatermark && (
              <div className="space-y-2">
                <Label htmlFor="watermarkText">Watermark Text</Label>
                <input
                  id="watermarkText"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md"
                  value={options.watermarkText || ""}
                  onChange={(e) =>
                    updateOption("watermarkText", e.target.value)
                  }
                  placeholder="CONFIDENTIAL"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* File Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">File Options</h3>

            <div className="space-y-2">
              <Label htmlFor="compression">Compression</Label>
              <Select
                value={options.compression}
                onValueChange={(value: any) =>
                  updateOption("compression", value)
                }
              >
                <SelectTrigger id="compression">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Largest)</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Smallest)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher compression reduces file size but may affect quality
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
