import { useState, useMemo } from "react";
import {
  generateDecisionNarrative,
  generatePortfolioNarrative,
  searchNarrativeKeywords,
  extractCommonKeywords,
  exportNarrativeToMarkdown,
  exportNarrativeToText,
  getNarrativeStatistics,
  type NarrativeBrief,
  type NarrativeOptions,
} from "@/polymet/data/narrative-generator";
import { getDecisionJournal } from "@/polymet/data/decision-journal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileTextIcon,
  SearchIcon,
  DownloadIcon,
  CopyIcon,
  SparklesIcon,
  InfoIcon,
} from "lucide-react";
import { useTenant } from "@/polymet/data/tenant-context";

interface NarrativeGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId?: string;
  decisionTitle?: string;
  portfolioDecisionIds?: string[];
  portfolioName?: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function NarrativeGeneratorDialog({
  open,
  onOpenChange,
  decisionId,
  decisionTitle,
  portfolioDecisionIds,
  portfolioName,
  onAuditEvent,
}: NarrativeGeneratorDialogProps) {
  const { tenant } = useTenant();
  const [entryCount, setEntryCount] = useState(5);
  const [keywords, setKeywords] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeBrief | null>(null);
  const [portfolioNarrative, setPortfolioNarrative] = useState<{
    portfolioNarrative: string;
    decisionNarratives: NarrativeBrief[];
    totalEntries: number;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "search">("generate");
  const [copied, setCopied] = useState(false);

  const isPortfolio = !!portfolioDecisionIds && portfolioDecisionIds.length > 0;

  // Get common keywords from journal
  const suggestedKeywords = useMemo(() => {
    if (!decisionId) return [];

    const journal = getDecisionJournal(decisionId, tenant.tenantId);
    if (!journal) return [];

    return extractCommonKeywords(journal.entries, 5);
  }, [decisionId, tenant.tenantId]);

  // Generate narrative
  const handleGenerate = () => {
    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const options: NarrativeOptions = {
      entryCount,
      includeMetadata,
      keywords: keywordList.length > 0 ? keywordList : undefined,
    };

    if (isPortfolio && portfolioDecisionIds) {
      // Portfolio narrative
      const result = generatePortfolioNarrative(
        tenant.tenantId,
        portfolioDecisionIds,
        options
      );

      if (result) {
        setPortfolioNarrative(result);

        // Audit log
        onAuditEvent?.("narrative.generated", {
          type: "portfolio",
          portfolioName,
          decisionCount: portfolioDecisionIds.length,
          entriesIncluded: result.totalEntries,
          keywords: keywordList.length > 0 ? keywordList : undefined,
          tenantId: tenant.tenantId,
          timestamp: Date.now(),
        });
      }
    } else if (decisionId && decisionTitle) {
      // Single decision narrative
      const result = generateDecisionNarrative(
        decisionId,
        tenant.tenantId,
        options
      );

      if (result) {
        setNarrative(result);

        // Audit log
        onAuditEvent?.("narrative.generated", {
          type: "decision",
          decisionId,
          decisionTitle,
          entriesIncluded: result.entriesIncluded,
          keywords: keywordList.length > 0 ? keywordList : undefined,
          tenantId: tenant.tenantId,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Search by keywords
  const handleSearch = () => {
    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywordList.length === 0) return;

    const results = searchNarrativeKeywords(tenant.tenantId, keywordList);
    setSearchResults(results);

    // Audit log
    onAuditEvent?.("narrative.searched", {
      keywords: keywordList,
      resultsCount: results.length,
      tenantId: tenant.tenantId,
      timestamp: Date.now(),
    });
  };

  // Copy to clipboard
  const handleCopy = () => {
    const text = isPortfolio
      ? portfolioNarrative?.portfolioNarrative || ""
      : narrative?.narrative || "";

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as markdown
  const handleDownloadMarkdown = () => {
    if (isPortfolio && portfolioNarrative) {
      const markdown = portfolioNarrative.portfolioNarrative;
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-narrative-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (narrative) {
      const markdown = exportNarrativeToMarkdown(narrative);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `narrative-${narrative.decisionId}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Audit log
    onAuditEvent?.("narrative.downloaded", {
      type: isPortfolio ? "portfolio" : "decision",
      format: "markdown",
      tenantId: tenant.tenantId,
      timestamp: Date.now(),
    });
  };

  // Download as text
  const handleDownloadText = () => {
    if (isPortfolio && portfolioNarrative) {
      const text = portfolioNarrative.portfolioNarrative;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-narrative-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (narrative) {
      const text = exportNarrativeToText(narrative);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `narrative-${narrative.decisionId}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Audit log
    onAuditEvent?.("narrative.downloaded", {
      type: isPortfolio ? "portfolio" : "decision",
      format: "text",
      tenantId: tenant.tenantId,
      timestamp: Date.now(),
    });
  };

  // Get statistics
  const stats = useMemo(() => {
    if (narrative) {
      return getNarrativeStatistics(narrative);
    }
    return null;
  }, [narrative]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Generate Summary Narrative
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Quick summary for reports
            <div className="group relative">
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />

              <div className="absolute left-0 top-6 w-64 p-2 bg-popover border border-border rounded-md shadow-lg text-xs text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Turns recent events into a short story for leadership updates.
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entry Count</Label>
                <Select
                  value={entryCount.toString()}
                  onValueChange={(v) => setEntryCount(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Last 3 entries</SelectItem>
                    <SelectItem value="4">Last 4 entries</SelectItem>
                    <SelectItem value="5">Last 5 entries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  placeholder="supplier, cost spike, guardrail"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </div>

            {/* Suggested keywords */}
            {suggestedKeywords.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Suggested keywords:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedKeywords.map((kw) => (
                    <Badge
                      key={kw.keyword}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => {
                        const current = keywords
                          .split(",")
                          .map((k) => k.trim())
                          .filter((k) => k.length > 0);
                        if (!current.includes(kw.keyword)) {
                          setKeywords([...current, kw.keyword].join(", "));
                        }
                      }}
                    >
                      {kw.keyword} ({kw.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) =>
                  setIncludeMetadata(checked as boolean)
                }
              />

              <label
                htmlFor="metadata"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include metadata details
              </label>
            </div>

            {/* Generate button */}
            <Button onClick={handleGenerate} className="w-full">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate Narrative
            </Button>

            {/* Generated narrative */}
            {(narrative || portfolioNarrative) && (
              <div className="space-y-4 border border-border rounded-lg p-4">
                {/* Stats */}
                {stats && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{stats.entryCount} entries</span>
                    <span>{stats.wordCount} words</span>
                    <span>{stats.dateSpan} days</span>
                  </div>
                )}

                {/* Narrative text */}
                <div className="prose prose-sm max-w-none bg-muted/50 rounded-md p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {isPortfolio
                      ? portfolioNarrative?.portfolioNarrative
                      : narrative?.narrative}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />

                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    onClick={handleDownloadMarkdown}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Markdown
                  </Button>
                  <Button
                    onClick={handleDownloadText}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            {/* Search input */}
            <div className="space-y-2">
              <Label>Search Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="supplier, cost spike, guardrail"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />

                <Button onClick={handleSearch}>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">
                  {searchResults.length} decision(s) found
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.decisionId}
                      className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {result.decisionTitle}
                          </div>
                          <Badge variant="outline">
                            {result.matchCount} matches
                          </Badge>
                        </div>
                      </div>

                      {/* Matching entries */}
                      <div className="mt-3 space-y-2">
                        {result.matchingEntries
                          .slice(0, 3)
                          .map((entry: any) => (
                            <div
                              key={entry.id}
                              className="text-xs text-muted-foreground pl-3 border-l-2 border-border"
                            >
                              {entry.summary_text.substring(0, 100)}
                              {entry.summary_text.length > 100 ? "..." : ""}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && keywords && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No results found. Try different keywords.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
