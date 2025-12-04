import React from "react";
import {
  ScanIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  BrainCircuitIcon,
} from "lucide-react";

export type ModuleDef = {
  key: string;
  name: string;
  path: string;
  enabled: boolean;
  description: string;
  icon: React.ReactNode;
};

export const MODULE_REGISTRY: ModuleDef[] = [
  {
    key: "i-scan",
    name: "i-Scan",
    path: "/retina/modules/i-scan",
    enabled: true,
    description: "Intelligent scanning and analysis of documents and data",
    icon: <ScanIcon className="h-6 w-6" />,
  },
  {
    key: "i-event",
    name: "i-Event",
    path: "/retina/modules/i-event",
    enabled: true,
    description: "Event tracking and management system",
    icon: <CalendarIcon className="h-6 w-6" />,
  },
  {
    key: "i-audit",
    name: "i-Audit",
    path: "/retina/modules/i-audit",
    enabled: true,
    description: "Comprehensive audit trail and compliance monitoring",
    icon: <ShieldCheckIcon className="h-6 w-6" />,
  },
  {
    key: "fragile-i",
    name: "Fragile-i",
    path: "/retina/modules/fragile-i",
    enabled: true,
    description: "Vulnerability detection and risk assessment",
    icon: <EyeIcon className="h-6 w-6" />,
  },
  {
    key: "i-decide",
    name: "i-Decide",
    path: "/retina/modules/i-decide",
    enabled: true,
    description: "Decision support and recommendation engine",
    icon: <BrainCircuitIcon className="h-6 w-6" />,
  },
];

export function getEnabledModules(): ModuleDef[] {
  return MODULE_REGISTRY.filter((module) => module.enabled);
}

export function getModuleByKey(key: string): ModuleDef | undefined {
  return MODULE_REGISTRY.find((module) => module.key === key);
}
