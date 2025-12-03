import { useState, useEffect } from "react";

export type UserRole = "super_admin" | "admin" | "manager" | "viewer";

export interface Permission {
  key: string;
  name: string;
  description: string;
}

export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  permissions: string[];
}

// Define all available permissions
export const PERMISSIONS = {
  MANAGE_MODULES: {
    key: "manage_modules",
    name: "Manage Modules",
    description: "Enable/disable modules for tenants",
  },
  MANAGE_USERS: {
    key: "manage_users",
    name: "Manage Users",
    description: "Create, edit, and delete users",
  },
  MANAGE_TENANTS: {
    key: "manage_tenants",
    name: "Manage Tenants",
    description: "Create and configure tenants",
  },
  VIEW_AUDIT: {
    key: "view_audit",
    name: "View Audit Logs",
    description: "Access audit trail and logs",
  },
  MANAGE_SETTINGS: {
    key: "manage_settings",
    name: "Manage Settings",
    description: "Configure system settings",
  },
  VIEW_ANALYTICS: {
    key: "view_analytics",
    name: "View Analytics",
    description: "Access analytics and reports",
  },
} as const;

// Define role permissions
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "super_admin",
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: [
      PERMISSIONS.MANAGE_MODULES.key,
      PERMISSIONS.MANAGE_USERS.key,
      PERMISSIONS.MANAGE_TENANTS.key,
      PERMISSIONS.VIEW_AUDIT.key,
      PERMISSIONS.MANAGE_SETTINGS.key,
      PERMISSIONS.VIEW_ANALYTICS.key,
    ],
  },
  {
    role: "admin",
    name: "Admin",
    description: "Manage modules and users within tenant",
    permissions: [
      PERMISSIONS.MANAGE_MODULES.key,
      PERMISSIONS.MANAGE_USERS.key,
      PERMISSIONS.VIEW_AUDIT.key,
      PERMISSIONS.VIEW_ANALYTICS.key,
    ],
  },
  {
    role: "manager",
    name: "Manager",
    description: "View analytics and manage basic settings",
    permissions: [PERMISSIONS.VIEW_AUDIT.key, PERMISSIONS.VIEW_ANALYTICS.key],
  },
  {
    role: "viewer",
    name: "Viewer",
    description: "Read-only access to modules and data",
    permissions: [],
  },
];

// User storage key
const USER_ROLE_KEY = "retina:user:role";
const DEFAULT_ROLE: UserRole = "admin"; // Default to admin for demo

/**
 * Get current user's role from localStorage
 */
export function getUserRole(): UserRole {
  const stored = localStorage.getItem(USER_ROLE_KEY);
  if (stored && isValidRole(stored)) {
    return stored as UserRole;
  }
  return DEFAULT_ROLE;
}

/**
 * Set current user's role in localStorage
 */
export function setUserRole(role: UserRole): void {
  localStorage.setItem(USER_ROLE_KEY, role);
  // Dispatch event to notify other components
  window.dispatchEvent(
    new CustomEvent("userRoleChanged", { detail: { role } })
  );
}

/**
 * Check if a string is a valid role
 */
function isValidRole(role: string): boolean {
  return ["super_admin", "admin", "manager", "viewer"].includes(role);
}

/**
 * Get role definition by role key
 */
export function getRoleDefinition(role: UserRole): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((def) => def.role === role);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const roleDef = getRoleDefinition(role);
  return roleDef?.permissions.includes(permission) ?? false;
}

/**
 * Check if user can manage modules
 */
export function canManageModules(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_MODULES.key);
}

/**
 * React hook for managing user role and permissions
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole>(() => getUserRole());

  useEffect(() => {
    // Listen for role changes
    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.role) {
        setRole(customEvent.detail.role);
      }
    };

    window.addEventListener("userRoleChanged", handleRoleChange);

    return () => {
      window.removeEventListener("userRoleChanged", handleRoleChange);
    };
  }, []);

  const updateRole = (newRole: UserRole) => {
    setRole(newRole);
    setUserRole(newRole);
  };

  const checkPermission = (permission: string): boolean => {
    return hasPermission(role, permission);
  };

  const canManage = canManageModules(role);

  return {
    role,
    updateRole,
    checkPermission,
    canManageModules: canManage,
    roleDefinition: getRoleDefinition(role),
  };
}
