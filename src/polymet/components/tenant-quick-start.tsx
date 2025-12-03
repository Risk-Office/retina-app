import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function TenantQuickStart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start Guide</CardTitle>
        <CardDescription>
          Copy-paste examples to get started with the tenant system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="fetch">Fetch</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="switch">Switch</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">Access Current Tenant</h4>
                <Badge variant="outline">useTenant()</Badge>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`import { useTenant } from "@/polymet/data/tenant-context"

function MyComponent() {
  const { tenant } = useTenant()
  
  return (
    <div>
      <p>Tenant: {tenant.tenantName}</p>
      <p>ID: {tenant.tenantId}</p>
    </div>
  )
}`}
                </code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="fetch" className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">Fetch with Tenant Header</h4>
                <Badge variant="outline">useTenantFetch()</Badge>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`import { useTenantFetch } from "@/polymet/data/use-tenant-fetch"

function DataLoader() {
  const { tenantFetch } = useTenantFetch()
  
  const loadData = async () => {
    // x-tenant-id header automatically added
    const response = await tenantFetch("/api/data")
    const data = await response.json()
    return data
  }
  
  return <button onClick={loadData}>Load</button>
}`}
                </code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">API Helper Methods</h4>
                <Badge variant="outline">useTenantApi()</Badge>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`import { useTenantApi } from "@/polymet/data/use-tenant-fetch"

function UserManager() {
  const { get, post, put, del } = useTenantApi()
  
  // GET request
  const users = await get("/api/users")
  
  // POST request
  const newUser = await post("/api/users", {
    name: "John Doe"
  })
  
  // PUT request
  const updated = await put("/api/users/123", {
    name: "Jane Doe"
  })
  
  // DELETE request
  await del("/api/users/123")
}`}
                </code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="switch" className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">Switch Tenant</h4>
                <Badge variant="outline">setTenant()</Badge>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>
                  {`import { useTenant } from "@/polymet/data/tenant-context"

function TenantSwitcher() {
  const { tenant, setTenant } = useTenant()
  
  const switchToDemo = () => {
    setTenant({
      tenantId: "t-demo",
      tenantName: "Demo Co"
    })
    // Automatically saved to localStorage
  }
  
  const switchToAcme = () => {
    setTenant({
      tenantId: "t-acme",
      tenantName: "Acme Ltd"
    })
  }
  
  return (
    <div>
      <button onClick={switchToDemo}>Demo Co</button>
      <button onClick={switchToAcme}>Acme Ltd</button>
    </div>
  )
}`}
                </code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
