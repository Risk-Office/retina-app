/**
 * Admin Features Documentation
 *
 * This document describes the role-based permissions system and bulk control features
 * for the Retina Intelligence Suite admin panel.
 */

export const ADMIN_FEATURES_INFO = {
  version: "1.0.0",
  lastUpdated: "2024-01-10",

  features: {
    roleBasedPermissions: {
      name: "Role-Based Permissions",
      description: "Control access to admin features based on user roles",
      storageKey: "retina:user:role",
      defaultRole: "admin",

      roles: [
        {
          role: "super_admin",
          name: "Super Admin",
          description: "Full system access with all permissions",
          canManageModules: true,
          canManageUsers: true,
          canManageTenants: true,
          canViewAudit: true,
          canManageSettings: true,
          canViewAnalytics: true,
        },
        {
          role: "admin",
          name: "Admin",
          description: "Manage modules and users within tenant",
          canManageModules: true,
          canManageUsers: true,
          canManageTenants: false,
          canViewAudit: true,
          canManageSettings: false,
          canViewAnalytics: true,
        },
        {
          role: "manager",
          name: "Manager",
          description: "View analytics and manage basic settings",
          canManageModules: false,
          canManageUsers: false,
          canManageTenants: false,
          canViewAudit: true,
          canManageSettings: false,
          canViewAnalytics: true,
        },
        {
          role: "viewer",
          name: "Viewer",
          description: "Read-only access to modules and data",
          canManageModules: false,
          canManageUsers: false,
          canManageTenants: false,
          canViewAudit: false,
          canManageSettings: false,
          canViewAnalytics: false,
        },
      ],

      usage: {
        hook: "useUserRole()",
        functions: [
          "getUserRole() - Get current user role from localStorage",
          "setUserRole(role) - Set user role in localStorage",
          "hasPermission(role, permission) - Check if role has permission",
          "canManageModules(role) - Check if role can manage modules",
        ],

        example: `
import { useUserRole } from "@/polymet/data/roles-permissions";

function MyComponent() {
  const { role, canManageModules, checkPermission } = useUserRole();
  
  if (!canManageModules) {
    return <div>Access denied</div>;
  }
  
  return <div>Admin panel</div>;
}
        `,
      },
    },

    bulkControls: {
      name: "Bulk Enable/Disable",
      description: "Enable or disable all modules at once",

      features: [
        "Enable All - Turn on all modules for the current tenant",
        "Disable All - Turn off all modules for the current tenant",
        "Permission-based - Only available to users with manage_modules permission",
        "Smart buttons - Disabled when action is not applicable",
      ],

      usage: {
        location: "Admin Settings page (/retina/admin)",
        buttons: [
          "Enable All - Appears in module features card header",
          "Disable All - Appears in module features card header",
        ],

        behavior: [
          "Enable All is disabled when all modules are already enabled",
          "Disable All is disabled when all modules are already disabled",
          "Both buttons are hidden if user lacks manage_modules permission",
        ],
      },
    },

    permissionGuards: {
      name: "Permission Guards",
      description: "UI elements that respect user permissions",

      guards: [
        {
          component: "Module toggles",
          permission: "manage_modules",
          behavior: "Switches are disabled if user lacks permission",
        },
        {
          component: "Bulk action buttons",
          permission: "manage_modules",
          behavior: "Buttons are hidden if user lacks permission",
        },
        {
          component: "Role selector",
          permission: "none",
          behavior: "Always visible for demo purposes",
        },
      ],

      alerts: [
        "Warning alert shown when user lacks manage_modules permission",
        "Alert explains why controls are disabled",
        "Alert shows current role name",
      ],
    },
  },

  integration: {
    files: [
      "@/polymet/data/roles-permissions - Core permissions system",
      "@/polymet/pages/retina-admin - Admin page with role checks",
      "@/polymet/components/retina-sidebar - Shows user role badge",
    ],

    events: [
      "userRoleChanged - Dispatched when role is updated",
      "featureFlagsUpdated - Dispatched when modules are toggled",
    ],

    localStorage: [
      "retina:user:role - Current user role",
      "retina:features:{tenantId} - Module flags per tenant",
    ],
  },

  bestPractices: [
    "Always check permissions before showing admin controls",
    "Use useUserRole() hook for reactive permission checks",
    "Disable controls instead of hiding them for better UX",
    "Show clear feedback when actions are restricted",
    "Use bulk actions for efficiency with many modules",
  ],
};

export default ADMIN_FEATURES_INFO;
