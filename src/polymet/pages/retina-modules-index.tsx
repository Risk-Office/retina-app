import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import { getEnabledModulesForTenant } from "@/polymet/data/feature-flags";
import { type ModuleDef } from "@/polymet/data/module-registry";

function ModuleCard({ module }: { module: ModuleDef }) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <div className="text-primary">{module.icon}</div>
          </div>
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
          >
            Active
          </Badge>
        </div>
        <CardTitle className="text-xl">{module.name}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {module.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={module.path}>
          <Button
            variant="ghost"
            className="w-full justify-between group-hover:bg-accent"
          >
            <span>Open Module</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function RetinaModulesIndex() {
  const { tenant } = useTenant();
  const modules = getEnabledModulesForTenant(tenant.tenantId);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Modules</h1>
        <p className="text-muted-foreground">
          Explore and access the Retina Intelligence Suite modules. Each module
          provides specialized capabilities for your operational needs.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />

          <span className="text-sm text-muted-foreground">
            {modules.length} Active
          </span>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard key={module.key} module={module} />
        ))}
      </div>
    </div>
  );
}
