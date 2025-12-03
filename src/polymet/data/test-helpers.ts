import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TenantProvider } from "@/polymet/data/tenant-context";

/**
 * localStorage mock helpers
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
};

/**
 * Set up localStorage with initial values
 */
export const setupLocalStorage = (initialValues: Record<string, any> = {}) => {
  Object.entries(initialValues).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
};

/**
 * Mock clipboard API
 */
export const mockClipboard = () => {
  const clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  };

  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    writable: true,
    configurable: true,
  });

  return clipboard;
};

/**
 * Custom render with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  tenantId?: string;
  tenantName?: string;
  plainLanguage?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    tenantId = "t-test",
    tenantName = "Test Tenant",
    plainLanguage = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set up tenant context in localStorage
  setupLocalStorage({
    "retina:tenant": { tenantId, tenantName },
    [`retina:settings:${tenantId}`]: {
      plainLanguage,
      rarocThresholds: { red: 0.05, amber: 0.1 },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <TenantProvider>{children}</TenantProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async updates
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock TERMS data for testing
 */
export const mockTerms = {
  raroc: {
    tech: "RAROC",
    label: "Return per risk capital",
    short: "RAROC",
    help: "Value per unit of capital at risk.",
    formula: "EV ÷ Capital at risk",
  },
  ev: {
    tech: "EV",
    label: "Expected profit",
    short: "EV",
    help: "Average outcome across all scenarios.",
    formula: "Σ(probability × outcome)",
  },
  var95: {
    tech: "VaR 95%",
    label: "Risk capital (95%)",
    short: "VaR95",
    help: "95th percentile worst-case loss.",
    formula: "Percentile(outcomes, 0.05)",
  },
  cvar95: {
    tech: "CVaR 95%",
    label: "Tail risk (95%)",
    short: "CVaR95",
    help: "Average loss beyond VaR threshold.",
    formula: "Mean(outcomes < VaR95)",
  },
  econCap: {
    tech: "Economic Capital",
    label: "Capital at risk",
    short: "EconCap",
    help: "Capital needed to cover unexpected losses.",
    formula: "VaR95 - EV",
  },
};

/**
 * Generate mock simulation results
 */
export const mockSimulationResults = (count: number = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    optionId: `opt-${i + 1}`,
    optionLabel: `Option ${String.fromCharCode(65 + i)}`,
    raroc: 0.08 + i * 0.02,
    ev: 150 + i * 30,
    var95: 45 + i * 7,
    cvar95: 38 + i * 6,
    economicCapital: 50 + i * 10,
    outcomes: Array.from({ length: 1000 }, () => Math.random() * 200),
  }));
};
