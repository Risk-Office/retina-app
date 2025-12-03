import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboardIcon,
  EyeIcon,
  SettingsIcon,
  UsersIcon,
  DatabaseIcon,
  BuildingIcon,
  ActivityIcon,
  FolderIcon,
  BellIcon,
  SparklesIcon,
  TargetIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  NetworkIcon,
  GridIcon,
} from "lucide-react";
import { getPendingRevaluationCount } from "@/polymet/data/signal-monitor";
import { cn } from "@/lib/utils";
import { useTenant } from "@/polymet/data/tenant-context";
import { useFeatureFlags } from "@/polymet/data/feature-flags";
import { MODULE_REGISTRY } from "@/polymet/data/module-registry";
import { useAuthStore } from "@/polymet/data/auth-store";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  tooltip?: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function RetinaSidebar() {
  const location = useLocation();
  const { tenant } = useTenant();
  const { isEnabled } = useFeatureFlags(tenant.tenantId);
  const { user, hasPermission } = useAuthStore();
  const [pendingTags, setPendingTags] = React.useState(0);
  const [goalsExpanded, setGoalsExpanded] = React.useState(true);
  const [modulesExpanded, setModulesExpanded] = React.useState(true);
  const [iDecideExpanded, setIDecideExpanded] = React.useState(true);
  const [adminExpanded, setAdminExpanded] = React.useState(true);

  // Update pending tags count
  React.useEffect(() => {
    const updateCount = () => {
      setPendingTags(getPendingRevaluationCount(tenant.tenantId));
    };
    updateCount();
    const interval = setInterval(updateCount, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [tenant.tenantId]);

  // Filter modules based on feature flags
  const enabledModules = MODULE_REGISTRY.filter((module) =>
    isEnabled(module.key)
  );

  const dashboardItems: NavItem[] = [
    {
      title: "Overview",
      href: "/retina",
      icon: <LayoutDashboardIcon className="w-4 h-4" />,
    },
    {
      title: "Daily Learning Feed",
      href: "/retina/learning-feed",
      icon: <SparklesIcon className="w-4 h-4" />,

      tooltip: "System-generated insights from the last 24 hours",
    },
  ];

  const modulesItems: NavItem[] = enabledModules.map((module) => ({
    title: module.name,
    href: module.path,
    icon: module.icon,
  }));

  const iDecideItems: NavItem[] = [
    {
      title: "Closed Decisions",
      href: "/retina/modules/i-decide/closed",
      icon: <FolderIcon className="w-4 h-4" />,

      tooltip: "View and manage all closed decisions.",
    },
    {
      title: "Portfolios",
      href: "/retina/portfolios",
      icon: <FolderIcon className="w-4 h-4" />,

      tooltip: "Tracks every time decisions are grouped or reorganized.",
    },
    {
      title: "Re-evaluation Tags",
      href: "/retina/revaluation-tags",
      icon: <BellIcon className="w-4 h-4" />,

      tooltip: "Decisions flagged for re-evaluation due to signal updates.",
      badge: pendingTags > 0 ? pendingTags : undefined,
    },
  ];

  const adminItems: NavItem[] = [
    // Only show Admin link to admin role
    ...(hasPermission("admin")
      ? [
          {
            title: "Admin",
            href: "/retina/admin",
            icon: <SettingsIcon className="w-4 h-4" />,
          },
        ]
      : []),
    {
      title: "Settings",
      href: "/retina/admin/settings",
      icon: <SettingsIcon className="w-4 h-4" />,

      tooltip: "Configure interface level and preferences",
    },
    {
      title: "Audit",
      href: "/retina/audit",
      icon: <ActivityIcon className="w-4 h-4" />,
    },
    {
      title: "Tenant Demo",
      href: "/retina/admin/tenant-demo",
      icon: <BuildingIcon className="w-4 h-4" />,
    },
    {
      title: "Users",
      href: "/retina/admin/users",
      icon: <UsersIcon className="w-4 h-4" />,
    },
    {
      title: "Data",
      href: "/retina/admin/data",
      icon: <DatabaseIcon className="w-4 h-4" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/retina") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <EyeIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Retina</h1>
            <p className="text-xs text-muted-foreground">Intelligence Suite</p>
            {user && (
              <Badge variant="outline" className="text-xs mt-1">
                {user.role}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dashboard Section - Non-collapsible */}
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboard
          </h2>
          <div className="space-y-1">
            {dashboardItems.map((item) => {
              const active = isActive(item.href);
              const linkContent = (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div>{item.icon}</div>
                  <span className="flex-1">{item.title}</span>
                </Link>
              );

              if (item.tooltip) {
                return (
                  <TooltipProvider key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return linkContent;
            })}
          </div>
        </div>

        {/* Goals & Objectives - Collapsible Section */}
        <div>
          <button
            onClick={() => setGoalsExpanded(!goalsExpanded)}
            className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Goals & Objectives</span>
            {goalsExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
          {goalsExpanded && (
            <div className="space-y-1">
              {[
                {
                  title: "Goals & Objectives",
                  href: "/retina/goals",
                  icon: <TargetIcon className="w-4 h-4" />,

                  tooltip: "Manage organizational goals with SMART validation",
                },
                {
                  title: "Stakeholders",
                  href: "/retina/stakeholders",
                  icon: <UsersIcon className="w-4 h-4" />,

                  tooltip: "Manage stakeholders and view goal ownership",
                },
                {
                  title: "Goals Map",
                  href: "/retina/goals/map",
                  icon: <NetworkIcon className="w-4 h-4" />,

                  tooltip: "Visualize goal dependencies and relationships",
                },
                {
                  title: "Goals Matrix",
                  href: "/retina/goals/matrix",
                  icon: <GridIcon className="w-4 h-4" />,

                  tooltip: "View goals ownership matrix",
                },
              ].map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div>{item.icon}</div>
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );

                if (item.tooltip) {
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return linkContent;
              })}
            </div>
          )}
        </div>

        {/* Modules - Collapsible Section */}
        <div>
          <button
            onClick={() => setModulesExpanded(!modulesExpanded)}
            className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Modules</span>
            {modulesExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
          {modulesExpanded && (
            <div className="space-y-1">
              {modulesItems.map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div>{item.icon}</div>
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );

                if (item.tooltip) {
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return linkContent;
              })}

              {/* i-Decide nested under Modules - Collapsible */}
              <div className="mt-4">
                <button
                  onClick={() => setIDecideExpanded(!iDecideExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                >
                  <span>i-Decide</span>
                  {iDecideExpanded ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3" />
                  )}
                </button>
                {iDecideExpanded && (
                  <div className="space-y-1 mt-1 ml-2">
                    {iDecideItems.map((item) => {
                      const active = isActive(item.href);
                      const linkContent = (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <div>{item.icon}</div>
                          <span className="flex-1">{item.title}</span>
                          {item.badge !== undefined && (
                            <Badge
                              variant={active ? "secondary" : "destructive"}
                              className="h-5 min-w-5 px-1 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );

                      if (item.tooltip) {
                        return (
                          <TooltipProvider key={item.href}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {linkContent}
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm">{item.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      }

                      return linkContent;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin - Collapsible Section */}
        <div>
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Admin</span>
            {adminExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
          {adminExpanded && (
            <div className="space-y-1">
              {adminItems.map((item) => {
                const active = isActive(item.href);
                const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div>{item.icon}</div>
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );

                if (item.tooltip) {
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return linkContent;
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                AD
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role || "admin"}
              </p>
            </div>
          </div>
          {user && (
            <div className="px-3">
              <Badge
                variant="outline"
                className="text-xs w-full justify-center"
              >
                {user.role}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
