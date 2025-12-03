import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRightIcon,
  CheckCircle2Icon,
  DownloadIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";
import { useRetinaStore } from "@/polymet/data/retina-store";
import { exportDecisionsCSV } from "@/polymet/data/csv-export-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FeedbackLoopModal } from "@/polymet/components/feedback-loop-modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RetinaClosedDecisions() {
  const { tenant } = useTenant();
  const { getDecisionsByStatus } = useRetinaStore();
  const closedDecisions = getDecisionsByStatus(tenant.tenantId, "closed");

  const [feedbackLoopOpen, setFeedbackLoopOpen] = useState(false);
  const [selectedDecisionForLoop, setSelectedDecisionForLoop] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  // Filter and sort decisions
  const filteredDecisions = closedDecisions
    .filter((decision) =>
      decision.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return b.closedAt - a.closedAt;
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/retina" className="hover:text-foreground transition-colors">
          Retina
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <Link
          to="/retina/modules"
          className="hover:text-foreground transition-colors"
        >
          Modules
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <Link
          to="/retina/modules/i-decide"
          className="hover:text-foreground transition-colors"
        >
          i-Decide
        </Link>
        <ChevronRightIcon className="w-4 h-4" />

        <span className="text-foreground font-medium">Closed Decisions</span>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Closed Decisions
            </h1>
            <Badge variant="secondary" className="text-sm">
              {tenant.tenantName}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            View and manage all closed decisions for {tenant.tenantName}
          </p>
        </div>
        {closedDecisions.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportDecisionsCSV(closedDecisions)}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Decisions CSV
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      {closedDecisions.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: "date" | "title") => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="title">Sort by Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Decisions Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {filteredDecisions.length === closedDecisions.length
                  ? `${closedDecisions.length} Decisions`
                  : `${filteredDecisions.length} of ${closedDecisions.length} Decisions`}
              </CardTitle>
              <CardDescription>
                All closed decisions for {tenant.tenantName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDecisions.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    No decisions found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No closed decisions yet
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="relative p-4 border border-border rounded-lg space-y-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  {/* Feedback Loop Icon */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDecisionForLoop(decision.id);
                            setFeedbackLoopOpen(true);
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center shadow-md z-10 opacity-0 group-hover:opacity-100"
                        >
                          <RotateCcwIcon className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View feedback loop</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="space-y-2">
                    <div className="font-semibold text-sm line-clamp-2">
                      {decision.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="w-4 h-4 text-green-600 shrink-0" />

                      <span className="text-xs text-muted-foreground truncate">
                        {
                          decision.options.find(
                            (o) => o.id === decision.chosenOptionId
                          )?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(decision.closedAt).toLocaleDateString()}
                      </div>
                      {decision.metrics && (
                        <Badge variant="outline" className="text-xs">
                          RAROC: {decision.metrics.raroc.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Decision Description Preview */}
                  {decision.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {decision.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Loop Modal */}
      {selectedDecisionForLoop &&
        (() => {
          const decision = closedDecisions.find(
            (d) => d.id === selectedDecisionForLoop
          );
          if (!decision) return null;

          const chosenOption = decision.options.find(
            (o) => o.id === decision.chosenOptionId
          );

          // Mock outcome and adjustment data (in real app, fetch from backend)
          const hasOutcome = Math.random() > 0.3; // 70% chance of having outcome
          const hasAdjustments = hasOutcome && Math.random() > 0.4; // 60% chance of adjustments if outcome exists

          return (
            <FeedbackLoopModal
              open={feedbackLoopOpen}
              onOpenChange={setFeedbackLoopOpen}
              decisionTitle={decision.title}
              decisionDate={decision.closedAt || Date.now()}
              chosenOption={chosenOption?.label || "Unknown Option"}
              outcomeData={
                hasOutcome
                  ? {
                      logged: true,
                      date:
                        (decision.closedAt || Date.now()) +
                        15 * 24 * 60 * 60 * 1000,
                      summary:
                        Math.random() > 0.5
                          ? "Performance exceeded expectations"
                          : "Results tracking close to projections",
                    }
                  : {
                      logged: false,
                    }
              }
              adjustmentData={
                hasAdjustments
                  ? {
                      count: Math.floor(Math.random() * 3) + 1,
                      lastAdjustment: "Tightened VaR95 threshold by 5%",
                      date:
                        (decision.closedAt || Date.now()) +
                        20 * 24 * 60 * 60 * 1000,
                    }
                  : {
                      count: 0,
                    }
              }
            />
          );
        })()}
    </div>
  );
}
