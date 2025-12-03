/**
 * RETINA TENANT CONTEXT SYSTEM
 * ============================
 *
 * Complete multi-tenant system with localStorage persistence and automatic
 * header injection for all API requests.
 *
 * FEATURES:
 * ---------
 * ✅ TenantContext with React Context API
 * ✅ localStorage persistence (key: "retina:tenant")
 * ✅ useTenant() hook for accessing/updating tenant
 * ✅ useTenantFetch() for automatic x-tenant-id header injection
 * ✅ useTenantApi() with helper methods (get, post, put, del)
 * ✅ Tenant switcher dropdown in header
 * ✅ Default tenant: Demo Co (t-demo)
 * ✅ Available tenants: Demo Co, Acme Ltd
 *
 *
 * SETUP:
 * ------
 * The TenantProvider is already configured in the app prototype at:
 * @/polymet/prototypes/retina-app
 *
 * All components within the app have automatic access to tenant context.
 *
 *
 * USAGE EXAMPLES:
 * ---------------
 *
 * 1. ACCESS CURRENT TENANT:
 * -------------------------
 * import { useTenant } from "@/polymet/data/tenant-context"
 *
 * function MyComponent() {
 *   const { tenant } = useTenant()
 *
 *   return (
 *     <div>
 *       <p>Current Tenant: {tenant.tenantName}</p>
 *       <p>Tenant ID: {tenant.tenantId}</p>
 *     </div>
 *   )
 * }
 *
 *
 * 2. SWITCH TENANT:
 * -----------------
 * import { useTenant } from "@/polymet/data/tenant-context"
 *
 * function TenantSwitcher() {
 *   const { tenant, setTenant } = useTenant()
 *
 *   const switchToAcme = () => {
 *     setTenant({
 *       tenantId: "t-acme",
 *       tenantName: "Acme Ltd"
 *     })
 *     // Tenant is automatically saved to localStorage
 *   }
 *
 *   return <button onClick={switchToAcme}>Switch to Acme</button>
 * }
 *
 *
 * 3. MAKE API REQUESTS WITH TENANT HEADER:
 * -----------------------------------------
 * import { useTenantFetch } from "@/polymet/data/use-tenant-fetch"
 *
 * function DataLoader() {
 *   const { tenantFetch } = useTenantFetch()
 *
 *   const loadData = async () => {
 *     // x-tenant-id header is automatically added
 *     const response = await tenantFetch("/api/data")
 *     const data = await response.json()
 *     return data
 *   }
 *
 *   return <button onClick={loadData}>Load Data</button>
 * }
 *
 *
 * 4. USE API HELPER METHODS:
 * --------------------------
 * import { useTenantApi } from "@/polymet/data/use-tenant-fetch"
 *
 * function UserManager() {
 *   const { get, post, put, del } = useTenantApi()
 *
 *   const loadUsers = async () => {
 *     // GET request with x-tenant-id header
 *     const users = await get("/api/users")
 *     return users
 *   }
 *
 *   const createUser = async (userData) => {
 *     // POST request with x-tenant-id header
 *     const newUser = await post("/api/users", userData)
 *     return newUser
 *   }
 *
 *   const updateUser = async (id, userData) => {
 *     // PUT request with x-tenant-id header
 *     const updated = await put(`/api/users/${id}`, userData)
 *     return updated
 *   }
 *
 *   const deleteUser = async (id) => {
 *     // DELETE request with x-tenant-id header
 *     await del(`/api/users/${id}`)
 *   }
 * }
 *
 *
 * TENANT SWITCHER IN HEADER:
 * ---------------------------
 * The header component includes a built-in tenant switcher dropdown:
 * - Located next to the notification bell
 * - Shows current tenant name with building icon
 * - Dropdown menu with available tenants
 * - Checkmark indicates currently selected tenant
 * - Automatically reloads route after switching
 *
 *
 * LOCALSTORAGE:
 * -------------
 * Key: "retina:tenant"
 * Format: { "tenantId": "t-demo", "tenantName": "Demo Co" }
 *
 * - Automatically saved when tenant is changed
 * - Automatically loaded on app initialization
 * - Persists across page refreshes and browser sessions
 *
 *
 * DEFAULT TENANT:
 * ---------------
 * If no tenant is set in localStorage on first load:
 * - tenantId: "t-demo"
 * - tenantName: "Demo Co"
 *
 *
 * AVAILABLE TENANTS:
 * ------------------
 * 1. Demo Co (t-demo)
 * 2. Acme Ltd (t-acme)
 *
 * To add more tenants, update the AVAILABLE_TENANTS array in:
 * @/polymet/components/retina-header
 *
 *
 * FILES IN THE SYSTEM:
 * --------------------
 * - @/polymet/data/tenant-context - TenantProvider and useTenant hook
 * - @/polymet/data/use-tenant-fetch - Fetch hooks with tenant header injection
 * - @/polymet/components/retina-header - Header with tenant switcher
 * - @/polymet/pages/retina-tenant-demo - Interactive demo page
 * - @/polymet/components/tenant-usage-guide - Documentation component
 *
 *
 * DEMO PAGE:
 * ----------
 * Visit /retina/admin/tenant-demo to see an interactive demonstration
 * of the tenant system with live examples.
 */

export const TENANT_SYSTEM_INFO = {
  version: "1.0.0",
  storageKey: "retina:tenant",
  defaultTenant: {
    tenantId: "t-demo",
    tenantName: "Demo Co",
  },
  availableTenants: [
    { tenantId: "t-demo", tenantName: "Demo Co" },
    { tenantId: "t-acme", tenantName: "Acme Ltd" },
  ],
};
