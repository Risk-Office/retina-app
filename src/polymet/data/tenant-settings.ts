import { useState, useEffect } from "react";

export interface RAROCThresholds {
  red: number;
  amber: number;
}

export type UtilityMode =
  | "CARA"
  | "CRRA"
  | "Exponential"
  | "Quadratic"
  | "Power";

export interface UtilitySettings {
  mode: UtilityMode;
  a: number; // risk aversion coefficient (CARA, Exponential) or relative risk aversion (CRRA)
  scale: number; // outcome scale divider
  useForRecommendation: boolean;
}

export interface TCORSettings {
  insuranceRate: number; // % of option cost (e.g., 0.01 = 1%)
  contingencyOnCap: number; // % of economic capital (e.g., 0.15 = 15%)
}

export interface PlainLanguageSettings {
  enabled: boolean;
}

export type InterfaceLevel = "basic" | "intermediate" | "advanced" | "auto";

export interface InterfaceLevelSettings {
  level: InterfaceLevel;
}

export interface TenantSettings {
  raroc: RAROCThresholds;
  utility: UtilitySettings;
  tcor: TCORSettings;
  horizonMonths: number;
  plainLanguage: PlainLanguageSettings;
  interfaceLevel: InterfaceLevelSettings;
}

export const DEFAULT_RAROC_THRESHOLDS: RAROCThresholds = {
  red: 0.05,
  amber: 0.1,
};

export const DEFAULT_UTILITY_SETTINGS: UtilitySettings = {
  mode: "CARA",
  a: 0.000005,
  scale: 100000,
  useForRecommendation: false,
};

export const DEFAULT_TCOR_SETTINGS: TCORSettings = {
  insuranceRate: 0.01, // 1% of cost
  contingencyOnCap: 0.15, // 15% of economic capital
};

export const DEFAULT_HORIZON_MONTHS = 12;

export const DEFAULT_PLAIN_LANGUAGE_SETTINGS: PlainLanguageSettings = {
  enabled: true, // Default ON for SME-friendly labels
};

export const DEFAULT_INTERFACE_LEVEL_SETTINGS: InterfaceLevelSettings = {
  level: "auto", // Default to auto-detection
};

export const UTILITY_MODE_DESCRIPTIONS: Record<UtilityMode, string> = {
  CARA: "Constant Absolute Risk Aversion - U(x) = 1 - exp(-a×x/scale)",
  CRRA: "Constant Relative Risk Aversion - U(x) = (x^(1-γ))/(1-γ) where γ=a",
  Exponential: "Exponential Utility - U(x) = -exp(-a×x/scale)",
  Quadratic: "Quadratic Utility - U(x) = x - (a/2)×x²",
  Power: "Power Utility - U(x) = x^α where α=1-a",
};

const DEFAULT_SETTINGS: TenantSettings = {
  raroc: DEFAULT_RAROC_THRESHOLDS,
  utility: DEFAULT_UTILITY_SETTINGS,
  tcor: DEFAULT_TCOR_SETTINGS,
  horizonMonths: DEFAULT_HORIZON_MONTHS,
  plainLanguage: DEFAULT_PLAIN_LANGUAGE_SETTINGS,
  interfaceLevel: DEFAULT_INTERFACE_LEVEL_SETTINGS,
};

function getStorageKey(tenantId: string): string {
  return `retina:settings:${tenantId}`;
}

export function getTenantSettings(tenantId: string): TenantSettings {
  try {
    const stored = localStorage.getItem(getStorageKey(tenantId));
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        raroc: {
          red: parsed.raroc?.red ?? DEFAULT_RAROC_THRESHOLDS.red,
          amber: parsed.raroc?.amber ?? DEFAULT_RAROC_THRESHOLDS.amber,
        },
        utility: {
          mode: parsed.utility?.mode ?? DEFAULT_UTILITY_SETTINGS.mode,
          a: parsed.utility?.a ?? DEFAULT_UTILITY_SETTINGS.a,
          scale: parsed.utility?.scale ?? DEFAULT_UTILITY_SETTINGS.scale,
          useForRecommendation:
            parsed.utility?.useForRecommendation ??
            DEFAULT_UTILITY_SETTINGS.useForRecommendation,
        },
        tcor: {
          insuranceRate:
            parsed.tcor?.insuranceRate ?? DEFAULT_TCOR_SETTINGS.insuranceRate,
          contingencyOnCap:
            parsed.tcor?.contingencyOnCap ??
            DEFAULT_TCOR_SETTINGS.contingencyOnCap,
        },
        horizonMonths: parsed.horizonMonths ?? DEFAULT_HORIZON_MONTHS,
        plainLanguage: {
          enabled:
            parsed.plainLanguage?.enabled ??
            DEFAULT_PLAIN_LANGUAGE_SETTINGS.enabled,
        },
        interfaceLevel: {
          level:
            parsed.interfaceLevel?.level ??
            DEFAULT_INTERFACE_LEVEL_SETTINGS.level,
        },
      };
    }
  } catch (error) {
    console.error("Error loading tenant settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveTenantSettings(
  tenantId: string,
  settings: TenantSettings
): void {
  try {
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(settings));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(
      new CustomEvent("tenant-settings-changed", {
        detail: { tenantId, settings },
      })
    );
    // Also dispatch storage event for cross-tab updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: getStorageKey(tenantId),
        newValue: JSON.stringify(settings),
      })
    );
  } catch (error) {
    console.error("Error saving tenant settings:", error);
  }
}

export function useRAROCThresholds(tenantId: string) {
  const [thresholds, setThresholds] = useState<RAROCThresholds>(
    () => getTenantSettings(tenantId).raroc
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setThresholds(parsed.raroc ?? DEFAULT_RAROC_THRESHOLDS);
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setThresholds(e.detail.settings.raroc ?? DEFAULT_RAROC_THRESHOLDS);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const updateThresholds = (newThresholds: RAROCThresholds) => {
    const settings = getTenantSettings(tenantId);
    settings.raroc = newThresholds;
    saveTenantSettings(tenantId, settings);
    setThresholds(newThresholds);
  };

  return { thresholds, updateThresholds };
}

export function useTCORSettings(tenantId: string) {
  const [settings, setSettings] = useState<TCORSettings>(
    () => getTenantSettings(tenantId).tcor
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed.tcor ?? DEFAULT_TCOR_SETTINGS);
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setSettings(e.detail.settings.tcor ?? DEFAULT_TCOR_SETTINGS);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const updateTCORSettings = (newSettings: TCORSettings) => {
    const fullSettings = getTenantSettings(tenantId);
    fullSettings.tcor = newSettings;
    saveTenantSettings(tenantId, fullSettings);
    setSettings(newSettings);
  };

  return { settings, updateTCORSettings };
}

export function getRAROCBadgeVariant(
  raroc: number,
  thresholds: RAROCThresholds
): "destructive" | "default" | "secondary" {
  if (raroc < thresholds.red) {
    return "destructive"; // red
  } else if (raroc < thresholds.amber) {
    return "default"; // amber (using default as amber)
  } else {
    return "secondary"; // green
  }
}

export function getRAROCBadgeColor(
  raroc: number,
  thresholds: RAROCThresholds
): string {
  if (raroc < thresholds.red) {
    return "bg-red-500 text-white hover:bg-red-600";
  } else if (raroc < thresholds.amber) {
    return "bg-amber-500 text-white hover:bg-amber-600";
  } else {
    return "bg-green-500 text-white hover:bg-green-600";
  }
}

export function useHorizonMonths(tenantId: string) {
  const [horizonMonths, setHorizonMonths] = useState<number>(
    () => getTenantSettings(tenantId).horizonMonths
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setHorizonMonths(parsed.horizonMonths ?? DEFAULT_HORIZON_MONTHS);
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setHorizonMonths(
          e.detail.settings.horizonMonths ?? DEFAULT_HORIZON_MONTHS
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const updateHorizonMonths = (newHorizonMonths: number) => {
    const fullSettings = getTenantSettings(tenantId);
    fullSettings.horizonMonths = newHorizonMonths;
    saveTenantSettings(tenantId, fullSettings);
    setHorizonMonths(newHorizonMonths);
  };

  return { horizonMonths, updateHorizonMonths };
}

export function useUtilitySettings(tenantId: string) {
  const [settings, setSettings] = useState<UtilitySettings>(
    () => getTenantSettings(tenantId).utility
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed.utility ?? DEFAULT_UTILITY_SETTINGS);
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setSettings(e.detail.settings.utility ?? DEFAULT_UTILITY_SETTINGS);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const updateUtilitySettings = (newSettings: UtilitySettings) => {
    const fullSettings = getTenantSettings(tenantId);
    fullSettings.utility = newSettings;
    saveTenantSettings(tenantId, fullSettings);
    setSettings(newSettings);
  };

  return { settings, updateUtilitySettings };
}

export function usePlainLanguage(tenantId: string) {
  const [enabled, setEnabled] = useState<boolean>(
    () => getTenantSettings(tenantId).plainLanguage.enabled
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setEnabled(
            parsed.plainLanguage?.enabled ??
              DEFAULT_PLAIN_LANGUAGE_SETTINGS.enabled
          );
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setEnabled(
          e.detail.settings.plainLanguage?.enabled ??
            DEFAULT_PLAIN_LANGUAGE_SETTINGS.enabled
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const setPlainLanguage = (newEnabled: boolean) => {
    const fullSettings = getTenantSettings(tenantId);
    fullSettings.plainLanguage.enabled = newEnabled;
    saveTenantSettings(tenantId, fullSettings);
    setEnabled(newEnabled);
  };

  return { enabled, setEnabled: setPlainLanguage };
}

export function useInterfaceLevelSettings(tenantId: string) {
  const [level, setLevel] = useState<InterfaceLevel>(
    () => getTenantSettings(tenantId).interfaceLevel.level
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(tenantId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLevel(
            parsed.interfaceLevel?.level ??
              DEFAULT_INTERFACE_LEVEL_SETTINGS.level
          );
        } catch (error) {
          console.error("Error parsing settings update:", error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.tenantId === tenantId) {
        setLevel(
          e.detail.settings.interfaceLevel?.level ??
            DEFAULT_INTERFACE_LEVEL_SETTINGS.level
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "tenant-settings-changed",
      handleCustomEvent as EventListener
    );
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tenant-settings-changed",
        handleCustomEvent as EventListener
      );
    };
  }, [tenantId]);

  const setInterfaceLevel = (newLevel: InterfaceLevel) => {
    const fullSettings = getTenantSettings(tenantId);
    fullSettings.interfaceLevel.level = newLevel;
    saveTenantSettings(tenantId, fullSettings);
    setLevel(newLevel);
  };

  return { level, setInterfaceLevel };
}
