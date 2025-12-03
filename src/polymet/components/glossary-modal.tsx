import { useState, useMemo, useEffect, useCallback } from "react";
import { TERMS } from "@/polymet/data/terms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GlossaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scrollToTerm?: string;
}

interface TermEntry {
  key: string;
  tech: string;
  label: string;
  short?: string;
  help?: string;
  formula?: string;
}

const SEARCH_STORAGE_KEY = "retina:glossary:search";
const DEFAULT_TENANT_ID = "t-demo";

// Helper to get tenant ID safely
function getTenantId(): string {
  try {
    const stored = localStorage.getItem("retina:tenant");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.tenantId || DEFAULT_TENANT_ID;
    }
  } catch (error) {
    // Ignore errors
  }
  return DEFAULT_TENANT_ID;
}

export function GlossaryModal({
  open,
  onOpenChange,
  scrollToTerm,
}: GlossaryModalProps) {
  // Get tenant ID from localStorage directly to avoid dependency on TenantProvider
  const tenantId = useMemo(() => {
    try {
      return getTenantId();
    } catch (error) {
      console.error("Error getting tenant ID:", error);
      return DEFAULT_TENANT_ID;
    }
  }, []);

  // Use local state for plain language with localStorage persistence
  const [plainLanguageEnabled, setPlainLanguageEnabledState] = useState(() => {
    try {
      const currentTenantId = getTenantId();
      if (!currentTenantId) return true;
      const stored = localStorage.getItem(`retina:settings:${currentTenantId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.plainLanguage?.enabled ?? true;
      }
    } catch (error) {
      console.error("Error loading plain language setting:", error);
    }
    return true;
  });

  const setPlainLanguageEnabled = useCallback((enabled: boolean) => {
    setPlainLanguageEnabledState(enabled);
    try {
      const currentTenantId = getTenantId();
      if (!currentTenantId) return;
      const stored = localStorage.getItem(`retina:settings:${currentTenantId}`);
      const settings = stored ? JSON.parse(stored) : {};
      settings.plainLanguage = { enabled };
      localStorage.setItem(
        `retina:settings:${currentTenantId}`,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving plain language setting:", error);
    }
  }, []);

  // Load last search from localStorage
  const [search, setSearch] = useState(() => {
    try {
      return localStorage.getItem(SEARCH_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Save search to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_STORAGE_KEY, search);
    } catch (error) {
      console.error("Error saving search:", error);
    }
  }, [search]);

  // Scroll to term when specified
  useEffect(() => {
    if (open && scrollToTerm) {
      setTimeout(() => {
        const element = document.getElementById(`term-${scrollToTerm}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary");
          }, 2000);
        }
      }, 100);
    }
  }, [open, scrollToTerm]);

  // Build term entries array
  const termEntries: TermEntry[] = useMemo(() => {
    try {
      if (!TERMS || typeof TERMS !== "object") {
        console.error("TERMS is not properly loaded");
        return [];
      }
      return Object.entries(TERMS).map(([key, term]) => ({
        key,
        tech: term?.tech || key,
        label: term?.label || key,
        short: term?.short,
        help: term?.help,
        formula: term?.formula,
      }));
    } catch (error) {
      console.error("Error building term entries:", error);
      return [];
    }
  }, []);

  // Filter terms with memoization
  const filteredTerms = useMemo(() => {
    if (!search) return termEntries;
    const searchLower = search.toLowerCase();
    return termEntries.filter((term) => {
      return (
        term.tech.toLowerCase().includes(searchLower) ||
        term.label.toLowerCase().includes(searchLower) ||
        (term.short && term.short.toLowerCase().includes(searchLower)) ||
        (term.help && term.help.toLowerCase().includes(searchLower))
      );
    });
  }, [termEntries, search]);

  // Copy to clipboard handler
  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ["key", "tech", "label", "short", "help", "formula"];
    const rows = termEntries.map((term) => [
      term.key,
      term.tech,
      term.label,
      term.short || "",
      term.help || "",
      term.formula || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "glossary.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] flex flex-col"
        role="dialog"
        aria-labelledby="glossary-title"
        aria-describedby="glossary-description"
      >
        <DialogHeader>
          <DialogTitle id="glossary-title">Glossary</DialogTitle>
          <DialogDescription id="glossary-description">
            Search and browse all terms used in Retina
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search input with result count */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                placeholder="Search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search glossary terms"
              />
            </div>
            <Badge variant="secondary" className="shrink-0">
              {filteredTerms.length}{" "}
              {filteredTerms.length === 1 ? "term" : "terms"}
            </Badge>
          </div>

          {/* Plain language toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="plain-language-toggle" className="cursor-pointer">
              Use plain language
            </Label>
            <Switch
              id="plain-language-toggle"
              checked={plainLanguageEnabled}
              onCheckedChange={setPlainLanguageEnabled}
              aria-label="Toggle plain language mode"
            />
          </div>

          {/* Terms list */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {filteredTerms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No matches. Try another word.
                </div>
              ) : (
                filteredTerms.map((term) => (
                  <div
                    key={term.key}
                    id={`term-${term.key}`}
                    className="p-4 border border-border rounded-lg space-y-3 transition-all"
                  >
                    {/* Title and technical name */}
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        {term.label}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          ({term.tech})
                        </span>
                      </div>
                      {term.short && (
                        <div className="text-xs text-muted-foreground">
                          Short: {term.short}
                        </div>
                      )}
                    </div>

                    {/* Help text */}
                    {term.help && (
                      <div className="text-sm text-foreground leading-relaxed">
                        {term.help}
                      </div>
                    )}

                    {/* Formula */}
                    {term.formula && (
                      <div className="text-xs bg-muted p-2 rounded font-mono">
                        <span className="font-semibold font-sans">
                          Formula:
                        </span>{" "}
                        {term.formula}
                      </div>
                    )}

                    {/* Copy buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(term.label, `${term.key}-friendly`)
                        }
                        aria-label={`Copy friendly term: ${term.label}`}
                      >
                        <CopyIcon className="w-3 h-3 mr-1" />

                        {copiedKey === `${term.key}-friendly`
                          ? "Copied!"
                          : "Copy friendly"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(term.tech, `${term.key}-technical`)
                        }
                        aria-label={`Copy technical term: ${term.tech}`}
                      >
                        <CopyIcon className="w-3 h-3 mr-1" />

                        {copiedKey === `${term.key}-technical`
                          ? "Copied!"
                          : "Copy technical"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Export button */}
          <div className="pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="w-full"
              aria-label="Export glossary as CSV"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export glossary.csv
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
