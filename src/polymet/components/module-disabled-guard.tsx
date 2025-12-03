import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOffIcon, SettingsIcon } from "lucide-react";

interface ModuleDisabledGuardProps {
  moduleName: string;
  moduleKey: string;
}

export function ModuleDisabledGuard({
  moduleName,
  moduleKey,
}: ModuleDisabledGuardProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <ShieldOffIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Module Disabled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The <strong>{moduleName}</strong> module is currently disabled for
            this tenant.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator or enable this module in the admin
            settings.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link to="/retina/admin">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Go to Admin Settings
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/retina">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
