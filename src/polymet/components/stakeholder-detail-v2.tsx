import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStakeholdersV2 } from "@/polymet/data/use-stakeholders-v2";
import { useStakeholderGoalsV2 } from "@/polymet/data/use-stakeholder-goals-v2";
import type { GoalV2 } from "@/polymet/data/goal-v2-schema";
import {
  UserIcon,
  UsersIcon,
  ExternalLinkIcon,
  MailIcon,
  TargetIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react";

export interface StakeholderDetailV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholderId: string | null;
}

export function StakeholderDetailV2({
  open,
  onOpenChange,
  stakeholderId,
}: StakeholderDetailV2Props) {
  const { stakeholders } = useStakeholdersV2();
  const stakeholder = useMemo(
    () => stakeholders.find((s) => s.id === stakeholderId),
    [stakeholders, stakeholderId]
  );

  const stakeholderGoals = useStakeholderGoalsV2(stakeholderId || "");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return <UserIcon className="h-4 w-4" />;

      case "team":
        return <UsersIcon className="h-4 w-4" />;

      case "external":
        return <ExternalLinkIcon className="h-4 w-4" />;

      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "draft":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "retired":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const renderGoalCard = (goal: GoalV2, ownershipPercentage?: number) => (
    <Card key={goal.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm">{goal.statement}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {goal.category}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(goal.status)}>
            {goal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ownershipPercentage !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ownership</span>
            <Badge variant="secondary">{ownershipPercentage}%</Badge>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Time Horizon</span>
          <span className="font-medium">{goal.time_horizon}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Priority</span>
          <Badge variant="outline">{goal.priority}</Badge>
        </div>

        {goal.kpis.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">KPIs</div>
            <div className="flex flex-wrap gap-1">
              {goal.kpis.slice(0, 3).map((kpi, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {kpi.name}
                </Badge>
              ))}
              {goal.kpis.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{goal.kpis.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link to={`/retina/goals?goal=${goal.id}`}>
            View Goal
            <ArrowRightIcon className="h-3 w-3 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  if (!stakeholder) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {getTypeIcon(stakeholder.type)}
            </div>
            <div className="flex-1">
              <SheetTitle>{stakeholder.name}</SheetTitle>
              <SheetDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stakeholder.group}</Badge>
                  <Badge variant="secondary">{stakeholder.type}</Badge>
                </div>
                {stakeholder.email && (
                  <div className="flex items-center gap-1 text-xs">
                    <MailIcon className="h-3 w-3" />

                    {stakeholder.email}
                  </div>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Total Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stakeholderGoals.totalCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ownership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stakeholderGoals.owns.length +
                    stakeholderGoals.coOwns.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals Tabs */}
          <Tabs defaultValue="owns" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="owns" className="text-xs">
                Owns ({stakeholderGoals.owns.length})
              </TabsTrigger>
              <TabsTrigger value="co-owns" className="text-xs">
                Co-owns ({stakeholderGoals.coOwns.length})
              </TabsTrigger>
              <TabsTrigger value="contributes" className="text-xs">
                Contributes ({stakeholderGoals.contributes.length})
              </TabsTrigger>
              <TabsTrigger value="consumes" className="text-xs">
                Consumes ({stakeholderGoals.consumes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="owns" className="space-y-4 mt-4">
              {stakeholderGoals.owns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <TargetIcon className="h-8 w-8 text-muted-foreground mb-2" />

                    <p className="text-sm text-muted-foreground">
                      No owned goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stakeholderGoals.owns.map((goal) =>
                    renderGoalCard(goal, 100)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="co-owns" className="space-y-4 mt-4">
              {stakeholderGoals.coOwns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <UsersIcon className="h-8 w-8 text-muted-foreground mb-2" />

                    <p className="text-sm text-muted-foreground">
                      No co-owned goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stakeholderGoals.all
                    .filter((rel) => rel.relationshipType === "co-owner")
                    .map((rel) =>
                      renderGoalCard(rel.goal, rel.ownershipPercentage)
                    )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contributes" className="space-y-4 mt-4">
              {stakeholderGoals.contributes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <TrendingUpIcon className="h-8 w-8 text-muted-foreground mb-2" />

                    <p className="text-sm text-muted-foreground">
                      No contributing goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stakeholderGoals.contributes.map((goal) =>
                    renderGoalCard(goal)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="consumes" className="space-y-4 mt-4">
              {stakeholderGoals.consumes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2Icon className="h-8 w-8 text-muted-foreground mb-2" />

                    <p className="text-sm text-muted-foreground">
                      No consuming goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stakeholderGoals.consumes.map((goal) =>
                    renderGoalCard(goal)
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
