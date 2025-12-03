import { useTenant } from "@/polymet/data/tenant-context";
import { useTenantFetch, useTenantApi } from "@/polymet/data/use-tenant-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BuildingIcon,
  CheckCircleIcon,
  CodeIcon,
  DatabaseIcon,
} from "lucide-react";
import { useState } from "react";
import { TenantUsageGuide } from "@/polymet/components/tenant-usage-guide";
import { TenantAwareDataTable } from "@/polymet/components/tenant-aware-data-table";
import { TenantQuickStart } from "@/polymet/components/tenant-quick-start";

export function RetinaTenantDemo() {
  const { tenant, setTenant } = useTenant();
  const { tenantFetch } = useTenantFetch();
  const [fetchLog, setFetchLog] = useState<string[]>([]);

  const simulateFetch = async (endpoint: string, method: string = "GET") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${method} ${endpoint} with x-tenant-id: ${tenant.tenantId}`;
    setFetchLog((prev) => [logEntry, ...prev].slice(0, 10));
  };

  const handleTenantSwitch = (newTenant: {
    tenantId: string;
    tenantName: string;
  }) => {
    setTenant(newTenant);
    setFetchLog((prev) =>
      [
        `[${new Date().toLocaleTimeString()}] Tenant switched to: ${newTenant.tenantName}`,
        ...prev,
      ].slice(0, 10)
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Tenant Context Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the multi-tenant system
        </p>
      </div>

      {/* Current Tenant Status */}
      <Alert>
        <BuildingIcon className="h-4 w-4" />

        <AlertTitle>Current Tenant</AlertTitle>
        <AlertDescription className="flex items-center gap-2 mt-2">
          <span className="font-semibold">{tenant.tenantName}</span>
          <Badge variant="outline">{tenant.tenantId}</Badge>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Switcher */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5" />
              Tenant Switcher
            </CardTitle>
            <CardDescription>Switch between available tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() =>
                handleTenantSwitch({
                  tenantId: "t-demo",
                  tenantName: "Demo Co",
                })
              }
              variant={tenant.tenantId === "t-demo" ? "default" : "outline"}
              className="w-full justify-between"
            >
              <span>Demo Co</span>
              {tenant.tenantId === "t-demo" && (
                <CheckCircleIcon className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={() =>
                handleTenantSwitch({
                  tenantId: "t-acme",
                  tenantName: "Acme Ltd",
                })
              }
              variant={tenant.tenantId === "t-acme" ? "default" : "outline"}
              className="w-full justify-between"
            >
              <span>Acme Ltd</span>
              {tenant.tenantId === "t-acme" && (
                <CheckCircleIcon className="w-4 h-4" />
              )}
            </Button>
          </CardContent>
        </Card>

        {/* API Request Simulator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              API Request Simulator
            </CardTitle>
            <CardDescription>
              Simulate API calls with tenant headers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => simulateFetch("/api/users", "GET")}
              variant="outline"
              className="w-full"
            >
              GET /api/users
            </Button>
            <Button
              onClick={() => simulateFetch("/api/scans", "POST")}
              variant="outline"
              className="w-full"
            >
              POST /api/scans
            </Button>
            <Button
              onClick={() => simulateFetch("/api/events", "GET")}
              variant="outline"
              className="w-full"
            >
              GET /api/events
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Request Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CodeIcon className="w-5 h-5" />
            Request Log
          </CardTitle>
          <CardDescription>
            Recent API calls with tenant context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No requests yet. Try switching tenants or simulating API calls.
            </p>
          ) : (
            <div className="space-y-2">
              {fetchLog.map((log, index) => (
                <div
                  key={index}
                  className="text-sm font-mono bg-muted p-2 rounded border border-border"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start */}
      <TenantQuickStart />

      {/* Example Component */}
      <TenantAwareDataTable />

      {/* Usage Guide */}
      <TenantUsageGuide />
    </div>
  );
}
