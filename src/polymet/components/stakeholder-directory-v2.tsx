import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useStakeholdersV2 } from "@/polymet/data/use-stakeholders-v2";
import { useStakeholdersWithGoalCounts } from "@/polymet/data/use-stakeholder-goals-v2";
import { useTenant } from "@/polymet/data/tenant-context";
import type {
  StakeholderGroup,
  StakeholderType,
} from "@/polymet/data/stakeholder-v2-schema";
import {
  SearchIcon,
  UsersIcon,
  UserIcon,
  BuildingIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "lucide-react";

export interface StakeholderDirectoryV2Props {
  onStakeholderClick?: (stakeholderId: string) => void;
}

export function StakeholderDirectoryV2({
  onStakeholderClick,
}: StakeholderDirectoryV2Props) {
  const { tenantId } = useTenant();
  const { stakeholders, loading, createStakeholder } = useStakeholdersV2();
  const goalCounts = useStakeholdersWithGoalCounts();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<StakeholderGroup | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<StakeholderType | "all">("all");

  // New stakeholder dialog state
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGroup, setNewGroup] = useState<StakeholderGroup>("C-Suite");
  const [newType, setNewType] = useState<StakeholderType>("individual");
  const [creating, setCreating] = useState(false);

  const handleCreateStakeholder = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      await createStakeholder({
        tenantId,
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        group: newGroup,
        type: newType,
      });

      // Reset form
      setNewName("");
      setNewEmail("");
      setNewGroup("C-Suite");
      setNewType("individual");
      setNewDialogOpen(false);
    } catch (error) {
      console.error("Failed to create stakeholder:", error);
    } finally {
      setCreating(false);
    }
  };

  // Get unique groups
  const uniqueGroups = useMemo(() => {
    const groups = new Set(stakeholders.map((s) => s.group));
    return Array.from(groups).sort();
  }, [stakeholders]);

  // Filter stakeholders
  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter((stakeholder) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = stakeholder.name.toLowerCase().includes(query);
        const matchesEmail = stakeholder.email?.toLowerCase().includes(query);
        const matchesGroup = stakeholder.group.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesGroup) {
          return false;
        }
      }

      // Group filter
      if (groupFilter !== "all" && stakeholder.group !== groupFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && stakeholder.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [stakeholders, searchQuery, groupFilter, typeFilter]);

  // Group stakeholders by group
  const groupedStakeholders = useMemo(() => {
    const grouped = new Map<string, typeof filteredStakeholders>();
    filteredStakeholders.forEach((stakeholder) => {
      const group = stakeholder.group;
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)!.push(stakeholder);
    });
    return grouped;
  }, [filteredStakeholders]);

  const getTypeIcon = (type: StakeholderType) => {
    switch (type) {
      case "individual":
        return <UserIcon className="h-4 w-4" />;

      case "team":
        return <UsersIcon className="h-4 w-4" />;

      case "external":
        return <ExternalLinkIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: StakeholderType) => {
    switch (type) {
      case "individual":
        return "Individual";
      case "team":
        return "Team";
      case "external":
        return "External";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading stakeholders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Stakeholder Directory</h2>
          <p className="text-sm text-muted-foreground">
            {filteredStakeholders.length} of {stakeholders.length} stakeholders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setNewDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Stakeholder
          </Button>
          <Button asChild variant="outline">
            <Link to="/retina/goals/matrix">
              <BuildingIcon className="h-4 w-4 mr-2" />
              Ownership Matrix
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search stakeholders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={groupFilter}
          onValueChange={(value) =>
            setGroupFilter(value as StakeholderGroup | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {uniqueGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as StakeholderType | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stakeholder Cards */}
      {filteredStakeholders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />

            <p className="text-muted-foreground">No stakeholders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedStakeholders.entries()).map(
            ([group, groupStakeholders]) => (
              <div key={group} className="space-y-3">
                <h3 className="text-lg font-medium">{group}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupStakeholders.map((stakeholder) => {
                    const counts = goalCounts.get(stakeholder.id) || {
                      owns: 0,
                      coOwns: 0,
                      contributes: 0,
                      consumes: 0,
                      total: 0,
                    };

                    return (
                      <Card
                        key={stakeholder.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onStakeholderClick?.(stakeholder.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {stakeholder.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {stakeholder.email || "No email"}
                              </CardDescription>
                            </div>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {getTypeIcon(stakeholder.type)}
                              {getTypeLabel(stakeholder.type)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Linked Goals
                              </span>
                              <span className="font-semibold">
                                {counts.total}
                              </span>
                            </div>
                            {counts.total > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {counts.owns > 0 && (
                                  <Badge variant="default" className="text-xs">
                                    Owns: {counts.owns}
                                  </Badge>
                                )}
                                {counts.coOwns > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Co-owns: {counts.coOwns}
                                  </Badge>
                                )}
                                {counts.contributes > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Contributes: {counts.contributes}
                                  </Badge>
                                )}
                                {counts.consumes > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Consumes: {counts.consumes}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* New Stakeholder Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Stakeholder</DialogTitle>
            <DialogDescription>
              Add a new stakeholder to the directory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., CFO, COO, Product Manager"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Group *</Label>
              <Select
                value={newGroup}
                onValueChange={(value) =>
                  setNewGroup(value as StakeholderGroup)
                }
              >
                <SelectTrigger id="group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Board">Board</SelectItem>
                  <SelectItem value="C-Suite">C-Suite</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={newType}
                onValueChange={(value) => setNewType(value as StakeholderType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStakeholder}
              disabled={!newName.trim() || creating}
            >
              {creating ? "Creating..." : "Create Stakeholder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
