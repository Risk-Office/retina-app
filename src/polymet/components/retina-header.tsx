import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRightIcon,
  SearchIcon,
  BuildingIcon,
  CheckIcon,
  BookOpenIcon,
  LanguagesIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTenant } from "@/polymet/data/tenant-context";
import { useAuthStore, UserRole } from "@/polymet/data/auth-store";
import { usePlainLanguage } from "@/polymet/data/tenant-settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ShieldCheckIcon,
  ShieldIcon,
  ShieldAlertIcon,
  EyeIcon,
} from "lucide-react";
import { SignalNotifications } from "@/polymet/components/signal-notifications";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Retina
  if (paths[0] === "retina") {
    breadcrumbs.push({ label: "Retina", href: "/retina" });

    // Add subsequent paths
    for (let i = 1; i < paths.length; i++) {
      const path = paths[i];
      const href = "/" + paths.slice(0, i + 1).join("/");

      // Format label: convert kebab-case to Title Case
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: i === paths.length - 1 ? undefined : href,
      });
    }
  }

  return breadcrumbs;
}

const AVAILABLE_TENANTS = [
  { tenantId: "t-demo", tenantName: "Demo Co" },
  { tenantId: "t-acme", tenantName: "Acme Ltd" },
];

const ROLE_CONFIG: Record<UserRole, { icon: any; label: string }> = {
  viewer: { icon: EyeIcon, label: "Viewer" },
  analyst: { icon: ShieldAlertIcon, label: "Analyst" },
  manager: { icon: ShieldIcon, label: "Manager" },
  admin: { icon: ShieldCheckIcon, label: "Admin" },
};

export function RetinaHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant, setTenant } = useTenant();
  const { user, updateRole, setUser } = useAuthStore();
  const { enabled: plainLanguage, setEnabled: setPlainLanguage } =
    usePlainLanguage(tenant.tenantId);
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Ensure user is initialized
  React.useEffect(() => {
    if (!user) {
      setUser({
        id: "user-1",
        email: "admin@retina.ai",
        role: "admin",
        tenantId: tenant.tenantId,
      });
    }
  }, [user, setUser, tenant.tenantId]);

  const handleOpenGlossary = () => {
    window.dispatchEvent(new CustomEvent("open-glossary", { detail: {} }));
  };

  const handleTenantSwitch = (newTenant: {
    tenantId: string;
    tenantName: string;
  }) => {
    setTenant(newTenant);
    // Reload the current route to refresh data with new tenant
    navigate(location.pathname, { replace: true });
    console.warn(
      "Prevented function call: `window.location.reload()`"
    ) /*TODO: Do not use window.location for navigation. Use react-router instead.*/;
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Plain Language Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md bg-background">
              <LanguagesIcon className="w-4 h-4 text-muted-foreground" />

              <Label
                htmlFor="plain-language"
                className="text-sm cursor-pointer"
              >
                Plain language
              </Label>
              <Switch
                id="plain-language"
                checked={plainLanguage}
                onCheckedChange={setPlainLanguage}
              />
            </div>

            {/* Glossary Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenGlossary}
              className="gap-2"
            >
              <BookOpenIcon className="w-4 h-4" />

              <span className="hidden md:inline">Glossary</span>
            </Button>
            {/* Role Switcher */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {React.createElement(ROLE_CONFIG[user.role].icon, {
                      className: "w-4 h-4",
                    })}
                    <span>{ROLE_CONFIG[user.role].label}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => updateRole(role)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(config.icon, {
                            className: "w-4 h-4",
                          })}
                          <span>{config.label}</span>
                        </div>
                        {user.role === role && (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Tenant Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <BuildingIcon className="w-4 h-4" />

                  <span>{tenant.tenantName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {AVAILABLE_TENANTS.map((t) => (
                  <DropdownMenuItem
                    key={t.tenantId}
                    onClick={() => handleTenantSwitch(t)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{t.tenantName}</span>
                    {tenant.tenantId === t.tenantId && (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <SignalNotifications tenantId={tenant.tenantId} />
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href || crumb.label}>
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
              )}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </header>
  );
}
