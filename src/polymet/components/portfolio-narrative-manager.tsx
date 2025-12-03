/**
 * # Portfolio Narrative Manager
 *
 * ## Overview
 * Comprehensive narrative management for portfolios with:
 * - On-demand narrative generation (basic or AI)
 * - Scheduled narrative generation
 * - Narrative history and viewing
 * - Export and sharing options
 */

import { useState, useEffect } from "react";
import {
  generatePortfolioNarrative,
  type NarrativeBrief,
} from "@/polymet/data/narrative-generator";
import {
  generateAIPortfolioNarrative,
  isAIAvailable,
  type AIConfig,
} from "@/polymet/data/ai-narrative-service";
import {
  createNarrativeSchedule,
  getPortfolioNarrativeSchedules,
  getNarrativeHistory,
  getLatestNarrative,
  toggleNarrativeSchedule,
  deleteNarrativeSchedule,
  type NarrativeScheduleConfig,
  type GeneratedNarrativeHistory,
  type ScheduleFrequency,
} from "@/polymet/data/scheduled-narrative-generator";
import { getDecisionJournal } from "@/polymet/data/decision-journal";
import type { DecisionPortfolio } from "@/polymet/data/decision-portfolios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  CopyIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
// Toast functionality
const useToast = () => ({
  toast: (props: any) => console.log("Toast:", props),
});

interface PortfolioNarrativeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: DecisionPortfolio;
  tenantId: string;
  onAuditEvent?: (eventType: string, payload: any) => void;
}

export function PortfolioNarrativeManager({
  open,
  onOpenChange,
  portfolio,
  tenantId,
  onAuditEvent,
}: PortfolioNarrativeManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "generate" | "schedule" | "history"
  >("generate");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [entryCount, setEntryCount] = useState(5);
  const [generatedNarrative, setGeneratedNarrative] = useState<string | null>(
    null
  );
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);

  // AI config
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: "",
  });

  // Schedule state
  const [schedules, setSchedules] = useState<NarrativeScheduleConfig[]>([]);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: "weekly" as ScheduleFrequency,
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: "09:00",
    recipients: "",
    subject: "",
  });

  // History state
  const [histories, setHistories] = useState<GeneratedNarrativeHistory[]>([]);
  const [selectedHistory, setSelectedHistory] =
    useState<GeneratedNarrativeHistory | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, portfolio.id]);

  const loadData = () => {
    const loadedSchedules = getPortfolioNarrativeSchedules(
      tenantId,
      portfolio.id
    );
    const loadedHistories = getNarrativeHistory(tenantId, portfolio.id);

    setSchedules(loadedSchedules);
    setHistories(loadedHistories);

    // Load latest narrative
    const latest = getLatestNarrative(tenantId, portfolio.id);
    if (latest) {
      setGeneratedNarrative(latest.narrative);
      setExecutiveSummary(latest.executiveSummary || null);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      if (useAI && isAIAvailable(aiConfig)) {
        // AI generation
        const decisionNarratives = [];

        for (const decisionId of portfolio.decision_ids) {
          const journal = getDecisionJournal(decisionId, tenantId);
          if (journal && journal.entries.length > 0) {
            const recentEntries = journal.entries
              .sort((a, b) => b.entry_date - a.entry_date)
              .slice(0, entryCount);

            decisionNarratives.push({
              decisionTitle: journal.decision_title,
              entries: recentEntries,
            });
          }
        }

        const result = await generateAIPortfolioNarrative(
          portfolio.portfolio_name,
          decisionNarratives,
          aiConfig
        );

        if (result) {
          setGeneratedNarrative(result.portfolioNarrative);
          setExecutiveSummary(result.executiveSummary);

          toast({
            title: "AI Narrative Generated",
            description: "Portfolio narrative created with AI insights",
          });

          onAuditEvent?.("portfolio.narrative.generated", {
            portfolioId: portfolio.id,
            portfolioName: portfolio.portfolio_name,
            aiGenerated: true,
            decisionsIncluded: decisionNarratives.length,
          });
        }
      } else {
        // Basic generation
        const result = generatePortfolioNarrative(
          tenantId,
          portfolio.decision_ids,
          {
            entryCount,
          }
        );

        if (result) {
          setGeneratedNarrative(result.portfolioNarrative);
          setExecutiveSummary(null);

          toast({
            title: "Narrative Generated",
            description: "Portfolio narrative created successfully",
          });

          onAuditEvent?.("portfolio.narrative.generated", {
            portfolioId: portfolio.id,
            portfolioName: portfolio.portfolio_name,
            aiGenerated: false,
            decisionsIncluded: result.decisionNarratives.length,
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate narrative:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate narrative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyNarrative = () => {
    if (generatedNarrative) {
      navigator.clipboard.writeText(generatedNarrative);
      toast({
        title: "Copied",
        description: "Narrative copied to clipboard",
      });
    }
  };

  const handleDownloadNarrative = () => {
    if (generatedNarrative) {
      const blob = new Blob([generatedNarrative], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${portfolio.portfolio_name}-narrative-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Narrative downloaded successfully",
      });
    }
  };

  const handleCreateSchedule = () => {
    const recipients = scheduleForm.recipients
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r);

    if (recipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    createNarrativeSchedule(
      tenantId,
      portfolio.id,
      portfolio.portfolio_name,
      scheduleForm.frequency,
      recipients,
      "Admin User",
      {
        dayOfWeek: scheduleForm.dayOfWeek,
        dayOfMonth: scheduleForm.dayOfMonth,
        time: scheduleForm.time,
        subject:
          scheduleForm.subject ||
          `${portfolio.portfolio_name} - ${scheduleForm.frequency} Report`,
        useAI,
        aiConfig: useAI ? aiConfig : undefined,
        entryCount,
        includeInsights: true,
        includeTrends: true,
        includeRecommendations: true,
      }
    );

    toast({
      title: "Schedule Created",
      description: `${scheduleForm.frequency} narrative generation scheduled`,
    });

    onAuditEvent?.("portfolio.narrative.scheduled", {
      portfolioId: portfolio.id,
      portfolioName: portfolio.portfolio_name,
      frequency: scheduleForm.frequency,
      recipients: recipients.length,
    });

    setCreatingSchedule(false);
    loadData();
  };

  const handleToggleSchedule = (scheduleId: string) => {
    toggleNarrativeSchedule(tenantId, scheduleId);
    loadData();
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm("Delete this schedule?")) {
      deleteNarrativeSchedule(tenantId, scheduleId);
      loadData();

      toast({
        title: "Schedule Deleted",
        description: "Narrative schedule removed",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Portfolio Narrative Manager
          </DialogTitle>
          <DialogDescription>
            Generate, schedule, and manage narratives for "
            {portfolio.portfolio_name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v: any) => setActiveTab(v)}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI-Enhanced Generation</Label>
                    <p className="text-xs text-muted-foreground">
                      Use AI for more natural narratives with insights
                    </p>
                  </div>
                  <Switch checked={useAI} onCheckedChange={setUseAI} />
                </div>

                {useAI && (
                  <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label>AI Provider</Label>
                      <Select
                        value={aiConfig.provider}
                        onValueChange={(value: any) =>
                          setAiConfig({ ...aiConfig, provider: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                          <SelectItem value="anthropic">
                            Anthropic Claude
                          </SelectItem>
                          <SelectItem value="local">Local LLM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {aiConfig.provider !== "local" && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={aiConfig.apiKey || ""}
                          onChange={(e) =>
                            setAiConfig({ ...aiConfig, apiKey: e.target.value })
                          }
                          placeholder="sk-..."
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Entries per Decision: {entryCount}</Label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={entryCount}
                    onChange={(e) => setEntryCount(parseInt(e.target.value))}
                    className="w-full"
                  />

                  <p className="text-xs text-muted-foreground">
                    Number of recent journal entries to include per decision
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || (useAI && !isAIAvailable(aiConfig))}
                  className="w-full"
                >
                  {generating ? "Generating..." : "Generate Narrative"}
                </Button>
              </CardContent>
            </Card>

            {generatedNarrative && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Generated Narrative
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyNarrative}
                      >
                        <CopyIcon className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadNarrative}
                      >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {executiveSummary && (
                    <>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          Executive Summary
                        </h4>
                        <p className="text-sm">{executiveSummary}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                      {generatedNarrative}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Scheduled Generation</h3>
                <p className="text-sm text-muted-foreground">
                  {schedules.length} active schedule
                  {schedules.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={() => setCreatingSchedule(true)} size="sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm capitalize">
                          {schedule.frequency} Report
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.time} • {schedule.recipients.length}{" "}
                          recipients
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={() =>
                            handleToggleSchedule(schedule.id)
                          }
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {schedule.useAI && (
                        <Badge variant="default">
                          <SparklesIcon className="w-3 h-3 mr-1" />
                          AI Enhanced
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {schedule.entryCount} entries
                      </Badge>
                    </div>

                    {schedule.nextScheduled && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        Next:{" "}
                        {new Date(schedule.nextScheduled).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {schedules.length === 0 && (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />

                    <p className="text-sm text-muted-foreground mb-4">
                      No schedules configured
                    </p>
                    <Button onClick={() => setCreatingSchedule(true)} size="sm">
                      Create First Schedule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Create Schedule Dialog */}
            <Dialog open={creatingSchedule} onOpenChange={setCreatingSchedule}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Narrative Schedule</DialogTitle>
                  <DialogDescription>
                    Set up automatic narrative generation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={scheduleForm.frequency}
                      onValueChange={(value: any) =>
                        setScheduleForm({ ...scheduleForm, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleForm.frequency === "weekly" && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select
                        value={scheduleForm.dayOfWeek.toString()}
                        onValueChange={(value) =>
                          setScheduleForm({
                            ...scheduleForm,
                            dayOfWeek: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {scheduleForm.frequency === "monthly" && (
                    <div className="space-y-2">
                      <Label>Day of Month</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={scheduleForm.dayOfMonth}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            dayOfMonth: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          time: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients (comma-separated)</Label>
                    <Textarea
                      value={scheduleForm.recipients}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          recipients: e.target.value,
                        })
                      }
                      placeholder="exec@company.com, board@company.com"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Subject (optional)</Label>
                    <Input
                      value={scheduleForm.subject}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          subject: e.target.value,
                        })
                      }
                      placeholder={`${portfolio.portfolio_name} - ${scheduleForm.frequency} Report`}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreatingSchedule(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedule}>
                    Create Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Generation History</h3>
              <p className="text-sm text-muted-foreground">
                {histories.length} narrative{histories.length !== 1 ? "s" : ""}{" "}
                generated
              </p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {histories.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />

                    <p className="text-sm text-muted-foreground">
                      No narratives generated yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                histories
                  .sort(
                    (a, b) =>
                      new Date(b.generatedAt).getTime() -
                      new Date(a.generatedAt).getTime()
                  )
                  .map((history) => (
                    <Card
                      key={history.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setSelectedHistory(history)}
                    >
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {new Date(
                                history.generatedAt
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(
                                history.generatedAt
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                          {history.aiGenerated && (
                            <Badge variant="default" className="text-xs">
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{history.decisionsIncluded} decisions</span>
                          <span>•</span>
                          <span>{history.entriesAnalyzed} entries</span>
                        </div>

                        {history.executiveSummary && (
                          <>
                            <Separator />

                            <p className="text-xs line-clamp-2">
                              {history.executiveSummary}
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>

            {/* View History Dialog */}
            {selectedHistory && (
              <Dialog
                open={!!selectedHistory}
                onOpenChange={() => setSelectedHistory(null)}
              >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Narrative from{" "}
                      {new Date(
                        selectedHistory.generatedAt
                      ).toLocaleDateString()}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedHistory.decisionsIncluded} decisions •{" "}
                      {selectedHistory.entriesAnalyzed} entries analyzed
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {selectedHistory.executiveSummary && (
                      <>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">
                            Executive Summary
                          </h4>
                          <p className="text-sm">
                            {selectedHistory.executiveSummary}
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm">
                        {selectedHistory.narrative}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedHistory.narrative
                        );
                        toast({
                          title: "Copied",
                          description: "Narrative copied to clipboard",
                        });
                      }}
                    >
                      <CopyIcon className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button onClick={() => setSelectedHistory(null)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
