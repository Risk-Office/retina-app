import { useState, useMemo, useEffect, useRef } from "react";
import {
  getDecisionJournal,
  addJournalEntry,
  getEntryTypeLabel,
  getEntryTypeColor,
  type DecisionJournalEntry,
  type JournalEntryType,
} from "@/polymet/data/decision-journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2Icon,
  TrendingUpIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  SparklesIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";

interface DecisionJournalPanelProps {
  decisionId: string;
  decisionTitle: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function DecisionJournalPanel({
  decisionId,
  decisionTitle,
  onAuditEvent,
}: DecisionJournalPanelProps) {
  const { tenant } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<JournalEntryType | "all">("all");
  const [filterAuthor, setFilterAuthor] = useState<"all" | "system" | "user">(
    "all"
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] =
    useState<JournalEntryType>("reflection");
  const [newEntrySummary, setNewEntrySummary] = useState("");

  // Inline reflection editor state
  const [reflectionText, setReflectionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load journal entries
  const journal = getDecisionJournal(decisionId, tenant.tenantId);
  const entries = journal?.entries || [];

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((e) => e.entry_type === filterType);
    }

    // Filter by author
    if (filterAuthor !== "all") {
      filtered = filtered.filter((e) => e.author === filterAuthor);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        e.summary_text.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.entry_date - a.entry_date);
  }, [entries, filterType, filterAuthor, searchQuery]);

  // Get entry icon
  const getEntryIcon = (type: JournalEntryType) => {
    switch (type) {
      case "choice":
        return (
          <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
        );

      case "update":
        return (
          <TrendingUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );

      case "guardrail_adjustment":
        return (
          <ShieldAlertIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        );

      case "incident":
        return (
          <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
        );

      case "reflection":
        return (
          <MessageSquareIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        );

      default:
        return null;
    }
  };

  // Handle add entry
  const handleAddEntry = () => {
    if (newEntrySummary.trim().length === 0) return;

    try {
      addJournalEntry(decisionId, decisionTitle, tenant.tenantId, {
        decision_id: decisionId,
        entry_type: newEntryType,
        summary_text: newEntrySummary.trim(),
        auto_generated: false,
        author: "user",
      });

      // Log audit event
      if (onAuditEvent) {
        onAuditEvent("journal.entry_added", {
          decisionId,
          entryType: newEntryType,
          summaryLength: newEntrySummary.trim().length,
          timestamp: Date.now(),
        });
      }

      // Reset form
      setNewEntrySummary("");
      setNewEntryType("reflection");
      setAddDialogOpen(false);

      // Force re-render by updating state
      console.warn(
        "Prevented function call: `window.location.reload()`"
      ) /*TODO: Do not use window.location for navigation. Use react-router instead.*/;
    } catch (error) {
      console.error("Failed to add journal entry:", error);
    }
  };

  // Auto-save reflection
  useEffect(() => {
    if (reflectionText.trim().length === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds after typing stops)
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveReflection();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [reflectionText]);

  // Handle save reflection
  const handleSaveReflection = () => {
    if (reflectionText.trim().length === 0) return;

    setIsSaving(true);

    try {
      addJournalEntry(decisionId, decisionTitle, tenant.tenantId, {
        decision_id: decisionId,
        entry_type: "reflection",
        summary_text: reflectionText.trim(),
        auto_generated: false,
        author: "user",
      });

      // Log audit event
      if (onAuditEvent) {
        onAuditEvent("journal.reflection_added", {
          decisionId,
          summaryLength: reflectionText.trim().length,
          timestamp: Date.now(),
        });
      }

      // Clear the text and update last saved time
      setReflectionText("");
      setLastSaved(Date.now());

      // Force re-render
      console.warn(
        "Prevented function call: `window.location.reload()`"
      ) /*TODO: Do not use window.location for navigation. Use react-router instead.*/;
    } catch (error) {
      console.error("Failed to save reflection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Statistics
  const stats = {
    total: entries.length,
    autoGenerated: entries.filter((e) => e.auto_generated).length,
    userGenerated: entries.filter((e) => !e.auto_generated).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              What just happened?
            </CardTitle>
            <CardDescription>
              Short summaries automatically created so we don't forget context.
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Journal Entry</DialogTitle>
                <DialogDescription>
                  Record a reflection, update, or note about this decision.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-type">Entry Type</Label>
                  <Select
                    value={newEntryType}
                    onValueChange={(value) =>
                      setNewEntryType(value as JournalEntryType)
                    }
                  >
                    <SelectTrigger id="entry-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reflection">Reflection</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="choice">Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="entry-summary">Summary</Label>
                    <span className="text-xs text-muted-foreground">
                      {newEntrySummary.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="entry-summary"
                    placeholder="What happened? What did you learn?"
                    value={newEntrySummary}
                    onChange={(e) => setNewEntrySummary(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntry}
                  disabled={newEntrySummary.trim().length === 0}
                >
                  Add Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Inline Reflection Editor */}
        <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />

                <span className="text-sm font-medium">Add your thoughts</span>
                <div className="group relative">
                  <div className="h-4 w-4 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground cursor-help">
                    ?
                  </div>
                  <div className="absolute left-0 top-6 w-64 p-2 bg-popover border border-border rounded-md shadow-lg text-xs text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    Use this to capture intuition or hindsight — complements
                    system notes.
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your personal notes are saved automatically as you type.
              </p>
            </div>
            {isSaving && (
              <Badge variant="secondary" className="text-xs">
                Saving...
              </Badge>
            )}
            {lastSaved && !isSaving && (
              <span className="text-xs text-muted-foreground">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>

          <Textarea
            ref={textareaRef}
            placeholder="What are you thinking? Any intuition or lessons learned..."
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none bg-background"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {reflectionText.length}/500 characters
            </span>
            {reflectionText.trim().length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveReflection}
                disabled={isSaving}
              >
                Save Now
              </Button>
            )}
          </div>
        </div>
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Entries</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.autoGenerated}
              <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs text-muted-foreground">Auto-Generated</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.userGenerated}</div>
            <div className="text-xs text-muted-foreground">User Notes</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            <SelectTrigger className="w-[160px]">
              <FilterIcon className="h-4 w-4 mr-2" />

              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="choice">Choice</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="reflection">Reflection</SelectItem>
              <SelectItem value="incident">Incident</SelectItem>
              <SelectItem value="guardrail_adjustment">
                Guardrail Adjustment
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterAuthor}
            onValueChange={(value: any) => setFilterAuthor(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />

              <p className="text-sm">
                {searchQuery || filterType !== "all" || filterAuthor !== "all"
                  ? "No entries match your filters"
                  : "No journal entries yet"}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 border border-border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getEntryIcon(entry.entry_type)}
                    <Badge variant={getEntryTypeColor(entry.entry_type)}>
                      {getEntryTypeLabel(entry.entry_type)}
                    </Badge>
                    {entry.auto_generated && (
                      <Badge variant="secondary" className="text-xs">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.entry_date).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm leading-relaxed">{entry.summary_text}</p>

                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
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
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
