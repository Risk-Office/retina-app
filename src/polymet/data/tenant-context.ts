import React, { createContext, useContext, useState, useEffect } from "react";

interface TenantState {
  tenantId: string;
  tenantName: string;
}

interface TenantContextValue {
  tenant: TenantState;
  setTenant: (tenant: TenantState) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const STORAGE_KEY = "retina:tenant";
const DEFAULT_TENANT: TenantState = {
  tenantId: "t-demo",
  tenantName: "Demo Co",
};

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<TenantState>(() => {
    // Initialize from localStorage or use default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return DEFAULT_TENANT;
        }
      }
    }
    return DEFAULT_TENANT;
  });

  const setTenant = (newTenant: TenantState) => {
    setTenantState(newTenant);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTenant));
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
