import { useState, useEffect } from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import { useTenantApi } from "@/polymet/data/use-tenant-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCwIcon, DatabaseIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataItem {
  id: string;
  name: string;
  status: string;
  timestamp: string;
}

// Mock data generator based on tenant
const generateMockData = (tenantId: string): DataItem[] => {
  const prefix = tenantId === "t-demo" ? "Demo" : "Acme";
  return [
    {
      id: `${tenantId}-001`,
      name: `${prefix} Item 1`,
      status: "active",
      timestamp: new Date().toISOString(),
    },
    {
      id: `${tenantId}-002`,
      name: `${prefix} Item 2`,
      status: "pending",
      timestamp: new Date().toISOString(),
    },
    {
      id: `${tenantId}-003`,
      name: `${prefix} Item 3`,
      status: "active",
      timestamp: new Date().toISOString(),
    },
  ];
};

export function TenantAwareDataTable() {
  const { tenant } = useTenant();
  const { get } = useTenantApi();
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a real app, this would call your API:
      // const result = await get("/api/items")
      // setData(result)

      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockData = generateMockData(tenant.tenantId);
      setData(mockData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant.tenantId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              Tenant-Aware Data Table
            </CardTitle>
            <CardDescription>
              Data automatically filtered by tenant: {tenant.tenantName}
            </CardDescription>
          </div>
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCwIcon
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
          <div className="font-medium mb-1">API Request Headers:</div>
          <code className="text-xs">x-tenant-id: {tenant.tenantId}</code>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {loading ? "Loading..." : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "active" ? "default" : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
