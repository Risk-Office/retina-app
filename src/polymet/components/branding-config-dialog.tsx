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
import { Input } from "@/components/ui/input";
import { PaletteIcon, CheckIcon } from "lucide-react";
import {
  saveBrandingConfig,
  type BrandingConfig,
} from "@/polymet/data/board-summary-templates";

interface BrandingConfigDialogProps {
  tenantId: string;
  currentBranding: BrandingConfig;
  onBrandingUpdate: (branding: BrandingConfig) => void;
  onAuditEvent: (eventType: string, payload: any) => void;
}

export function BrandingConfigDialog({
  tenantId,
  currentBranding,
  onBrandingUpdate,
  onAuditEvent,
}: BrandingConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig>(currentBranding);

  const handleSave = () => {
    saveBrandingConfig(tenantId, branding);
    onBrandingUpdate(branding);
    onAuditEvent("branding.config.updated", {
      tenantId,
      companyName: branding.companyName,
      hasLogo: !!branding.logoUrl,
    });
    setOpen(false);
  };

  const handleReset = () => {
    setBranding(currentBranding);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PaletteIcon className="w-4 h-4 mr-2" />
          Customize Branding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Branding Configuration</DialogTitle>
          <DialogDescription>
            Customize your company branding for board reports and exports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={branding.companyName}
              onChange={(e) =>
                setBranding({ ...branding, companyName: e.target.value })
              }
              placeholder="Your Company Name"
            />

            <p className="text-xs text-muted-foreground">
              This will appear in report headers and footers
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
            <Input
              id="logoUrl"
              value={branding.logoUrl || ""}
              onChange={(e) =>
                setBranding({ ...branding, logoUrl: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />

            <p className="text-xs text-muted-foreground">
              URL to your company logo (PNG, JPG, or SVG)
            </p>
          </div>

          {/* Color Configuration */}
          <div className="space-y-4">
            <Label>Brand Colors</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="text-xs">
                  Primary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />

                  <Input
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    placeholder="#0066cc"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor" className="text-xs">
                  Secondary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />

                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        secondaryColor: e.target.value,
                      })
                    }
                    placeholder="#00a3e0"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor" className="text-xs">
                  Accent Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />

                  <Input
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    placeholder="#0099cc"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Colors used for headers, borders, and accents in reports
            </p>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family (Optional)</Label>
            <Input
              id="fontFamily"
              value={branding.fontFamily || ""}
              onChange={(e) =>
                setBranding({ ...branding, fontFamily: e.target.value })
              }
              placeholder="Inter, system-ui, sans-serif"
            />

            <p className="text-xs text-muted-foreground">
              CSS font family string for report text
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-6 border border-border rounded-lg"
              style={{
                borderColor: branding.primaryColor,
                fontFamily: branding.fontFamily || "inherit",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-2xl font-bold"
                  style={{ color: branding.primaryColor }}
                >
                  {branding.companyName}
                </h3>
                {branding.logoUrl && (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="h-12 max-w-[200px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <div
                className="h-2 rounded"
                style={{ backgroundColor: branding.accentColor }}
              />

              <p className="mt-4 text-sm text-muted-foreground">
                This is how your branding will appear in board reports
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Branding
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
