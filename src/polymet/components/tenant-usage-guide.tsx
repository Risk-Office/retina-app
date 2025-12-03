import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export function TenantUsageGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tenant Context System</h2>
        <p className="text-muted-foreground">
          Complete guide for using the multi-tenant system in your application
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />

        <AlertTitle>Automatic Setup</AlertTitle>
        <AlertDescription>
          The TenantProvider is already configured in the app prototype. All
          components have access to tenant context automatically.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Using the Tenant Hook</CardTitle>
          <CardDescription>
            Access and update tenant information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code>
              {`import { useTenant } from "@/polymet/data/tenant-context"

function MyComponent() {
  const { tenant, setTenant } = useTenant()
  
  // Access current tenant
  console.log(tenant.tenantId)   // "t-demo"
  console.log(tenant.tenantName) // "Demo Co"
  
  // Switch tenant
  const switchToAcme = () => {
    setTenant({
      tenantId: "t-acme",
      tenantName: "Acme Ltd"
    })
  }
  
  return <div>{tenant.tenantName}</div>
}`}
            </code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Making API Requests with Tenant Header</CardTitle>
          <CardDescription>
            Use useTenantFetch for automatic header injection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Basic Fetch:</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>
                {`import { useTenantFetch } from "@/polymet/data/use-tenant-fetch"

function MyComponent() {
  const { tenantFetch } = useTenantFetch()
  
  const loadData = async () => {
    // x-tenant-id header is automatically added
    const response = await tenantFetch("/api/data")
    const data = await response.json()
    return data
  }
}`}
              </code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Using API Helpers:</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>
                {`import { useTenantApi } from "@/polymet/data/use-tenant-fetch"

function MyComponent() {
  const { get, post, put, del } = useTenantApi()
  
  // GET request
  const data = await get("/api/users")
  
  // POST request
  const newUser = await post("/api/users", {
    name: "John Doe",
    email: "john@example.com"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. LocalStorage Persistence</CardTitle>
          <CardDescription>
            Tenant selection is automatically saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              Tenant selection is saved to localStorage key:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                retina:tenant
              </code>
            </li>
            <li>
              Default tenant on first load:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                Demo Co (t-demo)
              </code>
            </li>
            <li>Persists across page refreshes and browser sessions</li>
            <li>Automatically loads on app initialization</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Tenant Switcher in Header</CardTitle>
          <CardDescription>Built-in UI for switching tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Located in the top header next to notifications</li>
            <li>Shows current tenant name with building icon</li>
            <li>Dropdown menu with available tenants: Demo Co, Acme Ltd</li>
            <li>Checkmark indicates currently selected tenant</li>
            <li>Automatically reloads route after switching</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Available Tenants</CardTitle>
          <CardDescription>Pre-configured tenant options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-semibold">Demo Co</div>
              <div className="text-sm text-muted-foreground">
                Tenant ID: t-demo
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-semibold">Acme Ltd</div>
              <div className="text-sm text-muted-foreground">
                Tenant ID: t-acme
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
