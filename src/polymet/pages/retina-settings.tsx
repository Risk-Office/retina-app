import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRightIcon, MonitorIcon } from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import { InterfaceLevelSelector } from "@/polymet/components/interface-level-selector";
import { useRetinaStore } from "@/polymet/data/retina-store";

export function RetinaSettings() {
  const { tenant } = useTenant();
  const { addAudit } = useRetinaStore();

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/retina" className="hover:text-foreground transition-colors">
          Retina
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <span className="text-foreground font-medium">Settings</span>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <Badge variant="secondary" className="text-sm">
              {tenant.tenantName}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configure your preferences and system settings
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interface Level Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MonitorIcon className="w-5 h-5 text-primary" />

              <CardTitle>Interface Level</CardTitle>
            </div>
            <CardDescription>
              Choose your preferred interface complexity. This affects the
              density of controls, information display, and available features
              across the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InterfaceLevelSelector
              variant="global"
              onLevelChange={(level, isTemporary) => {
                // Track analytics
                addAudit("settings.interface.level.changed", {
                  level,
                  isTemporary,
                  timestamp: Date.now(),
                });
              }}
            />

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">What changes?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Basic:</strong> Simplified layout, essential controls
                  only
                </li>
                <li>
                  <strong>Intermediate:</strong> Balanced view with common
                  features
                </li>
                <li>
                  <strong>Advanced:</strong> Full analytics, dense information
                  display
                </li>
                <li>
                  <strong>Auto:</strong> Adapts based on page context and user
                  behavior
                </li>
              </ul>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> You can temporarily override this setting
                on individual decision pages using the "View Mode" dropdown.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for other settings */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>More Settings Coming Soon</CardTitle>
            <CardDescription>
              Additional configuration options will be available here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay tuned for more customization options including notifications,
              data preferences, and integration settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
