import React from "react";
import { useTenant } from "@/polymet/data/tenant-context";
import { isModuleEnabled } from "@/polymet/data/feature-flags";
import { ModuleDisabledGuard } from "@/polymet/components/module-disabled-guard";

interface ModuleRouteGuardProps {
  moduleKey: string;
  moduleName: string;
  children: React.ReactNode;
}

export function ModuleRouteGuard({
  moduleKey,
  moduleName,
  children,
}: ModuleRouteGuardProps) {
  const { tenant } = useTenant();
  const enabled = isModuleEnabled(tenant.tenantId, moduleKey);

  if (!enabled) {
    return (
      <ModuleDisabledGuard moduleName={moduleName} moduleKey={moduleKey} />
    );
  }

  return <>{children}</>;
}
