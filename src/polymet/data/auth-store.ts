import { create } from "zustand";

export type UserRole = "viewer" | "editor" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  updateRole: (role: UserRole) => void;
  logout: () => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  canModifyFeatureFlags: (targetTenantId?: string) => boolean;
  canEdit: () => boolean;
  isReadOnly: () => boolean;
  fetchCurrentUser: () => Promise<User>;
}

const STORAGE_KEY = "retina:user";

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

// Load user from localStorage
const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Save user to localStorage
const saveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),

  setUser: (user) => {
    saveUser(user);
    set({ user });
  },

  updateRole: (role) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, role };
      saveUser(updatedUser);
      set({ user: updatedUser });
    }
  },

  logout: () => {
    saveUser(null);
    set({ user: null });
  },

  hasPermission: (requiredRole) => {
    const { user } = get();
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  },

  canModifyFeatureFlags: (targetTenantId) => {
    const { user } = get();
    if (!user) return false;

    // Admin can modify any tenant's flags
    if (user.role === "admin") return true;

    // Editor and viewer cannot modify flags
    return false;
  },

  canEdit: () => {
    const { user } = get();
    if (!user) return false;
    return user.role === "admin" || user.role === "editor";
  },

  isReadOnly: () => {
    const { user } = get();
    if (!user) return true;
    return user.role === "viewer";
  },

  fetchCurrentUser: async () => {
    // Simulate GET /me API call
    // In production, this would be: const response = await fetch('/api/auth/me')
    const { user } = get();

    // Return current user or default
    if (user) {
      return user;
    }

    // Default user for demo
    const defaultUser: User = {
      id: "user-1",
      email: "editor@retina.ai",
      role: "editor",
      tenantId: "t-demo",
    };

    get().setUser(defaultUser);
    return defaultUser;
  },
}));

// Initialize default user if none exists
const initializeDefaultUser = () => {
  const stored = loadUser();
  if (!stored) {
    const defaultUser: User = {
      id: "user-1",
      email: "editor@retina.ai",
      role: "editor",
      tenantId: "t-demo",
    };
    saveUser(defaultUser);
  }
};

// Initialize on module load
initializeDefaultUser();

/**
 * GET /me helper function
 * Returns the current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const stored = loadUser();
  if (stored) {
    return stored;
  }

  // Default user for demo
  const defaultUser: User = {
    id: "user-1",
    email: "editor@retina.ai",
    role: "editor",
    tenantId: "t-demo",
  };

  return defaultUser;
}

/**
 * API endpoint stubs for authentication
 */
export const authApi = {
  /**
   * GET /api/auth/me
   * Returns the current authenticated user
   */
  getMe: async (): Promise<User> => {
    return getCurrentUser();
  },

  /**
   * POST /api/auth/login
   * Authenticates a user and returns their profile
   */
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Mock authentication - in production this would validate credentials
    const user: User = {
      id: "user-" + Date.now(),
      email,
      role: email.includes("admin")
        ? "admin"
        : email.includes("editor")
          ? "editor"
          : "viewer",
      tenantId: "t-demo",
    };

    return user;
  },

  /**
   * POST /api/auth/logout
   * Logs out the current user
   */
  logout: async (): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
};
