import { useState, useEffect } from "react";
import { MODULE_REGISTRY } from "@/polymet/data/module-registry";

export type FeatureFlags = Record<string, boolean>;

const STORAGE_PREFIX = "retina:features:";

/**
 * Get feature flags for a specific tenant from localStorage
 */
export function getFeatureFlags(tenantId: string): FeatureFlags {
  const key = `${STORAGE_PREFIX}${tenantId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse feature flags:", e);
    }
  }

  // Default: all modules enabled
  const defaults: FeatureFlags = {};
  MODULE_REGISTRY.forEach((module) => {
    defaults[module.key] = module.enabled;
  });

  return defaults;
}

/**
 * Save feature flags for a specific tenant to localStorage
 */
export function saveFeatureFlags(tenantId: string, flags: FeatureFlags): void {
  const key = `${STORAGE_PREFIX}${tenantId}`;
  localStorage.setItem(key, JSON.stringify(flags));
}

/**
 * Check if a specific module is enabled for a tenant
 */
export function isModuleEnabled(tenantId: string, moduleKey: string): boolean {
  const flags = getFeatureFlags(tenantId);
  return flags[moduleKey] ?? true; // Default to enabled if not set
}

/**
 * Toggle a module feature flag for a tenant
 */
export function toggleModuleFeature(
  tenantId: string,
  moduleKey: string,
  enabled: boolean
): void {
  const flags = getFeatureFlags(tenantId);
  flags[moduleKey] = enabled;
  saveFeatureFlags(tenantId, flags);
}

/**
 * React hook for managing feature flags
 */
export function useFeatureFlags(tenantId: string) {
  const [flags, setFlags] = useState<FeatureFlags>(() =>
    getFeatureFlags(tenantId)
  );

  useEffect(() => {
    // Reload flags when tenant changes
    setFlags(getFeatureFlags(tenantId));
  }, [tenantId]);

  useEffect(() => {
    // Listen for storage changes (when flags are updated in other components)
    const handleStorageChange = (e: StorageEvent) => {
      const key = `${STORAGE_PREFIX}${tenantId}`;
      if (e.key === key && e.newValue) {
        try {
          setFlags(JSON.parse(e.newValue));
        } catch (err) {
          console.error(
            "Failed to parse feature flags from storage event:",
            err
          );
        }
      }
    };

    // Listen for custom events (for same-window updates)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tenantId === tenantId) {
        setFlags(getFeatureFlags(tenantId));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("featureFlagsUpdated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("featureFlagsUpdated", handleCustomEvent);
    };
  }, [tenantId]);

  const updateFlag = (moduleKey: string, enabled: boolean) => {
    const newFlags = { ...flags, [moduleKey]: enabled };
    setFlags(newFlags);
    saveFeatureFlags(tenantId, newFlags);

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("featureFlagsUpdated", {
        detail: { tenantId, moduleKey, enabled },
      })
    );
  };

  const isEnabled = (moduleKey: string): boolean => {
    return flags[moduleKey] ?? true;
  };

  return {
    flags,
    updateFlag,
    isEnabled,
  };
}

/**
 * Get all enabled modules for a tenant
 */
export function getEnabledModulesForTenant(tenantId: string) {
  const flags = getFeatureFlags(tenantId);
  return MODULE_REGISTRY.filter((module) => flags[module.key] !== false);
}
