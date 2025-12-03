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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, PaletteIcon } from "lucide-react";
import type { ReportTemplate } from "@/polymet/data/board-summary-templates";
import { saveCustomTemplate } from "@/polymet/data/board-summary-templates";

interface TemplateBuilderDialogProps {
  tenantId: string;
  onTemplateCreated: (template: ReportTemplate) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function TemplateBuilderDialog({
  tenantId,
  onTemplateCreated,
  onAuditEvent,
}: TemplateBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<
    "executive" | "technical" | "stakeholder" | "board"
  >("executive");

  // Sections
  const [sections, setSections] = useState({
    executiveSummary: true,
    keyMetrics: true,
    detailedMetrics: false,
    sensitiveFactors: true,
    partnerAnalysis: true,
    riskAssessment: true,
    recommendations: true,
    technicalDetails: false,
  });

  // Styling
  const [primaryColor, setPrimaryColor] = useState("#0066cc");
  const [accentColor, setAccentColor] = useState("#00a3e0");
  const [headerStyle, setHeaderStyle] = useState<
    "formal" | "modern" | "minimal"
  >("modern");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeLogos, setIncludeLogos] = useState(true);

  const handleSectionToggle = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreateTemplate = () => {
    if (!name.trim()) {
      alert("Please enter a template name");
      return;
    }

    const template: ReportTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim() || "Custom template",
      audience,
      sections,
      styling: {
        primaryColor,
        accentColor,
        headerStyle,
        includeCharts,
        includeLogos,
      },
    };

    // Save to localStorage
    saveCustomTemplate(tenantId, template);

    // Audit event
    onAuditEvent("template.created", {
      templateId: template.id,
      templateName: template.name,
      audience: template.audience,
    });

    // Callback
    onTemplateCreated(template);

    // Reset form
    setName("");
    setDescription("");
    setAudience("executive");
    setSections({
      executiveSummary: true,
      keyMetrics: true,
      detailedMetrics: false,
      sensitiveFactors: true,
      partnerAnalysis: true,
      riskAssessment: true,
      recommendations: true,
      technicalDetails: false,
    });
    setPrimaryColor("#0066cc");
    setAccentColor("#00a3e0");
    setHeaderStyle("modern");
    setIncludeCharts(true);
    setIncludeLogos(true);

    setOpen(false);
  };

  const enabledSectionsCount = Object.values(sections).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Custom Template
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Builder</DialogTitle>
          <DialogDescription>
            Create a custom report template with your preferred sections and
            styling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Quarterly Board Review"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-audience">Target Audience</Label>
                <Select
                  value={audience}
                  onValueChange={(v: any) => setAudience(v)}
                >
                  <SelectTrigger id="template-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Report Sections</CardTitle>
                <Badge variant="outline">{enabledSectionsCount} enabled</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(sections).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label
                      htmlFor={`section-${key}`}
                      className="cursor-pointer"
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Switch
                      id={`section-${key}`}
                      checked={enabled}
                      onCheckedChange={() =>
                        handleSectionToggle(key as keyof typeof sections)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Styling */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PaletteIcon className="w-4 h-4" />

                <CardTitle className="text-base">Visual Styling</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />

                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#0066cc"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-20 h-10"
                    />

                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#00a3e0"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="header-style">Header Style</Label>
                <Select
                  value={headerStyle}
                  onValueChange={(v: any) => setHeaderStyle(v)}
                >
                  <SelectTrigger id="header-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-charts" className="cursor-pointer">
                    Include Charts
                  </Label>
                  <Switch
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-logos" className="cursor-pointer">
                    Include Company Logos
                  </Label>
                  <Switch
                    id="include-logos"
                    checked={includeLogos}
                    onCheckedChange={setIncludeLogos}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-border rounded-lg space-y-2">
                <div
                  className="h-12 rounded flex items-center px-4 text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {name || "Template Name"}
                </div>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-16 rounded"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">
                      {description || "Template description"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {audience} • {headerStyle} • {enabledSectionsCount}{" "}
                      sections
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
