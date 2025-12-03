import { useMemo, useState } from "react";
import {
  getDecisionJournal,
  getEntryTypeLabel,
  type DecisionJournalEntry,
  type JournalEntryType,
} from "@/polymet/data/decision-journal";
import { getLearningTrace } from "@/polymet/data/auto-refresh-engine";
import { NarrativeGeneratorDialog } from "@/polymet/components/narrative-generator-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2Icon,
  TrendingUpIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  SparklesIcon,
  FileTextIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";

interface DecisionStoryTimelineProps {
  decisionId: string;
  decisionTitle: string;
  className?: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

interface TimelineEntry extends DecisionJournalEntry {
  utilityChange?: "up" | "down" | "neutral";
  utilityDelta?: number;
}

export function DecisionStoryTimeline({
  decisionId,
  decisionTitle,
  className = "",
  onAuditEvent,
}: DecisionStoryTimelineProps) {
  const { tenant } = useTenant();
  const [narrativeDialogOpen, setNarrativeDialogOpen] = useState(false);

  // Load journal entries
  const journal = getDecisionJournal(decisionId, tenant.tenantId);
  const entries = journal?.entries || [];

  // Load learning trace for utility changes
  const learningTrace = getLearningTrace(decisionId, tenant.tenantId);

  // Enrich entries with utility change data
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    return entries.map((entry) => {
      // Find corresponding learning trace entry
      const traceEntry = learningTrace.find((trace) => {
        // Match by timestamp (within 1 minute tolerance)
        return Math.abs(trace.timestamp - entry.entry_date) < 60000;
      });

      if (traceEntry && traceEntry.deltaUtility !== undefined) {
        const delta = traceEntry.deltaUtility;
        return {
          ...entry,
          utilityChange:
            delta > 0.01 ? "up" : delta < -0.01 ? "down" : "neutral",
          utilityDelta: delta,
        };
      }

      return entry;
    });
  }, [entries, learningTrace]);

  // Sort by date (oldest first for timeline)
  const sortedEntries = useMemo(() => {
    return [...timelineEntries].sort((a, b) => a.entry_date - b.entry_date);
  }, [timelineEntries]);

  // Get entry icon
  const getEntryIcon = (type: JournalEntryType) => {
    switch (type) {
      case "choice":
        return (
          <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
        );

      case "update":
        return (
          <TrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );

      case "guardrail_adjustment":
        return (
          <ShieldAlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        );

      case "incident":
        return (
          <AlertTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
        );

      case "reflection":
        return (
          <MessageSquareIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        );

      default:
        return null;
    }
  };

  // Get sentiment icon
  const getSentimentIcon = (change?: "up" | "down" | "neutral") => {
    if (!change) return null;

    switch (change) {
      case "up":
        return (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <ArrowUpIcon className="h-4 w-4" />

            <span className="text-xs font-medium">Utility ↑</span>
          </div>
        );

      case "down":
        return (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <ArrowDownIcon className="h-4 w-4" />

            <span className="text-xs font-medium">Utility ↓</span>
          </div>
        );

      case "neutral":
        return (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MinusIcon className="h-4 w-4" />

            <span className="text-xs font-medium">Utility ~</span>
          </div>
        );
    }
  };

  // Get entry type color
  const getEntryTypeColor = (type: JournalEntryType) => {
    switch (type) {
      case "choice":
        return "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700";
      case "update":
        return "bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700";
      case "guardrail_adjustment":
        return "bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";
      case "incident":
        return "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700";
      case "reflection":
        return "bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700";
      default:
        return "bg-muted border-border";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              How this decision evolved
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Shows the journey — from choice to outcome to adjustment.
              <div className="group relative">
                <div className="h-4 w-4 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground cursor-help">
                  ?
                </div>
                <div className="absolute left-0 top-6 w-64 p-2 bg-popover border border-border rounded-md shadow-lg text-xs text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Shows the journey — from choice to outcome to adjustment.
                </div>
              </div>
            </CardDescription>
          </div>
          {sortedEntries.length > 0 && (
            <Button
              onClick={() => setNarrativeDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <MessageSquareIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              No story yet
            </p>
            <p className="text-xs text-muted-foreground">
              Journal entries will appear here as the decision evolves
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline entries */}
            <div className="space-y-6">
              {sortedEntries.map((entry, index) => (
                <div key={entry.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEntryTypeColor(entry.entry_type)}`}
                  >
                    {getEntryIcon(entry.entry_type)}
                  </div>

                  {/* Entry card */}
                  <div className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {getEntryTypeLabel(entry.entry_type)}
                        </Badge>
                        {entry.auto_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        {getSentimentIcon(entry.utilityChange)}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.entry_date).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Summary text */}
                    <p className="text-sm leading-relaxed">
                      {entry.summary_text}
                    </p>

                    {/* Utility delta */}
                    {entry.utilityDelta !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Utility change:{" "}
                        <span
                          className={
                            entry.utilityDelta > 0
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : entry.utilityDelta < 0
                                ? "text-red-600 dark:text-red-400 font-medium"
                                : "font-medium"
                          }
                        >
                          {entry.utilityDelta > 0 ? "+" : ""}
                          {entry.utilityDelta.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    {entry.metadata &&
                      Object.keys(entry.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre className="overflow-auto">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}

                    {/* Time */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.entry_date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Narrative Generator Dialog */}
      <NarrativeGeneratorDialog
        open={narrativeDialogOpen}
        onOpenChange={setNarrativeDialogOpen}
        decisionId={decisionId}
        decisionTitle={decisionTitle}
        onAuditEvent={onAuditEvent}
      />
    </Card>
  );
}
